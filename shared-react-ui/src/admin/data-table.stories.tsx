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
  note: string;
  duration: number;
}

const rows: SampleRow[] = [
  {
    id: 1,
    name: "nightly-build",
    status: "success",
    note: "A very long note that should be clipped with an ellipsis and revealed on hover.",
    duration: 42,
  },
  { id: 2, name: "deploy-prod", status: "running", note: "Deploying to production cluster", duration: 12 },
  { id: 3, name: "lint-check", status: "error", note: "Failed: 3 lint errors", duration: 5 },
];

const columns: DataTableColumn<SampleRow>[] = [
  { key: "id", header: "ID", width: "4rem", align: "right", cell: (r) => r.id },
  {
    key: "name",
    header: "Name",
    width: "12rem",
    cell: (r) => r.name,
    title: (r) => r.name,
    filter: { kind: "text", accessor: (r) => r.name, placeholder: "name…" },
  },
  {
    key: "status",
    header: "Status",
    width: "9rem",
    cell: (r) => <StatusBadge tone={r.status} label={r.status} />,
    filter: {
      kind: "select",
      accessor: (r) => r.status,
      options: [
        { value: "success", label: "success" },
        { value: "running", label: "running" },
        { value: "error", label: "error" },
      ],
    },
  },
  // No width → flexes; truncates its long content + tooltip on hover.
  { key: "note", header: "Note", cell: (r) => r.note, title: (r) => r.note },
  { key: "duration", header: "Duration", width: "7rem", align: "right", cell: (r) => `${r.duration}s` },
];

export const Default: Story = () => (
  <div style={{ maxWidth: 720 }}>
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      onRowClick={(r) => console.log("clicked", r.name)}
    />
  </div>
);

export const Empty: Story = () => (
  <DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} />
);
