"use client";
import { TABLE_COLUMNS } from "@/assets/constants/table-columns";
import { Button } from "@/components/ui/button";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { BlogListingTable } from "@/src/components/table/blog-listing-table";
import { Plus, Eye, Heart, MessageCircle, ThumbsUp, MessageSquare } from "lucide-react";
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
	const totalComments = blogList.reduce(
		(sum, b) => sum + (b.comments || 0),
		0
	);

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
				<Section>
					<SectionHeader>Analytics</SectionHeader>
					<div className="flex gap-6">
						<AnalyticsCard
							title="Cumulative Views"
							value={totalViews}
							icon={<Eye />}
						/>
						<AnalyticsCard
							title="Cumulative Likes"
							value={totalLikes}
							icon={<ThumbsUp />}
						/>
						<AnalyticsCard
							title="Cumulative Comments"
							value={totalComments}
							icon={<MessageSquare />}
						/>
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
