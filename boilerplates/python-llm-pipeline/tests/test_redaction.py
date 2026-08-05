"""`RedactionGate` / `mask_secrets` tests (frozen case 12)."""

from __future__ import annotations

from mypipeline.redaction import RedactionGate, mask_secrets


def test_case12_gate_masks_api_key_and_bearer_token_leaves_rest_unchanged() -> None:
    """Case 12: sk-* and Bearer tokens are masked; the rest of the text is not."""
    gate = RedactionGate()
    text = (
        "prefix sk-abcdefghijklmnopqrstuvwxyz "
        "and Bearer abcdEFGH12345678wxyz suffix"
    )

    masked = gate.redact(text)

    assert "sk-abcdefghijklmnopqrstuvwxyz" not in masked
    assert "Bearer abcdEFGH12345678wxyz" not in masked
    assert masked.startswith("prefix ")
    assert masked.endswith(" suffix")
    assert "<REDACTED>" in masked


def test_case12_short_sk_prefixed_word_is_not_masked() -> None:
    """A short `sk-` token (under the 20-char threshold) is left untouched.

    Guards against an overly broad pattern that would mask ordinary words.
    """
    text = "the sk-short token stays as-is"

    masked = mask_secrets(text)

    assert masked == text


def test_mask_secrets_is_the_gates_default_redactor() -> None:
    """`RedactionGate()` defaults to `mask_secrets` (no configuration needed)."""
    assert RedactionGate().redact("sk-abcdefghijklmnopqrstuvwxyz") == "<REDACTED>"
