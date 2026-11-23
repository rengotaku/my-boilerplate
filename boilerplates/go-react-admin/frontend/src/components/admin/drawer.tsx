import type { ReactNode } from "react";
import { Drawer as AstryxDrawer, DrawerHeader } from "@astryxdesign/core/Drawer";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Visible heading in the drawer's own header bar. */
  title?: string;
  /** Accessible name for the dialog when it should be more specific than title. */
  label?: string;
  children: ReactNode;
}

/**
 * Right-side detail panel built on Astryx Drawer (modal, closes on Escape or
 * a scrim click). The caller owns the open state.
 *
 * The Drawer's own padding is left at the theme default so the header bar and
 * the content share the same inset; Layout picks that padding up for both
 * regions.
 */
export function Drawer({ open, onClose, title, label, children }: DrawerProps) {
  if (!open) return null;

  const heading = title || "Details";

  return (
    <AstryxDrawer
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      label={label || heading}
      width={560}
    >
      <Layout
        header={
          <DrawerHeader
            title={heading}
            onOpenChange={(isOpen) => {
              if (!isOpen) onClose();
            }}
          />
        }
        content={<LayoutContent>{children}</LayoutContent>}
      />
    </AstryxDrawer>
  );
}
