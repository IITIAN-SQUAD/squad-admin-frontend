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
import { Plus, User, Shield } from "lucide-react";
import React from "react";

// dummy data
const categoryList = [
  {
    name: "dummy-category",
    createdOn: "2024-06-01",
    totalBlogs: 5,
    createdBy: "John Doe",
  },
];

export default function CategoryListingPage() {
  const [open, setOpen] = React.useState(false);

  // sample articles to choose from (replace with real data)
  const articles = [
    { id: 1, title: "How to prepare for IIT" },
    { id: 2, title: "Study plan for 6 months" },
    { id: 3, title: "Math shortcuts" },
  ];

  return (
    <>
      <PageHeader title={"Category Listing"}></PageHeader>
      <div className="p-8">
        <div className="flex justify-between">
          <PageTitle>Category Listing</PageTitle>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2">
                <span>
                  <Plus />
                </span>
                Create category
              </Button>
            </DialogTrigger>

            <DialogContent>
              <CreateCategoryForm articles={articles} onClose={setOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard
              className="max-w-2xl"
              title="Total Categories"
              value={42}
              icon={<User />}
            />
          </div>
        </Section>

        <Section>
          <SectionHeader>Category management</SectionHeader>
          <DataTable_Search
            columns={TABLE_COLUMNS.categoryListing}
            data={categoryList}
            searchPlaceholder="Search categories..."
          />
        </Section>
      </div>
    </>
  );
}
