"""`SubprocessLlmClient` retry / rate-limit / spill tests (frozen cases 6-9).

No real subprocess is ever spawned: `runner` is injected in every test, and
`sleep` is injected to record calls instead of actually blocking.
"""

from __future__ import annotations

import stat
import subprocess
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pytest

from mypipeline.llm.base import LlmError, RateLimitedError, TransientLlmError
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


def test_case9_large_prompt_spills_small_prompt_stays_in_argv(tmp_path: Path) -> None:
    """Case 9: a prompt over the threshold is spilled to a private temp file
    (0600 file in a 0700 directory) instead of passed via argv; a prompt at
    or under the threshold stays inline.
    """
    observed: dict[str, Any] = {}

    def runner(
        argv: Sequence[str], timeout_s: float
    ) -> subprocess.CompletedProcess[str]:
        observed["argv"] = list(argv)
        last = argv[-1]
        path = Path(last)
        if path.exists():
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
    )

    # At or under the threshold: passed inline via argv, no file created.
    small = "x" * 10
    result_small = client.complete(small)
    assert result_small == "ok"
    assert observed["argv"] == ["mycmd", small]
    assert "spilled_path" not in observed

    # Over the threshold: spilled to a private temp file.
    large = "y" * 500
    result_large = client.complete(large)
    assert result_large == "ok"
    assert observed["spilled_content"] == large
    assert observed["file_mode"] == 0o600
    assert observed["dir_mode"] == 0o700
    # The file is removed again once the call that referenced it returns.
    assert not observed["spilled_path"].exists()


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
