"""`IngestState` migration / watermark / dedup-ledger / tx tests (frozen 1-5)."""

from __future__ import annotations

import stat
from pathlib import Path

from mypipeline.state import IngestState


def test_case1_migration_is_idempotent_across_reopen(tmp_path: Path) -> None:
    """Case 1: reopening an already-migrated DB file is a no-op and safe."""
    db_path = tmp_path / "state.db"

    with IngestState.open(db_path) as state1:
        (version_after_first_open,) = state1._conn.execute(
            "PRAGMA user_version"
        ).fetchone()

    # Re-opening must not raise and must leave the version + schema exactly
    # as the first open left them.
    with IngestState.open(db_path) as state2:
        (version_after_second_open,) = state2._conn.execute(
            "PRAGMA user_version"
        ).fetchone()
        tables = {
            row["name"]
            for row in state2._conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }

    assert version_after_first_open > 0
    assert version_after_second_open == version_after_first_open
    assert {"watermarks", "dedup_ledger"} <= tables


def test_case2_watermark_persists_across_reopen(tmp_path: Path) -> None:
    """Case 2: a watermark set before close is read back unchanged after reopen."""
    db_path = tmp_path / "state.db"

    with IngestState.open(db_path) as state:
        state.set_watermark("src-a", "cursor-42")

    with IngestState.open(db_path) as state:
        assert state.get_watermark("src-a") == "cursor-42"


def test_case3_dedup_ledger_flags_repeat_records() -> None:
    """Case 3: `record` returns True once per `(source, stable_id)`, then False."""
    with IngestState.in_memory() as state:
        assert state.record("src", "id-1") is True
        assert state.record("src", "id-1") is False
        assert state.record("src", "id-2") is True


def test_case4_tx_rolls_back_on_exception() -> None:
    """Case 4: a write inside `_tx()` that raises leaves no trace behind."""
    with IngestState.in_memory() as state:
        try:
            with state._tx():
                state._conn.execute(
                    "INSERT INTO watermarks (source, cursor, updated_at) "
                    "VALUES (?, ?, ?)",
                    ("src", "cursor-1", "2024-01-01T00:00:00+00:00"),
                )
                raise RuntimeError("boom")
        except RuntimeError:
            pass

        assert state.get_watermark("src") is None


def test_case5_in_memory_requires_no_file(tmp_path: Path) -> None:
    """Case 5: `in_memory()` supports the same operations without a file."""
    with IngestState.in_memory() as state:
        assert state.record("src", "id-1") is True
        state.set_watermark("src", "cursor-1")
        assert state.get_watermark("src") == "cursor-1"

    # `in_memory()` never touched the filesystem.
    assert list(tmp_path.iterdir()) == []


def test_is_seen_reflects_record_without_mutating() -> None:
    """`is_seen` is a read-only check, independent of `record`'s bookkeeping."""
    with IngestState.in_memory() as state:
        assert state.is_seen("src", "id-1") is False
        state.record("src", "id-1")
        assert state.is_seen("src", "id-1") is True


def test_open_does_not_modify_an_existing_parent_directory_mode(
    tmp_path: Path,
) -> None:
    """Round-3 fix 1: `open()` leaves an existing parent dir's mode alone.

    Round-3 fix 1 rationale (must report in the progress comment):
    the parent directory of `db_path` can be an arbitrary caller-supplied
    directory (worst case the current working directory for a relative
    `db_path`); unconditionally re-chmod-ing it to 0700 on every open was a
    surprising side effect on a directory `IngestState` does not own.
    """
    parent = tmp_path / "existing_parent"
    parent.mkdir()
    parent.chmod(0o755)
    db_path = parent / "state.db"

    with IngestState.open(db_path):
        pass

    assert stat.S_IMODE(parent.stat().st_mode) == 0o755


def test_open_creates_a_missing_parent_directory_as_private(
    tmp_path: Path,
) -> None:
    """Round-3 fix 1: `open()` still creates a *missing* parent as 0700."""
    parent = tmp_path / "missing_parent"
    db_path = parent / "state.db"

    with IngestState.open(db_path):
        pass

    assert parent.is_dir()
    assert stat.S_IMODE(parent.stat().st_mode) == 0o700


def test_open_hardens_the_db_file_to_0600(tmp_path: Path) -> None:
    """Round-3 fix 1: `open()` still hardens the DB file itself to 0600."""
    db_path = tmp_path / "state.db"

    with IngestState.open(db_path):
        pass

    assert stat.S_IMODE(db_path.stat().st_mode) == 0o600
