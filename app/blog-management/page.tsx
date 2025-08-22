"use client";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { Button } from "@/components/ui/button";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import { Plus, FileText } from "lucide-react";
import React from "react";

// Dummy data for demonstration
const blogList = [
  {
    srNo: 1,
    heading: "How to prepare for IIT",
    bannerImage: "/blog1.jpg",
    createdOn: "2024-06-01",
    visibility: "Published",
    createdBy: "John Doe",
    id: 1,
  },
  {
    srNo: 2,
    heading: "Math shortcuts",
    bannerImage: "/blog2.jpg",
    createdOn: "2024-06-05",
    visibility: "Draft",
    createdBy: "Jane Smith",
    id: 2,
  },
];

export default function BlogManagementPage() {
  return (
    <>
      <PageHeader title={"Blog Management"} />
      <div className="p-8">
        <div className="flex justify-between">
          <PageTitle>Blog Management</PageTitle>
          <Button className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2">
            <span>
              <Plus />
            </span>
            Create Blog
          </Button>
        </div>
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard title="Total Blogs" value={blogList.length} icon={<FileText />} />
            <AnalyticsCard title="Published Blogs" value={blogList.filter(b => b.visibility === "Published").length} icon={<FileText />} />
          </div>
        </Section>
        <Section>
          <SectionHeader>Blog Listing</SectionHeader>
          <DataTable_Search
            columns={TABLE_COLUMNS.blogManagementListing}
            data={blogList}
            searchPlaceholder="Search blogs..."
          />
        </Section>
      </div>
      <div className="h-[100vh]" />
    </>
  );
}
