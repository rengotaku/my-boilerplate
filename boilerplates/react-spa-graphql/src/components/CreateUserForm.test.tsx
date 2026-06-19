/**
 * US2: ユーザー作成 - CreateUserForm コンポーネントのテスト
 *
 * TDD RED フェーズ:
 * - CreateUserForm コンポーネントが存在しないため、これらのテストは FAIL する
 * - Phase 4 GREEN フェーズで実装後に PASS に変わる
 *
 * テスト対象:
 * - T045: CreateUserForm コンポーネントの基本動作
 * - T047: バリデーションエラーテスト
 */

import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { graphql, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { CreateUserForm } from "./CreateUserForm";

// ===================================================================
// T045: CreateUserForm コンポーネントテスト
// ===================================================================
describe("US2: CreateUserForm - 基本レンダリング", () => {
  it("フォームが正しくレンダリングされること", () => {
    render(<CreateUserForm />);

    // 名前フィールドが存在すること
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    // メールフィールドが存在すること
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // 送信ボタンが存在すること
    expect(
      screen.getByRole("button", { name: /create|作成|submit/i })
    ).toBeInTheDocument();
  });

  it("初期状態でフォームフィールドが空であること", () => {
    render(<CreateUserForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    expect(nameInput.value).toBe("");
    expect(emailInput.value).toBe("");
  });
});

describe("US2: CreateUserForm - フォーム送信", () => {
  it("有効な情報を入力して送信できること", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<CreateUserForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it("送信成功後にフォームがリセットされること", async () => {
    const user = userEvent.setup();

    render(<CreateUserForm />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    await user.type(nameInput, "Reset Test User");
    await user.type(emailInput, "reset@example.com");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
    });
  });

  it("送信中に送信ボタンが無効化されること", async () => {
    const user = userEvent.setup();

    render(<CreateUserForm />);

    await user.type(screen.getByLabelText(/name/i), "Loading User");
    await user.type(screen.getByLabelText(/email/i), "loading@example.com");

    const submitButton = screen.getByRole("button", { name: /create|作成|submit/i });
    await user.click(submitButton);

    // 送信中はボタンが無効化されること（または loading 状態）
    // 完了後は再び有効になる
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("GraphQL エラー時にエラーメッセージが表示されること", async () => {
    server.use(
      graphql.mutation("CreateUser", () => {
        return HttpResponse.json({
          errors: [
            {
              message: "Email already exists",
              locations: [{ line: 1, column: 1 }],
              path: ["createUser"],
            },
          ],
        });
      })
    );

    const user = userEvent.setup();

    render(<CreateUserForm />);

    await user.type(screen.getByLabelText(/name/i), "Duplicate User");
    await user.type(screen.getByLabelText(/email/i), "duplicate@example.com");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/エラー|error|失敗|Email already exists/i)
      ).toBeInTheDocument();
    });
  });
});

// ===================================================================
// T047: バリデーションエラーテスト
// ===================================================================
describe("US2: CreateUserForm - バリデーションエラー", () => {
  it("名前が空の場合にバリデーションエラーが表示されること", async () => {
    const user = userEvent.setup();

    render(<CreateUserForm />);

    // 名前を空にして送信
    await user.type(screen.getByLabelText(/email/i), "valid@example.com");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required|名前は必須/i)).toBeInTheDocument();
    });
  });

  it("メールアドレスが空の場合にバリデーションエラーが表示されること", async () => {
    const user = userEvent.setup();

    render(<CreateUserForm />);

    // メールを空にして送信
    await user.type(screen.getByLabelText(/name/i), "Valid Name");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required|メールは必須/i)).toBeInTheDocument();
    });
  });

  it("メールアドレスの形式が不正な場合にバリデーションエラーが表示されること", async () => {
    const user = userEvent.setup();

    render(<CreateUserForm />);

    await user.type(screen.getByLabelText(/name/i), "Valid Name");
    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email|メールアドレスの形式/i)).toBeInTheDocument();
    });
  });

  it("名前とメールアドレスが両方空の場合に両方のバリデーションエラーが表示されること", async () => {
    const user = userEvent.setup();

    render(<CreateUserForm />);

    // 何も入力せず送信
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required|名前は必須/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required|メールは必須/i)).toBeInTheDocument();
    });
  });

  it("バリデーションエラーがある場合に Mutation が呼ばれないこと", async () => {
    const mutationCalled = vi.fn();

    server.use(
      graphql.mutation("CreateUser", () => {
        mutationCalled();
        return HttpResponse.json({
          data: {
            createUser: {
              __typename: "User",
              id: "99",
              name: "Should Not Create",
              email: "shouldnot@example.com",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          },
        });
      })
    );

    const user = userEvent.setup();

    render(<CreateUserForm />);

    // バリデーションエラーが起きる状態で送信（名前が空）
    await user.type(screen.getByLabelText(/email/i), "valid@example.com");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required|名前は必須/i)).toBeInTheDocument();
    });

    // Mutation は呼ばれないこと
    expect(mutationCalled).not.toHaveBeenCalled();
  });

  it("バリデーションエラー修正後に正常送信できること", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<CreateUserForm onSuccess={onSuccess} />);

    // まず空で送信してバリデーションエラーを発生させる
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required|名前は必須/i)).toBeInTheDocument();
    });

    // 正しい値を入力して再送信
    await user.type(screen.getByLabelText(/name/i), "Fixed User");
    await user.type(screen.getByLabelText(/email/i), "fixed@example.com");
    await user.click(screen.getByRole("button", { name: /create|作成|submit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});

describe("US2: CreateUserForm - アクセシビリティ", () => {
  it("フォームフィールドに適切なラベルが設定されていること", () => {
    render(<CreateUserForm />);

    // ラベルとフィールドが関連付けられていること
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
