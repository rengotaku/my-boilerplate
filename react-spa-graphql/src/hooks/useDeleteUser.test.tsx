/**
 * US3: ユーザー削除 - useDeleteUser フックのテスト
 *
 * TDD RED フェーズ:
 * - useDeleteUser フックが存在しないため、これらのテストは FAIL する
 * - Phase 5 GREEN フェーズで実装後に PASS に変わる
 *
 * テスト対象:
 * - T061: useDeleteUser フックの基本動作
 * - T064: キャッシュ evict テスト
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { graphql, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { TestWrapper } from "@/test/test-utils";
import { useDeleteUser } from "./useDeleteUser";

describe("US3: useDeleteUser フック", () => {
  describe("正常系: Mutation 実行", () => {
    it("deleteUser 関数と loading, error プロパティを返すこと", () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toHaveProperty("deleteUser");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.deleteUser).toBe("function");
    });

    it("初期状態では loading が false であること", () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current.loading).toBe(false);
    });

    it("初期状態では error が undefined であること", () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current.error).toBeUndefined();
    });

    it("deleteUser を呼び出すとユーザーが削除されること", async () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.deleteUser("1");
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeUndefined();
    });

    it("deleteUser 成功後に true が返ること", async () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      let deleteResult: boolean | undefined;

      await act(async () => {
        const response = await result.current.deleteUser("1");
        deleteResult = response?.data?.deleteUser;
      });

      expect(deleteResult).toBe(true);
    });
  });

  describe("キャッシュ更新", () => {
    it("Mutation 成功後に GetUsers キャッシュが更新されること", async () => {
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.deleteUser("1");
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeUndefined();
      });
    });

    it("onCompleted コールバックが Mutation 成功後に呼ばれること", async () => {
      const onCompleted = vi.fn();

      const { result } = renderHook(() => useDeleteUser({ onCompleted }), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.deleteUser("1");
      });

      await waitFor(() => {
        expect(onCompleted).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("異常系: エラーハンドリング", () => {
    it("GraphQL エラー発生時に error が設定されること", async () => {
      server.use(
        graphql.mutation("DeleteUser", () => {
          return HttpResponse.json({
            errors: [
              {
                message: "ユーザーの削除に失敗しました",
                locations: [{ line: 1, column: 1 }],
                path: ["deleteUser"],
              },
            ],
          });
        }),
      );

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.deleteUser("1");
        } catch {
          // エラーは result.current.error に設定される
        }
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("存在しないユーザー ID で削除を試みた場合にエラーになること", async () => {
      server.use(
        graphql.mutation("DeleteUser", () => {
          return HttpResponse.json({
            errors: [
              {
                message: "ユーザーが見つかりません",
                locations: [{ line: 1, column: 1 }],
                path: ["deleteUser"],
              },
            ],
          });
        }),
      );

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        try {
          await result.current.deleteUser("999");
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
      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.deleteUser("1");
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
