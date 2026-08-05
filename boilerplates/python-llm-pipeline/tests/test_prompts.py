"""Prompt template construction tests."""

from __future__ import annotations

import json

from mypipeline.prompts import (
    PromptTemplate,
    build_json_skeleton,
    build_prompt,
)


def test_build_prompt_without_skeleton_keeps_task_verbatim() -> None:
    """With no skeleton, the user prompt is exactly the task text."""
    result = build_prompt(system="You are helpful.", task="Summarize this.")

    assert result == PromptTemplate(system="You are helpful.", user="Summarize this.")


def test_build_prompt_with_skeleton_embeds_json() -> None:
    """A skeleton is appended to the user prompt as pretty-printed JSON."""
    result = build_prompt(
        system="You are helpful.",
        task="Fill in the fields.",
        skeleton={"title": "<title>", "count": 0},
    )

    assert result.system == "You are helpful."
    assert result.user.startswith("Fill in the fields.\n\n# Output JSON skeleton\n")
    embedded = result.user.split("# Output JSON skeleton\n", 1)[1]
    assert json.loads(embedded) == {"title": "<title>", "count": 0}


def test_build_json_skeleton_round_trips() -> None:
    """The rendered skeleton parses back to the original mapping."""
    fields = {"a": 1, "b": ["x", "y"], "c": {"nested": True}}

    rendered = build_json_skeleton(fields)

    assert json.loads(rendered) == fields


def test_build_json_skeleton_uses_indentation() -> None:
    """The rendered skeleton is pretty-printed, not a single line."""
    rendered = build_json_skeleton({"a": 1})

    assert "\n" in rendered
