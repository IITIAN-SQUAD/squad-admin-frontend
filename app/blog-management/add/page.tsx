"use client";
import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
// replace plain inputs with shadcn inputs
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MDXProvider } from "@mdx-js/react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useForm, Controller } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function Callout({
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
    <div className={`border-l-4 p-3 my-4 rounded ${colors[type]}`}>
      {children}
    </div>
  );
}

// Action buttons as separate component
function ActionButtons({
  onCancel,
  onSaveDraft,
  onPublish,
}: {
  onCancel: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="outline" onClick={onSaveDraft}>
        Save Draft
      </Button>
      <Button onClick={onPublish}>Publish</Button>
    </div>
  );
}

// add LayoutToggle component
function LayoutToggle({
  layout,
  onChange,
}: {
  layout: "horizontal" | "vertical";
  onChange: (l: "horizontal" | "vertical") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("horizontal")}
        aria-label="Horizontal layout"
        title="Horizontal layout"
        className={`inline-flex items-center justify-center p-2 rounded-md ${
          layout === "horizontal"
            ? "bg-muted text-foreground"
            : "hover:bg-muted/50"
        }`}
      >
        {/* Horizontal icon: three horizontal bars */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="3" rx="1" />
          <rect x="3" y="10.5" width="12" height="3" rx="1" />
          <rect x="3" y="16" width="18" height="3" rx="1" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => onChange("vertical")}
        aria-label="Vertical layout"
        title="Vertical layout"
        className={`inline-flex items-center justify-center p-2 rounded-md ${
          layout === "vertical"
            ? "bg-muted text-foreground"
            : "hover:bg-muted/50"
        }`}
      >
        {/* Vertical icon: three vertical bars */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="3" width="3" height="18" rx="1" />
          <rect x="10.5" y="3" width="3" height="12" rx="1" />
          <rect x="16" y="3" width="3" height="18" rx="1" />
        </svg>
      </button>
    </div>
  );
}

