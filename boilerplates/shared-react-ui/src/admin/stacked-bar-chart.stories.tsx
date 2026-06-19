import type { Story } from "@ladle/react";
import { StackedBarChart } from "./stacked-bar-chart";

export default {
  title: "Admin / StackedBarChart",
};

const data = [
  { day: "Mon", success: 24, error: 3, running: 1 },
  { day: "Tue", success: 31, error: 2, running: 2 },
  { day: "Wed", success: 18, error: 6, running: 0 },
  { day: "Thu", success: 27, error: 1, running: 3 },
  { day: "Fri", success: 35, error: 4, running: 1 },
];

export const Default: Story = () => (
  <div className="max-w-xl">
    <StackedBarChart
      data={data}
      xKey="day"
      series={[
        { key: "success", label: "Success", color: "#22c55e" },
        { key: "error", label: "Error", color: "#ef4444" },
        { key: "running", label: "Running" },
      ]}
    />
  </div>
);
