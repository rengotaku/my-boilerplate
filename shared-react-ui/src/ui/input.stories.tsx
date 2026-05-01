import type { Story } from "@ladle/react";
import * as React from "react";
import { Input } from "./input";

type InputArgs = React.ComponentProps<typeof Input>;

export default {
  title: "UI / Input",
};

export const Default: Story<InputArgs> = (args) => <Input {...args} />;
Default.args = { placeholder: "Type here...", disabled: false };

export const WithValue: Story = () => {
  const [value, setValue] = React.useState("hello");
  return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
};

export const Types: Story = () => (
  <div className="flex flex-col gap-2">
    <Input type="text" placeholder="text" />
    <Input type="email" placeholder="email@example.com" />
    <Input type="password" placeholder="password" />
    <Input type="number" placeholder="0" />
  </div>
);

export const Disabled: Story = () => <Input disabled placeholder="disabled" />;
