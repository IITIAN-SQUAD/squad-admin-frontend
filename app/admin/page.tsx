"use client";

import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import React from "react";
import { User, Shield, Plus } from "lucide-react";
import { DataTable_Search } from "@/src/components/ui/data-table-search";
import PageHeader from "@/src/components/page/page-header";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import PageTitle from "@/src/components/page/page-title";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CreateAdminForm from "@/src/components/admin/CreateAdminForm";


// Dummy data
const adminData = [
  {
    image: "/profile.jpg",
    name: "John Doe",
    email: "john@example.com",
    createdBy: "System",
    level: "1",
    role: "Platform Admin",
    createdOn: "2024-06-01",
  },
  {
    image: "/profile.jpg",
    name: "Jane Smith",
    email: "jane@example.com",
    createdBy: "Admin",
    level: "2",
    role: "Admin",
    createdOn: "2024-05-15",
  },
];

const ADMIN_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Editor" },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader title={"Admin Listing"}></PageHeader>
      <div className="p-8">
        <div className="flex justify-between">
          <PageTitle>Admin Listing</PageTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2">
                <span><Plus /></span>Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreateAdminForm />
            </DialogContent>
          </Dialog>
        </div>
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard title="Total Admins" value={42} icon={<User />} />
            <AnalyticsCard title="Platform Admins" value={7} icon={<Shield />} />
          </div>
        </Section>

        <Section>
          <SectionHeader>Admin management</SectionHeader>
          <DataTable_Search columns={TABLE_COLUMNS.adminListing} data={adminData} searchPlaceholder="Search admins..." />
        </Section>
      </div>
      <div className="h-[100vh]" />
    </>
  );
}
