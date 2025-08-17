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
};
