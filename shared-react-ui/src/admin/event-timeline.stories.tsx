import type { Story } from "@ladle/react";
import { EventTimeline } from "./event-timeline";
import type { StatusTone } from "./status-badge";

export default {
  title: "Admin / EventTimeline",
};

interface SampleEvent {
  id: number;
  at: string;
  title: string;
  tone: StatusTone;
  detail?: string;
}

const events: SampleEvent[] = [
  { id: 1, at: "10:00:01", title: "Started", tone: "running", detail: "Picked up by worker-3" },
  { id: 2, at: "10:00:42", title: "Step build passed", tone: "success" },
  { id: 3, at: "10:01:10", title: "Retrying step deploy", tone: "warning", detail: "attempt 2 of 3" },
  { id: 4, at: "10:02:33", title: "Failed", tone: "error", detail: "timeout after 90s" },
];

export const Default: Story = () => (
  <div className="max-w-md">
    <EventTimeline
      items={events}
      getKey={(e) => e.id}
      getTimestamp={(e) => e.at}
      getTitle={(e) => e.title}
      getTone={(e) => e.tone}
      renderDetail={(e) => e.detail ?? null}
    />
  </div>
);
