import * as React from "react";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Table, pixel, proportional, type TableColumn } from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

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
  /** Tooltip text shown on hover when the cell is truncated. */
  title?: (row: T) => string;
  /** Per-column filter control rendered above the table. */
  filter?: ColumnFilter<T>;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => React.Key;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

const ALIGN = {
  left: "start",
  right: "end",
  center: "center",
} as const;

/** Convert the old CSS widths ("8rem", "120px") to Astryx column widths. */
function toColumnWidth(width: string | undefined) {
  if (!width) return proportional(1);
  const rem = /^([\d.]+)rem$/.exec(width);
  if (rem) return pixel(Math.round(Number(rem[1]) * 16));
  const px = /^([\d.]+)px$/.exec(width);
  if (px) return pixel(Math.round(Number(px[1])));
  return proportional(1);
}

/**
 * Filterable, clickable data table built on Astryx Table.
 *
 * Astryx Table has no row click callback, so clicks are delegated from the
 * wrapper to the matching <tr>. A trailing "Open" button keeps the same action
 * reachable from the keyboard.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = "No data",
}: DataTableProps<T>): React.JSX.Element {
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const filterColumns = columns.filter((column) => column.filter);

  const setFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const visibleRows = React.useMemo(() => {
    const active = filterColumns.filter((column) => (filters[column.key] ?? "") !== "");
    if (active.length === 0) return rows;
    return rows.filter((row) =>
      active.every((column) => {
        const needle = filters[column.key];
        const hay = column.filter!.accessor(row);
        return column.filter!.kind === "text"
          ? hay.toLowerCase().includes(needle.toLowerCase())
          : hay === needle;
      })
    );
  }, [filterColumns, rows, filters]);

  const data = React.useMemo(
    () =>
      visibleRows.map((row, index) => ({
        __key: String(getRowKey(row, index)),
        __row: row,
      })),
    [visibleRows, getRowKey]
  );

  const tableColumns: TableColumn<Record<string, unknown>>[] = columns.map((column) => ({
    key: column.key,
    header: column.header,
    width: toColumnWidth(column.width),
    align: ALIGN[column.align ?? "left"],
    renderCell: (item) => {
      const row = item.__row as T;
      const content = column.cell(row);
      return column.title ? <span title={column.title(row)}>{content}</span> : content;
    },
  }));

  if (onRowClick) {
    tableColumns.push({
      key: "__open",
      header: "",
      width: pixel(88),
      renderCell: (item) => (
        <Button
          label="Open"
          variant="secondary"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onRowClick(item.__row as T);
          }}
        />
      ),
    });
  }

  const handleRowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onRowClick) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select")) return;
    const row = target.closest("tbody tr");
    const tbody = row?.parentElement;
    if (!row || !tbody) return;
    const index = Array.from(tbody.children).indexOf(row);
    const item = data[index];
    if (item) onRowClick(item.__row);
  };

  return (
    <VStack gap={3}>
      {filterColumns.length > 0 && (
        <HStack gap={2} wrap="wrap">
          {filterColumns.map((column) => {
            const label =
              typeof column.header === "string" ? column.header : String(column.key);
            const filter = column.filter!;
            if (filter.kind === "select") {
              return (
                <Selector
                  key={column.key}
                  label={label}
                  isLabelHidden
                  size="sm"
                  value={filters[column.key] ?? ""}
                  options={[
                    { value: "", label: filter.placeholder ?? "All" },
                    ...(filter.options ?? []),
                  ]}
                  onChange={(value) => setFilter(column.key, value)}
                />
              );
            }
            return (
              <TextInput
                key={column.key}
                label={label}
                isLabelHidden
                size="sm"
                width={200}
                placeholder={filter.placeholder ?? "Filter…"}
                value={filters[column.key] ?? ""}
                onChange={(value) => setFilter(column.key, value)}
              />
            );
          })}
        </HStack>
      )}

      <div
        className={onRowClick ? "data-table data-table-clickable" : "data-table"}
        onClick={handleRowClick}
      >
        <Table
          data={data}
          columns={tableColumns}
          idKey="__key"
          density="compact"
          textOverflow="truncate"
          hasHover={Boolean(onRowClick)}
          emptyState={<EmptyState title={emptyMessage} isCompact />}
        />
      </div>
    </VStack>
  );
}
