"use client";
import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
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

  return (
    <>
      <PageHeader title="Add Blog" />
      <PageWrapper>
        <PageTitle>Add New Blog</PageTitle>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Editor */}
          <div className="w-full lg:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markdown Editor
            </label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-[60vh] min-h-[300px] p-4 border rounded-md resize-none font-mono bg-white dark:bg-slate-900 dark:text-slate-200"
              placeholder="Write markdown here..."
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {markdown.length} characters
              </span>
              <Button onClick={() => setMarkdown("")}>Clear</Button>
            </div>
          </div>

          {/* Preview */}
          <div className="w-full lg:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="prose max-w-full p-4 border rounded-md h-[60vh] min-h-[300px] overflow-auto bg-white dark:bg-slate-900 dark:text-slate-200">
              <MDXProvider components={mdxComponents}>
                {CompiledMDX ? <CompiledMDX components={mdxComponents as any} /> : <p>Loading preview…</p>}
              </MDXProvider>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
