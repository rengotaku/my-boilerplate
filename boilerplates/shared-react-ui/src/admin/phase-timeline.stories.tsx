import type { Story } from "@ladle/react";
import { PhaseTimeline } from "./phase-timeline";
import type { StatusTone } from "./status-badge";

export default {
  title: "Admin / PhaseTimeline",
};

interface SamplePhase {
  id: string;
  name: string;
  tone: StatusTone;
  duration: string;
}

const phases: SamplePhase[] = [
  { id: "queue", name: "Queue", tone: "success", duration: "2s" },
  { id: "build", name: "Build", tone: "success", duration: "44s" },
  { id: "deploy", name: "Deploy", tone: "running", duration: "12s" },
  { id: "verify", name: "Verify", tone: "neutral", duration: "-" },
];

export const Default: Story = () => (
  <PhaseTimeline
    phases={phases}
    getKey={(p) => p.id}
    getName={(p) => p.name}
    getTone={(p) => p.tone}
    getDuration={(p) => p.duration}
  />
);
