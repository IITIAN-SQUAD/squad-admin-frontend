import React from "react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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
  const [query, setQuery] = React.useState("");

  const toggle = (id: string | number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedItems = React.useMemo(
    () => articles.filter(a => selected[a.id]),
    [articles, selected]
  );

  const filteredArticles = React.useMemo(() => {
    if (!query.trim()) return articles;
    const q = query.toLowerCase();
    return articles.filter(a => a.title.toLowerCase().includes(q));
  }, [articles, query]);

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
            <div className="text-xs text-muted-foreground">Type to search and select articles</div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="text-sm">
                  {selectedItems.length > 0
                    ? selectedItems.map(i => i.title).slice(0, 3).join(", ") + (selectedItems.length > 3 ? ` +${selectedItems.length - 3}` : "")
                    : "Select articles"}
                </span>
                <span className="text-xs text-muted-foreground">{selectedItems.length > 0 ? `${selectedItems.length} selected` : ""}</span>
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-[320px] p-2">
              <div className="space-y-2">
                <Input
                  placeholder="Search articles..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="mb-2"
                  autoFocus
                />
                <div className="flex flex-col gap-2 max-h-48 overflow-auto">
                  {filteredArticles.map((a) => (
                    <label key={a.id} className="flex items-center gap-3 px-2 py-1 rounded hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selected[a.id]}
                        onChange={() => toggle(a.id)}
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm">{a.title}</span>
                    </label>
                  ))}
                  {filteredArticles.length === 0 && (
                    <div className="text-sm text-muted-foreground px-2">No articles match your search</div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </form>
    </>
  );
}
