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

export function Callout({ type = "info", children }: { type?: "info" | "warning"; children: React.ReactNode }) {
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
    { from: "Draft", to: "Published", admin: "Admin 1", date: "2024-01-15", reason: "Initial publish" }
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
      }
    }
    compile();
  }, [markdown]);

  // custom MDX components
  const mdxComponents = {
    h1: (props: any) => (
      <h1 className="text-3xl font-bold text-orange-600 mb-4" {...props} />
    ),
    h2: (props: any) => (
      <h2 className="text-2xl font-semibold text-blue-700 mb-3" {...props} />
    ),
    p: (props: any) => (
      <p className="text-base leading-relaxed mb-2" {...props} />
    ),
    code: ({ className, children }: any) => {
      return (
        <pre className="rounded-md bg-slate-800 text-slate-100 p-4 overflow-auto border border-slate-700">
          <code className={className}>{children}</code>
        </pre>
      );
    },
    Callout
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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

  return (
    <>
      {/* Action Buttons Header */}
      <div className="flex justify-between items-center py-4 px-6 border-b">
        <PageTitle>Add New Blog</PageTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={handlePublish}>Publish</Button>
        </div>
      </div>

      <PageWrapper>
        <div className="max-w-full mx-auto flex gap-6">
          {/* Left Column - Main Content (70%) */}
          <div className="w-[70%] space-y-6">
            {/* Blog Core */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Blog Content</h2>
              
              {/* Blog Title */}
              <div className="mb-4">
                <Label className="mb-2">Blog Title</Label>
                <Input
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  placeholder="Enter blog title..."
                />
              </div>

              {/* Sub Heading */}
              <div className="mb-4">
                <Label className="mb-2">Sub Heading</Label>
                <Input
                  value={subHeading}
                  onChange={(e) => setSubHeading(e.target.value)}
                  placeholder="Enter sub heading..."
                />
              </div>

              {/* Banner Image */}
              <div className="mb-4">
                <Label className="mb-2">Banner Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e: any) => setBannerImage(e.target.files?.[0] || null)}
                />
                {bannerImage && <p className="text-sm text-gray-600 mt-1">{bannerImage.name}</p>}
              </div>

              {/* Blog Body - Two Column Layout */}
              <div className="mb-4">
                <Label className="mb-2">Blog Body</Label>
                <div className="flex gap-4">
                  {/* Editor */}
                  <div className="w-1/2">
                    <Textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      className="h-[50vh] font-mono"
                      placeholder="Write markdown here..."
                    />
                  </div>
                  
                  {/* Preview */}
                  <div className="w-1/2">
                    <div className="prose max-w-full p-4 border rounded-md h-[50vh] overflow-auto bg-gray-50">
                      <MDXProvider components={mdxComponents}>
                        {CompiledMDX ? <CompiledMDX components={mdxComponents as any} /> : <p>Loading preview…</p>}
                      </MDXProvider>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <Label className="mb-2">Summary (Max 500 chars)</Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value.slice(0, 500))}
                  className="h-24"
                  placeholder="Brief description of the blog..."
                />
                <p className="text-sm text-gray-500 mt-1">{summary.length}/500 characters</p>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Meta Title (60 chars)</Label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value.slice(0, 60))}
                    placeholder="SEO title..."
                  />
                   <p className="text-sm text-gray-500">{metaTitle.length}/60</p>
                </div>
                
                <div>
                  <Label className="mb-2">Canonical URL</Label>
                  <Input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label className="mb-2">Meta Description (160 chars)</Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                  className="h-20"
                  placeholder="SEO description..."
                />
                <p className="text-sm text-gray-500">{metaDescription.length}/160</p>
              </div>

              <div className="mt-4">
                <Label className="mb-2">Meta Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e: any) => setMetaImage(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Settings (30%) */}
          <div className="w-[30%] space-y-6">
            {/* Blog Settings */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Blog Settings</h3>
              
              {/* Visibility Status */}
              <div className="mb-4">
                <Label className="mb-2">Visibility Status</Label>
                <Select value={visibility} onValueChange={(val) => setVisibility(val)}>
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

              {/* Tags */}
              <div className="mb-4">
                <Label className="mb-2">Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                  />
                  <Button onClick={addTag} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Created By */}
              <div className="mb-4">
                <Label className="mb-2">Created By</Label>
                <Input
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                />
              </div>

              {/* Audit Info */}
              <div className="mb-4">
                <Label className="mb-2">Audit Info</Label>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Created On: {new Date().toLocaleDateString()}</p>
                  <p>Last Updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Analytics (Read-only) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Analytics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span>Shares:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span>Popularity:</span>
                  <span>New</span>
                </div>
              </div>
            </div>

            {/* Audit History */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Audit History</h3>
              <div className="space-y-2">
                {auditHistory.map((entry, index) => (
                  <div key={index} className="text-sm border-b pb-2">
                    <p><strong>{entry.from}</strong> → <strong>{entry.to}</strong></p>
                    <p className="text-gray-600">By {entry.admin} on {entry.date}</p>
                    <p className="text-gray-500">{entry.reason}</p>
                  </div>
                ))}
              </div>
              
              {/* Change Visibility Form */}
              <div className="mt-4 pt-4 border-t">
                <Label className="mb-2">Change Reason</Label>
                <Textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="h-16 text-sm"
                  placeholder="Reason for status change..."
                />
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
