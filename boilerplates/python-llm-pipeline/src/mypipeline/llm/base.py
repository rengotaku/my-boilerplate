"""The `LlmClient` Protocol and the exception hierarchy backends raise.

A pipeline should depend on :class:`LlmClient`, never on a concrete backend
(subprocess-driven CLI wrapper, HTTP API client, ...). Tests inject a fake
implementation, so no network and no external process is ever touched in CI.

The exception hierarchy exists so a caller's retry loop can distinguish a
*worth-retrying* failure from one that is not:

* :class:`TransientLlmError` — a one-off hiccup (timeout, empty response).
  Safe to retry with backoff.
* :class:`RateLimitedError` — the backend reported it is throttling calls.
  This is typically a multi-hour quota window, so retrying immediately just
  burns the remaining quota; callers should fail fast instead.
* Any other :class:`LlmError` — treated as non-transient by default (retrying
  would usually just repeat the same failure).
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable


class LlmError(RuntimeError):
    """An LLM call failed (non-zero exit, timeout, malformed response, ...)."""


class TransientLlmError(LlmError):
    """A transient failure worth retrying (e.g. a timeout or empty body).

    Only this subclass (not :class:`RateLimitedError` or a plain
    :class:`LlmError`) should be retried by a backend's retry loop.
    """


class RateLimitedError(LlmError):
    """The backend reported that the call was rate limited.

    Deliberately **not** a :class:`TransientLlmError`: rate limiting is
    usually a sustained, multi-hour quota window, so retrying immediately
    wastes calls. Callers should fail fast and let the caller's own
    resumption logic (e.g. a checkpoint) pick the work back up later.
    """


@runtime_checkable
class LlmClient(Protocol):
    """The single seam a pipeline uses to reach an LLM.

    Implementations must raise :class:`LlmError` (or a subclass) on failure
    rather than returning an empty or partial string, so callers can rely on
    "no exception" meaning "the body is usable".
    """

    def complete(self, prompt: str, *, timeout_s: float | None = None) -> str:
        """Return the model's response text for `prompt`.

        Raises:
            LlmError: the call failed. Use :class:`TransientLlmError` for
                failures worth retrying and :class:`RateLimitedError` for
                backend-reported throttling.
        """
        ...
