"""`LlmClient` Protocol and exception hierarchy tests."""

from __future__ import annotations

from mypipeline.llm.base import (
    LlmClient,
    LlmError,
    RateLimitedError,
    TransientLlmError,
)


class _FakeLlmClient:
    """A minimal `LlmClient` implementation used to check Protocol conformance."""

    def complete(self, prompt: str, *, timeout_s: float | None = None) -> str:
        return f"echo: {prompt}"


def test_fake_client_satisfies_protocol() -> None:
    """A structurally-compatible class is recognized via `isinstance`."""
    client: LlmClient = _FakeLlmClient()
    assert isinstance(client, LlmClient)
    assert client.complete("hi") == "echo: hi"


def test_object_without_complete_does_not_satisfy_protocol() -> None:
    """A class missing `complete` is not treated as an `LlmClient`."""

    class _NotAClient:
        pass

    assert not isinstance(_NotAClient(), LlmClient)


def test_transient_and_rate_limited_are_llm_errors() -> None:
    """Both leaf exceptions are catchable as the common `LlmError` base."""
    assert issubclass(TransientLlmError, LlmError)
    assert issubclass(RateLimitedError, LlmError)


def test_rate_limited_is_not_transient() -> None:
    """Rate limiting must not be retried by a transient-only retry loop."""
    assert not issubclass(RateLimitedError, TransientLlmError)


def test_llm_error_carries_message() -> None:
    """Exceptions behave like ordinary `RuntimeError`s (message preserved)."""
    exc = TransientLlmError("boom")
    assert str(exc) == "boom"
    assert isinstance(exc, RuntimeError)
