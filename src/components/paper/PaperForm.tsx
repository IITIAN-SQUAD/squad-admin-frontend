"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paperSchema, PaperFormData } from "@/src/schemas/exam";
import { Paper, Exam } from "@/src/types/exam";

interface PaperFormProps {
  initialData?: Paper;
  exams: Exam[];
  onSubmit: (data: Omit<Paper, "id" | "createdAt" | "updatedAt" | "sections">) => void;
}

export default function PaperForm({ initialData, exams, onSubmit }: PaperFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaperFormData>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      name: initialData?.name || "",
      examId: initialData?.examId || "",
      date: initialData?.date || new Date(),
      totalQuestions: initialData?.totalQuestions || 0,
      totalMarks: initialData?.totalMarks || 0,
      duration: initialData?.duration || 3600, // 1 hour default
    },
  });

  const examId = watch("examId");

  const formatDurationForInput = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const parseDurationFromInput = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 3600) + (minutes * 60);
  };

  const onFormSubmit = (data: PaperFormData) => {
    onSubmit({
      name: data.name,
      examId: data.examId,
      date: data.date,
      totalQuestions: data.totalQuestions,
      totalMarks: data.totalMarks,
      duration: data.duration,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Paper Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., JEE Main 2024 - Paper 1"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="examId">Exam *</Label>
          <Select value={examId} onValueChange={(value) => setValue("examId", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select an exam" />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.examId && (
            <p className="text-red-500 text-sm mt-1">{errors.examId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Exam Date *</Label>
          <Input
            id="date"
            type="date"
            {...register("date", { 
              setValueAs: (value) => value ? new Date(value) : new Date() 
            })}
            className="mt-1"
            defaultValue={initialData?.date?.toISOString().split('T')[0]}
          />
          {errors.date && (
            <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalQuestions">Total Questions *</Label>
            <Input
              id="totalQuestions"
              type="number"
              {...register("totalQuestions", { valueAsNumber: true })}
              placeholder="90"
              className="mt-1"
              min="1"
            />
            {errors.totalQuestions && (
              <p className="text-red-500 text-sm mt-1">{errors.totalQuestions.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="totalMarks">Total Marks *</Label>
            <Input
              id="totalMarks"
              type="number"
              {...register("totalMarks", { valueAsNumber: true })}
              placeholder="300"
              className="mt-1"
              min="1"
            />
            {errors.totalMarks && (
              <p className="text-red-500 text-sm mt-1">{errors.totalMarks.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="duration">Duration (HH:MM) *</Label>
          <Input
            id="duration"
            type="time"
            className="mt-1"
            defaultValue={formatDurationForInput(initialData?.duration || 3600)}
            onChange={(e) => {
              const seconds = parseDurationFromInput(e.target.value);
              setValue("duration", seconds);
            }}
          />
          {errors.duration && (
            <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Set the total duration for the paper
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
        <p className="text-sm text-blue-800">
          After creating the paper, you can add sections and questions using the "Edit Structure" button.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Paper" : "Create Paper"}
        </Button>
      </div>
    </form>
  );
}
