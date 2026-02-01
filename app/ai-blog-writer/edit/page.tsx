"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import BlogForm from "@/src/components/blog/BlogForm";
import PageWrapper from "@/src/components/page/page-wrapper";
import PageHeader from "@/src/components/page/page-header";
import { blogService } from "@/src/services/blog.service";
import { BlogFormValues } from "@/src/types/blog";
import { GeneratedBlogWithMetadata } from "@/src/services/ai-blog-generator.service";

function EditAIBlogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blogData, setBlogData] = useState<GeneratedBlogWithMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Retrieve blog data from sessionStorage using the ID
    const blogId = searchParams.get('id');
    if (blogId) {
      try {
        const storedData = sessionStorage.getItem(blogId);
        if (storedData) {
          const parsed = JSON.parse(storedData) as GeneratedBlogWithMetadata;
          setBlogData(parsed);
          // Clean up sessionStorage after retrieving
          sessionStorage.removeItem(blogId);
        } else {
          toast.error('Blog data not found. Please try again.');
        }
      } catch (error) {
        console.error('Failed to parse blog data:', error);
        toast.error('Failed to load blog data');
      }
    } else {
      toast.error('No blog ID provided');
    }
  }, [searchParams]);

  const handleSubmit = async (data: BlogFormValues, quizQuestions: any[]) => {
    try {
      setIsSubmitting(true);

      // Transform form data to match API structure
      const blogPayload = {
        heading: data.heading,
        sub_heading: data.sub_heading || "",
        banner_image: data.banner_image || "",
        body: data.body,
        summary: data.summary,
        quiz_questions: quizQuestions.map(q => ({
          text: q.text,
          options: q.options,
          correct_answer_label: q.correct_answer_label
        })),
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        meta_image: data.meta_image || "",
        canonical_url: data.canonical_url || "",
        schema: data.schema.length > 0 ? data.schema[0].split(',').map(s => s.trim()) : [],
        slug: data.slug,
        tags: Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim()),
        blog_visibility_status: data.blog_visibility_status,
        author_id: data.author_id,
        category_id: data.category_id,
      };

      await blogService.createBlog(blogPayload);
      
      toast.success('Blog published successfully!');
      
      // Close this tab and notify parent
      window.opener?.postMessage({ type: 'blog-published' }, '*');
      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to publish blog:', error);
      toast.error(error.message || 'Failed to publish blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      window.close();
    }
  };

  if (!blogData) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-yellow-500" />
            <p className="text-gray-600">Loading blog data...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader title="Edit AI Generated Blog" />
      <div className="p-8">
        <BlogForm
          mode="create"
          initialData={{
            heading: blogData.heading,
            sub_heading: blogData.sub_heading,
            banner_image: blogData.banner_image,
            body: blogData.body,
            summary: blogData.summary,
            meta_title: blogData.meta_title,
            meta_description: blogData.meta_description,
            canonical_url: blogData.canonical_url || "",
            meta_image: blogData.meta_image || "",
            blog_visibility_status: blogData.blog_visibility_status,
            author_id: blogData.author_id,
            slug: blogData.slug,
            category_id: blogData.category_id,
            schema: blogData.schema || [],
            tags: blogData.tags || []
          }}
          initialQuizQuestions={(blogData.quiz_questions || []).map((q, index) => ({
            id: `question-${index}-${Date.now()}`,
            text: q.text,
            options: q.options,
            correct_answer_label: q.correct_answer_label
          }))}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </PageWrapper>
  );
}

export default function EditAIBlogPage() {
  return (
    <Suspense fallback={
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
        </div>
      </PageWrapper>
    }>
      <EditAIBlogContent />
    </Suspense>
  );
}
