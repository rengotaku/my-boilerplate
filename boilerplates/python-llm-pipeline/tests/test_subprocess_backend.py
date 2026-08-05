"""`SubprocessLlmClient` retry / rate-limit / spill tests (frozen cases 6-9).

No real subprocess is ever spawned: `runner` is injected in every test, and
`sleep` is injected to record calls instead of actually blocking.

Case 9 was revised (round-3 fix 2, management decision on issue #282): the
original contract silently substituted the argv prompt with a spilled file's
path, which a CLI that treats its last argument as literal prompt text would
send straight through as a bogus prompt. The retired single test
(`test_case9_large_prompt_spills_small_prompt_stays_in_argv`) is replaced by
9a/9b/9c below, which pin the new `spill_argv`-based contract. All other
frozen cases (1-8, 10-12) are unchanged.
"""

from __future__ import annotations

import stat
import subprocess
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pytest

from mypipeline.llm.base import (
    LlmError,
    RateLimitedError,
    TransientLlmError,
)
from mypipeline.llm.subprocess_backend import SubprocessLlmClient


def _completed(
    argv: list[str], *, returncode: int, stdout: str, stderr: str = ""
) -> subprocess.CompletedProcess[str]:
    return subprocess.CompletedProcess(
        args=argv, returncode=returncode, stdout=stdout, stderr=stderr
    )


def test_case6_transient_failure_then_success_retries_with_backoff() -> None:
    """Case 6: a transient (empty-body) failure is retried and then succeeds."""
    calls: list[list[str]] = []
    sleeps: list[float] = []

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        calls.append(list(argv))
        if len(calls) == 1:
            # transient: empty body
            return _completed(list(argv), returncode=0, stdout="")
        return _completed(list(argv), returncode=0, stdout="the answer")

    client = SubprocessLlmClient(
        argv=["mycmd"],
        runner=runner,
        sleep=sleeps.append,
        max_attempts=3,
        backoff_s=2.0,
    )

    result = client.complete("hi")

    assert result == "the answer"
    assert len(calls) == 2
    assert sleeps == [2.0]  # backoff_s * attempt(1), called once


def test_case7_transient_failure_exhausts_max_attempts() -> None:
    """Case 7: a persistently transient failure fails after `max_attempts`."""
    calls = 0
    sleeps: list[float] = []

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        nonlocal calls
        calls += 1
        # always empty (transient)
        return _completed(list(argv), returncode=0, stdout="")

    client = SubprocessLlmClient(
        argv=["mycmd"],
        runner=runner,
        sleep=sleeps.append,
        max_attempts=3,
        backoff_s=1.0,
    )

    with pytest.raises(LlmError):
        client.complete("hi")

    assert calls == 3
    assert sleeps == [1.0, 2.0]


def test_case8_rate_limit_fails_fast_without_retry() -> None:
    """Case 8: a rate-limit signal raises `RateLimitedError` with no sleep."""
    calls = 0
    sleeps: list[float] = []

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        nonlocal calls
        calls += 1
        return _completed(list(argv), returncode=42, stdout="", stderr="rate limited")

    client = SubprocessLlmClient(
        argv=["mycmd"],
        runner=runner,
        sleep=sleeps.append,
        max_attempts=3,
    )

    with pytest.raises(RateLimitedError):
        client.complete("hi")

    assert calls == 1
    assert sleeps == []


