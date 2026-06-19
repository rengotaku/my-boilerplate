import * as React from "react";

import { cn } from "@/lib/utils";

export type ColumnAlign = "left" | "right" | "center";

export interface ColumnFilter<T> {
  kind: "text" | "select";
  /** Value pulled from a row for matching against the filter input. */
  accessor: (row: T) => string;
  /** Options for kind="select" (a leading "All" entry is added automatically). */
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface DataTableColumn<T> {
  /** Stable id — used for the colgroup and per-column filter state. */
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Fixed CSS width (e.g. "8rem", "20%"). Columns without one share the rest. */
  width?: string;
  align?: ColumnAlign;
  /** Clip overflow with an ellipsis and reveal the full text on hover. Default true. */
  truncate?: boolean;
  /** Tooltip text shown on hover when the cell is truncated. */
  title?: (row: T) => string;
  /** Per-column filter control rendered in the filter row. */
  filter?: ColumnFilter<T>;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => React.Key;
  onRowClick?: (row: T) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
}

const alignClass: Record<ColumnAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

// Shared chevron-styled select (matches MetricsFilters) for select filters.
const selectChevron: React.CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
  backgroundPosition: "right 0.5rem center",
  backgroundSize: "0.9rem",
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = "No data",
  className,
}: DataTableProps<T>): React.JSX.Element {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const hasFilters = columns.some((c) => c.filter);

  const setFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const visibleRows = React.useMemo(() => {
    const active = columns.filter((c) => c.filter && (filters[c.key] ?? "") !== "");
    if (active.length === 0) return rows;
    return rows.filter((row) =>
      active.every((c) => {
        const needle = filters[c.key];
        const hay = c.filter!.accessor(row);
        return c.filter!.kind === "text"
          ? hay.toLowerCase().includes(needle.toLowerCase())
          : hay === needle;
      })
    );
  }, [columns, rows, filters]);

  return (
    <div className={cn("overflow-hidden rounded-md border border-slate-200", className)}>
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "truncate px-3 py-2 font-medium text-slate-600",
                  alignClass[column.align ?? "left"],
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
          {hasFilters && (
            <tr className="border-b border-slate-200 bg-white">
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-2 py-1.5">
                  {column.filter && (
                    <FilterControl
                      filter={column.filter}
                      value={filters[column.key] ?? ""}
                      onChange={(v) => setFilter(column.key, v)}
                    />
                  )}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            visibleRows.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-slate-100 last:border-0",
                  onRowClick && "cursor-pointer hover:bg-slate-50"
                )}
              >
                {columns.map((column) => {
                  const truncate = column.truncate !== false;
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2 align-middle text-slate-700",
                        alignClass[column.align ?? "left"],
                        column.className
                      )}
                    >
                      <div
                        className={cn(truncate && "truncate")}
                        title={truncate ? column.title?.(row) : undefined}
                      >
                        {column.cell(row)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function FilterControl<T>({
  filter,
  value,
  onChange,
}: {
  filter: ColumnFilter<T>;
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  if (filter.kind === "select") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-md border border-slate-300 bg-white bg-no-repeat py-0 pl-2 pr-7 text-xs font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
        style={selectChevron}
      >
        <option value="">{filter.placeholder ?? "All"}</option>
        {filter.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={filter.placeholder ?? "Filter…"}
      className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-normal text-slate-700 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
    />
  );
}
