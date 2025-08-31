import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { ServerDataTable } from "@/src/components/ui/server-data-table";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import { Mail, User, FileText } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AuthorBlogTable } from "@/src/components/table/author-blog-table";


// Dummy data for the author
const dummyAuthor = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  description: "John is an experienced writer with expertise in technology and science topics. He has been writing for over 10 years and has published numerous articles in reputable journals.",
  avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  addedBy: "Admin User",
  associatedBlogs: 5,
};

// Dummy data for associated blogs
const dummyBlogs = [
  {
    srNo: 1,
    id: "blog1",
    heading: "Introduction to React Hooks",
    bannerImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1470&auto=format&fit=crop",
    categories: ["React", "JavaScript", "Web Development"],
    associatedBy: "Admin User",
  },
  {
    srNo: 2,
    id: "blog2",
    heading: "Advanced TypeScript Patterns",
    bannerImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1470&auto=format&fit=crop",
    categories: ["TypeScript", "JavaScript", "Programming"],
    associatedBy: "Super Admin",
  },
  {
    srNo: 3,
    id: "blog3",
    heading: "Building Scalable APIs with Node.js",
    bannerImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1470&auto=format&fit=crop",
    categories: ["Node.js", "API", "Backend"],
    associatedBy: "Admin User",
  },
];

// Server-side data fetching functions
async function getAuthorData(id: string) {
  // In a real application, you would fetch this data from an API or database
  console.log("Server-side fetching author with ID:", id);
  
  // For now, return dummy data
  // In a real app, this would be something like:
  // const res = await fetch(`${process.env.API_URL}/authors/${id}`, { cache: 'no-store' });
  // if (!res.ok) throw new Error('Failed to fetch author');
  // return res.json();
  
  return dummyAuthor;
}

async function getAuthorBlogs(id: string) {
  // In a real application, you would fetch this data from an API or database
  console.log("Server-side fetching blogs for author with ID:", id);
  
  // For now, return dummy data
  // In a real app, this would be something like:
  // const res = await fetch(`${process.env.API_URL}/authors/${id}/blogs`, { cache: 'no-store' });
  // if (!res.ok) throw new Error('Failed to fetch author blogs');
  // return res.json();
  
  return dummyBlogs;
}

export default async function AuthorDetailPage({ params }: { params: { id: string } }) {
  // Server-side data fetching
  const id = params.id;
  const author = await getAuthorData(id);
  const blogs = await getAuthorBlogs(id);

  return (
    <>
      <PageHeader title={`Author Details`} />
      <PageWrapper>
        <PageTitle>{author.name}</PageTitle>
        
        <Section>
          <SectionHeader>Author Details</SectionHeader>
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="flex-grow space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-gray-600">{author.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email</h4>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{author.email}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Added By</h4>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{author.addedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section>
          <SectionHeader>Analytics</SectionHeader>
          <div className="flex gap-6">
            <AnalyticsCard title="Associated Blogs" value={blogs.length} icon={<FileText />} />
          </div>
        </Section>

        <Section>
          <SectionHeader>Associated Blogs</SectionHeader>
          <AuthorBlogTable
            blogs={blogs}
          />
        </Section>
      </PageWrapper>
    </>
  );
}
