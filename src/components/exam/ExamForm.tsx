"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { examSchema, ExamFormData } from "@/src/schemas/exam";
import { Exam } from "@/src/types/exam";
import hierarchyService, { HierarchyNode } from "@/src/services/hierarchy.service";

interface ExamFormProps {
  initialData?: Exam;
  onSubmit: (data: Omit<Exam, "id" | "createdAt" | "updatedAt">) => void;
}

const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "Singapore",
];

export default function ExamForm({ initialData, onSubmit }: ExamFormProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialData?.countries || []
  );
  const [subjects, setSubjects] = useState<HierarchyNode[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialData?.subject_ids || []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      countries: initialData?.countries || [],
      metadata: initialData?.metadata || [{ key: "", value: "" }],
    },
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await hierarchyService.getAllSubjects();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, []);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "metadata",
  });

  const handleCountryToggle = (country: string) => {
    const newCountries = selectedCountries.includes(country)
      ? selectedCountries.filter((c) => c !== country)
      : [...selectedCountries, country];
    
    setSelectedCountries(newCountries);
    setValue("countries", newCountries);
  };

  const handleSubjectToggle = (subjectId: string) => {
    const newSubjects = selectedSubjects.includes(subjectId)
      ? selectedSubjects.filter((id) => id !== subjectId)
      : [...selectedSubjects, subjectId];
    
    setSelectedSubjects(newSubjects);
  };

  const onFormSubmit = (data: ExamFormData) => {
    onSubmit({
      name: data.name,
      description: data.description,
      countries: selectedCountries,
      subject_ids: selectedSubjects,
      metadata: data.metadata.filter(m => m.key && m.value),
      status: initialData?.status || 'DRAFT',
    } as any);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Exam Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., JEE Main 2024"
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
            placeholder="Brief description of the exam"
            className="mt-1"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Countries */}
      <div>
        <Label>Countries *</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {COUNTRY_OPTIONS.map((country) => (
            <label key={country} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCountries.includes(country)}
                onChange={() => handleCountryToggle(country)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{country}</span>
            </label>
          ))}
        </div>
        {errors.countries && (
          <p className="text-red-500 text-sm mt-1">{errors.countries.message}</p>
        )}
      </div>

      {/* Subjects */}
      <div>
        <Label>Subjects</Label>
        <p className="text-sm text-gray-500 mb-2">Select subjects for this exam</p>
        <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
          {subjects.length === 0 && (
            <p className="text-sm text-gray-400 col-span-2">No subjects available. Create subjects first.</p>
          )}
          {subjects.map((subject) => (
            <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSubjects.includes(subject.id)}
                onChange={() => handleSubjectToggle(subject.id)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">{subject.code}</span>
              <span className="text-xs text-gray-500">- {subject.name}</span>
            </label>
          ))}
        </div>
        {selectedSubjects.length > 0 && (
          <p className="text-xs text-gray-600 mt-1">{selectedSubjects.length} subject(s) selected</p>
        )}
      </div>

      {/* Metadata */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <Label>Metadata (Key-Value Pairs)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ key: "", value: "" })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Metadata
          </Button>
        </div>
        
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  {...register(`metadata.${index}.key`)}
                  placeholder="Key (e.g., conducting_body)"
                />
                {errors.metadata?.[index]?.key && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.metadata[index]?.key?.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <Input
                  {...register(`metadata.${index}.value`)}
                  placeholder="Value (e.g., NTA)"
                />
                {errors.metadata?.[index]?.value && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.metadata[index]?.value?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Exam" : "Create Exam"}
        </Button>
      </div>
    </form>
  );
}
