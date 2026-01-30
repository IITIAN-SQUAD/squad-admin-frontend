"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import BlogForm from "@/src/components/blog/BlogForm";
import { blogService, Blog, BlogQuizQuestion } from "@/src/services/blog.service";
import { BlogFormValues } from "@/src/types/blog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const blogId = params.id as string;
        
        const blogData = await blogService.getBlogById(blogId);
        setBlog(blogData);
      } catch (err) {
        console.error("Failed to fetch blog:", err);
        setError("Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [params.id]);

  const handleSubmit = async (data: BlogFormValues, quizQuestions: any[]) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus({ type: null, message: '' });
      
      // Transform form data to match API structure
      const updateData = {
        heading: data.heading,
        sub_heading: data.sub_heading || "",
        banner_image: data.banner_image || "",
        body: data.body,
        summary: data.summary,
        quiz_questions: quizQuestions.map(q => ({
          id: q.id,
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
        blog_visibility_status: data.blog_visibility_status,
        category_id: data.category_id,
        author_id: data.author_id,
        tags: data.tags
      };

      await blogService.updateBlog(params.id as string, updateData);
      
      // Show success message but stay on the same page
      setSubmitStatus({
        type: 'success',
        message: 'Blog updated successfully!'
      });
      
      // Optionally refresh the blog data to show latest changes
      const updatedBlog = await blogService.getBlogById(params.id as string);
      setBlog(updatedBlog);
      
    } catch (error: any) {
      console.error('Failed to update blog:', error);
      
      // Extract meaningful error message from API response
      let errorMessage = 'Failed to update blog';
      
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data.error_description || data.message || 'Bad request - Please check your input';
        } else if (status === 401) {
          errorMessage = 'Unauthorized - Please login again';
        } else if (status === 403) {
          errorMessage = 'Forbidden - You do not have permission to update this blog';
        } else if (status === 404) {
          errorMessage = 'Blog not found';
        } else if (status >= 500) {
          errorMessage = 'Server error - Please try again later';
        } else {
          errorMessage = data.error_description || data.message || `Error ${status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/blog-management");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-96">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "The requested article could not be found."}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Link href={`/blog-management/view/${blog.id}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Article
          </Button>
        </Link>
      </div>
      
      {/* Success/Error Messages */}
      {submitStatus.type && (
        <Alert className={`mb-6 ${
          submitStatus.type === 'success' 
            ? 'border-green-200 bg-green-50 text-green-800' 
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {submitStatus.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {submitStatus.message}
          </AlertDescription>
        </Alert>
      )}
      
      <BlogForm
        mode="edit"
        initialData={{
          heading: blog.heading,
          sub_heading: blog.sub_heading,
          banner_image: blog.banner_image,
          summary: blog.summary,
          body: blog.body,
          meta_title: blog.meta_title,
          meta_description: blog.meta_description,
          canonical_url: blog.canonical_url,
          meta_image: blog.meta_image,
          blog_visibility_status: blog.blog_visibility_status,
          author_id: blog.author.id,
          slug: blog.slug,
          category_id: blog.category.id,
          schema: blog.schema,
          tags: blog.tags.map(tag => tag.name)
        }}
        initialQuizQuestions={(blog.quiz_questions || []).map((q, index) => ({
          ...q,
          id: q.id || `question-${index}-${Date.now()}`
        }))}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
