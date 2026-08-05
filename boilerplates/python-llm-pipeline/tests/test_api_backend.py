"""`HttpApiLlmClient` JSON response parsing tests (frozen case 10).

All HTTP is faked with `httpx.MockTransport` — no real network access.
"""

from __future__ import annotations

import httpx
import pytest

from mypipeline.llm.api_backend import HttpApiLlmClient, parse_json_response
from mypipeline.llm.base import LlmError, RateLimitedError, TransientLlmError


def _client_with_response_text(text: str) -> HttpApiLlmClient:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"text": text})

    return HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )


def test_case10a_code_fenced_json_response_parses_to_dict() -> None:
    """Case 10(a): a ```json fenced response body parses to a dict."""
    client = _client_with_response_text('```json\n{"answer": 42}\n```')

    result = client.complete_json("question")

    assert result == {"answer": 42}


def test_case10b_raw_json_response_parses_to_dict() -> None:
    """Case 10(b): a raw (unfenced) JSON object response parses to a dict."""
    client = _client_with_response_text('{"answer": 42}')

    result = client.complete_json("question")

    assert result == {"answer": 42}


def test_case10c_invalid_json_raises_llm_error() -> None:
    """Case 10(c): text that is not valid JSON raises `LlmError`."""
    client = _client_with_response_text("not json at all")

    with pytest.raises(LlmError):
        client.complete_json("question")


def test_case10d_non_dict_json_raises_llm_error() -> None:
    """Case 10(d): valid JSON that is not an object (e.g. a list) raises
    `LlmError`.
    """
    client = _client_with_response_text("[1, 2, 3]")

    with pytest.raises(LlmError):
        client.complete_json("question")


def test_complete_returns_raw_text_without_parsing() -> None:
    """`complete()` (the `LlmClient` Protocol method) returns the raw text,
    unparsed — only `complete_json()` parses it.
    """
    client = _client_with_response_text("plain text, not JSON")

    assert client.complete("question") == "plain text, not JSON"


def test_parse_json_response_strips_code_fence_directly() -> None:
    """`parse_json_response` is usable standalone (no HTTP involved)."""
    assert parse_json_response('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_json_response('{"a": 1}') == {"a": 1}


def test_missing_text_field_raises_llm_error() -> None:
    """Additional case: a response body without the expected `text` field
    is a clear `LlmError`, not a `KeyError`/`TypeError` leaking out.

    Extra test rationale (must report in the progress comment):
    the JSON-parsing case (10) only covers malformed *text*; a malformed
    *response envelope* (missing/mistyped `text` field) is a distinct
    failure mode the brief's cases don't enumerate but that the same
    "LLM output drift -> silent corruption" concern from case 10 applies to.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"unexpected": "shape"})

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(LlmError):
        client.complete("question")


def test_2xx_non_json_body_raises_llm_error() -> None:
    """Additional case: a 2xx response with a non-JSON body raises `LlmError`.

    Extra test rationale (must report in the progress comment):
    a successful HTTP status is not a guarantee the body is well-formed
    JSON (a misconfigured endpoint, a proxy error page returned with a 200,
    ...). `response.json()` raises `json.JSONDecodeError` (a `ValueError`)
    in that case; without an explicit catch it would bypass the `LlmError`
    contract every other failure in this class goes through.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="not json at all")

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(LlmError):
        client.complete("question")


def test_status_429_raises_rate_limited_error() -> None:
    """Round-2 fix 1(a): a 429 response maps to `RateLimitedError`.

    Extra test rationale (must report in the progress comment):
    mirrors `subprocess_backend`'s rate-limit-fails-fast case (8) for the
    HTTP backend -- a 429 is the HTTP-standard way an API signals throttling,
    and the caller needs a distinct exception type to fail fast instead of
    retrying into the same quota window.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, text="rate limited")

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(RateLimitedError):
        client.complete("question")


def test_connect_timeout_raises_transient_llm_error() -> None:
    """Round-2 fix 1(b): a connect timeout maps to `TransientLlmError`.

    Extra test rationale (must report in the progress comment):
    mirrors `subprocess_backend`'s `subprocess.TimeoutExpired`-is-transient
    case (the additional test added for STEP B) -- a timeout is a one-off
    worth retrying, not a permanent failure.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("connect timed out", request=request)

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(TransientLlmError):
        client.complete("question")


