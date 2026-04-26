"""Makefile correctness tests.

- run ターゲットの uvicorn フラグが現行 uvicorn で受理されること
- install ターゲットが壊れた .venv を自動復旧すること
"""

import re
import subprocess
import sys
from pathlib import Path

import pytest

PYTHON_WEB_DIR = Path(__file__).parent.parent
MAKEFILE = PYTHON_WEB_DIR / "Makefile"
CHECK_VENV_SCRIPT = PYTHON_WEB_DIR / "scripts" / "check_venv.py"


def _read_makefile() -> str:
    return MAKEFILE.read_text()


def _extract_target_section(content: str, target: str) -> str:
    section: list[str] = []
    in_section = False
    for line in content.split("\n"):
        if line.startswith(f"{target}:"):
            in_section = True
            section.append(line)
            continue
        if in_section:
            if (
                line.startswith("\t")
                or line.startswith("@")
                or line.strip() == ""
            ):
                section.append(line)
            else:
                break
    return "\n".join(section)


class TestRunTargetUvicornFlags:
    """run ターゲットの uvicorn 起動フラグが現行 uvicorn で有効なこと."""

    def test_run_target_does_not_use_no_reload(self) -> None:
        """run は --no-reload を含まない (uvicorn 0.44 で削除済み)."""
        run_section = _extract_target_section(_read_makefile(), "run")
        assert "--no-reload" not in run_section, (
            "uvicorn 0.44 では --no-reload が削除された (デフォルト = 非リロード)"
        )

    def test_run_target_does_not_enable_reload(self) -> None:
        """run は --reload を有効化しない (本番モード)."""
        run_section = _extract_target_section(_read_makefile(), "run")
        # --reload-xxx は許容、単独 --reload のみ NG
        assert not re.search(r"--reload(\s|$)", run_section), (
            f"run target で --reload が有効化されている: {run_section}"
        )

    def test_run_target_uvicorn_flags_are_accepted_by_uvicorn(self) -> None:
        """run ターゲットの uvicorn 引数を実バイナリで検証する.

        Makefile run セクションから uvicorn 行を抽出し、
        `<uvicorn> <args> --help` を実行してフラグエラーが出ないことを確認。
        """
        uvicorn_bin = PYTHON_WEB_DIR / ".venv" / "bin" / "uvicorn"
        if not uvicorn_bin.exists():
            pytest.skip(".venv/bin/uvicorn 未インストールのためスキップ")

        run_section = _extract_target_section(_read_makefile(), "run")
        match = re.search(r"uvicorn\s+([^\n]+)", run_section)
        assert match, f"uvicorn 起動行が見つからない: {run_section}"

        # 環境変数を展開: $(PORT) → 8000
        args_str = match.group(1).replace("$(PORT)", "8000")
        args = args_str.split()

        result = subprocess.run(
            [str(uvicorn_bin), *args, "--help"],
            capture_output=True,
            text=True,
            timeout=15,
            check=False,
        )
        # Click は --help 表示前にフラグを検証する
        assert "No such option" not in result.stderr, (
            f"uvicorn が拒否したフラグが含まれる: stderr={result.stderr}"
        )
        assert result.returncode == 0, (
            f"uvicorn --help 実行失敗: rc={result.returncode}, "
            f"stderr={result.stderr}"
        )


class TestCheckVenvScript:
    """scripts/check_venv.py が壊れた .venv を検知すること."""

    def test_script_exists(self) -> None:
        """check_venv.py が存在する."""
        assert CHECK_VENV_SCRIPT.exists(), (
            f"{CHECK_VENV_SCRIPT} が存在しない"
        )

    def test_script_is_executable(self) -> None:
        """check_venv.py が実行可能 (shebang つき)."""
        if not CHECK_VENV_SCRIPT.exists():
            pytest.skip("script not yet created")
        content = CHECK_VENV_SCRIPT.read_text()
        assert content.startswith("#!"), "shebang がない"

    def test_returns_zero_when_no_venv(self, tmp_path: Path) -> None:
        """.venv が無い場合は 0 を返す (uv sync が作成する)."""
        if not CHECK_VENV_SCRIPT.exists():
            pytest.skip("script not yet created")
        result = subprocess.run(
            [sys.executable, str(CHECK_VENV_SCRIPT)],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        assert result.returncode == 0, (
            f"no-venv で 0 を期待: rc={result.returncode}, "
            f"stdout={result.stdout}, stderr={result.stderr}"
        )

    def test_returns_zero_for_working_venv(self, tmp_path: Path) -> None:
        """正常な .venv (Python が実行可能) なら 0 を返す."""
        if not CHECK_VENV_SCRIPT.exists():
            pytest.skip("script not yet created")
        venv_bin = tmp_path / ".venv" / "bin"
        venv_bin.mkdir(parents=True)
        (venv_bin / "python").symlink_to(sys.executable)

        result = subprocess.run(
            [sys.executable, str(CHECK_VENV_SCRIPT)],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        assert result.returncode == 0, (
            f"working venv で 0 を期待: rc={result.returncode}, "
            f"stderr={result.stderr}"
        )

    def test_returns_nonzero_for_broken_venv(self, tmp_path: Path) -> None:
        """壊れた .venv (Python シンボリックリンク先が存在しない) で非0."""
        if not CHECK_VENV_SCRIPT.exists():
            pytest.skip("script not yet created")
        venv_bin = tmp_path / ".venv" / "bin"
        venv_bin.mkdir(parents=True)
        # 存在しないパスへのシンボリックリンク (壊れた shebang を再現)
        (venv_bin / "python").symlink_to(
            "/nonexistent/path/python-broken-shebang"
        )

        result = subprocess.run(
            [sys.executable, str(CHECK_VENV_SCRIPT)],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        assert result.returncode != 0, (
            "broken venv は非0 を期待"
        )


class TestInstallTargetSelfHeals:
    """install ターゲットが壊れた .venv を検知して再作成すること."""

    def test_install_invokes_check_venv(self) -> None:
        """install ターゲットで check_venv.py が呼ばれる."""
        install_section = _extract_target_section(_read_makefile(), "install")
        assert "check_venv" in install_section, (
            f"install で check_venv が呼ばれていない: {install_section}"
        )

    def test_install_removes_venv_on_check_failure(self) -> None:
        """check_venv 失敗時に .venv を削除する."""
        install_section = _extract_target_section(_read_makefile(), "install")
        # check_venv.py || rm -rf .venv のようなパターン
        assert "rm -rf .venv" in install_section, (
            f"install で .venv 削除が無い: {install_section}"
        )
