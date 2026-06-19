import * as React from "react";
import type { Story } from "@ladle/react";
import { MetricsFilters, type FilterField } from "./metrics-filters";
import { Button } from "../ui/button";

export default {
  title: "Admin / MetricsFilters",
};

export const Default: Story = () => {
  const [values, setValues] = React.useState<Record<string, string>>({
    status: "all",
    kind: "all",
  });
  const fields: FilterField[] = [
    {
      name: "status",
      label: "Status",
      value: values.status,
      options: [
        { value: "all", label: "All" },
        { value: "success", label: "Success" },
        { value: "error", label: "Error" },
      ],
    },
    {
      name: "kind",
      label: "Kind",
      value: values.kind,
      options: [
        { value: "all", label: "All" },
        { value: "build", label: "Build" },
        { value: "deploy", label: "Deploy" },
      ],
    },
  ];
  return (
    <MetricsFilters
      fields={fields}
      onChange={(name, value) =>
        setValues((prev) => ({ ...prev, [name]: value }))
      }
    >
      <Button variant="outline" size="sm">
        Apply
      </Button>
    </MetricsFilters>
  );
};
