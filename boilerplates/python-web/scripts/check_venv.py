#!/usr/bin/env python3
"""Detect a stale .venv whose interpreter cannot be executed.

Exit 0  : .venv が無い、または .venv/bin/python が起動できる (健全)
Exit 1  : .venv が存在するが python 起動に失敗 (要再作成)

uv で作成した venv は shebang や symlink に絶対パスを焼き込むため、
プロジェクトを別パスへ移動 / Docker の bind mount から取り出した直後に
``.venv/bin/python`` のリンク切れで ``Failed to spawn`` が起きる。
本スクリプトは Makefile install ターゲットから呼ばれ、壊れた venv を
``rm -rf .venv`` で削除する判定に使う。
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    venv_dir = Path(".venv")
    if not venv_dir.exists():
        return 0

    python_bin = venv_dir / "bin" / "python"
    if not python_bin.exists() and not python_bin.is_symlink():
        # .venv はあるが python 自体が無い → 不完全
        return 1

    try:
        result = subprocess.run(
            [str(python_bin), "-c", "import sys; sys.exit(0)"],
            capture_output=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return 1

    return 0 if result.returncode == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
