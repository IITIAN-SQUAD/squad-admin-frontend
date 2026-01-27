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
import React, { useState, useEffect, useCallback } from "react";
import { blogService, BlogListItem, BlogFilterRequest, OverallAnalytics } from "@/src/services/blog.service";

// Remove dummy data as we're now using real API
// const blogList = [...];

export default function BlogManagementPage() {
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<{
    searchText?: string;
    status?: string;
    category?: string;
  }>({});

  // Fetch blogs with filters - using useCallback to prevent infinite loops
  const fetchBlogs = useCallback(async (filters: BlogFilterRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogService.filterBlogs(filters);
      setBlogs(response.blogs);
      setAnalytics(response.overall_analytics);
      
      // Update current filters to persist in UI
      setCurrentFilters({
        searchText: filters.search_text,
        status: filters.visibility_status,
        category: filters.category_id,
      });
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBlogs({ page: 0, size: 20 });
  }, [fetchBlogs]);

  const totalViews = analytics?.cumulative_views || 0;
  const totalLikes = analytics?.cumulative_likes || 0;
  const totalComments = analytics?.cumulative_comments || 0;

  const prevViewsTotal = analytics?.previous_month_views || 0;
  const prevLikesTotal = analytics?.previous_month_likes || 0;
  const prevCommentsTotal = analytics?.previous_month_comments || 0;

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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p>Loading blogs...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <BlogListingTable
              data={blogs}
              loading={loading}
              onFiltersChange={fetchBlogs}
              currentFilters={currentFilters}
            />
          )}
        </Section>
      </div>
    </>
  );
}
