"""Prompt templates: system/user separation with an embedded JSON skeleton.

Separating the system prompt (persona / global instructions, stable across
calls) from the user prompt (the concrete task for *this* call) keeps prompt
construction testable and lets callers reuse a persona across many tasks.

Embedding a JSON skeleton in the user prompt nudges the model toward a
predictable response shape. The caller is still responsible for validating
(and, if needed, retrying on) the parsed JSON — a skeleton is a hint, not a
schema enforcement mechanism.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True, slots=True)
class PromptTemplate:
    """A system/user prompt pair, ready to send to an `LlmClient`."""

    system: str
    user: str


def build_json_skeleton(fields: dict[str, Any]) -> str:
    """Render `fields` as a pretty-printed JSON skeleton for a prompt body.

    `fields` values are typically placeholder strings (e.g. `"<title>"`) or
    example values describing the expected shape, not real data.
    """
    return json.dumps(fields, ensure_ascii=False, indent=2)


def build_prompt(
    *,
    system: str,
    task: str,
    skeleton: dict[str, Any] | None = None,
) -> PromptTemplate:
    """Compose a `PromptTemplate` from a system persona and a task.

    When `skeleton` is given, its JSON rendering is appended to the user
    prompt under an "Output JSON skeleton" heading so the model has a
    concrete shape to fill in.
    """
    user = task
    if skeleton is not None:
        user = f"{task}\n\n# Output JSON skeleton\n{build_json_skeleton(skeleton)}"
    return PromptTemplate(system=system, user=user)
