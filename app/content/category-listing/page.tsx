"use client";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { Button } from "@/components/ui/button";
import CreateCategoryForm from "@/src/components/content/CreateCategoryForm";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Plus, FolderOpen, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { categoryService, Category, CategoryListResponse } from "@/src/services/category.service";

// Pagination settings
const ITEMS_PER_PAGE = 10;

export default function CategoryListingPage() {
  const [open, setOpen] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesResponse = await categoryService.getAllCategories();
      setCategoryData(categoriesResponse);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
      
      // Extract specific error message
      let errorMessage = 'Failed to load categories';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.errorDescription) {
        errorMessage = error.errorDescription;
      } else if (error?.errorCode) {
        errorMessage = `Error: ${error.errorCode}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  // Add event listener for category deletion
  useEffect(() => {
    const handleCategoryDeleted = () => {
      fetchCategories(); // Refresh the list after deletion
    };

    const handleCategoryUpdated = () => {
      fetchCategories(); // Refresh the list after update
    };

    window.addEventListener('category-deleted', handleCategoryDeleted);
    window.addEventListener('category-updated', handleCategoryUpdated);
    
    return () => {
      window.removeEventListener('category-deleted', handleCategoryDeleted);
      window.removeEventListener('category-updated', handleCategoryUpdated);
    };
  }, []);

  const handleCategorySaved = () => {
    fetchCategories(); // Refresh the list
  };

  // Pagination logic
  const totalPages = categoryData ? Math.ceil(categoryData.total_categories / ITEMS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = categoryData 
    ? categoryData.category_response_dto_list.slice(startIndex, endIndex)
    : [];

  // Transform data for table display
  const transformedCategories = paginatedCategories.map((category, index) => ({
    id: category.id,
    name: category.name,
    createdOn: new Date(category.created_at).toLocaleDateString(),
    totalBlogs: category.blog_count || 0, // Use actual blog count from API
    createdBy: category.created_by_admin_id, // TODO: Get admin name by ID
    ...category, // Include all category data for actions
  }));

  return (
    <>
      <PageHeader title={"Category Listing"}></PageHeader>
      <div className="p-8">
        <div className="flex justify-between items-center">
          <PageTitle>Category Listing</PageTitle>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2"
              onClick={fetchCategories}
              disabled={loading}
            >
              <span className="mr-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </span>
              Refresh
            </Button>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2">
                  <span className="mr-2">
                    <Plus />
                  </span>
                  Create category
                </Button>
              </DialogTrigger>

              <DialogContent>
                <CreateCategoryForm onClose={setOpen} onSave={handleCategorySaved} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard
              className="max-w-2xl"
              title="Total Categories"
              value={categoryData?.total_categories || 0}
              icon={<FolderOpen />}
            />
            <AnalyticsCard
              className="max-w-2xl"
              title="Total Blogs"
              value={categoryData?.total_blogs || 0}
              icon={<FolderOpen />}
            />
          </div>
        </Section>

        <Section>
          <SectionHeader>Category Management</SectionHeader>
          <DataTable_Search
            columns={TABLE_COLUMNS.categoryListing}
            data={transformedCategories}
            searchPlaceholder="Search categories..."
            loading={loading}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, categoryData?.total_categories || 0)} of {categoryData?.total_categories || 0} categories
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <span className="px-3 py-1 text-sm border rounded">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
