"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2, GripVertical } from "lucide-react";
import { authorService, Author } from "@/src/services/author.service";
import { blogService, CreateBlogRequest, UpdateBlogRequest, BlogQuizQuestion, BlogOption } from "@/src/services/blog.service";
import { categoryService, Category } from "@/src/services/category.service";
import { BlogFormValues, QuizQuestion } from "@/src/types/blog";
import { MDXProvider } from "@mdx-js/react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning";
  children: React.ReactNode;
}) {
  const colors = {
    info: "bg-blue-100 text-blue-800 border-blue-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };
  return (
    <div className={`p-4 border-l-4 rounded ${colors[type]}`}>{children}</div>
  );
}

const BLOG_VISIBILITY = [
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "REJECTED", label: "Rejected" },
];

const blogFormSchema = z.object({
  heading: z.string().min(1, "Blog title is required"),
  sub_heading: z.string().optional(),
  banner_image: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  summary: z.string().min(1, "Summary is required"),
  body: z.string().min(1, "Content is required"),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  canonical_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  meta_image: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  blog_visibility_status: z.enum(["DRAFT", "UNDER_REVIEW", "PUBLISHED", "ARCHIVED", "REJECTED"]),
  author_id: z.string().min(1, "Author is required"),
  slug: z.string().min(1, "Slug is required"),
  category_id: z.string().min(1, "Category is required"),
  schema: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormProps {
  mode: "create" | "edit";
  initialData?: Partial<BlogFormValues>;
  initialQuizQuestions?: QuizQuestion[];
  onSubmit: (data: BlogFormValues, quizQuestions: QuizQuestion[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function BlogForm({
  mode,
  initialData,
  initialQuizQuestions = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BlogFormProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [CompiledMDX, setCompiledMDX] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(initialQuizQuestions);
  const [leftPaneWidth, setLeftPaneWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialMarkdown = `# Welcome

Type markdown on the left and see preview on the right.

- Bullet lists
- **Bold**
- _Italic_

\`\`\`js
console.log("code block")
\`\`\`
`;

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      heading: initialData?.heading || "",
      sub_heading: initialData?.sub_heading || "",
      banner_image: initialData?.banner_image || "",
      summary: initialData?.summary || "",
      body: initialData?.body || initialMarkdown,
      meta_title: initialData?.meta_title || "",
      meta_description: initialData?.meta_description || "",
      canonical_url: initialData?.canonical_url || "",
      meta_image: initialData?.meta_image || "",
      blog_visibility_status: initialData?.blog_visibility_status || "DRAFT",
      author_id: initialData?.author_id || "",
      slug: initialData?.slug || "",
      category_id: initialData?.category_id || "",
      schema: initialData?.schema || [],
      tags: initialData?.tags || [],
    },
  });

  const blogTitle = form.watch("heading");
  const subHeading = form.watch("sub_heading");
  const summary = form.watch("summary");
  const markdown = form.watch("body");
  const bannerImageLink = form.watch("banner_image");
  const metaTitleFromForm = form.watch("meta_title");
  const metaDescriptionFromForm = form.watch("meta_description");
  const metaImageLinkFromForm = form.watch("meta_image");

  useEffect(() => {
    async function compile() {
      try {
        const code = await evaluate(markdown || "", {
          ...runtime,
          remarkPlugins: [],
          rehypePlugins: [],
        });
        setCompiledMDX(() => code.default);
      } catch (err) {
        console.error("MDX compile error:", err);
        setCompiledMDX(null);
      }
    }
    compile();
  }, [markdown]);

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const response = await authorService.getAllAuthors();
        setAuthors(response);
      } catch (error) {
        console.error("Failed to fetch authors:", error);
      } finally {
        setLoadingAuthors(false);
      }
    }

    fetchAuthors();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await categoryService.getAllCategories();
        setCategories(response.category_response_dto_list);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  const mdxComponents: any = {
    Callout,
  };

  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      text: "",
      options: [
        { label: "A", option_text: "" },
        { label: "B", option_text: "" },
        { label: "C", option_text: "" },
        { label: "D", option_text: "" }
      ],
      correct_answer_label: "A",
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const updateQuizQuestion = (id: string, field: keyof QuizQuestion, value: any) => {
    setQuizQuestions(quizQuestions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateQuizOption = (questionId: string, optionIndex: number, field: keyof BlogOption, value: string) => {
    setQuizQuestions(quizQuestions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeQuizQuestion = (id: string) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== id));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftPaneWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const addTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    if (tag && !currentTags.includes(tag)) {
      form.setValue("tags", [...currentTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter((t: string) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const values = form.getValues();
      await onSubmit(values, quizQuestions);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {mode === "create" ? "Create New Blog" : "Edit Article"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "create" ? "Write and publish your blog post" : "Modify your blog post"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || isSubmitting}>
            {saving || isSubmitting ? "Saving..." : mode === "create" ? "Save" : "Update"}
          </Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex gap-0 relative flex-1 overflow-hidden"
      >
        <div 
          className="overflow-y-auto pr-4"
          style={{ width: `${leftPaneWidth}%` }}
        >
          <div className="space-y-6 pr-6 pb-6">
            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
                <CardDescription>Enter the main content for your blog post</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="heading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blog Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter blog title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sub_heading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub Heading</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter sub heading..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="banner_image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/banner.jpg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            <span>Enter the URL for the banner image.</span>
                            <span className="block mt-1 text-blue-600">Test URLs:</span>
                            <span className="block text-xs text-gray-600">
                              • General: https://picsum.photos/800/400<br />
                              • Unsplash: https://source.unsplash.com/800x400/?nature,water<br />
                              • Unsplash ID: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800
                            </span>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blog Body (Markdown)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Type markdown content here..."
                              className="min-h-[300px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="summary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Summary</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter article summary..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blog Settings</CardTitle>
                <CardDescription>Configure blog metadata and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="blog_visibility_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BLOG_VISIBILITY.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="author_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select author" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {loadingAuthors ? (
                                  <SelectItem value="loading" disabled>
                                    Loading authors...
                                  </SelectItem>
                                ) : (
                                  authors.map((author) => (
                                    <SelectItem key={author.id} value={author.id}>
                                      {author.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="blog-post-slug"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Unique identifier for the blog URL</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loadingCategories ? (
                                <SelectItem value="loading" disabled>
                                  Loading categories...
                                </SelectItem>
                              ) : categories.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  No categories available
                                </SelectItem>
                              ) : (
                                categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>Choose a category for the blog</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schema"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schema Types</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Article, EducationalContent"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Comma-separated schema types</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize your blog for search engines</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="meta_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title</FormLabel>
                          <FormControl>
                            <Input placeholder="SEO meta title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="meta_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="SEO meta description..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canonical_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canonical URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/blog/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="meta_image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/meta-image.jpg" {...field} />
                          </FormControl>
                          <FormDescription>Enter the URL for the meta image</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Add tags to categorize your blog</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a tag..."
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTag(e.currentTarget.value);
                                    e.currentTarget.value = "";
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder="Add a tag..."]') as HTMLInputElement;
                                  if (input) {
                                    addTag(input.value);
                                    input.value = "";
                                  }
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {field.value.map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz Questions</CardTitle>
                <CardDescription>Add quiz questions to engage your readers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quizQuestions.map((question, qIndex) => (
                    <Card key={question.id || qIndex} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Question {qIndex + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuizQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <Input
                            placeholder="Enter question..."
                            value={question.text}
                            onChange={(e) => updateQuizQuestion(question.id, "text", e.target.value)}
                          />
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Options</label>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <Input
                                  placeholder={`Option ${option.label}`}
                                  value={option.option_text}
                                  onChange={(e) => updateQuizOption(question.id, oIndex, "option_text", e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant={question.correct_answer_label === option.label ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateQuizQuestion(question.id, "correct_answer_label", option.label)}
                                >
                                  Correct
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuizQuestion}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quiz Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          className="w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex items-center justify-center flex-shrink-0"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>

        <div 
          className="overflow-y-auto pl-4"
          style={{ width: `${100 - leftPaneWidth}%` }}
        >
          <div className="sticky top-0 pb-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bannerImageLink ? (
                    <div className="relative">
                      <img
                        src={bannerImageLink}
                        alt="Banner preview"
                        className="w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          const imageUrl = bannerImageLink;
                          console.error('Banner preview failed to load:', imageUrl);
                          
                          // Specific Unsplash error handling
                          if (imageUrl?.includes('unsplash')) {
                            console.warn('Unsplash image failed - this might be due to:');
                            console.warn('1. Missing Unsplash API key for certain endpoints');
                            console.warn('2. Rate limiting by Unsplash');
                            console.warn('3. Invalid Unsplash image ID or format');
                            console.warn('Try using: https://source.unsplash.com/800x400/?nature,water');
                          }
                          
                          e.currentTarget.style.display = 'none';
                          // Show fallback after error
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                            const errorText = fallback.querySelector('p');
                            if (errorText) {
                              errorText.textContent = imageUrl?.includes('unsplash') 
                                ? 'Unsplash image failed to load' 
                                : 'Image failed to load';
                            }
                          }
                        }}
                        onLoad={() => {
                          console.log('Banner preview loaded successfully:', bannerImageLink);
                        }}
                      />
                      <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                        <div className="text-center">
                          <div className="text-2xl mb-1">🖼️</div>
                          <p className="text-sm">Image failed to load</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-2xl mb-1">🖼️</div>
                        <p className="text-sm">No banner image</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      {blogTitle || "Blog Title"}
                    </h1>
                    {subHeading && (
                      <p className="text-sm text-gray-600 mb-4">{subHeading}</p>
                    )}
                    {summary && (
                      <p className="text-base text-gray-700 mb-4">{summary}</p>
                    )}
                  </div>
                  
                  <div className="prose max-w-none">
                    <MDXProvider components={mdxComponents}>
                      {CompiledMDX ? (
                        <CompiledMDX components={mdxComponents as any} />
                      ) : (
                        <p>Live preview will appear here…</p>
                      )}
                    </MDXProvider>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-2">SEO Preview</h3>
                    <p className="text-sm font-medium">
                      {metaTitleFromForm || blogTitle || "Meta title preview"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {metaDescriptionFromForm || summary || "Meta description preview"}
                    </p>
                    {metaImageLinkFromForm && (
                      <img
                        src={metaImageLinkFromForm}
                        alt="Meta image preview"
                        className="w-full h-32 object-cover rounded-md mt-2"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
