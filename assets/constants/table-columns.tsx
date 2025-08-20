"use client"

import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/src/components/dialogs/ConfirmDialog";

// Cell component for blog management actions
const BlogManagementActions = ({ row }: { row: any }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    console.log("Deleting blog:", row.original.id);
    // Implement delete logic here
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Settings className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Remove Article"
        description="Are you sure you want to remove this article? This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
};

export const TABLE_COLUMNS = {
  adminListing: [
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
      cell: ({ row }: any) => (
        <Link href={`/admin/${row.original.id}`} className="hover:underline">
          {row.original.name}
        </Link>
      ),
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
            <Button variant="ghost" size="icon" className="w-8 h-8">
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
  ],
  categoryListing: [
    {
      accessorKey: "name",
      header: "Category Name",
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
    },
    {
      accessorKey: "totalBlogs",
      header: "Total Blogs",
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Category</DropdownMenuItem>
            <DropdownMenuItem>Delete Category</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ],
  blogListing: [
    {
      accessorKey: "srNo",
      header: "Sr No",
    },
    {
      accessorKey: "heading",
      header: "Article Heading",
    },
    {
      accessorKey: "bannerImage",
      header: "Banner Image",
      cell: ({ row }: any) => (
        <Image
          src={row.original.bannerImage}
          alt={row.original.heading}
          width={80}
          height={45}
          className="rounded object-cover"
        />
      ),
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      cell: ({ row }: any) => (
        <span className={row.original.visibility === "Published" ? "text-green-600" : "text-amber-600"}>
          {row.original.visibility}
        </span>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Article</DropdownMenuItem>
            <DropdownMenuItem>Edit Article</DropdownMenuItem>
            <DropdownMenuItem>Delete Article</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ],
  blogManagementListing: [
    {
      accessorKey: "srNo",
      header: "Sr No",
    },
    {
      accessorKey: "heading",
      header: "Article Heading",
    },
    {
      accessorKey: "bannerImage",
      header: "Banner Image",
      cell: ({ row }: any) => (
        <Image
          src={row.original.bannerImage}
          alt={row.original.heading}
          width={80}
          height={45}
          className="rounded object-cover"
        />
      ),
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      cell: ({ row }: any) => (
        <span className={row.original.visibility === "Published" ? "text-green-600" : "text-amber-600"}>
          {row.original.visibility}
        </span>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
    },
    {
      id: "actions",
      header: "",
      cell: BlogManagementActions,
    },
  ],
};
