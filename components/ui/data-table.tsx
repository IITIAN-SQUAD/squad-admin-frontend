"use client";

import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // pagination & selection state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // inject a default selection column at the start (use shadcn Checkbox)
  const columnsWithSelection = useMemo<ColumnDef<TData, any>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="w-12 flex items-center justify-center">
            <Checkbox
              aria-label="Select all"
              checked={table.getIsAllRowsSelected()}
              onCheckedChange={(checked) =>
                // adapt to tanstack's native event handler
                table.getToggleAllRowsSelectedHandler()({
                  target: { checked },
                } as unknown as React.ChangeEvent<HTMLInputElement>)
              }
              className="accent-blue-500 align-middle"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="w-12 flex items-center justify-center">
            <Checkbox
              aria-label={`Select row ${row.index + 1}`}
              checked={row.getIsSelected()}
              onCheckedChange={(checked) =>
                row.getToggleSelectedHandler()({
                  target: { checked },
                } as unknown as React.ChangeEvent<HTMLInputElement>)
              }
              className="accent-blue-500 align-middle"
            />
          </div>
        ),
        enableHiding: false,
        size: 12,
      },
      // ...existing columns...
      ...columns,
    ],
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    state: {
      pagination,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ADD: internal Pagination component (shadcn-style)
  function Pagination({ table }: { table: any }) {
    const pageCount = table.getPageCount();
    const pageIndex = table.getState().pagination.pageIndex;

    // build a compact page range similar to shadcn example
    const pages: (number | "dots")[] = [];
    const total = pageCount;
    const current = pageIndex;

    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      // always show first, last, current +-1, and ellipses
      pages.push(0);
      if (current > 3) pages.push("dots");
      const start = Math.max(1, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 4) pages.push("dots");
      pages.push(total - 1);
    }

    return (
      <div className="flex items-center justify-end gap-4 h-12 z-50 border-t-1 px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.setPageIndex(Math.max(0, pageIndex - 1))}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous"
          >
            ‹
          </Button>

          {pages.map((p, idx) =>
            p === "dots" ? (
              <span
                key={`dots-${idx}`}
                className="px-2 text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === pageIndex ? "default" : "ghost"}
                size="sm"
                onClick={() => table.setPageIndex(p)}
                aria-label={`Go to page ${p + 1}`}
              >
                {p + 1}
              </Button>
            )
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              table.setPageIndex(Math.min(pageCount - 1, pageIndex + 1))
            }
            disabled={!table.getCanNextPage()}
            aria-label="Next"
          >
            ›
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Page <strong>{pageIndex + 1}</strong> of{" "}
            <strong>{pageCount || 1}</strong>
          </div>

          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md overflow-hidden border relative">
      <div className="absolute bottom-0 left-0 right-0 h-0 border-b bg-border z-50 top-12" />
      <Table className="relative" maxheight="max-h-[400px]">
        
        {/* Sticky Header */}
        <TableHeader className="sticky top-0 z-20 bg-background h-12">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="border-b-1">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {/* Scrollable Rows */}
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnsWithSelection.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <tfoot className="sticky bottom-0 z-20 bg-background">
          <TableRow className="p-0">
            <TableCell colSpan={columnsWithSelection.length} className="p-0">
              <Pagination table={table} />
            </TableCell>
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
