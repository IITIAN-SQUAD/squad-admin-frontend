"use client";

import React, { useMemo, useState } from "react";
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

  // Track selected tab
  const [selectedVisibility, setSelectedVisibility] = useState<string>(
    visibilityStats.length > 0 ? visibilityStats[0][0] : "Unknown"
  );

  return (
    <Tabs
      value={selectedVisibility}
      onValueChange={setSelectedVisibility}
      className="w-full"
    >
      {visibilityStats.map(([visibility]) => (
        <TabsContent key={visibility} value={visibility} className="w-full">
          <DataTableProvider
            columns={TABLE_COLUMNS.blogListing}
            data={data.filter(
              (item) => (item.visibility ?? "Unknown") === visibility
            )}
          >
            <div className="mb-4 flex items-center">
              <DataTableSearchInput searchPlaceholder={searchPlaceholder} />
              <div className="flex-1" />
              <TabsList>
                {visibilityStats.map(([visibility, count]) => (
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
            <div className="rounded-md">
              <InnerDataTable />
            </div>
          </DataTableProvider>
        </TabsContent>
      ))}
    </Tabs>
  );
}
