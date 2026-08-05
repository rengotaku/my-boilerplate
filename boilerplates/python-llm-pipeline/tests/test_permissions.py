"""`ensure_private_dir` / `harden_file` tests (frozen case 11)."""

from __future__ import annotations

import stat
from pathlib import Path

from mypipeline.permissions import (
    ensure_dir_exists_private,
    ensure_private_dir,
    harden_file,
)


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


def test_ensure_dir_exists_private_creates_a_missing_dir_as_0700(
    tmp_path: Path,
) -> None:
    """`ensure_dir_exists_private` creates a missing dir (and parents) 0700.

    Round-3 fix 1 rationale (must report in the progress comment):
    `IngestState.open()` needs the "create if missing, 0700" half of
    `ensure_private_dir`'s behavior without the "correct an existing dir"
    half (that half is wrong for a caller-supplied path like a relative
    `db_path`'s parent, which can be an arbitrary existing directory).
    """
    nested = tmp_path / "a" / "b" / "c"

    ensure_dir_exists_private(nested)

    assert nested.is_dir()
    assert stat.S_IMODE(nested.stat().st_mode) == 0o700


def test_ensure_dir_exists_private_leaves_an_existing_dirs_mode_untouched(
    tmp_path: Path,
) -> None:
    """`ensure_dir_exists_private` does NOT correct an already-existing dir.

    Round-3 fix 1 rationale (must report in the progress comment):
    this is the key behavioral difference from `ensure_private_dir` (frozen
    case 11 requires the opposite for that function) -- pins that an
    existing, loosely-permissioned directory keeps its mode.
    """
    loose_dir = tmp_path / "loose_dir"
    loose_dir.mkdir()
    loose_dir.chmod(0o777)

    ensure_dir_exists_private(loose_dir)

    assert stat.S_IMODE(loose_dir.stat().st_mode) == 0o777
