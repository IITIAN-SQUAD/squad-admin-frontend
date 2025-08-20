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
              <DialogHeader className="mb-4">
                <DialogTitle>Create Admin</DialogTitle>
              </DialogHeader>
              <form className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" placeholder="Username" required />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Email" required />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="Password" required />
                </div>
                <div className="space-y-3 mb-6">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" required>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMIN_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
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
