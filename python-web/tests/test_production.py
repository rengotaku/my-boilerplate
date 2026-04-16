"""Production build and server configuration tests.

US4: 本番ビルドとデプロイ準備
- make build で Tailwind CSS が minify される
- make run で本番モードのサーバーが起動する
"""

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
    """make build ターゲットの本番ビルド要件テスト."""

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
        """minify 済み CSS が開発ビルドの 10% 以下であること.

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

        ratio = prod_size / dev_size
        assert ratio <= 0.10, (
            f"minify ratio {ratio:.1%} > 10%. "
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
    """make run ターゲットの本番サーバー要件テスト."""

    def test_run_target_exists_in_makefile(self) -> None:
        """Makefile に run ターゲットが定義されていること."""
        content = _read_makefile()
        assert "run:" in content or "run: build" in content

    def test_run_target_uses_no_reload(self) -> None:
        """run ターゲットが --no-reload を使用すること.

        本番サーバーでは自動リロードを無効にする。
        """
        content = _read_makefile()
        run_section = _extract_target_section(content, "run")
        assert "--no-reload" in run_section, (
            "run target missing --no-reload. "
            f"section: {run_section}"
        )

    def test_run_target_depends_on_build(self) -> None:
        """run ターゲットが build に依存していること."""
        content = _read_makefile()
        lines = content.split("\n")
        for line in lines:
            if line.startswith("run:"):
                assert "build" in line
                return
        pytest.fail("run target not found")

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
        assert "$(PORT)" in run_section

    def test_run_target_binds_to_all_interfaces(self) -> None:
        """run ターゲットが 0.0.0.0 にバインドすること."""
        content = _read_makefile()
        run_section = _extract_target_section(content, "run")
        assert "0.0.0.0" in run_section


class TestDevVsProductionDifferences:
    """開発モードと本番モードの違いが正しいこと."""

    def test_dev_uses_reload_run_does_not(self) -> None:
        """dev は --reload あり、run は --no-reload."""
        content = _read_makefile()
        dev_section = _extract_target_section(content, "dev")
        run_section = _extract_target_section(content, "run")

        assert "--reload" in dev_section
        assert "--no-reload" in run_section

    def test_dev_uses_tailwind_watch_build_uses_minify(self) -> None:
        """dev は Tailwind watch、build は minify."""
        content = _read_makefile()
        dev_section = _extract_target_section(content, "dev")
        build_section = _extract_target_section(content, "build")

        assert "--watch" in dev_section
        assert "--minify" in build_section


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
