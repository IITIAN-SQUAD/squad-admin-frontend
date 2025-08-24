"use client";
import React, { useState, useEffect, useMemo } from "react";
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

export default function BlogAddPage() {
  // Blog Core States
  const [blogTitle, setBlogTitle] = useState("");
  const [subHeading, setSubHeading] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [summary, setSummary] = useState("");

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

  const [markdown, setMarkdown] = useState<string>(() => {
    return `# Welcome

Type markdown on the left and see preview on the right.

- Bullet lists
- **Bold**
- _Italic_

\`\`\`js
console.log("code block")
\`\`\`
`;
  });

  const [CompiledMDX, setCompiledMDX] = useState<any>(null);

  // compile MDX when markdown changes
  useEffect(() => {
    async function compile() {
      try {
        const code = await evaluate(markdown, {
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

  // preview derived values
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
        <div className="flex justify-between items-center mb-4">
          <PageTitle disableMargin>Add Blog</PageTitle>

          <ActionButtons
            onCancel={handleCancel}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
          />
        </div>

        <div className="max-w-full mx-auto flex gap-6">
          {/* Left: Forms (50%) */}
          <div className="w-1/2 space-y-6">
            {/* Blog Core */}
            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label className="mb-2">Blog Title</Label>
                  <Input
                    value={blogTitle}
                    onChange={(e: any) => setBlogTitle(e.target.value)}
                    placeholder="Enter blog title..."
                  />
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Sub Heading</Label>
                  <Input
                    value={subHeading}
                    onChange={(e: any) => setSubHeading(e.target.value)}
                    placeholder="Enter sub heading..."
                  />
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Banner Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e: any) =>
                      setBannerImage(e.target.files?.[0] || null)
                    }
                  />
                  {bannerImage && (
                    <p className="text-sm text-gray-600 mt-1">
                      {bannerImage.name}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Blog Body (Markdown)</Label>
                  <Textarea
                    value={markdown}
                    onChange={(e: any) => setMarkdown(e.target.value)}
                    className="h-[40vh] font-mono"
                    placeholder="Write markdown here..."
                  />
                </div>

                <div className="mb-4">
                  <Label className="mb-2">Summary (Max 500 chars)</Label>
                  <Textarea
                    value={summary}
                    onChange={(e: any) =>
                      setSummary(e.target.value.slice(0, 500))
                    }
                    className="h-24"
                    placeholder="Brief description of the blog..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {summary.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">Meta Title (60 chars)</Label>
                    <Input
                      value={metaTitle}
                      onChange={(e: any) =>
                        setMetaTitle(e.target.value.slice(0, 60))
                      }
                      placeholder="SEO title..."
                    />
                    <p className="text-sm text-gray-500">{metaTitle.length}/60</p>
                  </div>

                  <div>
                    <Label className="mb-2">Canonical URL</Label>
                    <Input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e: any) => setCanonicalUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="mb-2">Meta Description (160 chars)</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e: any) =>
                      setMetaDescription(e.target.value.slice(0, 160))
                    }
                    className="h-20"
                    placeholder="SEO description..."
                  />
                  <p className="text-sm text-gray-500">
                    {metaDescription.length}/160
                  </p>
                </div>

                <div className="mt-4">
                  <Label className="mb-2">Meta Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e: any) =>
                      setMetaImage(e.target.files?.[0] || null)
                    }
                  />
                </div>
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

          {/* Right: Preview (50%) */}
          <div className="w-1/2 space-y-6 prose">
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
