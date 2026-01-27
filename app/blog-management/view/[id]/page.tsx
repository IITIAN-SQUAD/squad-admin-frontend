"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, Eye, ThumbsUp, MessageSquare } from "lucide-react";
import Link from "next/link";
import { blogService, Blog } from "@/src/services/blog.service";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleViewPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const blogId = params.id as string;
        
        const blogData = await blogService.getBlogById(blogId);
        console.log('Blog data:', blogData);
        setBlog(blogData);
      } catch (err) {
        setError("Failed to load article");
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBlog();
    }
  }, [params.id]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading article...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || !blog) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "The requested article could not be found."}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant={blog.blog_visibility_status === "PUBLISHED" ? "default" : "secondary"}>
              {blog.blog_visibility_status}
            </Badge>
            <Badge variant="outline">{blog.category?.name || 'Uncategorized'}</Badge>
          </div>
        </div>
        <PageTitle>{blog.heading}</PageTitle>
        {blog.sub_heading && (
          <p className="text-sm text-gray-600 mt-2">{blog.sub_heading}</p>
        )}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {blog.author?.name || 'Unknown Author'}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(blog.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {blog.views_count} views
            <span className="mx-2">•</span>
            {blog.likes_count} likes
            <span className="mx-2">•</span>
            {blog.comments_count} comments
          </div>
        </div>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            {/* Banner Image */}
            {blog.banner_image ? (
              <div className="mb-6">
                <img
                  src={blog.banner_image}
                  alt={blog.heading}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    const imageUrl = blog.banner_image;
                    console.error('Banner image failed to load:', imageUrl);
                    
                    // Specific Unsplash error handling
                    if (imageUrl?.includes('unsplash')) {
                      console.warn('Unsplash image failed - this might be due to:');
                      console.warn('1. Missing Unsplash API key for certain endpoints');
                      console.warn('2. Rate limiting by Unsplash');
                      console.warn('3. Invalid Unsplash image ID or format');
                    }
                    
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Banner image loaded successfully:', blog.banner_image);
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg mb-6 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p>No banner image</p>
                </div>
              </div>
            )}

            {/* Article Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{blog.heading}</h1>
              {blog.sub_heading && (
                <p className="text-xl text-gray-600 mb-4">{blog.sub_heading}</p>
              )}
            </div>

            {/* Summary */}
            {blog.summary && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Summary</h3>
                <p className="text-gray-700">{blog.summary}</p>
              </div>
            )}

            {/* Article Body - Markdown Rendering */}
            <div className="prose prose-lg max-w-none mb-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {blog.body}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Questions */}
        {blog.quiz_questions && blog.quiz_questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quiz Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {blog.quiz_questions.map((quiz, index) => (
                  <div key={quiz.id || index} className="border-b pb-4 last:border-b-0">
                    <p className="font-medium text-lg mb-3">
                      {index + 1}. {quiz.text}
                    </p>
                    <div className="space-y-2 ml-4">
                      {quiz.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            quiz.correct_answer_label === option.label
                              ? "bg-green-50 border-green-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <span className="font-semibold">{option.label}.</span>{" "}
                          {option.option_text}
                          {quiz.correct_answer_label === option.label && (
                            <Badge className="ml-2" variant="default">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Information */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-600">Meta Title</p>
                <p className="text-base">{blog.meta_title || blog.heading}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Meta Description</p>
                <p className="text-base">{blog.meta_description || blog.summary}</p>
              </div>
              {blog.canonical_url && (
                <div>
                  <p className="text-sm font-semibold text-gray-600">Canonical URL</p>
                  <p className="text-base text-blue-600">{blog.canonical_url}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Article Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                <p>Created: {new Date(blog.created_at).toLocaleString()}</p>
                <p>Last Updated: {new Date(blog.updated_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/blog-management/edit/${blog.id}`}>
                  <Button variant="outline" size="sm">Edit Article</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
