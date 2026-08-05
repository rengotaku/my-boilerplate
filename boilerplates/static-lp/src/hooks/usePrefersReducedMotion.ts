import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", onStoreChange);
  return () => {
    mediaQueryList.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * ユーザーの reduced-motion 設定を返すフック。
 * SSG（`window` / `window.matchMedia` が存在しない Node 環境）でも throw せず `false` を返す。
 * SSR とクライアント初回描画の className を一致させるため `useSyncExternalStore` を使う。
 * `getServerSnapshot` は常に `false` を返し、ハイドレーション直後の初回描画も
 * `getServerSnapshot` と一致する値になる。実際の `matches` 値への切り替えは
 * `matchMedia` の `change` イベント購読を通じてのみ行われる。
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
