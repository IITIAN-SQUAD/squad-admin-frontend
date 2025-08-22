"use client";
import React, { useState } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { EditorContent, EditorRoot } from "novel";
import { Button } from "@/components/ui/button";
import {defaultExtensions} from '@/src/components/novel/extensions'

export default function BlogAddPage() {
  const [title, setTitle] = useState('');
   const [content, setContent] = useState<any>(undefined);

  return (
    <>
      <PageHeader title="Add Blog" />
      <PageWrapper>
        <PageTitle>Add New Blog</PageTitle>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Blog Title"
              className="w-full text-3xl font-bold border-none outline-none mb-4 bg-background placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="border rounded-lg overflow-hidden">
          <EditorRoot>
            <EditorContent
              initialContent={undefined}
              onUpdate={({ editor }) => {
                const json = editor.getJSON();
                setContent(json);
              }}
              extensions={defaultExtensions}
            />
          </EditorRoot>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline">Save Draft</Button>
            <Button>Publish</Button>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
