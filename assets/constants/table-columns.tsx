"use client";

import React, { useState } from "react";
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
import ConfirmDialog from "@/src/components/dialogs/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { categoryService } from "@/src/services/category.service";
import { toast } from "sonner";
import EditCategoryForm from "@/src/components/content/EditCategoryForm";

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
    // Dispatch delete event that will be handled by the parent component
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('delete-author', { detail: row.original.id }));
    }
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
    cell: ({ row }: any) => {
      const avatarSrc = row.original.avatar;
      
      // Check if it's a data URL (generated avatar) or external URL
      if (avatarSrc?.startsWith('data:')) {
        // Use Next.js Image for data URLs (generated avatars)
        return (
          <Image
            src={avatarSrc}
            alt={row.original.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        );
      } else if (avatarSrc) {
        // Use regular img tag for external URLs to avoid domain restrictions
        return (
          <img
            src={avatarSrc}
            alt={row.original.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
            onError={(e) => {
              // Fallback to generated avatar on error
              const target = e.target as HTMLImageElement;
              const name = row.original.name;
              const initials = name
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase())
                .join('')
                .substring(0, 2);
              
              // Create a simple colored div with initials as fallback
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-avatar')) {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
                const colorIndex = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
                
                const fallback = document.createElement('div');
                fallback.className = `fallback-avatar w-10 h-10 rounded-full object-cover flex items-center justify-center text-white font-semibold text-sm ${colors[colorIndex]}`;
                fallback.textContent = initials;
                parent.appendChild(fallback);
              }
            }}
          />
        );
      } else {
        // No avatar - show placeholder
        const name = row.original.name;
        const initials = name
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 2);
        
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
        const colorIndex = name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colors.length;
        
        return (
          <div className={`w-10 h-10 rounded-full object-cover flex items-center justify-center text-white font-semibold text-sm ${colors[colorIndex]}`}>
            {initials}
          </div>
        );
      }
    },
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
        <span className="font-medium">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "display_name",
      header: "Display Name",
      cell: ({ row }: any) => (
        <span className="font-medium text-blue-600">
          {row.original.display_name || row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "exams",
      header: "Associated Exams",
      cell: ({ row }: any) => {
        const exams = row.original.exams || [];
        if (exams.length === 0) {
          return <span className="text-gray-500 text-sm">No exams</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {exams.map((examName: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {examName}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "createdOn",
      header: "Created On",
    },
    {
      accessorKey: "totalBlogs",
      header: "Total Blogs",
      cell: ({ row }: any) => (
        <span className="text-sm">
          {row.original.totalBlogs}
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
      cell: (props: any) => {
        // stateful cell component (renders per-row)
        const { row } = props;
        const [deleteOpen, setDeleteOpen] = useState(false);
        const [editOpen, setEditOpen] = useState(false);
        const [loading, setLoading] = useState(false);

        const handleDelete = async () => {
          try {
            setLoading(true);
            
            // Call the real API
            await categoryService.deleteCategory(row.original.id);
            
            toast.success('Category deleted successfully');
            setDeleteOpen(false);
            
            // Dispatch event to refresh the list
            window.dispatchEvent(new CustomEvent('category-deleted', { detail: row.original.id }));
          } catch (error: any) {
            console.error("Failed to delete category:", error);
            
            // Extract specific error message
            let errorMessage = 'Failed to delete category';
            if (error?.message) {
              errorMessage = error.message;
            } else if (error?.errorDescription) {
              errorMessage = error.errorDescription;
            } else if (error?.errorCode) {
              errorMessage = `Error: ${error.errorCode}`;
            }
            
            toast.error(errorMessage);
          } finally {
            setLoading(false);
          }
        };

        return (
          <>
            <div className="flex gap-1">
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  setEditOpen(true);
                }}
                title="Edit Category"
              >
                <Edit className="w-4 h-4" />
              </Button>

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteOpen(true)}
                title="Delete Category"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Category</DialogTitle>
                </DialogHeader>
                <p className="text-gray-600">
                  Are you sure you want to delete "{row.original.name}"? This action cannot be undone.
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <EditCategoryForm 
                  category={row.original}
                  onClose={setEditOpen}
                  onSave={() => {
                    setEditOpen(false);
                    // Dispatch event to refresh the list
                    window.dispatchEvent(new CustomEvent('category-updated', { detail: row.original.id }));
                  }} 
                />
              </DialogContent>
            </Dialog>
          </>
        );
      },
    },
  ],
  blogListing: [
    {
      accessorKey: "srNo",
      header: "Sr No",
      cell: ({ row }: any) => row.index + 1,
    },
    {
      accessorKey: "heading",
      header: "Article Heading",
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.heading}</span>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }: any) => {
        const category = row.original.category_name || "Uncategorized";
        return <Badge variant="outline">{category}</Badge>;
      },
    },
    {
      accessorKey: "author_name",
      header: "Author",
    },
    {
      accessorKey: "views_count",
      header: "Views",
    },
    {
      accessorKey: "likes_count",
      header: "Likes",
    },
    {
      accessorKey: "published_at",
      header: "Published On",
      cell: ({ row }: any) => {
        const timestamp = row.original.published_at;
        if (!timestamp) return "N/A";
        return new Date(timestamp).toLocaleDateString();
      },
    },
    {
      accessorKey: "updated_at",
      header: "Modified On",
      cell: ({ row }: any) => {
        const timestamp = row.original.updated_at;
        if (!timestamp) return "N/A";
        return new Date(timestamp).toLocaleDateString();
      },
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
            <DropdownMenuItem asChild>
              <Link href={`/blog-management/view/${row.original.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Article
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/blog-management/edit/${row.original.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Article
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${row.original.heading}"?`)) {
                  // TODO: Implement delete functionality
                  console.log('Delete blog:', row.original.id);
                }
              }}
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete Article
            </DropdownMenuItem>
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