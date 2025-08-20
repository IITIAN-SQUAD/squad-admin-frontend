"use client"
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import { User } from "lucide-react";

const categoryDetails = {
  name: 'dummy-category'
}

export default function CategoryDetailPage({ params }: any) {

  return (
    <>
      <PageHeader title={`Category Details`} />
      <PageWrapper>
        <PageTitle>{categoryDetails.name}</PageTitle>
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard title="Total Categories" value={42} icon={<User />} />
          </div>
        </Section>

        {/* Role Change History Table */}
        <Section>
          <SectionHeader>Associated Articles</SectionHeader>
          <DataTable_Search
            columns={TABLE_COLUMNS.blogManagementListing}
            data={[]}
            searchPlaceholder="Search blogs..."
          />
        </Section>

      </PageWrapper>
    </>
  );
}
