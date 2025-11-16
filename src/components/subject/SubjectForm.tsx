"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { subjectSchema, SubjectFormData } from "@/src/schemas/exam";
import { Subject } from "@/src/types/exam";

interface SubjectFormProps {
  initialData?: Subject;
  examId: string;
  parentSubjectId?: string;
  onSubmit: (data: Omit<Subject, "id" | "createdAt" | "updatedAt">) => void;
}

export default function SubjectForm({ 
  initialData, 
  examId, 
  parentSubjectId,
  onSubmit 
}: SubjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      examId: examId,
      parentSubjectId: parentSubjectId || initialData?.parentSubjectId,
      order: initialData?.order || 0,
    },
  });

  const onFormSubmit = (data: SubjectFormData) => {
    onSubmit({
      name: data.name,
      description: data.description,
      examId: data.examId,
      parentSubjectId: data.parentSubjectId,
      order: data.order,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Subject Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Physics, Mathematics, Mechanics"
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
            placeholder="Brief description of the subject"
            className="mt-1"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
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

        {parentSubjectId && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              This subject will be created as a sub-subject under the selected parent.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Subject" : "Create Subject"}
        </Button>
      </div>
    </form>
  );
}
