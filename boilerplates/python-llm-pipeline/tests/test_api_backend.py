"""`HttpApiLlmClient` JSON response parsing tests (frozen case 10).

All HTTP is faked with `httpx.MockTransport` — no real network access.
"""

from __future__ import annotations

import httpx
import pytest

from mypipeline.llm.api_backend import HttpApiLlmClient, parse_json_response
from mypipeline.llm.base import LlmError


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
