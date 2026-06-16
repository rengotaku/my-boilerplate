import type { Story } from "@ladle/react";
import { DataTable, type DataTableColumn } from "./data-table";
import { StatusBadge, type StatusTone } from "./status-badge";

export default {
  title: "Admin / DataTable",
};

interface SampleRow {
  id: number;
  name: string;
  status: StatusTone;
  duration: number;
}

const rows: SampleRow[] = [
  { id: 1, name: "nightly-build", status: "success", duration: 42 },
  { id: 2, name: "deploy-prod", status: "running", duration: 12 },
  { id: 3, name: "lint-check", status: "error", duration: 5 },
];

const columns: DataTableColumn<SampleRow>[] = [
  { header: "Name", cell: (r) => r.name },
  { header: "Status", cell: (r) => <StatusBadge tone={r.status} label={r.status} /> },
  { header: "Duration", align: "right", cell: (r) => `${r.duration}s` },
];

export const Default: Story = () => (
  <DataTable
    columns={columns}
    rows={rows}
    getRowKey={(r) => r.id}
    onRowClick={(r) => console.log("clicked", r.name)}
  />
);

export const Empty: Story = () => (
  <DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} />
);
