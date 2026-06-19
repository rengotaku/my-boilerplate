import type { Story } from "@ladle/react";
import { Button, type ButtonProps } from "./button";

export default {
  title: "UI / Button",
};

export const Default: Story<ButtonProps> = (args) => <Button {...args}>Button</Button>;
Default.args = { variant: "default", size: "default" };
Default.argTypes = {
  variant: {
    options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    control: { type: "select" },
    defaultValue: "default",
  },
  size: {
    options: ["default", "sm", "lg", "icon"],
    control: { type: "select" },
    defaultValue: "default",
  },
};

export const Variants: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Button>Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-2">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const Disabled: Story = () => <Button disabled>Disabled</Button>;
