import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Section } from "@/src/components/Section";
import { SectionHeader } from "@/src/components/SectionHeader";
import { AnalyticsCard } from "@/src/components/AnalyticsCard";
import { Mail, User, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";

// Types for author and blog data
interface Blog {
  id: string;
  heading: string;
  banner_image: string;
  category: string;
  created_at: string;
  visibility: string;
}

interface AuthorDetail {
  id: string;
  name: string;
  email: string;
  description: string;
  profile_picture: string;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
  associated_blogs: number;
  blogs: Blog[];
  current_page: number;
  page_size: number;
  total_pages: number;
}

// Server-side data fetching functions
async function getAuthorData(id: string, page: number = 1, size: number = 10): Promise<AuthorDetail> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    const apiUrl = `${backendUrl}/v0/admin/blog/author/${id}?page=${page}&size=${size}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch author');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch author:', error);
    notFound();
  }
}

// Avatar component that handles both data URLs and external images
function AuthorAvatar({ name, profilePicture }: { name: string; profilePicture?: string }) {
  if (profilePicture?.startsWith('data:')) {
    // Use Next.js Image for data URLs (generated avatars)
    return (
      <Image
        src={profilePicture}
        alt={name}
        width={120}
        height={120}
        className="rounded-full object-cover"
      />
    );
  } else if (profilePicture) {
    // Use regular img tag for external URLs
    return (
      <img
        src={profilePicture}
        alt={name}
        width={120}
        height={120}
        className="rounded-full object-cover"
        onError={(e) => {
          // Fallback to initials on error
          const target = e.target as HTMLImageElement;
          const initials = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
          
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
          const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
          
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.fallback-avatar')) {
            const fallback = document.createElement('div');
            fallback.className = `fallback-avatar w-[120px] h-[120px] rounded-full object-cover flex items-center justify-center text-white font-bold text-xl ${colors[colorIndex]}`;
            fallback.textContent = initials;
            parent.appendChild(fallback);
          }
        }}
      />
    );
  } else {
    // No avatar - show initials
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
    
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    return (
      <div className={`w-[120px] h-[120px] rounded-full object-cover flex items-center justify-center text-white font-bold text-xl ${colors[colorIndex]}`}>
        {initials}
      </div>
    );
  }
}

// Blog card component
function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex gap-4">
          {blog.banner_image && (
            <div className="shrink-0">
              <img
                src={blog.banner_image}
                alt={blog.heading}
                width={80}
                height={60}
                className="rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{blog.heading}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Badge variant={blog.visibility === 'PUBLISHED' ? 'default' : 'secondary'}>
                {blog.visibility}
              </Badge>
              <Badge variant="outline">{blog.category}</Badge>
              <span>{new Date(blog.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AuthorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  // Get pagination params from URL
  const { id } = await params;
  const { page = '1', size = '10' } = await searchParams;
  
  const currentPage = parseInt(page, 10);
  const pageSize = parseInt(size, 10);
  
  // Server-side data fetching with pagination
  const authorData = await getAuthorData(id, currentPage, pageSize);

  return (
    <>
      <PageHeader title={`Author Details`} />
      <PageWrapper>
        <PageTitle>{authorData.name}</PageTitle>
        
        <Section>
          <SectionHeader>Author Details</SectionHeader>
          <Card className="max-w-3xl">
            <CardContent>
              <div className="flex gap-6">
                <div className="shrink-0">
                  <AuthorAvatar 
                    name={authorData.name}
                    profilePicture={authorData.profile_picture}
                  />
                </div>
                <div className="grow space-y-[21px]">
                  <div className="space-y-[9px]">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <p className="text-gray-600 text-sm leading-[150%]">
                      {authorData.description || 'No description provided'}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <div className="grow">
                      <h4 className="text-sm font-medium text-gray-500">Email</h4>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{authorData.email}</span>
                      </div>
                    </div>
                    <Separator orientation="vertical" />
                    <div className="grow">
                      <h4 className="text-sm font-medium text-gray-500">Added By</h4>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{authorData.created_by_admin_id || 'Unknown'}</span>
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
            <AnalyticsCard 
              title="Associated Blogs" 
              className="max-w-3xl" 
              value={authorData.associated_blogs} 
              icon={<FileText />} 
            />
            <AnalyticsCard 
              title="Total Pages" 
              className="max-w-3xl" 
              value={authorData.total_pages} 
              icon={<FileText />} 
            />
          </div>
        </Section>

        <Section>
          <SectionHeader>Author's Blogs ({authorData.associated_blogs})</SectionHeader>
          
          {authorData.blogs.length > 0 ? (
            <>
              <div className="space-y-4">
                {authorData.blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
              
              {/* Pagination */}
              {authorData.total_pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing page {authorData.current_page} of {authorData.total_pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={authorData.current_page <= 1}
                      asChild
                    >
                      <Link href={`/author-management/${id}?page=${authorData.current_page - 1}&size=${pageSize}`}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={authorData.current_page >= authorData.total_pages}
                      asChild
                    >
                      <Link href={`/author-management/${id}?page=${authorData.current_page + 1}&size=${pageSize}`}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs found</h3>
              <p className="text-gray-600">This author hasn't published any blogs yet.</p>
            </div>
          )}
        </Section>
      </PageWrapper>
    </>
  );
}
