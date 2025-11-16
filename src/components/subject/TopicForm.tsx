"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { topicSchema, TopicFormData } from "@/src/schemas/exam";
import { Topic } from "@/src/types/exam";

interface TopicFormProps {
  initialData?: Topic;
  subjectId: string;
  parentTopicId?: string;
  onSubmit: (data: Omit<Topic, "id" | "createdAt" | "updatedAt">) => void;
}

export default function TopicForm({ 
  initialData, 
  subjectId, 
  parentTopicId,
  onSubmit 
}: TopicFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      subjectId: subjectId,
      parentTopicId: parentTopicId || initialData?.parentTopicId,
      order: initialData?.order || 0,
      difficulty: initialData?.difficulty || "medium",
      tags: initialData?.tags || [],
    },
  });

  const difficulty = watch("difficulty");

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      const newTags = [...tags, currentTag.trim()];
      setTags(newTags);
      setValue("tags", newTags);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onFormSubmit = (data: TopicFormData) => {
    onSubmit({
      name: data.name,
      description: data.description,
      subjectId: data.subjectId,
      parentTopicId: data.parentTopicId,
      hierarchyPath: [], // Will be built by backend
      order: data.order,
      difficulty: data.difficulty,
      tags: tags,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Topic Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Kinematics, Thermodynamics, Calculus"
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
            placeholder="Brief description of the topic"
            className="mt-1"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="difficulty">Difficulty Level *</Label>
            <Select
              value={difficulty}
              onValueChange={(value: "easy" | "medium" | "hard") => setValue("difficulty", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Easy
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Medium
                  </div>
                </SelectItem>
                <SelectItem value="hard">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Hard
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.difficulty && (
              <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>
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
        </div>

        <div>
          <Label htmlFor="tags">Tags</Label>
          <div className="mt-1">
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag (press Enter)"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {parentTopicId && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              This topic will be created as a sub-topic under the selected parent.
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
          {isSubmitting ? "Saving..." : initialData ? "Update Topic" : "Create Topic"}
        </Button>
      </div>
    </form>
  );
}
