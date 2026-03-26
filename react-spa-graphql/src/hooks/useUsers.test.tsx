/**
 * US1: ユーザー一覧表示 - useUsers フックのテスト
 *
 * TDD RED フェーズ:
 * - useUsers フックが存在しないため、これらのテストは FAIL する
 * - Phase 3 GREEN フェーズで実装後に PASS に変わる
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TestWrapper } from "@/test/test-utils";
import { useUsers } from "./useUsers";

describe("US1: useUsers フック", () => {
  describe("正常系: データ取得", () => {
    it("ユーザー一覧を取得できること", async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: TestWrapper,
      });

      // ローディング中は loading が true
      expect(result.current.loading).toBe(true);

      // データ取得完了を待つ
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // ユーザーデータが取得できること
      expect(result.current.users).toBeDefined();
      expect(result.current.users).toHaveLength(2);
    });

    it("取得したユーザーが正しいフィールドを持つこと", async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstUser = result.current.users?.[0];
      expect(firstUser).toBeDefined();
      expect(firstUser?.id).toBe("1");
      expect(firstUser?.name).toBe("John Doe");
      expect(firstUser?.email).toBe("john@example.com");
      expect(firstUser?.createdAt).toBeDefined();
      expect(firstUser?.updatedAt).toBeDefined();
    });

    it("初期状態では error が undefined であること", async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeUndefined();
    });
  });

  describe("ローディング状態", () => {
    it("データ取得中は loading が true であること", () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: TestWrapper,
      });

      // 初期状態ではローディング中
      expect(result.current.loading).toBe(true);
    });

    it("データ取得完了後は loading が false になること", async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("返却値の型", () => {
    it("users, loading, error プロパティを返すこと", async () => {
      const { result } = renderHook(() => useUsers(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 必要なプロパティが存在すること
      expect(result.current).toHaveProperty("users");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
    });
  });
});
