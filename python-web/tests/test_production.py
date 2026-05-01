"""Build assets and dev-server configuration tests.

US4: 本番ビルドアセットとローカル開発サーバー
- make build で Tailwind CSS が minify される (本番アセット)
- make run でローカル開発モードのサーバーが起動する (--reload + watch)

Makefile はローカル開発のみを対象とする (#143)。本番サーバー起動は
ホスト環境の責務 (uvicorn 直叩き / gunicorn / Docker など) なので
Makefile には本番サーバーターゲットは存在しない。
"""

import re
import subprocess
from pathlib import Path

import pytest

# python-web ディレクトリのパス
PYTHON_WEB_DIR = Path(__file__).parent.parent


def _read_makefile() -> str:
    """Makefile の内容を読み取る."""
    return (PYTHON_WEB_DIR / "Makefile").read_text()


def _extract_target_section(content: str, target: str) -> str:
    """Makefile から指定ターゲットのセクションを抽出する."""
    lines = content.split("\n")
    section_lines: list[str] = []
    in_section = False
    for line in lines:
        if line.startswith(f"{target}:"):
            in_section = True
            section_lines.append(line)
            continue
        if in_section:
            if line.startswith("\t"):
                section_lines.append(line)
            else:
                break
    return "\n".join(section_lines)


