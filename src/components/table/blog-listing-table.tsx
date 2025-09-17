"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  DataTableProvider,
  InnerDataTable,
  useDataTableContext,
} from "@/components/ui/data-table";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { DataTableSearchInput } from "../ui/data-table-search";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DataTable_SearchProps<TData, TValue> {
  data: TData[];
  searchPlaceholder?: string;
}

export function BlogListingTable<
  TData extends { visibility?: string },
  TValue
>({
  data,
  searchPlaceholder = "Search...",
}: DataTable_SearchProps<TData, TValue>) {
  // Extract unique visibility values and counts
  const visibilityStats = useMemo(() => {
    const stats: Record<string, number> = {};
    data.forEach((item) => {
      const key = item.visibility ?? "Unknown";
      stats[key] = (stats[key] || 0) + 1;
    });
    return Object.entries(stats); // [ [visibility, count], ... ]
  }, [data]);

  // Add "All" tab at the start
  const tabs = useMemo<[string, number][]>(
    () => [["All", data.length], ...visibilityStats],
    [data.length, visibilityStats]
  );

  // Track selected tab
  const [selectedVisibility, setSelectedVisibility] = useState<string>("All");

  // Sync component that uses the table instance from provider to apply filter
  function SyncFilter({ value }: { value: string }) {
    const { setGlobalFilter, table } = useDataTableContext<any>();

    useEffect(() => {
      if (value === "All") {
        setGlobalFilter("");
      } else {
        // use visibility value as the global filter term
        setGlobalFilter(value);
      }
      // reset to first page when switching tabs
      table.setPageIndex(0);
    }, [value, setGlobalFilter, table]);

    return null;
  }

  return (
    // Provide the full dataset to the table; filtering is applied via the table instance
    <DataTableProvider columns={TABLE_COLUMNS.blogListing} data={data}>
      <Tabs
        value={selectedVisibility}
        onValueChange={setSelectedVisibility}
        className="w-full"
      >
        <div className="mb-4 flex items-center">
          <DataTableSearchInput searchPlaceholder={searchPlaceholder} />
          <div className="flex-1" />
          <TabsList>
            {tabs.map(([visibility, count]) => (
              <TabsTrigger
                key={visibility}
                value={visibility}
                className="flex items-center gap-2"
              >
                <span>{visibility}</span>
                <span className="bg-accent text-xs px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* sync filter into the provider's table instance */}
        <SyncFilter value={selectedVisibility} />

        {/* Render content panes — all panes use the same provider/table instance,
            actual rows are controlled by the table's filter state. */}
        {tabs.map(([visibility]) => (
          <TabsContent key={visibility} value={visibility} className="w-full">
            <div className="rounded-md">
              <InnerDataTable />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </DataTableProvider>
  );
}
