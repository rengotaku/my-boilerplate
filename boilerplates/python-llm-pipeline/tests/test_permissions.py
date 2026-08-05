"""`ensure_private_dir` / `harden_file` tests (frozen case 11)."""

from __future__ import annotations

import stat
from pathlib import Path

from mypipeline.permissions import ensure_private_dir, harden_file


def test_case11_ensure_private_dir_corrects_a_loose_existing_dir(
    tmp_path: Path,
) -> None:
    """Case 11: an existing, loosely-permissioned dir is corrected to 0700."""
    loose_dir = tmp_path / "loose_dir"
    loose_dir.mkdir()
    loose_dir.chmod(0o777)

    ensure_private_dir(loose_dir)

    assert stat.S_IMODE(loose_dir.stat().st_mode) == 0o700


def test_case11_ensure_private_dir_creates_missing_parents(
    tmp_path: Path,
) -> None:
    """Case 11: `ensure_private_dir` also creates missing parent dirs."""
    nested = tmp_path / "a" / "b" / "c"

    ensure_private_dir(nested)

    assert nested.is_dir()
    assert stat.S_IMODE(nested.stat().st_mode) == 0o700


def test_case11_harden_file_corrects_a_loose_existing_file(
    tmp_path: Path,
) -> None:
    """Case 11: an existing, loosely-permissioned file is corrected to 0600."""
    loose_file = tmp_path / "loose.db"
    loose_file.write_text("x", encoding="utf-8")
    loose_file.chmod(0o666)

    harden_file(loose_file)

    assert stat.S_IMODE(loose_file.stat().st_mode) == 0o600
