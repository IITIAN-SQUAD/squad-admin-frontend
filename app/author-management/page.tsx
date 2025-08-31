"use client";
import { Button } from "@/components/ui/button";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import { Plus, Users } from "lucide-react";
import React, { useState } from "react";
import { AuthorDialog } from "@/src/components/author/AuthorDialog";
import { AUTHOR_TABLE_COLUMNS } from "@/assets/constants/table-columns";

// Dummy data for demonstration
const authorList = [
  {
    srNo: 1,
    name: "John Doe",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    email: "john.doe@example.com",
    associatedBlogs: 5,
    addedBy: "Admin User",
    id: 1,
  },
  {
    srNo: 2,
    name: "Jane Smith",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    email: "jane.smith@example.com",
    associatedBlogs: 3,
    addedBy: "Super Admin",
    id: 2,
  },
  {
    srNo: 3,
    name: "Amit Kumar",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    email: "amit.kumar@example.com",
    associatedBlogs: 7,
    addedBy: "Admin User",
    id: 3,
  },
  {
    srNo: 4,
    name: "Priya Patel",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
    email: "priya.patel@example.com",
    associatedBlogs: 2,
    addedBy: "Content Manager",
    id: 4,
  },
  {
    srNo: 5,
    name: "Ravi Singh",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    email: "ravi.singh@example.com",
    associatedBlogs: 4,
    addedBy: "Super Admin",
    id: 5,
  },
];

export default function AuthorManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);

  // Add event listener for edit-author event
  React.useEffect(() => {
    const handleEditAuthorEvent = (event: CustomEvent) => {
      handleEditAuthor(event.detail);
    };

    window.addEventListener('edit-author', handleEditAuthorEvent as EventListener);
    
    return () => {
      window.removeEventListener('edit-author', handleEditAuthorEvent as EventListener);
    };
  }, []);

  const handleCreateAuthor = () => {
    setEditingAuthor(null);
    setIsDialogOpen(true);
  };

  const handleEditAuthor = (author: any) => {
    setEditingAuthor(author);
    setIsDialogOpen(true);
  };

  return (
    <>
      <PageHeader title={"Author Management"} />
      <div className="p-8">
        <div className="flex justify-between">
          <PageTitle>Author Management</PageTitle>
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
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard
              title="Total Authors"
              value={authorList.length}
              icon={<Users />}
            />
            <AnalyticsCard
              title="Total Blogs by Authors"
              value={authorList.reduce((sum, author) => sum + author.associatedBlogs, 0)}
              icon={<Users />}
            />
          </div>
        </Section>
        <Section>
          <SectionHeader>Author Listing</SectionHeader>
          <DataTable_Search
            columns={AUTHOR_TABLE_COLUMNS}
            data={authorList}
            searchPlaceholder="Search authors..."
          />
        </Section>
      </div>

      <AuthorDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        author={editingAuthor}
      />
    </>
  );
}
