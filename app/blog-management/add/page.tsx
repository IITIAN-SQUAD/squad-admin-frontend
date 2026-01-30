"use client";
import { useRouter } from "next/navigation";
import BlogForm from "@/src/components/blog/BlogForm";
import { blogService, CreateBlogRequest } from "@/src/services/blog.service";
import { BlogFormValues } from "@/src/types/blog";

export default function BlogAddPage() {
  const router = useRouter();

  const handleSubmit = async (data: BlogFormValues, quizQuestions: any[]) => {
    try {
      // Transform form data to match API structure
      const blogData: CreateBlogRequest = {
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

      console.log("Creating blog:", blogData);
      await blogService.createBlog(blogData);
      router.push("/blog-management");
    } catch (error) {
      console.error("Failed to create blog:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push("/blog-management");
  };

  return (
    <div className="container mx-auto py-6">
      <BlogForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
