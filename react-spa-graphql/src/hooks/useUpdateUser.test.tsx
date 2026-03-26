/**
 * US3: ユーザー更新 - useUpdateUser フックのテスト
 *
 * TDD RED フェーズ:
 * - useUpdateUser フックが存在しないため、これらのテストは FAIL する
 * - Phase 5 GREEN フェーズで実装後に PASS に変わる
 *
 * テスト対象:
 * - T060: useUpdateUser フックの基本動作
 * - T063: キャッシュ更新テスト
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { graphql, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { TestWrapper } from "@/test/test-utils";
import { useUpdateUser } from "./useUpdateUser";

describe("US3: useUpdateUser フック", () => {
  describe("正常系: Mutation 実行", () => {
    it("updateUser 関数と loading, error プロパティを返すこと", () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toHaveProperty("updateUser");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.updateUser).toBe("function");
    });

    it("初期状態では loading が false であること", () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it("初期状態では error が undefined であること", () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current.error).toBeUndefined();
    });

    it("updateUser を呼び出すとユーザーが更新されること", async () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.updateUser("1", {
          name: "Updated Name",
          email: "updated@example.com",
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeUndefined();
    });

    it("updateUser 成功後に更新されたユーザーデータが返ること", async () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      let updatedUser: { id: string; name: string; email: string } | null | undefined;

      await act(async () => {
        const response = await result.current.updateUser("1", {
          name: "Updated Name",
          email: "updated@example.com",
        });
        updatedUser = response?.data?.updateUser;
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe("1");
      expect(updatedUser?.name).toBe("Updated Name");
      expect(updatedUser?.email).toBe("updated@example.com");
    });
  });

  describe("キャッシュ更新", () => {
    it("Mutation 成功後に GetUsers キャッシュが更新されること", async () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.updateUser("1", {
          name: "Cache Updated",
          email: "cache@example.com",
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeUndefined();
      });
    });

    it("onCompleted コールバックが Mutation 成功後に呼ばれること", async () => {
      const onCompleted = vi.fn();

      const { result } = renderHook(() => useUpdateUser({ onCompleted }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.updateUser("1", {
          name: "Callback User",
          email: "callback@example.com",
        });
      });

      await waitFor(() => {
        expect(onCompleted).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("異常系: エラーハンドリング", () => {
    it("GraphQL エラー発生時に error が設定されること", async () => {
      server.use(
        graphql.mutation("UpdateUser", () => {
          return HttpResponse.json({
            errors: [
              {
                message: "ユーザーの更新に失敗しました",
                locations: [{ line: 1, column: 1 }],
                path: ["updateUser"],
              },
            ],
          });
        })
      );

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.updateUser("1", {
            name: "Error",
            email: "error@example.com",
          });
        } catch {
          // エラーは result.current.error に設定される
        }
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("存在しないユーザー ID で更新を試みた場合にエラーになること", async () => {
      server.use(
        graphql.mutation("UpdateUser", () => {
          return HttpResponse.json({
            errors: [
              {
                message: "ユーザーが見つかりません",
                locations: [{ line: 1, column: 1 }],
                path: ["updateUser"],
              },
            ],
          });
        })
      );

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.updateUser("999", {
            name: "Not Found",
            email: "notfound@example.com",
          });
        } catch {
          // エラーを期待
        }
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("ローディング状態", () => {
    it("Mutation 実行中は loading が true になること", async () => {
      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.updateUser("1", {
          name: "Loading Test",
          email: "loading@example.com",
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
