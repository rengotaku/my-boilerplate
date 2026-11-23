import { Pagination as AstryxPagination } from "@astryxdesign/core/Pagination";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Page navigation built on Astryx Pagination (count readout keeps "x of N"). */
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);

  return (
    <AstryxPagination
      page={current}
      totalItems={total}
      pageSize={pageSize}
      onChange={onPageChange}
      variant="count"
      size="sm"
      label="Pagination"
    />
  );
}
