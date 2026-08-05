import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useInView } from "./useInView";

describe("useInView", () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it("追加テスト: IntersectionObserver 不在時のフォールバック / SSG・jsdom で throw せず最初から可視にするため", () => {
    // @ts-expect-error simulate an environment without IntersectionObserver support (SSG / older jsdom)
    delete window.IntersectionObserver;

    expect(() => renderHook(() => useInView())).not.toThrow();

    const { result } = renderHook(() => useInView());
    expect(result.current.isVisible).toBe(true);
  });

  it("追加テスト: 一度可視になったら、以降不可視に戻っても isVisible が true を維持する / 点滅防止のため", () => {
    let observedCallback: IntersectionObserverCallback | null = null;
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();

    function FakeIntersectionObserver(callback: IntersectionObserverCallback) {
      observedCallback = callback;
      return { observe, unobserve, disconnect };
    }

    window.IntersectionObserver =
      FakeIntersectionObserver as unknown as typeof IntersectionObserver;

    const { result } = renderHook(() => useInView());
    const fakeElement = document.createElement("div");

    act(() => {
      result.current.ref(fakeElement);
    });

    expect(result.current.isVisible).toBe(false);
    expect(observe).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith(fakeElement);

    act(() => {
      observedCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(true);

    act(() => {
      observedCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(result.current.isVisible).toBe(true);
  });
});