def test_connect_error_raises_transient_llm_error() -> None:
    """Round-2 fix 1(b): a connection-level failure maps to `TransientLlmError`.

    Extra test rationale (must report in the progress comment):
    `httpx.ConnectError` (refused/reset connection, DNS failure, ...) is a
    distinct exception class from `httpx.TimeoutException`; both are
    `httpx.TransportError` subclasses and both must be caught, so this
    confirms the non-timeout half of the fix independently.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(TransientLlmError):
        client.complete("question")


def test_status_500_raises_plain_llm_error_not_rate_limited_or_transient() -> None:
    """Round-2 fix 1(c): a 500 stays a plain `LlmError` (not a subclass).

    Extra test rationale (must report in the progress comment):
    the existing `test_http_error_status_raises_llm_error` only checks
    `pytest.raises(LlmError)`, which would also pass if 500 were
    mis-mapped to `RateLimitedError`/`TransientLlmError` (both are
    `LlmError` subclasses) -- this test pins the "everything else" branch of
    the three-way split precisely, without touching that existing test.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="internal error")

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(LlmError) as exc_info:
        client.complete("question")

    assert not isinstance(exc_info.value, RateLimitedError)
    assert not isinstance(exc_info.value, TransientLlmError)


def test_base_url_path_is_preserved_in_the_request() -> None:
    """Round-2 fix 2: a `base_url` with a path is requested as-is.

    Extra test rationale (must report in the progress comment):
    the docstring promises "POSTs to `base_url`"; before this fix the
    client posted to a client-level `base_url` + `"/"`, which httpx resolves
    by replacing the whole path -- so `https://host/v1/completions` silently
    became a request to `https://host/`. This pins the real request URL.
    """
    observed_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        observed_paths.append(request.url.path)
        return httpx.Response(200, json={"text": "ok"})

    client = HttpApiLlmClient(
        base_url="https://example.invalid/v1/completions",
        transport=httpx.MockTransport(handler),
    )

    result = client.complete("question")

    assert result == "ok"
    assert observed_paths == ["/v1/completions"]


def test_empty_text_field_raises_transient_llm_error() -> None:
    """Round-2 fix 3: an empty `text` field is a transient failure.

    Extra test rationale (must report in the progress comment):
    mirrors `subprocess_backend`'s empty-stdout-is-transient handling (case
    6/7) for the HTTP backend -- an empty response body usually means a
    retry-worthy hiccup, not a genuine (empty) answer.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"text": ""})

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(TransientLlmError):
        client.complete("question")


def test_whitespace_only_text_field_raises_transient_llm_error() -> None:
    """Round-2 fix 3: a whitespace-only `text` field is also transient.

    Extra test rationale (must report in the progress comment):
    guards against a masked-but-still-empty answer (e.g. a backend that pads
    an empty response with a newline) sneaking past a naive `== ""` check.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"text": "   \n  "})

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(TransientLlmError):
        client.complete("question")


def test_http_error_status_raises_llm_error() -> None:
    """Additional case: a non-2xx HTTP status is surfaced as `LlmError`.

    Extra test rationale (must report in the progress comment):
    complements case 10 (which only exercises 200 responses with varying
    bodies) with the other half of "the request failed" -- a transport-level
    HTTP failure -- so callers can rely on `complete()`/`complete_json()`
    never raising a raw `httpx` exception.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="internal error")

    client = HttpApiLlmClient(
        base_url="https://example.invalid",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(LlmError):
        client.complete("question")
