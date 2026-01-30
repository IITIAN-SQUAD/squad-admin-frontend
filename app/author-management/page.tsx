"use client";
import { Button } from "@/components/ui/button";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import { Plus, Users, RefreshCw } from "lucide-react";
import React, { useState, useEffect } from "react";
import { AuthorDialog } from "@/src/components/author/AuthorDialog";
import { AUTHOR_TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { authorService, Author } from "@/src/services/author.service";
import { toast } from "sonner";
import { generateAvatarDataURL } from "@/src/utils/avatar";

export default function AuthorManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAuthors, setTotalAuthors] = useState(0);
  const [totalBlogs, setTotalBlogs] = useState(0);

  // Add event listener for edit-author event
  React.useEffect(() => {
    const handleEditAuthorEvent = (event: CustomEvent) => {
      handleEditAuthor(event.detail);
    };

    const handleDeleteAuthorEvent = (event: CustomEvent) => {
      handleDeleteAuthor(event.detail);
    };

    window.addEventListener('edit-author', handleEditAuthorEvent as EventListener);
    window.addEventListener('delete-author', handleDeleteAuthorEvent as EventListener);
    
    return () => {
      window.removeEventListener('edit-author', handleEditAuthorEvent as EventListener);
      window.removeEventListener('delete-author', handleDeleteAuthorEvent as EventListener);
    };
  }, []);

  // Fetch authors from backend
  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const authorsData = await authorService.getAllAuthors();
      
      // Transform backend data to table format
      const transformedAuthors = authorsData.map((author, index) => ({
        srNo: index + 1,
        avatar: author.profilePicture || generateAvatarDataURL(author.name),
        addedBy: author.createdByAdminId, // You might want to fetch admin name by ID
        ...author // Include all author data for editing
      }));

      setAuthors(transformedAuthors);
      
      // Calculate analytics
      const totalBlogsCount = authorsData.reduce((sum, author) => sum + author.associatedBlogs, 0);
      setTotalAuthors(authorsData.length);
      setTotalBlogs(totalBlogsCount);
      
    } catch (error: any) {
      console.error('Failed to fetch authors:', error);
      
      // Extract specific error message
      let errorMessage = 'Failed to load authors';
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
    fetchAuthors();
  }, []);

  const handleCreateAuthor = () => {
    setEditingAuthor(null);
    setIsDialogOpen(true);
  };

  const handleEditAuthor = (author: any) => {
    setEditingAuthor(author);
    setIsDialogOpen(true);
  };

  const handleDeleteAuthor = async (authorId: string) => {
    try {
      await authorService.deleteAuthor(authorId);
      toast.success('Author deleted successfully');
      fetchAuthors(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to delete author:', error);
      
      // Extract specific error message
      let errorMessage = 'Failed to delete author';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.errorDescription) {
        errorMessage = error.errorDescription;
      } else if (error?.errorCode) {
        errorMessage = `Error: ${error.errorCode}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleAuthorSaved = () => {
    setIsDialogOpen(false);
    setEditingAuthor(null);
    fetchAuthors(); // Refresh the list
  };

  return (
    <>
      <PageHeader title={"Author Management"} />
      <div className="p-8">
        <div className="flex justify-between items-center">
          <PageTitle>Author Management</PageTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2"
              onClick={fetchAuthors}
              disabled={loading}
            >
              <span className="mr-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </span>
              Refresh
            </Button>
            <Button
              className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2"
              onClick={handleCreateAuthor}
            >
              <span className="mr-2">
                <Plus />
              </span>
              Create Author
            </Button>
          </div>
        </div>
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard
              title="Total Authors"
              value={totalAuthors}
              icon={<Users />}
            />
            <AnalyticsCard
              title="Total Blogs by Authors"
              value={totalBlogs}
              icon={<Users />}
            />
          </div>
        </Section>
        <Section>
          <SectionHeader>Author Listing</SectionHeader>
          <DataTable_Search
            columns={AUTHOR_TABLE_COLUMNS}
            data={authors}
            searchPlaceholder="Search authors..."
          />
        </Section>
      </div>

      <AuthorDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        author={editingAuthor}
        onSave={handleAuthorSaved}
      />
    </>
  );
}
