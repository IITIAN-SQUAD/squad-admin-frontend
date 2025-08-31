"use client"

import React from "react";
import {DataTable_Search} from "../ui/data-table-search";
import { ColumnDef } from "@tanstack/react-table";
import { AUTHOR_BLOGS_COLUMNS } from "@/assets/constants/table-columns";

interface AuthorBlog {
  srNo: number;
  id: string;
  heading: string;
  bannerImage: string;
  categories: string[];
  associatedBy: string;
}

interface AuthorBlogTableProps {
  blogs: AuthorBlog[];
}

export function AuthorBlogTable({ blogs }: AuthorBlogTableProps) {
  return (
    <DataTable_Search
      columns={AUTHOR_BLOGS_COLUMNS}
      data={blogs}
      searchPlaceholder="Search blogs..."
    />
  );
}
