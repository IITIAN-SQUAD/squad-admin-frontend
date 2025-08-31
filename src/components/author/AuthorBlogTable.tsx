"use client"

import React from "react";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import { ColumnDef } from "@tanstack/react-table";
import { AUTHOR_TABLE_COLUMNS } from "@/assets/constants/table-columns";

interface AuthorBlogTableProps {
  blogs: any[];
}

export function AuthorBlogTable({ blogs }: AuthorBlogTableProps) {
  return (
    <DataTable_Search
      columns={AUTHOR_TABLE_COLUMNS}
      data={blogs}
      searchPlaceholder="Search blogs..."
    />
  );
}
