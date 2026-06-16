import * as React from "react";
import type { Story } from "@ladle/react";
import { Pagination } from "./pagination";

export default {
  title: "Admin / Pagination",
};

export const Interactive: Story = () => {
  const [page, setPage] = React.useState(1);
  return (
    <Pagination
      page={page}
      pageSize={20}
      total={137}
      onPageChange={setPage}
    />
  );
};

export const Empty: Story = () => (
  <Pagination page={1} pageSize={20} total={0} onPageChange={() => {}} />
);
