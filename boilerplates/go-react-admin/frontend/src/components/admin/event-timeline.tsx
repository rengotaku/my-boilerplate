import * as React from "react";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";

import type { StatusTone } from "./status-badge";

export interface EventTimelineProps<T> {
  items: T[];
  getKey: (item: T, index: number) => React.Key;
  getTimestamp: (item: T) => string;
  getTitle: (item: T) => React.ReactNode;
  getTone?: (item: T) => StatusTone;
  renderDetail?: (item: T) => React.ReactNode;
}

const dotVariant = (tone: StatusTone) => {
  switch (tone) {
    case "success":
      return "success" as const;
    case "warning":
      return "warning" as const;
    case "error":
      return "error" as const;
    case "info":
    case "running":
      return "accent" as const;
    default:
      return "neutral" as const;
  }
};

/** Vertical event log. Astryx has no timeline component, so the rail is CSS
 *  and the dots come from StatusDot (theme-aware, a11y-labelled). */
export function EventTimeline<T>({
  items,
  getKey,
  getTimestamp,
  getTitle,
  getTone,
  renderDetail,
}: EventTimelineProps<T>) {
  return (
    <ol className="event-timeline">
      {items.map((item, index) => {
        const tone = getTone ? getTone(item) : "neutral";
        return (
          <li key={getKey(item, index)} className="event-item">
            <div className="event-rail">
              <StatusDot
                variant={dotVariant(tone)}
                label={tone}
                isPulsing={tone === "running"}
              />
            </div>
            <div className="event-body">
              <Text type="supporting">{getTimestamp(item)}</Text>
              <Text weight="medium">{getTitle(item)}</Text>
              {renderDetail && <Text type="supporting">{renderDetail(item)}</Text>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
