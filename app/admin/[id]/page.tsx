import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import AdminInfoCard from "@/src/components/admin/AdminInfoCard";
import Image from "next/image";
import React from "react";

// Dummy data for demonstration
const adminInfo = {
  image: "/profile.jpg",
  name: "John Doe",
  email: "john@example.com",
  createdBy: "Jane Smith",
  level: "1",
  role: "Super Admin",
  createdOn: "2024-06-01",
  roleUpdatedOn: "2024-06-10",
};

const roleChangeHistory = [
  {
    previous: "Admin",
    after: "Super Admin",
    changedBy: "Jane Smith",
    changedOn: "2024-06-10",
  },
  // ...more rows
];

const adminAdded = [
  {
    name: "Alice Brown",
    email: "alice@example.com",
    date: "2024-06-12",
  },
  // ...more rows
];

// Table columns for role change history
const roleChangeColumns = [
  {
    accessorKey: "previous",
    header: "Previous Role",
  },
  {
    accessorKey: "after",
    header: "New Role",
  },
  {
    accessorKey: "changedBy",
    header: "Changed By",
  },
  {
    accessorKey: "changedOn",
    header: "Changed On",
  },
];

// Table columns for admins added
const adminAddedColumns = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "date",
    header: "Date Added",
  },
];

interface AdminDetailPageProps {
  params: { id: string };
}

export default async function AdminDetailPage({ params }: any) {
  const { id } = await params;
  const isSuperAdmin = adminInfo.role === "Super Admin";

  return (
    <>
      <PageHeader title={`Admin Detail`} />
      <PageWrapper>
        <PageTitle>Admin Details</PageTitle>
        <Section>
          <SectionHeader>Profile</SectionHeader>
          <div className="flex items-center gap-6 mb-4">
            <Image
              src={adminInfo.image}
              alt={adminInfo.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <div className="font-bold text-lg">{adminInfo.name}</div>
              <div className="text-sm text-muted-foreground">
                {adminInfo.email}
              </div>
            </div>
          </div>
          <AdminInfoCard adminInfo={adminInfo} />
        </Section>

        {/* Role Change History Table */}
        <Section>
          <SectionHeader>Role Change History</SectionHeader>
          <DataTable_Search
            columns={roleChangeColumns}
            data={roleChangeHistory}
            searchPlaceholder="Search role changes..."
          />
        </Section>

        {/* Admin Added Table (only for super admin) */}
        {isSuperAdmin && (
          <Section>
            <SectionHeader>Admins Added</SectionHeader>
            <DataTable_Search
              columns={adminAddedColumns}
              data={adminAdded}
              searchPlaceholder="Search added admins..."
            />
          </Section>
        )}
      </PageWrapper>
    </>
  );
}
