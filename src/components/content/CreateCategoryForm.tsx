import React from "react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Article {
  id: string | number;
  title: string;
}

interface CreateCategoryFormProps {
  articles: Article[];
  onClose: (open: boolean) => void;
}

export default function CreateCategoryForm({ articles, onClose }: CreateCategoryFormProps) {
  const [name, setName] = React.useState("");
  const [selected, setSelected] = React.useState<Record<string | number, boolean>>({});

  const toggle = (id: string | number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedArticles = articles.filter(a => selected[a.id]);
    // TODO: replace with API call
    console.log("Create Category:", { name, selectedArticles });
    onClose(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Category</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="category-name">Category Name</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter category name"
            required
          />
        </div>

        <div>
          <div className="mb-2">
            <Label>Associate Articles</Label>
            <div className="text-xs text-muted-foreground">Select one or more articles to attach</div>
          </div>
          <div className="max-h-48 overflow-auto border rounded p-2 space-y-2">
            {articles.map((a) => (
              <label key={a.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selected[a.id]}
                  onChange={() => toggle(a.id)}
                  className="rounded"
                />
                <span className="text-sm">{a.title}</span>
              </label>
            ))}
            {articles.length === 0 && <div className="text-sm text-muted-foreground">No articles available</div>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </form>
    </>
  );
}
