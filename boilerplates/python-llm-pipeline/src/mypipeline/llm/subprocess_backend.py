"""Generic subprocess-driven `LlmClient` (external CLI wrapper).

Runs a fixed command (`argv`) with the prompt appended as the final argv
element. A prompt at or under `spill_threshold_bytes` is passed inline this
way; a larger one would hit the kernel's per-argument length limit
(``MAX_ARG_STRLEN``), so it is instead written to a private temp file.

Writing the prompt to a file only helps if the wrapped CLI knows to read a
file for that argument — a CLI that treats its last argument as literal
prompt text would otherwise silently receive a path string *as the prompt*.
So spilling requires `spill_argv` (a `Callable[[Path], list[str]]` that
builds the CLI-specific "read this file" argv suffix, e.g.
``lambda path: ["--file", str(path)]``) to be configured. Without it, a
prompt over the threshold raises `LlmError` up front (the subprocess is
never invoked) rather than guessing at a contract the CLI may not honor.

Only *transient* failures (an empty body or a subprocess timeout) are
retried, with linear backoff. Rate limiting — identified by
``rate_limited_returncode`` — fails fast (no retry): it is typically a
sustained, multi-hour quota window, so retrying immediately just burns the
remaining quota. Any other non-zero exit is also non-transient and fails
fast, on the assumption that a generic failure will usually repeat.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import time
from collections.abc import Callable, Iterator, Sequence
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

from mypipeline.llm.base import (
    LlmError,
    RateLimitedError,
    TransientLlmError,
)

# Injected subprocess seam: (argv, timeout_s) -> CompletedProcess. Defaults to
# `subprocess.run`; tests pass a stub so `SubprocessLlmClient` is testable
# without spawning a real process.
Runner = Callable[[Sequence[str], float], "subprocess.CompletedProcess[str]"]

DEFAULT_TIMEOUT_S = 60.0
DEFAULT_MAX_ATTEMPTS = 3
DEFAULT_BACKOFF_S = 1.0
# A prompt at or under this size (bytes, UTF-8) is passed inline via argv; a
# larger one is spilled to a private temp file, referenced by path.
DEFAULT_SPILL_THRESHOLD_BYTES = 60_000
# Exit code the wrapped CLI uses to signal it was rate limited by its
# backend. Override per-CLI if a different convention is used.
DEFAULT_RATE_LIMITED_RETURNCODE = 42


def _default_runner(
    argv: Sequence[str], timeout_s: float
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(argv),
        capture_output=True,
        text=True,
        timeout=timeout_s,
        check=False,
    )


@dataclass(slots=True)
class SubprocessLlmClient:
    """An `LlmClient` backed by an external CLI, run via `runner`.

    `argv` is the fixed command prefix (e.g. `["some-cli", "-m", "model"]`);
    the prompt is appended as the final argument on each call, as long as it
    fits under `spill_threshold_bytes`. `spill_argv`, if configured, builds
    the argv suffix for a prompt that had to be spilled to a file instead
    (see the module docstring); without it, an over-threshold prompt is a
    configuration error (`LlmError`), not a silent path-as-prompt send.
    """

    argv: list[str]
    runner: Runner | None = None
    sleep: Callable[[float], None] = time.sleep
    max_attempts: int = DEFAULT_MAX_ATTEMPTS
    backoff_s: float = DEFAULT_BACKOFF_S
    spill_threshold_bytes: int = DEFAULT_SPILL_THRESHOLD_BYTES
    spill_dir: Path | None = None
    spill_argv: Callable[[Path], list[str]] | None = None
    default_timeout_s: float = DEFAULT_TIMEOUT_S
    rate_limited_returncode: int = DEFAULT_RATE_LIMITED_RETURNCODE

    def __post_init__(self) -> None:
        if self.max_attempts < 1:
            raise ValueError(
                f"max_attempts must be at least 1, got {self.max_attempts}"
            )

    def complete(self, prompt: str, *, timeout_s: float | None = None) -> str:
        """Return the CLI's response text, retrying only transient failures."""
        effective_timeout = (
            timeout_s if timeout_s is not None else self.default_timeout_s
        )
        last: LlmError | None = None
        for attempt in range(1, self.max_attempts + 1):
            try:
                return self._complete_once(prompt, timeout_s=effective_timeout)
            except TransientLlmError as exc:
                last = exc
                if attempt < self.max_attempts:
                    self.sleep(self.backoff_s * attempt)
        assert last is not None  # the loop always runs at least once
        raise last

    def _complete_once(self, prompt: str, *, timeout_s: float) -> str:
        if len(prompt.encode("utf-8")) <= self.spill_threshold_bytes:
            return self._invoke([*self.argv, prompt], timeout_s)
        if self.spill_argv is None:
            raise LlmError(
                "prompt exceeds spill_threshold_bytes "
                f"({self.spill_threshold_bytes} bytes) but no spill_argv "
                "was configured; add spill_argv=<Callable[[Path], "
                "list[str]]> to send it via a file, or raise "
                "spill_threshold_bytes"
            )
        with self._spilled_prompt(prompt) as path:
            return self._invoke([*self.argv, *self.spill_argv(path)], timeout_s)

    def _invoke(self, argv: Sequence[str], timeout_s: float) -> str:
        runner = self.runner if self.runner is not None else _default_runner
        try:
            proc = runner(argv, timeout_s)
        except subprocess.TimeoutExpired as exc:
            raise TransientLlmError(
                "subprocess did not return before the timeout"
            ) from exc
        if proc.returncode == self.rate_limited_returncode:
            raise RateLimitedError(
                f"subprocess reported rate limiting (exit {proc.returncode})"
            )
        if proc.returncode != 0:
            stderr = (proc.stderr or "").strip()
            detail = f": {stderr}" if stderr else ""
            raise LlmError(f"subprocess exited {proc.returncode}{detail}")
        text = (proc.stdout or "").strip()
        if not text:
            raise TransientLlmError("subprocess returned an empty body")
        return text

    @contextmanager
    def _spilled_prompt(self, content: str) -> Iterator[Path]:
        """Write `content` to a private (0600) temp file; delete on exit.

        The file sits alone in a fresh per-call 0700 directory: sharing a
        parent directory (worst case the whole system temp dir) between
        concurrent calls would let one call's spilled prompt be read
        (or tampered with) via the referenced path of another.
        """
        base = self.spill_dir if self.spill_dir is not None else Path(
            tempfile.gettempdir()
        )
        base.mkdir(parents=True, exist_ok=True)
        # `mkdtemp` creates the directory 0700 — only this process (and
        # root) can look inside.
        private_dir = Path(
            tempfile.mkdtemp(prefix="llm-pipeline-", dir=str(base))
        )
        # `mkstemp` creates the file 0600 by default.
        fd, name = tempfile.mkstemp(
            suffix=".txt", prefix="prompt-", dir=str(private_dir)
        )
        path = Path(name)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                handle.write(content)
            yield path
        finally:
            shutil.rmtree(private_dir, ignore_errors=True)
