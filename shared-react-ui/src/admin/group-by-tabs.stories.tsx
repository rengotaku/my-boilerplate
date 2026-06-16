import * as React from "react";
import type { Story } from "@ladle/react";
import { GroupByTabs } from "./group-by-tabs";

export default {
  title: "Admin / GroupByTabs",
};

export const Interactive: Story = () => {
  const [value, setValue] = React.useState("status");
  return (
    <GroupByTabs
      value={value}
      onChange={setValue}
      options={[
        { value: "status", label: "Status" },
        { value: "kind", label: "Kind" },
        { value: "owner", label: "Owner" },
      ]}
    />
  );
};
