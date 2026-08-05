import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageDropZone } from "@/components/ui/image-drop-zone";

describe("ImageDropZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // D1 受理 — 前提: accept="image/*"。手順: 適合ファイルを drop/選択。期待: onFiles に渡る。観点: 正常受理経路
  it("D1 受理: calls onFiles with accepted image files when dropped or selected", () => {
    const handleFiles = vi.fn();
    render(<ImageDropZone accept="image/*" onFiles={handleFiles} />);

    const validFile = new File(["valid image"], "avatar.png", {
      type: "image/png",
    });

    const dropZone = screen.getByRole("button");

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [validFile],
      },
    });

    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(handleFiles).toHaveBeenCalledWith([validFile]);
  });

  it("D1 受理 (ファイル選択): accepts valid files via file input change", () => {
    const handleFiles = vi.fn();
    render(<ImageDropZone accept="image/*" onFiles={handleFiles} />);

    const validFile = new File(["valid image"], "photo.jpg", {
      type: "image/jpeg",
    });
    const input = screen.getByTestId("image-drop-zone-input") as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [validFile] },
    });

    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(handleFiles).toHaveBeenCalledWith([validFile]);
  });

  // D2 拒否 — 前提: 同上。手順: 不適合 MIME を含む複数ファイル。期待: 不適合分は rejected として提示され、受理コールバックに混入しない。観点: MIME 検証（ワイルドカード含む）
  it("D2 拒否: filters out invalid MIME files, presents rejected files, and passes only valid files to onFiles", () => {
    const handleFiles = vi.fn();
    render(<ImageDropZone accept="image/*" onFiles={handleFiles} />);

    const validFile = new File(["valid image"], "image.png", {
      type: "image/png",
    });
    const invalidFile = new File(["document text"], "document.pdf", {
      type: "application/pdf",
    });

    const dropZone = screen.getByRole("button");

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [validFile, invalidFile],
      },
    });

    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(handleFiles).toHaveBeenCalledWith([validFile]);

    const rejectedContainer = screen.getByTestId("rejected-files");
    expect(rejectedContainer).toHaveTextContent("document.pdf");
    expect(rejectedContainer).not.toHaveTextContent("image.png");
  });

  // D3 a11y — 前提: 描画。手順: キーボード操作（focus + Enter/Space）。期待: ファイル選択がトリガーされる（hidden input が label に紐づく）。観点: キーボード到達性
  it("D3 a11y: triggers file selection when keyboard focused and Enter/Space pressed", () => {
    render(<ImageDropZone accept="image/*" />);

    const dropZone = screen.getByRole("button");
    const input = screen.getByTestId("image-drop-zone-input") as HTMLInputElement;

    const clickSpy = vi.spyOn(input, "click");

    dropZone.focus();
    expect(dropZone).toHaveFocus();

    fireEvent.keyDown(dropZone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dropZone, { key: " " });
    expect(clickSpy).toHaveBeenCalledTimes(2);

    const label = screen.getByText("Upload files");
    expect(dropZone).toHaveAttribute("aria-labelledby", label.id);
  });

  // 回帰: 末尾カンマ accept で空トークンが生まれ全ファイル受理になるバグの防止
  it("回帰: rejects non-matching MIME when accept has a trailing comma", () => {
    const handleFiles = vi.fn();
    render(<ImageDropZone accept="image/png," onFiles={handleFiles} />);

    const invalidFile = new File(["document text"], "document.pdf", {
      type: "application/pdf",
    });

    const dropZone = screen.getByRole("button");

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [invalidFile],
      },
    });

    expect(handleFiles).not.toHaveBeenCalled();

    const rejectedContainer = screen.getByTestId("rejected-files");
    expect(rejectedContainer).toHaveTextContent("document.pdf");
  });

  // 回帰: 外部 onClick を渡しても内部のファイル選択トリガーが上書きされず、外部 onClick も呼ばれる
  it("回帰: preserves internal click-to-select behavior while still calling external onClick", () => {
    const externalOnClick = vi.fn();
    render(<ImageDropZone accept="image/*" onClick={externalOnClick} />);

    const dropZone = screen.getByRole("button");
    const input = screen.getByTestId("image-drop-zone-input") as HTMLInputElement;
    // Prevent the real click from firing a native event that bubbles back
    // up to the drop zone (which would call externalOnClick a second time
    // via event bubbling, independent of the fix under test).
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(dropZone);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(externalOnClick).toHaveBeenCalledTimes(1);
  });

  // 回帰: 同一ファイルを2回選択しても onFiles が毎回発火するよう input.value がリセットされる
  // (jsdom の file input は "" 以外を programmatic に set できないため、value setter を spy して
  //  処理後に "" へリセットされたことを検証する。これにより実ブラウザでの再選択でも change が発火する)
  it("回帰: calls onFiles twice when the same file is selected twice via input", () => {
    const handleFiles = vi.fn();
    render(<ImageDropZone accept="image/*" onFiles={handleFiles} />);

    const validFile = new File(["valid image"], "photo.jpg", {
      type: "image/jpeg",
    });
    const input = screen.getByTestId("image-drop-zone-input") as HTMLInputElement;
    const valueSetterSpy = vi.spyOn(input, "value", "set");

    fireEvent.change(input, {
      target: { files: [validFile] },
    });
    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(valueSetterSpy).toHaveBeenCalledWith("");

    fireEvent.change(input, {
      target: { files: [validFile] },
    });
    expect(handleFiles).toHaveBeenCalledTimes(2);
  });
});