def _npm_available() -> bool:
    """npm コマンドが利用可能かチェック."""
    try:
        result = subprocess.run(
            ["npm", "--version"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


class TestMakefileBuildTarget:
    """make build ターゲットの本番アセットビルド要件テスト."""

    def test_build_target_exists_in_makefile(self) -> None:
        """Makefile に build ターゲットが定義されていること."""
        content = _read_makefile()
        assert "build:" in content

    def test_build_target_uses_minify_flag(self) -> None:
        """build ターゲットが --minify フラグを使用すること."""
        content = _read_makefile()
        assert "--minify" in content

    def test_build_output_css_path(self) -> None:
        """build の出力先が static/css/style.css であること."""
        content = _read_makefile()
        assert "static/css/style.css" in content

    def test_build_generates_minified_css(self) -> None:
        """make build 後に minify 済み CSS が生成されること.

        npm/Node.js 環境が必要。
        """
        if not _npm_available():
            pytest.skip("npm が利用不可のためスキップ")

        css_output = PYTHON_WEB_DIR / "static" / "css" / "style.css"
        if css_output.exists():
            css_output.unlink()

        result = subprocess.run(
            ["make", "build"],
            cwd=PYTHON_WEB_DIR,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        assert result.returncode == 0, (
            f"make build failed: {result.stderr}"
        )
        assert css_output.exists()

    def test_minified_css_is_smaller_than_dev_css(self) -> None:
        """minify 済み CSS が開発ビルドより小さいこと.

        Tailwind v4 では dev/prod 両方で未使用クラスが除去されるため、
        minify による削減は空白・改行の除去のみ。
        npm/Node.js 環境が必要。
        """
        if not _npm_available():
            pytest.skip("npm が利用不可のためスキップ")

        css_output = PYTHON_WEB_DIR / "static" / "css" / "style.css"

        # dev build (no minify)
        _tailwind_cmd = [
            "npx", "@tailwindcss/cli",
            "-i", "static/css/input.css",
            "-o", "static/css/style.css",
        ]
        subprocess.run(
            _tailwind_cmd,
            cwd=PYTHON_WEB_DIR,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        dev_size = css_output.stat().st_size
        assert dev_size > 0

        # prod build (minify)
        subprocess.run(
            [*_tailwind_cmd, "--minify"],
            cwd=PYTHON_WEB_DIR,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        prod_size = css_output.stat().st_size
        assert prod_size > 0

        assert prod_size < dev_size, (
            f"minify 後のサイズが開発ビルド以上: "
            f"dev={dev_size}B, prod={prod_size}B"
        )

    def test_build_input_css_exists(self) -> None:
        """Tailwind 入力ファイル input.css が存在すること."""
        input_css = PYTHON_WEB_DIR / "static" / "css" / "input.css"
        assert input_css.exists()

    def test_build_input_css_imports_tailwind(self) -> None:
        """input.css が Tailwind v4 のインポートを含むこと."""
        input_css = PYTHON_WEB_DIR / "static" / "css" / "input.css"
        content = input_css.read_text()
        assert "@import" in content
        assert "tailwindcss" in content


class TestMakefileRunTarget:
    """make run ターゲットのローカル開発サーバー要件テスト."""

    def test_run_target_exists_in_makefile(self) -> None:
        """Makefile に run ターゲットが定義されていること."""
        content = _read_makefile()
        assert re.search(r"^run:", content, re.MULTILINE)

    def test_run_target_enables_reload(self) -> None:
        """run ターゲットが --reload を有効化すること (開発モード)."""
        content = _read_makefile()
        run_section = _extract_target_section(content, "run")
        assert re.search(r"--reload(\s|$)", run_section), (
            "run target で --reload が見つからない。"
            f"section: {run_section}"
        )

    def test_run_target_uses_uvicorn(self) -> None:
        """run ターゲットが uvicorn を使用すること."""
        content = _read_makefile()
        run_section = _extract_target_section(content, "run")
        assert "uvicorn" in run_section

    def test_run_target_uses_configurable_port(self) -> None:
        """run ターゲットが $(PORT) で設定可能なこと."""
        content = _read_makefile()
        assert "PORT" in content
        run_section = _extract_target_section(content, "run")
        assert "PORT" in run_section

    def test_run_target_binds_to_all_interfaces(self) -> None:
        """run ターゲットが 0.0.0.0 にバインドすること."""
        content = _read_makefile()
        run_section = _extract_target_section(content, "run")
        assert "0.0.0.0" in run_section

    def test_run_target_runs_tailwind_watch(self) -> None:
        """run ターゲットが Tailwind --watch を起動すること."""
        content = _read_makefile()
        run_section = _extract_target_section(content, "run")
        assert "--watch" in run_section, (
            "run target で Tailwind --watch が見つからない。"
            f"section: {run_section}"
        )


class TestNoProductionTargetInMakefile:
    """Makefile はローカル開発のみを対象とする (#143)."""

    def test_no_run_prod_target(self) -> None:
        """Makefile に run-prod ターゲットが存在しないこと.

        本番サーバー起動はホスト環境の責務とし、Makefile はローカル開発のみ。
        """
        content = _read_makefile()
        assert not re.search(r"^run-prod:", content, re.MULTILINE), (
            "run-prod ターゲットが残存している。Makefile はローカル開発のみ"
        )

    def test_no_dev_target(self) -> None:
        """Makefile に dev ターゲットが存在しないこと.

        開発サーバーは `run` に統一された (#143)。
        """
        content = _read_makefile()
        assert not re.search(r"^dev:", content, re.MULTILINE), (
            "dev ターゲットが残存している。run に統一されたはず"
        )


class TestCopyAlpineTarget:
    """_copy-alpine ターゲットのテスト."""

    def test_copy_alpine_creates_js_directory(self) -> None:
        """static/js ディレクトリを作成すること."""
        content = _read_makefile()
        assert "mkdir -p static/js" in content

    def test_copy_alpine_handles_missing_node_modules(self) -> None:
        """node_modules 不在時に警告を出すこと."""
        content = _read_makefile()
        assert "Warning" in content or "warning" in content


class TestBuildAssetsTarget:
    """_build-assets ターゲットのテスト."""

    def test_build_assets_depends_on_copy_alpine(self) -> None:
        """_build-assets が _copy-alpine に依存すること."""
        content = _read_makefile()
        lines = content.split("\n")
        for line in lines:
            if line.startswith("_build-assets:"):
                assert "_copy-alpine" in line
                return
        pytest.fail("_build-assets not found")

    def test_build_assets_handles_missing_npx(self) -> None:
        """npx が存在しない場合にスキップすること."""
        content = _read_makefile()
        assert "command -v npx" in content
