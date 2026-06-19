/**
 * US1: ユーザー一覧表示 - UsersPage コンポーネントのテスト
 *
 * TDD RED フェーズ:
 * - UsersPage が GraphQL 統合を実装していないため、これらのテストは FAIL する
 * - Phase 3 GREEN フェーズで実装後に PASS に変わる
 *
 * テスト対象:
 * - T030: ローディング状態テスト
 * - T031: エラー状態テスト
 * - T032: ユーザー一覧表示テスト
 */

import { render, screen, waitFor } from "@/test/test-utils";
import { describe, it, expect } from "vitest";
import { graphql, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { UsersPage } from "./UsersPage";

// ===================================================================
// T030: ローディング状態テスト
// ===================================================================
describe("US1: UsersPage - ローディング状態", () => {
  it("データ取得中にローディングインジケーターが表示されること", () => {
    // MSW がレスポンスを遅延させる前に初期レンダリングを確認
    render(<UsersPage />);

    // ローディング中のテキストまたはインジケーターが表示されること
    // 実装例: CircularProgress または "Loading..." テキスト
    expect(
      screen.getByRole("progressbar") ||
        screen.getByText(/loading/i) ||
        screen.getByText(/読み込み中/)
    ).toBeInTheDocument();
  });

  it("ローディング完了後にローディングインジケーターが消えること", async () => {
    render(<UsersPage />);

    // データ取得完了を待つ
    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });
});

// ===================================================================
// T031: エラー状態テスト
// ===================================================================
describe("US1: UsersPage - エラー状態", () => {
  it("GraphQL エラー発生時にエラーメッセージが表示されること", async () => {
    // MSW ハンドラーをエラーレスポンスに上書き
    server.use(
      graphql.query("GetUsers", () => {
        return HttpResponse.json({
          errors: [
            {
              message: "ユーザー一覧の取得に失敗しました",
              locations: [{ line: 1, column: 1 }],
              path: ["users"],
            },
          ],
        });
      })
    );

    render(<UsersPage />);

    // エラーメッセージが表示されること
    await waitFor(() => {
      expect(screen.getByText(/エラー|error|失敗/i)).toBeInTheDocument();
    });
  });

  it("ネットワークエラー発生時にエラーメッセージが表示されること", async () => {
    // MSW ハンドラーをネットワークエラーに上書き
    server.use(
      graphql.query("GetUsers", () => {
        return HttpResponse.error();
      })
    );

    render(<UsersPage />);

    // エラーメッセージが表示されること
    await waitFor(() => {
      expect(screen.getByText(/エラー|error|失敗/i)).toBeInTheDocument();
    });
  });

  it("エラー発生時もページヘッダーが表示されること", async () => {
    // MSW ハンドラーをエラーレスポンスに上書き
    server.use(
      graphql.query("GetUsers", () => {
        return HttpResponse.json({
          errors: [{ message: "Internal server error" }],
        });
      })
    );

    render(<UsersPage />);

    // ページヘッダーは常に表示されること
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /users/i })).toBeInTheDocument();
    });
  });
});

// ===================================================================
// T032: ユーザー一覧表示テスト
// ===================================================================
describe("US1: UsersPage - ユーザー一覧表示", () => {
  it("ユーザー一覧が取得後に表示されること", async () => {
    render(<UsersPage />);

    // データ取得完了を待つ
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("各ユーザーのメールアドレスが表示されること", async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("ページのタイトル見出しが表示されること", async () => {
    render(<UsersPage />);

    // "Users" 見出しが表示されること
    expect(screen.getByRole("heading", { name: /users/i })).toBeInTheDocument();
  });

  it("ユーザーがゼロ件の場合に適切なメッセージが表示されること", async () => {
    // MSW ハンドラーを空のレスポンスに上書き
    server.use(
      graphql.query("GetUsers", () => {
        return HttpResponse.json({
          data: { users: [] },
        });
      })
    );

    render(<UsersPage />);

    // 空状態のメッセージが表示されること
    await waitFor(() => {
      expect(
        screen.getByText(/ユーザーがいません|no users|ユーザーなし/i)
      ).toBeInTheDocument();
    });
  });

  it("GraphQL 統合メッセージ（プレースホルダー）が表示されないこと", async () => {
    render(<UsersPage />);

    await waitFor(() => {
      // プレースホルダーメッセージが消えること（GraphQL 統合完了の証拠）
      expect(screen.queryByText(/GraphQL integration pending/)).not.toBeInTheDocument();
    });
  });
});
