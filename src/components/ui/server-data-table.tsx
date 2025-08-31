import { ColumnDef } from "@tanstack/react-table";
import { DataTable_Search } from "./data-table-search";

interface ServerDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
}

export function ServerDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
}: ServerDataTableProps<TData, TValue>) {
  return (
    <div className="server-data-table">
      {/* This is a server component wrapper that passes data to the client component */}
      <DataTable_Search
        columns={columns}
        data={data}
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  );
}
