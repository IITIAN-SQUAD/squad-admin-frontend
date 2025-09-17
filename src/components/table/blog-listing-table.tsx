"use client"

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { DataTableProvider, InnerDataTable, useDataTableContext } from "@/components/ui/data-table";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { DataTableSearchInput } from "../ui/data-table-search";


interface DataTable_SearchProps<TData, TValue> {

  data: TData[];
  searchPlaceholder?: string;
}

export function BlogListingTable<TData extends { visibility?: string }, TValue>({
  data,
  searchPlaceholder = "Search...",
}: DataTable_SearchProps<TData, TValue>) {
  // Extract unique visibility values and counts
  const visibilityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    data.forEach(item => {
      const key = item.visibility ?? "Unknown";
      stats[key] = (stats[key] || 0) + 1;
    });
    return Object.entries(stats); // [ [visibility, count], ... ]
  }, [data]);

  // Track selected tab
  const [selectedVisibility, setSelectedVisibility] = useState<string>(
    visibilityStats.length > 0 ? visibilityStats[0][0] : "Unknown"
  );

  // Filter data based on selected tab
  const filteredData = useMemo(
    () =>
      data.filter(
        item => (item.visibility ?? "Unknown") === selectedVisibility
      ),
    [data, selectedVisibility]
  );

  return (
    <div>
      {/* Tabs for visibility */}
      <div className="flex gap-2 mb-4">
        {visibilityStats.map(([visibility, count]) => (
          <button
            key={visibility}
            className={`px-3 py-1 rounded border flex items-center gap-2 ${
              selectedVisibility === visibility
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground"
            }`}
            onClick={() => setSelectedVisibility(visibility)}
            type="button"
          >
            <span>{visibility}</span>
            <span className="bg-accent text-xs px-2 py-0.5 rounded-full">{count}</span>
          </button>
        ))}
      </div>
      <DataTableProvider columns={TABLE_COLUMNS.blogListing} data={filteredData}>
        <div className="mb-4 flex items-center">
          <DataTableSearchInput searchPlaceholder={searchPlaceholder} />
        </div>
        <div className="rounded-md">
          <InnerDataTable />
        </div>
      </DataTableProvider>
    </div>
  );
}
