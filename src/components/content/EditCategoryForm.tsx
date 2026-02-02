import React, { useState, useEffect } from "react";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { categoryService, Exam, Category } from "@/src/services/category.service";

interface EditCategoryFormProps {
  category: Category;
  onClose: (open: boolean) => void;
  onSave?: () => void; // Callback after successful save
}

export default function EditCategoryForm({ category, onClose, onSave }: EditCategoryFormProps) {
  const [name, setName] = useState(category.name);
  const [displayName, setDisplayName] = useState(category.display_name || "");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(category.exam_ids || []);
  const [loading, setLoading] = useState(false);

  // Fetch exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsData = await categoryService.getAllExams();
        setExams(examsData);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
        // Still show the form even if exams fail to load
        toast.warning('Could not load exams. You can still update the category without exams.');
      }
    };
    fetchExams();
  }, []);

  const handleExamChange = (examId: string, checked: boolean) => {
    if (checked) {
      setSelectedExamIds(prev => [...prev, examId]);
    } else {
      setSelectedExamIds(prev => prev.filter(id => id !== examId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    try {
      setLoading(true);
      
      // Call the real API using rewrites
      await categoryService.updateCategory(category.id, { 
        name: name.trim(),
        display_name: displayName.trim(),
        exam_ids: selectedExamIds 
      });
      
      toast.success("Category updated successfully");
      onClose(false);
      
      // Call save callback if provided
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error("Failed to update category:", error);
      
      // Extract specific error message
      let errorMessage = 'Failed to update category';
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
        <DialogTitle>Edit Category</DialogTitle>
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

        <div className="space-y-2">
          <Label>Associated Exams</Label>
          <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
            {exams.length === 0 ? (
              <p className="text-sm text-gray-500">
                No exams available. You can update the category without exams and add them later.
              </p>
            ) : (
              exams.map((exam) => (
                <div key={exam.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={exam.id}
                    checked={selectedExamIds.includes(exam.id)}
                    onCheckedChange={(checked) => handleExamChange(exam.id, checked as boolean)}
                    disabled={loading}
                  />
                  <Label 
                    htmlFor={exam.id} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {exam.name}
                  </Label>
                </div>
              ))
            )}
          </div>
          {selectedExamIds.length === 0 && (
            <p className="text-xs text-gray-500">Select at least one exam (optional)</p>
          )}
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
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
