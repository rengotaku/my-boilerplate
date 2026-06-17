import * as React from "react";
import type { Story } from "@ladle/react";
import { Drawer } from "./drawer";

export default {
  title: "Admin / Drawer",
};

export const Default: Story = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
      >
        Open drawer
      </button>
      <p className="mt-4 text-sm text-slate-500">
        The page stays visible behind the dimmed backdrop. Click the backdrop or press Escape to close.
      </p>
      <Drawer open={open} onClose={() => setOpen(false)} title="Run #1234">
        <div className="space-y-3 text-sm text-slate-700">
          <p>Half-overlay detail panel (NewRelic style).</p>
          <p>Put any detail content here — summaries, timelines, logs, etc.</p>
        </div>
      </Drawer>
    </div>
  );
};
