"""SQLite-backed pipeline state: watermarks + a dedup ledger.

`IngestState` owns two concerns and nothing else:

* `watermarks` — one opaque cursor per source, so a resumable pipeline picks
  up where it stopped instead of re-scanning everything on every run.
* `dedup_ledger` — a `(source, stable_id)` ledger so the same item is never
  processed (or sent to an LLM) twice.

Threading: `IngestState` wraps a single `sqlite3.Connection` with the default
`check_same_thread=True`. Use **one instance per process/thread**; do not
share it across threads.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from types import TracebackType

from mypipeline.permissions import ensure_private_dir, harden_file

# Bumped whenever the schema shape changes; `_migrate` upgrades an older
# database file in place on open. A fresh (or pre-versioning) database reads
# back as version 0.
_SCHEMA_VERSION = 1

_SCHEMA = """
CREATE TABLE IF NOT EXISTS watermarks (
    source     TEXT PRIMARY KEY,
    cursor     TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dedup_ledger (
    source        TEXT NOT NULL,
    stable_id     TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    PRIMARY KEY (source, stable_id)
);
"""


def _utcnow_iso() -> str:
    return datetime.now(UTC).isoformat()


class IngestState:
    """Repository over the pipeline state database.

    Prefer the `open` / `in_memory` constructors; both create the schema.
    Use it as a context manager (or call `close()`) to release the
    connection.
    """

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn
        self._conn.row_factory = sqlite3.Row
        try:
            self._init_schema()
        except BaseException:
            self._conn.close()
            raise

    @classmethod
    def open(cls, db_path: Path) -> IngestState:
        """Open (creating parent dirs and schema) a file-backed state store.

        The parent directory is hardened to `0700` and the DB file (plus its
        WAL/SHM sidecars, if present) to `0600` — this database can carry
        per-item identifiers and cursors that reveal what the pipeline has
        processed, so other local accounts must not be able to read it.
        """
        ensure_private_dir(db_path.parent)
        conn = sqlite3.connect(db_path)
        # WAL lets a read (e.g. a status command) proceed while a write
        # transaction is in flight.
        conn.execute("PRAGMA journal_mode=WAL")
        state = cls(conn)
        harden_file(db_path)
        for suffix in ("-wal", "-shm"):
            sidecar = db_path.with_name(db_path.name + suffix)
            if sidecar.exists():
                harden_file(sidecar)
        return state

    @classmethod
    def in_memory(cls) -> IngestState:
        """Open an ephemeral in-memory state store (for tests)."""
        return cls(sqlite3.connect(":memory:"))

    def _init_schema(self) -> None:
        # Migration runs BEFORE the schema script so a future column addition
        # can run its `ALTER TABLE` against the pre-migration shape; on a
        # fresh database the migration itself is a no-op.
        self._migrate()
        self._conn.executescript(_SCHEMA)
        self._conn.commit()

    def _migrate(self) -> None:
        """Idempotently upgrade an older database file to `_SCHEMA_VERSION`.

        Re-running this against an already-current database is a no-op: the
        version check short-circuits before any DDL runs, so `open()` is
        always safe to call repeatedly against the same file (or a
        concurrently-migrated one, since the version stamp is written last).
        This is also the hook point for future `ALTER TABLE` steps, gated the
        same way as this first version.
        """
        (version,) = self._conn.execute("PRAGMA user_version").fetchone()
        if version >= _SCHEMA_VERSION:
            return
        self._conn.execute(f"PRAGMA user_version = {_SCHEMA_VERSION:d}")

    @contextmanager
    def _tx(self) -> Iterator[None]:
        """Commit on success, roll back on any exception."""
        try:
            yield
            self._conn.commit()
        except BaseException:
            self._conn.rollback()
            raise

    # -- watermarks -----------------------------------------------------

    def get_watermark(self, source: str) -> str | None:
        """Return the stored cursor for `source`, or `None` if unset."""
        row = self._conn.execute(
            "SELECT cursor FROM watermarks WHERE source = ?", (source,)
        ).fetchone()
        return None if row is None else str(row["cursor"])

    def set_watermark(self, source: str, cursor: str) -> None:
        """Upsert the cursor for `source` (standalone, auto-committing)."""
        with self._tx():
            self._conn.execute(
                """
                INSERT INTO watermarks (source, cursor, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(source) DO UPDATE SET
                    cursor = excluded.cursor,
                    updated_at = excluded.updated_at
                """,
                (source, cursor, _utcnow_iso()),
            )

    # -- dedup ledger ---------------------------------------------------

    def is_seen(self, source: str, stable_id: str) -> bool:
        """Return whether `(source, stable_id)` is already recorded."""
        row = self._conn.execute(
            "SELECT 1 FROM dedup_ledger WHERE source = ? AND stable_id = ?",
            (source, stable_id),
        ).fetchone()
        return row is not None

    def record(self, source: str, stable_id: str) -> bool:
        """Idempotently record `(source, stable_id)` (auto-committing).

        Returns `True` when newly inserted, `False` when it was already
        present.
        """
        with self._tx():
            cur = self._conn.execute(
                """
                INSERT OR IGNORE INTO dedup_ledger
                    (source, stable_id, first_seen_at)
                VALUES (?, ?, ?)
                """,
                (source, stable_id, _utcnow_iso()),
            )
            return cur.rowcount == 1

    # -- lifecycle ------------------------------------------------------

    def close(self) -> None:
        """Close the underlying connection."""
        self._conn.close()

    def __enter__(self) -> IngestState:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        self.close()
