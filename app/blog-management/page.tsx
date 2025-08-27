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
  {
    srNo: 3,
    heading: "Top programming languages for engineers",
    bannerImage: "/blog3.jpg",
    createdOn: "2024-05-20",
    visibility: "Published",
    createdBy: "Amit Kumar",
    id: 3,
  },
  {
    srNo: 4,
    heading: "Time management tips for competitive exams",
    bannerImage: "/blog4.jpg",
    createdOn: "2024-04-15",
    visibility: "Published",
    createdBy: "Priya Patel",
    id: 4,
  },
  {
    srNo: 5,
    heading: "Understanding Physics: Core concepts",
    bannerImage: "/blog5.jpg",
    createdOn: "2024-03-30",
    visibility: "Draft",
    createdBy: "Ravi Singh",
    id: 5,
  },
  {
    srNo: 6,
    heading: "Chemistry tricks: Memorize the periodic table",
    bannerImage: "/blog6.jpg",
    createdOn: "2024-02-10",
    visibility: "Published",
    createdBy: "Neha Verma",
    id: 6,
  },
  {
    srNo: 7,
    heading: "Interview preparation: Dos and Don'ts",
    bannerImage: "/blog7.jpg",
    createdOn: "2024-01-25",
    visibility: "Published",
    createdBy: "Suman Rao",
    id: 7,
  },
  {
    srNo: 8,
    heading: "Study routines that actually work",
    bannerImage: "/blog8.jpg",
    createdOn: "2023-12-18",
    visibility: "Draft",
    createdBy: "Karan Mehta",
    id: 8,
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
    </>
  );
}
