import type { Story } from "@ladle/react";
import { TimeSeriesChart } from "./time-series-chart";

export default {
  title: "Admin / TimeSeriesChart",
};

const series = [
  {
    name: "p50",
    color: "#6366f1",
    points: [
      { ts: "10:00", value: 120 },
      { ts: "10:05", value: 132 },
      { ts: "10:10", value: 101 },
      { ts: "10:15", value: 134 },
    ],
  },
  {
    name: "p99",
    color: "#ef4444",
    points: [
      { ts: "10:00", value: 320 },
      { ts: "10:05", value: 412 },
      { ts: "10:10", value: 388 },
      { ts: "10:15", value: 502 },
    ],
  },
];

export const Line: Story = () => (
  <div className="max-w-xl">
    <TimeSeriesChart series={series} />
  </div>
);

export const Area: Story = () => (
  <div className="max-w-xl">
    <TimeSeriesChart series={series} type="area" />
  </div>
);
