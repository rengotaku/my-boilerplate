import type { ReactNode } from "react";
import { Drawer as AstryxDrawer, DrawerHeader } from "@astryxdesign/core/Drawer";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Right-side detail panel built on Astryx Drawer (modal, closes on Escape or
 * a scrim click). The caller owns the open state.
 */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
  if (!open) return null;

  const label = title || "Details";

  return (
    <AstryxDrawer
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      label={label}
      width={560}
      padding={0}
    >
      <Layout
        header={
          <DrawerHeader
            title={label}
            onOpenChange={(isOpen) => {
              if (!isOpen) onClose();
            }}
          />
        }
        content={<LayoutContent padding={4}>{children}</LayoutContent>}
      />
    </AstryxDrawer>
  );
}
