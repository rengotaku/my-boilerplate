import type { Story } from "@ladle/react";
import * as React from "react";
import { TimePicker, type TimePickerProps } from "./time-picker";

export default {
  title: "UI / TimePicker",
};

export const Default: Story<TimePickerProps> = (args) => {
  const [value, setValue] = React.useState(args.value ?? "09:00");
  return <TimePicker {...args} value={value} onChange={setValue} />;
};
Default.args = { value: "09:00", hourStep: 1, minuteStep: 5, disabled: false };

export const FifteenMinuteStep: Story = () => {
  const [value, setValue] = React.useState("12:30");
  return <TimePicker value={value} onChange={setValue} minuteStep={15} />;
};

export const Disabled: Story = () => (
  <TimePicker value="08:00" disabled onChange={() => {}} />
);
