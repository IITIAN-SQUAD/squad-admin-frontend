"use client";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { Button } from "@/components/ui/button";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { BlogListingTable } from "@/src/components/table/blog-listing-table";
import {
  Plus,
  Eye,
  ThumbsUp,
  MessageSquare,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import React from "react";

// Dummy data for demonstration
const blogList = [
  {
    srNo: 1,
    heading: "How to prepare for IIT",
    bannerImage: "/blog1.jpg",
    createdOn: "2024-06-01",
    visibility: "Published",
    createdBy: "John Doe",
    id: 1,
    views: 1240,
    likes: 120,
    comments: 18,
  },
  {
    srNo: 2,
    heading: "Math shortcuts",
    bannerImage: "/blog2.jpg",
    createdOn: "2024-06-05",
    visibility: "Draft",
    createdBy: "Jane Smith",
    id: 2,
    views: 430,
    likes: 40,
    comments: 6,
  },
  {
    srNo: 3,
    heading: "Top programming languages for engineers",
    bannerImage: "/blog3.jpg",
    createdOn: "2024-05-20",
    visibility: "Published",
    createdBy: "Amit Kumar",
    id: 3,
    views: 980,
    likes: 86,
    comments: 12,
  },
  {
    srNo: 4,
    heading: "Time management tips for competitive exams",
    bannerImage: "/blog4.jpg",
    createdOn: "2024-04-15",
    visibility: "Published",
    createdBy: "Priya Patel",
    id: 4,
    views: 670,
    likes: 54,
    comments: 9,
  },
  {
    srNo: 5,
    heading: "Understanding Physics: Core concepts",
    bannerImage: "/blog5.jpg",
    createdOn: "2024-03-30",
    visibility: "Draft",
    createdBy: "Ravi Singh",
    id: 5,
    views: 310,
    likes: 28,
    comments: 4,
  },
  {
    srNo: 6,
    heading: "Chemistry tricks: Memorize the periodic table",
    bannerImage: "/blog6.jpg",
    createdOn: "2024-02-10",
    visibility: "Published",
    createdBy: "Neha Verma",
    id: 6,
    views: 540,
    likes: 63,
    comments: 11,
  },
  {
    srNo: 7,
    heading: "Interview preparation: Dos and Don'ts",
    bannerImage: "/blog7.jpg",
    createdOn: "2024-01-25",
    visibility: "Published",
    createdBy: "Suman Rao",
    id: 7,
    views: 720,
    likes: 77,
    comments: 15,
  },
  {
    srNo: 8,
    heading: "Study routines that actually work",
    bannerImage: "/blog8.jpg",
    createdOn: "2023-12-18",
    visibility: "Draft",
    createdBy: "Karan Mehta",
    id: 8,
    views: 255,
    likes: 22,
    comments: 3,
  },
];

export default function BlogManagementPage() {
  const totalViews = blogList.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalLikes = blogList.reduce((sum, b) => sum + (b.likes || 0), 0);
  const totalComments = blogList.reduce((sum, b) => sum + (b.comments || 0), 0);

  // previous week heuristic: previous = 90% of current per-item
  const prevViewsTotal = blogList.reduce(
    (sum, b) => sum + Math.round((b.views || 0) * 0.9),
    0
  );
  const prevLikesTotal = blogList.reduce(
    (sum, b) => sum + Math.round((b.likes || 0) * 0.9),
    0
  );
  const prevCommentsTotal = blogList.reduce(
    (sum, b) => sum + Math.round((b.comments || 0) * 0.9),
    0
  );

  const viewsDelta = totalViews - prevViewsTotal;
  const likesDelta = totalLikes - prevLikesTotal;
  const commentsDelta = totalComments - prevCommentsTotal;

  // refined comparison UI used as right-aligned children
  const Comparison = ({ delta, prev }: { delta: number; prev: number }) => {
    const positive = delta >= 0;
    const pct = prev > 0 ? Math.round((delta / prev) * 100) : 0;
    return (
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
            positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
          aria-hidden
        >
          {positive ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
          <span className="font-semibold">{positive ? `+${delta}` : `${delta}`}</span>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              positive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {prev > 0 ? `${positive ? "+" : ""}${pct}%` : "—"}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Prev: {prev}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader title={"Blog Management"} />
      <div className="p-8">
        <div className="flex justify-between">
          <PageTitle>Blog Management</PageTitle>
          <Button
            className="hover:cursor-pointer focus:ring-yellow-500 focus:ring-3 focus:ring-offset-2"
            asChild
          >
            <Link href={"/blog-management/add"}>
              <span>
                <Plus />
              </span>
              Create Blog
            </Link>
          </Button>
        </div>
        <Section className="space-y-4">
          <div>
            <SectionHeader>Analytics</SectionHeader>
            <div className="flex gap-6 items-start">
              <AnalyticsCard
                iconPlacement="top"
                childrenPlacement="right"
                size="sm"
                title="Cumulative Views"
                value={totalViews}
                icon={<Eye />}
                explanation="Total number of page views across all listed blogs."
              >
                <Comparison delta={viewsDelta} prev={prevViewsTotal} />
              </AnalyticsCard>

              <AnalyticsCard
                iconPlacement="top"
                childrenPlacement="right"
                size="sm"
                title="Cumulative Likes"
                value={totalLikes}
                icon={<ThumbsUp />}
                explanation="Total likes received across all listed blogs."
              >
                <Comparison delta={likesDelta} prev={prevLikesTotal} />
              </AnalyticsCard>

              <AnalyticsCard
                iconPlacement="top"
                childrenPlacement="right"
                size="sm"
                title="Cumulative Comments"
                value={totalComments}
                icon={<MessageSquare />}
                explanation="Total number of comments across all listed blogs."
              >
                <Comparison delta={commentsDelta} prev={prevCommentsTotal} />
              </AnalyticsCard>
            </div>
          </div>
          <div>
            <Link
              href="/blog-management/analytics"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Detailed Analytics
            </Link>
          </div>
        </Section>
        <Section>
          <SectionHeader>Blog Listing</SectionHeader>
          <BlogListingTable
            data={blogList}
            searchPlaceholder="Search blogs..."
          />
        </Section>
      </div>
    </>
  );
}