export default function BlogAddPage() {
  // Blog Settings States
  const [visibility, setVisibility] = useState("draft");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [createdBy, setCreatedBy] = useState("Admin User");

  // SEO States
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaImage, setMetaImage] = useState<File | null>(null);
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Audit States
  const [auditHistory] = useState([
    {
      from: "Draft",
      to: "Published",
      admin: "Admin 1",
      date: "2024-01-15",
      reason: "Initial publish",
    },
  ]);
  const [changeReason, setChangeReason] = useState("");

  // initial markdown content
  const initialMarkdown = `# Welcome

Type markdown on the left and see preview on the right.

- Bullet lists
- **Bold**
- _Italic_

\`\`\`js
console.log("code block")
\`\`\`
`;

  const [CompiledMDX, setCompiledMDX] = useState<any>(null);

  // add a form instance seeded from local state (use the initial markdown)
  const form = useForm({
    defaultValues: {
      blogTitle: "",
      subHeading: "",
      summary: "",
      markdown: initialMarkdown,
      bannerImage: null,
      // added SEO defaults
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      metaImage: null,
    },
  });

  // read values from form state
  const blogTitle = form.watch("blogTitle");
  const subHeading = form.watch("subHeading");
  const summary = form.watch("summary");
  const markdown = form.watch("markdown");
  const bannerImage = form.watch("bannerImage") as File | null;
  const metaTitleFromForm = form.watch("metaTitle");
  const metaDescriptionFromForm = form.watch("metaDescription");
  const canonicalUrlFromForm = form.watch("canonicalUrl");
  const metaImageFromForm = form.watch("metaImage") as File | null;

  // compile MDX when markdown changes
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
        setCompiledMDX(() => null);
      }
    }
    compile();
  }, [markdown]);

  // custom MDX components
  const mdxComponents = {
    Callout,
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSaveDraft = () => {
    console.log("Saving as draft...");
  };

  const handlePublish = () => {
    console.log("Publishing blog...");
  };

  const handleCancel = () => {
    console.log("Navigating back...");
  };

  // layout state for toggling horizontal / vertical
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");

  // preview derived values (use bannerImage from form)
  const previewBannerUrl = useMemo(() => {
    if (!bannerImage) return null;
    return URL.createObjectURL(bannerImage);
  }, [bannerImage]);

  useEffect(() => {
    return () => {
      // revoke preview URL on unmount/when banner changes
      if (previewBannerUrl) URL.revokeObjectURL(previewBannerUrl);
    };
  }, [previewBannerUrl]);

  return (
    <>
      {/* Top header: use PageHeader component and action buttons to the right */}
      <PageHeader title="Add Blog" />

      <PageWrapper>
        {/* header row: PageTitle + layout toggle on left, actions on right */}
        <div className="flex justify-between items-center pb-8">
          <div className="flex items-center gap-4">
            <PageTitle disableMargin>Add Blog</PageTitle>

            {/* layout toggle placed beside title */}
            <LayoutToggle layout={layout} onChange={setLayout} />
          </div>

          <ActionButtons
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
          />
        </div>

        {/* main container switches between row/column based on layout */}
        <div
          className={`max-w-full mx-auto flex gap-6 ${
            layout === "vertical" ? "flex-col-reverse" : "flex-row"
          }`}
        >
          {/* Left: Forms */}
          <div
            className={
              layout === "vertical" ? "grow space-y-6" : "grow space-y-6"
            }
          >
            {/* Blog Core (REFACTORED to use shadcn Form + react-hook-form) */}
            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
              </CardHeader>

              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(() => {
                      /* local submit intentionally no-op; saving handled by action buttons */
                    })}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="blogTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blog Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              // use form state; no local setState
                              onChange={(e: any) => field.onChange(e)}
                              placeholder="Enter blog title..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subHeading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub Heading</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e: any) => field.onChange(e)}
                              placeholder="Enter sub heading..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Banner Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e: any) => {
                            const file = e.target.files?.[0] || null;
                            // store file in the form state
                            form.setValue("bannerImage", file);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      {bannerImage && (
                        <p className="text-sm text-gray-600 mt-1">
                          {bannerImage.name}
                        </p>
                      )}
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="markdown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blog Body (Markdown)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              onChange={(e: any) => field.onChange(e)}
                              className="h-[40vh] font-mono"
                              placeholder="Write markdown here..."
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
                          <FormLabel>Summary (Max 500 chars)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              onChange={(e: any) => {
                                const val = e.target.value.slice(0, 500);
                                field.onChange(val);
                              }}
                              className="h-24"
                              placeholder="Brief description of the blog..."
                            />
                          </FormControl>
                          <p className="text-sm text-gray-500 mt-1">
                            {summary.length}/500 characters
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title (60 chars)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value}
                            onChange={(e: any) => {
                              const val = e.target.value.slice(0, 60);
                              field.onChange(val);
                              setMetaTitle(val);
                            }}
                            placeholder="SEO title..."
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          {(metaTitle || metaTitleFromForm || "").length}/60
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canonical URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value}
                            type="url"
                            onChange={(e: any) => {
                              field.onChange(e);
                              setCanonicalUrl(e.target.value);
                            }}
                            placeholder="https://..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Meta Description (160 chars)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value}
                            onChange={(e: any) => {
                              const val = e.target.value.slice(0, 160);
                              field.onChange(val);
                              setMetaDescription(val);
                            }}
                            className="h-20"
                            placeholder="SEO description..."
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          {
                            (metaDescription || metaDescriptionFromForm || "")
                              .length
                          }
                          /160
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Meta Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e: any) => {
                          const file = e.target.files?.[0] || null;
                          form.setValue("metaImage", file);
                          setMetaImage(file);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {metaImage && (
                      <p className="text-sm text-gray-600 mt-1">
                        {metaImage.name}
                      </p>
                    )}
                  </FormItem>
                </Form>
              </CardContent>
            </Card>

            {/* Blog Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Blog Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label className="mb-2">Visibility Status</Label>
                  <Select
                    value={visibility}
                    onValueChange={(val: any) => setVisibility(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e: any) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                    />
                    <Button onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Created By</Label>
                  <Input
                    value={createdBy}
                    onChange={(e: any) => setCreatedBy(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Audit Info</Label>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Created On: {new Date().toLocaleDateString()}</p>
                    <p>Last Updated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Label className="mb-2">Change Reason</Label>
                  <Textarea
                    value={changeReason}
                    onChange={(e: any) => setChangeReason(e.target.value)}
                    className="h-16 text-sm"
                    placeholder="Reason for status change..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div
            className={
              layout === "vertical"
                ? "space-y-6 prose grow items-stretch max-w-[100vw]"
                : "space-y-6 prose items-start h-fit grow"
            }
          >
            <Card className="h-full overflow-auto">
              <CardContent>
                <div className="mb-4">
                  {previewBannerUrl ? (
                    <img
                      src={previewBannerUrl}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-500">
                      Banner preview
                    </div>
                  )}
                  <h1 className="text-2xl font-bold">
                    {blogTitle || "Blog Title"}
                  </h1>
                  {subHeading && (
                    <p className="text-sm text-gray-600 mb-2">{subHeading}</p>
                  )}
                  {summary && (
                    <p className="text-base text-gray-700 mb-4">{summary}</p>
                  )}
                  <div className="prose">
                    <MDXProvider components={mdxComponents}>
                      {CompiledMDX ? (
                        <CompiledMDX components={mdxComponents as any} />
                      ) : (
                        <p>Live preview will appear here…</p>
                      )}
                    </MDXProvider>
                  </div>
                </div>

                {/* Optional: SEO preview / meta summary */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2">SEO Preview</h3>
                  <p className="text-sm font-medium">
                    {metaTitle || blogTitle || "Meta title preview"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {metaDescription || summary || "Meta description preview"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
