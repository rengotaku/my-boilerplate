import { DataTable } from "@/components/admin/data-table";
import { useConfig } from "@/hooks/useConfig";

interface ConfigRow {
  key: string;
  value: string;
}

export function ConfigPage() {
  const { data, isLoading, isError, error } = useConfig();

  const rows: ConfigRow[] = data
    ? [
        { key: "Port", value: data.port },
        { key: "Database DSN", value: data.database_dsn },
        { key: "Log directory", value: data.log_dir },
        { key: "Worker interval (s)", value: String(data.worker_interval) },
        { key: "Shutdown timeout (s)", value: String(data.shutdown_timeout) },
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Config</h1>

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Failed to load config: {(error as Error)?.message}
        </div>
      ) : (
        <DataTable<ConfigRow>
          columns={[
            {
              header: "Key",
              cell: (row) => <span className="font-medium">{row.key}</span>,
              className: "w-1/3",
            },
            {
              header: "Value",
              cell: (row) => <span className="font-mono text-xs">{row.value}</span>,
            },
          ]}
          rows={rows}
          getRowKey={(row) => row.key}
          emptyMessage={isLoading ? "Loading…" : "No config"}
        />
      )}
    </div>
  );
}