def test_case9a_configured_spill_writes_private_file_and_uses_spill_argv(
    tmp_path: Path,
) -> None:
    """Case 9a (revised): with `spill_argv` configured, an over-threshold
    prompt is written to a private temp file (0600 file in a 0700
    directory), the file's content matches the prompt verbatim, `argv` is
    built via `spill_argv`, and the file is removed once the call returns.
    """
    observed: dict[str, Any] = {}

    def spill_argv(path: Path) -> list[str]:
        return ["--file", str(path)]

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        observed["argv"] = list(argv)
        path = Path(argv[-1])
        observed["spilled_content"] = path.read_text(encoding="utf-8")
        observed["file_mode"] = stat.S_IMODE(path.stat().st_mode)
        observed["dir_mode"] = stat.S_IMODE(path.parent.stat().st_mode)
        observed["spilled_path"] = path
        return _completed(list(argv), returncode=0, stdout="ok")

    client = SubprocessLlmClient(
        argv=["mycmd"],
        runner=runner,
        spill_threshold_bytes=100,
        spill_dir=tmp_path,
        spill_argv=spill_argv,
    )

    large = "y" * 500
    result = client.complete(large)

    assert result == "ok"
    assert observed["argv"] == ["mycmd", "--file", str(observed["spilled_path"])]
    assert observed["spilled_content"] == large
    assert observed["file_mode"] == 0o600
    assert observed["dir_mode"] == 0o700
    # The file is removed again once the call that referenced it returns.
    assert not observed["spilled_path"].exists()


def test_case9b_no_spill_argv_raises_llm_error_without_invoking_runner() -> None:
    """Case 9b (revised): without `spill_argv`, an over-threshold prompt is
    a configuration error (`LlmError`), not a silent path-as-prompt send —
    and the runner (subprocess) is never invoked.
    """
    calls = 0

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        nonlocal calls
        calls += 1
        return _completed(list(argv), returncode=0, stdout="ok")

    client = SubprocessLlmClient(
        argv=["mycmd"], runner=runner, spill_threshold_bytes=100
    )

    with pytest.raises(LlmError):
        client.complete("y" * 500)

    assert calls == 0


def test_case9c_prompt_at_or_under_threshold_uses_argv_directly() -> None:
    """Case 9c (revised, unchanged behavior): a prompt at or under the
    threshold is passed inline via argv, with no file created — regardless
    of whether `spill_argv` is configured.
    """
    captured: list[list[str]] = []

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        captured.append(list(argv))
        return _completed(list(argv), returncode=0, stdout="ok")

    client = SubprocessLlmClient(
        argv=["mycmd"], runner=runner, spill_threshold_bytes=100
    )

    small = "x" * 10
    result = client.complete(small)

    assert result == "ok"
    assert captured == [["mycmd", small]]


def test_transient_error_from_a_subprocess_timeout_is_retried() -> None:
    """Additional case: a `subprocess.TimeoutExpired` from the runner is
    treated as transient (worth retrying), same as an empty body.

    Extra test rationale (must report in the progress comment):
    `TimeoutExpired` is the other transient trigger the brief calls out
    ("timeout 相当"), alongside the empty-body case covered by 6/7. Checking
    it goes through the same retry path is a regression check that case 6/7
    alone would not cover.
    """
    calls = 0

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        nonlocal calls
        calls += 1
        if calls == 1:
            raise subprocess.TimeoutExpired(cmd=argv, timeout=timeout_s)
        return _completed(list(argv), returncode=0, stdout="recovered")

    client = SubprocessLlmClient(argv=["mycmd"], runner=runner, sleep=lambda _s: None)

    assert client.complete("hi") == "recovered"
    assert calls == 2


def test_non_rate_limit_non_zero_exit_fails_fast_as_llm_error() -> None:
    """Additional case: a plain non-zero exit (not rate-limit, not empty
    body) is a non-transient `LlmError` and is not retried.

    Extra test rationale (must report in the progress comment):
    confirms the brief's "transient のみ再試行" constraint holds for a
    generic (non-rate-limit) failure too, so a run of ordinary failures
    cannot burn the retry budget. Also pins that this error is not a
    `TransientLlmError` subclass.
    """
    calls = 0

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        nonlocal calls
        calls += 1
        return _completed(list(argv), returncode=1, stdout="", stderr="boom")

    client = SubprocessLlmClient(
        argv=["mycmd"], runner=runner, sleep=lambda _s: None, max_attempts=3
    )

    with pytest.raises(LlmError) as exc_info:
        client.complete("hi")

    assert not isinstance(exc_info.value, TransientLlmError)
    assert calls == 1
