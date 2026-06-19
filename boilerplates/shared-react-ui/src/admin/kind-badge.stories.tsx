import type { Story } from "@ladle/react";
import { KindBadge } from "./kind-badge";

export default {
  title: "Admin / KindBadge",
};

export const Default: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    <KindBadge label="default" />
    <KindBadge label="build" color="#6366f1" />
    <KindBadge label="deploy" color="#22c55e" />
    <KindBadge label="alert" color="#ef4444" />
  </div>
);
