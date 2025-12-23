"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Eye, Edit3 } from "lucide-react";
import { questionSchema, QuestionFormData } from "@/src/schemas/exam";
import { Question } from "@/src/types/exam";

interface QuestionEditorProps {
  initialData?: Question;
  sectionId: string;
  onSubmit: (data: Omit<Question, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

export default function QuestionEditor({ 
  initialData, 
  sectionId, 
  onSubmit,
  onCancel 
}: QuestionEditorProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [previewHtml, setPreviewHtml] = useState(initialData?.htmlContent || "");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      description: initialData?.description || "",
      htmlContent: initialData?.htmlContent || "",
      options: initialData?.options || [
        { label: "A", value: "", isCorrect: false },
        { label: "B", value: "", isCorrect: false },
        { label: "C", value: "", isCorrect: false },
        { label: "D", value: "", isCorrect: false },
      ],
      correctAnswers: initialData?.correctAnswers || [],
      positiveMarks: initialData?.positiveMarks || 4,
      negativeMarks: initialData?.negativeMarks || -1,
      duration: initialData?.duration || undefined,
      difficulty: initialData?.difficulty || 5,
      tags: initialData?.tags || [],
      topicId: initialData?.topicId || "",
      sectionId: sectionId,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const watchedOptions = watch("options");
  const watchedDescription = watch("description");
  const watchedHtmlContent = watch("htmlContent");
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

  const updateCorrectAnswers = (optionIndex: number, isCorrect: boolean) => {
    const option = watchedOptions?.[optionIndex];
    if (!option) return;

    const currentCorrect = watch("correctAnswers") || [];
    let newCorrectAnswers;

    if (isCorrect) {
      newCorrectAnswers = [...currentCorrect, option.label];
    } else {
      newCorrectAnswers = currentCorrect.filter(answer => answer !== option.label);
    }

    setValue("correctAnswers", newCorrectAnswers);
  };

  const generatePreview = () => {
    const html = `
      <div class="question-preview p-6 bg-white rounded-lg border">
        <div class="question-content mb-4">
          <h3 class="text-lg font-semibold mb-2">Question</h3>
          <div class="prose max-w-none">
            ${watchedHtmlContent || watchedDescription || "No question content yet..."}
          </div>
        </div>
        
        <div class="options-content">
          <h4 class="text-md font-medium mb-3">Options:</h4>
          <div class="space-y-2">
            ${(watchedOptions || []).map((option, index) => `
              <div class="flex items-center p-3 border rounded-lg ${option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'}">
                <span class="font-medium mr-3">${option.label})</span>
                <span>${option.value || 'Option not set'}</span>
                ${option.isCorrect ? '<span class="ml-auto text-green-600 text-sm font-medium">✓ Correct</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="question-meta mt-4 pt-4 border-t">
          <div class="flex gap-4 text-sm text-gray-600">
            <span>Marks: +${watch("positiveMarks")} / ${watch("negativeMarks")}</span>
            <span>Difficulty: ${difficulty || 5}/10</span>
            ${watch("duration") ? `<span>Duration: ${watch("duration")}s</span>` : ''}
          </div>
        </div>
      </div>
    `;
    setPreviewHtml(html);
  };

  React.useEffect(() => {
    generatePreview();
  }, [watchedDescription, watchedHtmlContent, watchedOptions, difficulty]);

  const onFormSubmit = (data: any) => {
    onSubmit({
      type: 'single_choice_mcq',
      description: data.description,
      htmlContent: data.htmlContent || data.description,
      options: data.options || [],
      correctAnswers: data.correctAnswers || [],
      positiveMarks: data.positiveMarks,
      negativeMarks: data.negativeMarks,
      duration: data.duration,
      difficulty: data.difficulty,
      tags: tags,
      topicId: data.topicId,
      sectionId: data.sectionId,
      content: {
        question: { raw: data.description, html: data.htmlContent || data.description, plainText: data.description, assets: [] },
        hints: { raw: '', html: '', plainText: '', assets: [] },
        solution: { raw: '', html: '', plainText: '', assets: [] }
      },
      assets: [],
    });
  };

  return (
    <div className="h-full">
      <Tabs defaultValue="editor" className="h-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Question Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter the question text..."
                  className="mt-1"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="htmlContent">HTML Content (Optional)</Label>
                <Textarea
                  id="htmlContent"
                  {...register("htmlContent")}
                  placeholder="Enter HTML content for rich formatting, equations, etc..."
                  className="mt-1 font-mono text-sm"
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use HTML for mathematical equations, formatting, images, etc.
                </p>
              </div>

              {/* Options */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Answer Options *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ 
                      label: String.fromCharCode(65 + fields.length), 
                      value: "", 
                      isCorrect: false 
                    })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="w-16">
                        <Input
                          {...register(`options.${index}.label`)}
                          placeholder="A"
                          className="text-center font-medium"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          {...register(`options.${index}.value`)}
                          placeholder="Option text"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register(`options.${index}.isCorrect`)}
                            onChange={(e) => updateCorrectAnswers(index, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Correct</span>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 2}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring and Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="positiveMarks">Positive Marks *</Label>
                  <Input
                    id="positiveMarks"
                    type="number"
                    {...register("positiveMarks", { valueAsNumber: true })}
                    placeholder="4"
                    className="mt-1"
                    min="0"
                    step="0.25"
                  />
                </div>

                <div>
                  <Label htmlFor="negativeMarks">Negative Marks *</Label>
                  <Input
                    id="negativeMarks"
                    type="number"
                    {...register("negativeMarks", { valueAsNumber: true })}
                    placeholder="-1"
                    className="mt-1"
                    max="0"
                    step="0.25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level (1-10) *</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="range"
                      id="difficulty"
                      min="1"
                      max="10"
                      value={difficulty || 5}
                      onChange={(e) => setValue("difficulty", parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <div className={`w-3 h-3 rounded-full ${
                        (difficulty || 5) <= 3 ? 'bg-green-500' :
                        (difficulty || 5) <= 6 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium text-lg">{difficulty || 5}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                    placeholder="120"
                    className="mt-1"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="topicId">Topic ID</Label>
                <Input
                  id="topicId"
                  {...register("topicId")}
                  placeholder="Enter topic ID"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Associate this question with a specific topic
                </p>
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
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {isSubmitting ? "Saving..." : initialData ? "Update Question" : "Create Question"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
