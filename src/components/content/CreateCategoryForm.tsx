import React from "react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { categoryService } from "@/src/services/category.service";

interface CreateCategoryFormProps {
  onClose: (open: boolean) => void;
  onSave?: () => void; // Callback after successful save
}

export default function CreateCategoryForm({ onClose, onSave }: CreateCategoryFormProps) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setLoading(true);
      
      // Call the real API using rewrites
      await categoryService.createCategory({ name: name.trim() });
      
      toast.success("Category created successfully");
      setName(""); // Reset form
      onClose(false);
      
      // Call save callback if provided
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error("Failed to create category:", error);
      
      // Extract specific error message
      let errorMessage = 'Failed to create category';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.errorDescription) {
        errorMessage = error.errorDescription;
      } else if (error?.errorCode) {
        errorMessage = `Error: ${error.errorCode}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
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
            disabled={loading}
          />
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
