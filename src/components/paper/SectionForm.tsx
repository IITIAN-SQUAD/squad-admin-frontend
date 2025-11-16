"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { paperSectionSchema, PaperSectionFormData } from "@/src/schemas/exam";
import { PaperSection, SectionGuidelines } from "@/src/types/exam";
import { MarkdownEditor } from "@/src/components/ui/markdown-editor";

interface SectionFormProps {
  initialData?: PaperSection;
  paperId: string;
  parentSectionId?: string;
  onSubmit: (data: Omit<PaperSection, "id" | "createdAt" | "updatedAt" | "questions">) => void;
}

export default function SectionForm({ 
  initialData, 
  paperId, 
  parentSectionId,
  onSubmit 
}: SectionFormProps) {
  const [guidelines, setGuidelines] = useState<SectionGuidelines>({
    id: initialData?.guidelines?.id || "",
    instructions: initialData?.guidelines?.instructions || "",
    markingScheme: "",
    specialInstructions: ""
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaperSectionFormData>({
    resolver: zodResolver(paperSectionSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      paperId: paperId,
      parentSectionId: parentSectionId || initialData?.parentSectionId,
      duration: initialData?.duration || undefined,
      order: initialData?.order || 0,
    },
  });


  const onFormSubmit = (data: PaperSectionFormData) => {
    // Convert minutes to seconds for backend storage
    const durationInSeconds = data.duration ? data.duration * 60 : undefined;
    
    onSubmit({
      ...data,
      duration: durationInSeconds,
      guidelines: guidelines
    } as any);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Section Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Physics, Mathematics, Section A"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Brief description of the section"
            className="mt-1"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>


        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (Minutes)</Label>
            <Input
              id="duration"
              type="number"
              {...register("duration", { valueAsNumber: true })}
              placeholder="45"
              className="mt-1"
              defaultValue={initialData?.duration ? Math.floor(initialData.duration / 60) : ""}
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional: Set time limit in minutes for this section
            </p>
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              {...register("order", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1"
              min="0"
            />
            {errors.order && (
              <p className="text-red-500 text-sm mt-1">{errors.order.message}</p>
            )}
          </div>
        </div>

        {parentSectionId && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              This section will be created as a sub-section under the selected parent.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="instructions">Section Instructions</Label>
        <MarkdownEditor
          value={guidelines.instructions}
          onChange={(value) => setGuidelines({...guidelines, instructions: value})}
          placeholder="Enter section instructions, marking scheme, and any special notes..."
          minHeight="120px"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Section" : "Create Section"}
        </Button>
      </div>
    </form>
  );
}
