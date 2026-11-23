import * as React from "react";
import { Step, Stepper } from "@astryxdesign/core/Stepper";

import type { StatusTone } from "./status-badge";

export interface PhaseTimelineProps<T> {
  phases: T[];
  getKey: (item: T, index: number) => React.Key;
  getName: (item: T) => string;
  getTone: (item: T) => StatusTone;
  getDuration?: (item: T) => string;
}

const stepStatus = (tone: StatusTone) => {
  switch (tone) {
    case "success":
      return "success" as const;
    case "warning":
      return "warning" as const;
    case "error":
      return "error" as const;
    default:
      return undefined;
  }
};

const isFinished = (tone: StatusTone): boolean =>
  tone === "success" || tone === "warning" || tone === "error";

/**
 * A run's phase progress built on Astryx Stepper. The active step is the
 * running phase, or the first unfinished phase when nothing is running yet.
 */
export function PhaseTimeline<T>({
  phases,
  getKey,
  getName,
  getTone,
  getDuration,
}: PhaseTimelineProps<T>) {
  if (phases.length === 0) return null;

  const runningIndex = phases.findIndex((phase) => getTone(phase) === "running");
  const firstUnfinished = phases.findIndex((phase) => !isFinished(getTone(phase)));
  const activeStep =
    runningIndex >= 0
      ? runningIndex
      : firstUnfinished >= 0
        ? firstUnfinished
        : phases.length;

  return (
    <Stepper activeStep={activeStep} density="compact">
      {phases.map((phase, index) => (
        <Step
          key={getKey(phase, index)}
          step={index}
          label={getName(phase)}
          description={getDuration?.(phase)}
          status={stepStatus(getTone(phase))}
        />
      ))}
    </Stepper>
  );
}
