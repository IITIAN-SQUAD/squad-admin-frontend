"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Eye, Edit, Trash } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/src/components/dialogs/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

// Banner image cell with modal preview
const BannerImageCell = ({ row }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Image
            src={row.original.bannerImage}
            alt={row.original.heading}
            width={80}
            height={45}
            className="rounded-lg object-cover cursor-pointer"
            onClick={() => setOpen(true)}
          />
        </DialogTrigger>
        <DialogContent className="flex flex-col items-center">
          <Image
            src={row.original.bannerImage}
            alt={row.original.heading}
            width={400}
            height={225}
            className="rounded-lg object-cover"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

// Visibility badge cell
const VisibilityBadgeCell = ({ row }: any) => (
  <Badge
    variant={'default'}
    className={
      row.original.visibility === "Published"
        ? "bg-green-600 text-white"
        : "bg-amber-500 text-white"
    }
  >
    {row.original.visibility}
  </Badge>
);

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

// Cell component for author management actions
const AuthorManagementActions = ({ row }: { row: any }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    console.log("Deleting author:", row.original.id);
    // Implement delete logic here
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8" 
          title="View Author"
          asChild
        >
          <Link href={`/author-management/${row.original.id}`}>
            <Eye className="w-4 h-4" />
          </Link>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8" 
          title="Edit Author"
          onClick={() => {
            // This will be handled by the parent component
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('edit-author', { detail: row.original }));
            }
          }}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8" 
          title="Delete Author"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Author"
        description="Are you sure you want to delete this author? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
};

export const AUTHOR_TABLE_COLUMNS = [
  {
    accessorKey: "srNo",
    header: "Sr No",
  },
  {
    accessorKey: "avatar",
    header: "Avatar",
    cell: ({ row }: any) => (
      <Image
        src={row.original.avatar}
        alt={row.original.name}
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Author Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "associatedBlogs",
    header: "Associated Blogs",
    cell: ({ row }: any) => (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        {row.original.associatedBlogs}
      </Badge>
    ),
  },
  {
    accessorKey: "addedBy",
    header: "Added by Admin",
  },
  {
    id: "actions",
    header: "Actions",
    cell: AuthorManagementActions,
  },
];

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
      cell: ({ row }: any) => (
        <Link
          href={`/content/category-specification/${row.original.id}`}
          className="hover:underline"
        >
          {row.original.name}
        </Link>
      ),
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
      cell: (props: any) => {
        // stateful cell component (renders per-row)
        const { row } = props;
        const [open, setOpen] = useState(false);

        const handleDelete = () => {
          // implement delete logic here, e.g. call API with row.original.id
          // console.log("Delete category", row.original.id);
          setOpen(false);
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
                <DropdownMenuItem>
                  {/* view category - replace with link/action as needed */}
                  View Category
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
              isOpen={open}
              onOpenChange={setOpen}
              title="Delete Category"
              description="Are you sure you want to delete this category? This action cannot be undone."
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onConfirm={handleDelete}
              variant="destructive"
            />
          </>
        );
      },
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
      cell: BannerImageCell,
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      cell: VisibilityBadgeCell,
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
        <span
          className={
            row.original.visibility === "Published"
              ? "text-green-600"
              : "text-amber-600"
          }
        >
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

export const AUTHOR_BLOGS_COLUMNS = [
  {
    accessorKey: "srNo",
    header: "Sr No",
  },
  {
    accessorKey: "heading",
    header: "Blog Heading",
    cell: ({ row }: any) => (
      <div className="flex items-center gap-3">
        <Image
          src={row.original.bannerImage}
          alt={row.original.heading}
          width={60}
          height={40}
          className="rounded object-cover"
        />
        <span>{row.original.heading}</span>
      </div>
    ),
  },
  {
    accessorKey: "categories",
    header: "Blog Categories",
    cell: ({ row }: any) => (
      <div className="max-w-[200px] truncate">
        {row.original.categories.join(", ")}
      </div>
    ),
  },
  {
    accessorKey: "associatedBy",
    header: "Associated by Admin",
  },
]