import * as React from "react";

import { cn } from "@/lib/utils";

// Inline close (×) icon — keeps shared-react-ui free of an icon dependency.
function CloseIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Override the panel width. Defaults to a ~half-screen overlay. */
  widthClassName?: string;
}

/**
 * Drawer is a NewRelic-style half-overlay: a right-aligned panel slides in over
 * the content, with the page dimmed (but still visible) behind a backdrop.
 * Closes on backdrop click or Escape.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  widthClassName = "w-full sm:w-[560px] lg:w-[44rem] max-w-[90vw]",
}: DrawerProps): React.JSX.Element | null {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop: dims the page but keeps it visible; click closes. */}
      <div
        className="absolute inset-0 bg-black/30"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-0 top-0 flex h-full flex-col border-l border-slate-200 bg-white shadow-xl",
          "animate-in slide-in-from-right duration-200",
          widthClassName
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <div className="min-w-0 truncate text-base font-semibold text-slate-800">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
