"use client"

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { DataTable, DataTableProvider, InnerDataTable, useDataTableContext } from "@/components/ui/data-table";


interface DataTable_SearchProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
}

function DataTableSearchInput({ searchPlaceholder }: { searchPlaceholder?: string }) {
  const { table } = useDataTableContext<any>();
  return (
    <Input
      placeholder={searchPlaceholder || "Search..."}
      value={table.getState().globalFilter || ""}
      onChange={e => table.setGlobalFilter(e.target.value)}
      className="w-[300px]"
    />
  );
}

export function DataTable_Search<TData, TValue>({ columns, data, searchPlaceholder = "Search..." }: DataTable_SearchProps<TData, TValue>) {
  // Just render the search input and DataTable, which now provides context
  return (
    <DataTableProvider columns={columns} data={data}>
      <div className="mb-4 flex justify-between items-center">
        <DataTableSearchInput searchPlaceholder={searchPlaceholder} />
      </div>
      <div className="rounded-md">
        <InnerDataTable />
      </div>
    </DataTableProvider>
  );
}
