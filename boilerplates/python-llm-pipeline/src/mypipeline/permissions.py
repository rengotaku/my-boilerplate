"""Filesystem permission hardening for on-disk pipeline state.

Any durable store that lands data on local disk (a SQLite state DB, a
spilled prompt file, ...) should sit behind a private (`0700`) directory and
use private (`0600`) files, regardless of the process umask, so other local
accounts on the machine cannot read it.

`chmod` runs *after* `mkdir`/create so the mode is exact even under a
permissive umask — a bare `mkdir(mode=0o700)` is still masked by the umask
(which can only *remove* bits, never widen it back to what was asked for).
"""

from __future__ import annotations

from pathlib import Path

DIR_MODE = 0o700
FILE_MODE = 0o600


def ensure_private_dir(directory: Path) -> None:
    """`mkdir(parents=True, exist_ok=True)` then chmod to `DIR_MODE`.

    Also corrects an *existing* directory's looser mode — the umask problem
    above applies just as much to a directory created by other code before
    this ever runs.
    """
    directory.mkdir(parents=True, exist_ok=True)
    directory.chmod(DIR_MODE)


def harden_file(path: Path) -> None:
    """chmod `path` to `FILE_MODE` (the file must already exist)."""
    path.chmod(FILE_MODE)
