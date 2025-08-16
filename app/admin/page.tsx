"use client"

import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import React, { useState } from "react";
import { User, Shield, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { DataTable } from "@/components/ui/data-table";

// Table columns definition
const columns = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }: any) => (
      <Image
        src={row.original.image}
        alt={row.original.name}
        width={32}
        height={32}
        className="rounded-full"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
  },
  {
    accessorKey: "level",
    header: "Level",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "createdOn",
    header: "Created On",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }: any) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Disable</DropdownMenuItem>
          <DropdownMenuItem>Update Role</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

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
  // ...add more rows as needed
];

export default function AdminPage() {
  const [search, setSearch] = useState("");

  // Filter data by name/email
  const filteredData = adminData.filter(
    (admin) =>
      admin.name.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="w-full border-b px-6 py-4 flex items-center bg-background sticky top-0 z-50">
        <h1 className="text-sm font-medium">Admin List</h1>
        {/* Add nav links or actions here if needed */}
      </header>
      <div className="p-8">
        <h1 className="text-xl font-bold mb-4">Admin Listing</h1>
        {/* Analytics Section */}
        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard title="Total Admins" value={42} icon={<User />} />
            <AnalyticsCard title="Platform Admins" value={7} icon={<Shield />} />
          </div>
        </Section>

        <Section>
          <SectionHeader>Admin management</SectionHeader>
          {/* Data Table with Search */}
          <div className="mb-4 flex justify-between items-center">
            <Input
              placeholder="Search admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px]"
            />
          </div>
          <DataTable columns={columns} data={filteredData} />
        </Section>
      </div>
      <div className="h-[100vh]" />
    </>
  );
}
