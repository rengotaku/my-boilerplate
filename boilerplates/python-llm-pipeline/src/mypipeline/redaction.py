"""Redaction gate: mask credential-shaped tokens before an LLM call.

This is a minimal, best-effort masker — not an exhaustive secret scanner —
applied just before a prompt leaves the process. Redact on the way out;
don't rely on the LLM (or its transport) to do it for you.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass

Redactor = Callable[[str], str]

_MASK = "<REDACTED>"

# API-key-shaped tokens ("sk-" followed by 20+ chars) and "Bearer <token>"
# values — the two shapes a minimal gate is expected to catch.
_SECRET_RE = re.compile(
    r"""
    sk-[A-Za-z0-9_-]{20,}                       # API-key-shaped token
    | (?i:bearer)[ ]+[A-Za-z0-9._~+/=-]{16,}     # Bearer <token>
    """,
    re.VERBOSE,
)


def mask_secrets(text: str) -> str:
    """Replace credential-shaped tokens in `text` with `<REDACTED>`."""
    return _SECRET_RE.sub(_MASK, text)


@dataclass(frozen=True, slots=True)
class RedactionGate:
    """The boundary a prompt passes through right before it reaches an LLM."""

    redactor: Redactor = mask_secrets

    def redact(self, text: str) -> str:
        """Return `text` with credential-shaped tokens masked."""
        return self.redactor(text)
