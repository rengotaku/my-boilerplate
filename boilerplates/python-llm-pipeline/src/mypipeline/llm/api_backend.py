"""Generic HTTP API `LlmClient` (chat-completion-style POST endpoint).

Requires the `llm-api` extra (`uv sync --extra llm-api` /
`pip install .[llm-api]`) — `httpx` is deliberately kept out of the core
dependencies so consumers of the subprocess backend don't have to pull it in.

POSTs `{"prompt": <prompt>}` to `base_url` (the full URL, path included — a
`base_url` like `https://host/v1/completions` is requested as-is, not
flattened to the host root) and expects a JSON response body shaped like
`{"text": "..."}`; the `text` field is the model's raw response. Override
`request_payload` / `response_text_field` for a different provider contract.

`complete()` (the `LlmClient` Protocol method) returns that raw text, unparsed.
`complete_json()` additionally parses the text as JSON, tolerating a Markdown
code fence — a common way models wrap structured output — and raising
`LlmError` if the text is not valid JSON or does not parse to an object. LLM
output is not a trustworthy input format: a model can drift into prose, an
empty string or a JSON array instead of the requested object, and silently
treating that as success would corrupt whatever consumes the result.

Failures map onto the same three-way split `subprocess_backend` uses: a 429
response or a network-level timeout/connection failure is treated as
recoverable (`RateLimitedError` / `TransientLlmError`); any other HTTP or
decoding failure, or an empty response body, is a plain `LlmError` — except
an *empty* `text` field, which is treated as transient (mirroring the
subprocess backend's empty-stdout case) since it usually means the same
retry-worthy hiccup on the HTTP side of a backend, not a permanent one.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

import httpx

from mypipeline.llm.base import (
    LlmError,
    RateLimitedError,
    TransientLlmError,
)

# The status code an API uses to signal rate limiting (HTTP convention).
RATE_LIMITED_STATUS_CODE = 429

DEFAULT_TIMEOUT_S = 60.0

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*\n?(.*?)\n?```$", re.DOTALL)


def _strip_code_fence(text: str) -> str:
    """Remove a leading/trailing ```` ```json ... ``` ```` fence, if present."""
    stripped = text.strip()
    match = _CODE_FENCE_RE.match(stripped)
    return match.group(1).strip() if match else stripped


def parse_json_response(text: str) -> dict[str, Any]:
    """Parse `text` as a JSON object, tolerating a Markdown code fence.

    Raises:
        LlmError: `text` is not valid JSON, or parses to something other
            than a JSON object (e.g. a list, string or number).
    """
    candidate = _strip_code_fence(text)
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise LlmError(f"response is not valid JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise LlmError(
            f"response JSON is not an object (got {type(parsed).__name__})"
        )
    return parsed


@dataclass(slots=True)
class HttpApiLlmClient:
    """An `LlmClient` backed by a JSON HTTP API, requested via `httpx`.

    `transport` is the injected HTTP seam (e.g. `httpx.MockTransport` in
    tests); left as `None` it defaults to `httpx`'s normal network transport.
    """

    base_url: str
    api_key: str | None = None
    transport: httpx.BaseTransport | None = None
    default_timeout_s: float = DEFAULT_TIMEOUT_S
    response_text_field: str = "text"

    def complete(self, prompt: str, *, timeout_s: float | None = None) -> str:
        """Return the API response's raw text field (Protocol-conformant)."""
        return self._request_text(prompt, timeout_s=timeout_s)

    def complete_json(
        self, prompt: str, *, timeout_s: float | None = None
    ) -> dict[str, Any]:
        """Return the API response's text field, parsed as a JSON object."""
        text = self._request_text(prompt, timeout_s=timeout_s)
        return parse_json_response(text)

    def _request_text(self, prompt: str, *, timeout_s: float | None) -> str:
        effective_timeout = (
            timeout_s if timeout_s is not None else self.default_timeout_s
        )
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        client_kwargs: dict[str, Any] = {
            "timeout": effective_timeout,
            "headers": headers,
        }
        if self.transport is not None:
            client_kwargs["transport"] = self.transport
        try:
            # Post to `base_url` itself (not a client-level `base_url` +
            # `"/"`, which would silently drop any path `base_url` carries —
            # httpx treats a request to the absolute path "/" as replacing
            # the whole path component of the client's `base_url`).
            with httpx.Client(**client_kwargs) as client:
                response = client.post(self.base_url, json={"prompt": prompt})
                response.raise_for_status()
                body = response.json()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == RATE_LIMITED_STATUS_CODE:
                raise RateLimitedError(
                    f"API rate limited (status {exc.response.status_code})"
                ) from exc
            raise LlmError(f"HTTP request failed: {exc}") from exc
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            # A timeout or connection-level failure (DNS, refused connection,
            # reset, ...) is a one-off worth retrying, same as
            # `subprocess_backend`'s `subprocess.TimeoutExpired` case.
            raise TransientLlmError(f"HTTP request failed transiently: {exc}") from exc
        except httpx.HTTPError as exc:
            raise LlmError(f"HTTP request failed: {exc}") from exc
        except ValueError as exc:
            # `response.json()` raises `json.JSONDecodeError` (a `ValueError`
            # subclass) on a non-JSON body -- a 2xx response is not a
            # guarantee the body is well-formed JSON, and letting that
            # exception escape here would bypass the `LlmError` contract
            # every other failure in this class goes through.
            raise LlmError(f"API response is not valid JSON: {exc}") from exc
        text = self._extract_text(body)
        if not text.strip():
            # Mirrors `subprocess_backend`'s empty-stdout handling: an empty
            # body is usually a transient hiccup on the backend's HTTP side,
            # not a permanent failure, so it is worth retrying rather than
            # returned as if it were a real (empty) answer.
            raise TransientLlmError("API response text field is empty")
        return text

    def _extract_text(self, body: object) -> str:
        if not isinstance(body, dict) or self.response_text_field not in body:
            raise LlmError(
                f"API response missing '{self.response_text_field}' field"
            )
        text = body[self.response_text_field]
        if not isinstance(text, str):
            raise LlmError(
                f"API response '{self.response_text_field}' field is not a string"
            )
        return text
