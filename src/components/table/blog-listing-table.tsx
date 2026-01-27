"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  DataTableProvider,
  InnerDataTable,
} from "@/components/ui/data-table";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryService, Category } from "@/src/services/category.service";
import { BlogFilterRequest } from "@/src/services/blog.service";

interface BlogListingTableProps {
  data: any[];
  onFiltersChange?: (filters: BlogFilterRequest) => void;
  loading?: boolean;
  currentFilters?: {
    searchText?: string;
    status?: string;
    category?: string;
  };
}

const BLOG_STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "REJECTED", label: "Rejected" },
];

export function BlogListingTable({
  data,
  onFiltersChange,
  loading = false,
  currentFilters,
}: BlogListingTableProps) {
  const [searchText, setSearchText] = useState<string>(currentFilters?.searchText || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(currentFilters?.status || "all");
  const [selectedCategory, setSelectedCategory] = useState<string>(currentFilters?.category || "all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Update local state when parent filters change
  useEffect(() => {
    if (currentFilters) {
      setSearchText(currentFilters.searchText || "");
      setSelectedStatus(currentFilters.status || "all");
      setSelectedCategory(currentFilters.category || "all");
    }
  }, [currentFilters]);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories();
        setCategories(response.category_response_dto_list || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Mark initial mount as complete
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Handle filter changes - only trigger on filter value changes, skip initial mount
  useEffect(() => {
    if (!onFiltersChange || isInitialMount) return;

    const timer = setTimeout(() => {
      const filters: BlogFilterRequest = {
        page: 0,
        size: 20,
      };

      if (searchText) filters.search_text = searchText;
      if (selectedCategory && selectedCategory !== "all") filters.category_id = selectedCategory;
      if (selectedStatus && selectedStatus !== "all") filters.visibility_status = selectedStatus as any;

      onFiltersChange(filters);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, selectedCategory, selectedStatus]); // Removed onFiltersChange from deps

  return (
    <div>
      {/* Filters Section */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search blogs by title or content..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {BLOG_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loadingCategories}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(searchText || selectedCategory !== "all" || selectedStatus !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchText("");
              setSelectedCategory("all");
              setSelectedStatus("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTableProvider columns={TABLE_COLUMNS.blogListing} data={data}>
        <div className="rounded-md">
          <InnerDataTable />
        </div>
      </DataTableProvider>
    </div>
  );
}
