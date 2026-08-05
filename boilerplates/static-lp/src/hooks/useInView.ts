import { useCallback, useRef, useState, useSyncExternalStore } from "react";

interface UseInViewResult<T extends Element> {
  ref: (node: T | null) => void;
  isVisible: boolean;
}

/**
 * 要素がビューポートに入ったかどうかをスクロール連動フェードイン用に判定するフック。
 * `IntersectionObserver` が存在しない環境（SSG のプリレンダリング・古い jsdom）では
 * throw せず、最初から可視として扱う。
 * 一度可視になった要素は、以降ビューポート外に出ても可視のまま維持する（点滅防止）。
 *
 * SSR とクライアント初回描画の className を一致させるため `useSyncExternalStore` を使う。
 * `getServerSnapshot` は常に「可視」を返し、ハイドレーション直後の初回描画も
 * `getServerSnapshot` と一致する値になる。実際の交差判定への切り替えは
 * `IntersectionObserver` のコールバック（外部システムの購読）でのみ行う。
 *
 * `ref` はコールバック ref なので `<div ref={ref}>` のようにそのまま渡せる。
 */
export function useInView<T extends Element = HTMLDivElement>(): UseInViewResult<T> {
  const [node, setNode] = useState<T | null>(null);
  // 一度可視になったら維持するラッチ。ノードごとの購読開始時にリセットする。
  const isVisibleLatchRef = useRef(false);

  const ref = useCallback((element: T | null) => {
    setNode(element);
  }, []);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const supportsIntersectionObserver =
        typeof window !== "undefined" &&
        typeof window.IntersectionObserver === "function";

      if (!supportsIntersectionObserver || !node) {
        return () => {};
      }

      isVisibleLatchRef.current = false;

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          isVisibleLatchRef.current = true;
          onStoreChange();
        }
      });

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    },
    [node]
  );

  const getSnapshot = useCallback(() => {
    const supportsIntersectionObserver =
      typeof window !== "undefined" && typeof window.IntersectionObserver === "function";

    if (!supportsIntersectionObserver || !node) {
      return true;
    }

    return isVisibleLatchRef.current;
  }, [node]);

  const getServerSnapshot = useCallback(() => true, []);

  const isVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { ref, isVisible };
}
