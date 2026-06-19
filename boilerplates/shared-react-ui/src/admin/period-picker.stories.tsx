import * as React from "react";
import type { Story } from "@ladle/react";
import { PeriodPicker } from "./period-picker";

export default {
  title: "Admin / PeriodPicker",
};

export const Default: Story = () => {
  const [value, setValue] = React.useState("24h");
  return <PeriodPicker value={value} onChange={setValue} />;
};

export const CustomPresets: Story = () => {
  const [value, setValue] = React.useState("today");
  return (
    <PeriodPicker
      value={value}
      onChange={setValue}
      presets={[
        { value: "today", label: "Today" },
        { value: "week", label: "This week" },
        { value: "month", label: "This month" },
      ]}
    />
  );
};
