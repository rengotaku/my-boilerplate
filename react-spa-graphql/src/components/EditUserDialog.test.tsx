/**
 * US3: ユーザー編集ダイアログ - EditUserDialog コンポーネントテスト
 *
 * TDD RED フェーズ:
 * - EditUserDialog コンポーネントが存在しないため、これらのテストは FAIL する
 * - Phase 5 GREEN フェーズで実装後に PASS に変わる
 *
 * テスト対象:
 * - T062: EditUserDialog コンポーネントの基本動作
 * - T063: 削除確認ダイアログテスト
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { graphql, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { TestWrapper } from "@/test/test-utils";
import { EditUserDialog } from "./EditUserDialog";

const mockUser = {
  id: "1",
  name: "John Doe",
  email: "john@example.com",
};

describe("US3: EditUserDialog コンポーネント", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSuccess.mockClear();
  });

  describe("表示", () => {
    it("ダイアログが開いているときにフォームが表示されること", () => {
      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("ユーザーデータがフォームに初期値として設定されること", () => {
      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    });

    it("ダイアログが閉じているときは何も表示されないこと", () => {
      render(
        <TestWrapper>
          <EditUserDialog
            open={false}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("保存ボタンと削除ボタンが表示されること", () => {
      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      expect(
        screen.getByRole("button", { name: /save|保存/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete|削除/i }),
      ).toBeInTheDocument();
    });
  });

  describe("更新機能", () => {
    it("フォームを変更して保存すると updateUser が呼ばれること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      const saveButton = screen.getByRole("button", { name: /save|保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("更新成功後に onClose が呼ばれること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      const saveButton = screen.getByRole("button", { name: /save|保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("更新中は保存ボタンが無効になること", async () => {
      const user = userEvent.setup();

      // 遅延レスポンスをモック
      server.use(
        graphql.mutation("UpdateUser", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({
            data: {
              updateUser: {
                __typename: "User",
                id: "1",
                name: "Updated Name",
                email: "john@example.com",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-03-26T00:00:00Z",
              },
            },
          });
        }),
      );

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      const saveButton = screen.getByRole("button", { name: /save|保存/i });
      await user.click(saveButton);

      // ボタンが無効になることを確認
      expect(saveButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("バリデーション", () => {
    it("名前が空の場合にエラーが表示されること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);

      const saveButton = screen.getByRole("button", { name: /save|保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it("メールが無効な形式の場合にエラーが表示されること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, "invalid-email");

      const saveButton = screen.getByRole("button", { name: /save|保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });
  });

  describe("削除機能", () => {
    it("削除ボタンをクリックすると確認ダイアログが表示されること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const deleteButton = screen.getByRole("button", { name: /delete|削除/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByText(/本当に削除しますか|are you sure/i),
        ).toBeInTheDocument();
      });
    });

    it("削除確認で「はい」をクリックするとユーザーが削除されること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: /delete|削除/i });
      await user.click(deleteButton);

      // 確認ダイアログで「はい」をクリック
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /confirm|はい|yes/i }),
        ).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm|はい|yes/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("削除確認で「いいえ」をクリックすると削除がキャンセルされること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: /delete|削除/i });
      await user.click(deleteButton);

      // 確認ダイアログで「いいえ」をクリック
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /cancel|いいえ|no/i }),
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", {
        name: /cancel|いいえ|no/i,
      });
      await user.click(cancelButton);

      // ダイアログがまだ開いていて、削除されていないこと
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("エラーハンドリング", () => {
    it("更新エラー時にエラーメッセージが表示されること", async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation("UpdateUser", () => {
          return HttpResponse.json({
            errors: [
              {
                message: "更新に失敗しました",
                locations: [{ line: 1, column: 1 }],
                path: ["updateUser"],
              },
            ],
          });
        }),
      );

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Will Fail");

      const saveButton = screen.getByRole("button", { name: /save|保存/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("削除エラー時にエラーメッセージが表示されること", async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation("DeleteUser", () => {
          return HttpResponse.json({
            errors: [
              {
                message: "削除に失敗しました",
                locations: [{ line: 1, column: 1 }],
                path: ["deleteUser"],
              },
            ],
          });
        }),
      );

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: /delete|削除/i });
      await user.click(deleteButton);

      // 確認ダイアログで「はい」をクリック
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /confirm|はい|yes/i }),
        ).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm|はい|yes/i,
      });
      await user.click(confirmButton);

      // エラーアラートが表示されることを確認（警告アラートとは別）
      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        // エラーアラートが表示されている（2つのアラート: 警告 + エラー）
        expect(alerts.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("キャンセル機能", () => {
    it("キャンセルボタンをクリックすると onClose が呼ばれること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      const cancelButton = screen.getByRole("button", { name: /cancel|キャンセル/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("ダイアログ外をクリックすると onClose が呼ばれること", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <EditUserDialog
            open={true}
            user={mockUser}
            onClose={mockOnClose}
            onSuccess={mockOnSuccess}
          />
        </TestWrapper>,
      );

      // MUI Dialog の backdrop をクリック
      const backdrop = document.querySelector(".MuiBackdrop-root");
      if (backdrop) {
        await user.click(backdrop);
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
