"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RichContentRenderer } from "@/src/components/ui/rich-content-renderer";
import { RichContentEditor } from "@/src/components/ui/rich-content-editor";
import { Edit, Save, X, Upload, Image as ImageIcon, CheckCircle2, Loader2 } from "lucide-react";
import questionService, { QuestionResponse } from '@/src/services/question.service';
import { toast } from 'sonner';

export default function QuestionViewPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit state
  const [editedQuestion, setEditedQuestion] = useState({
    questionText: { raw: '', html: '', plainText: '', assets: [] as string[] },
    options: [] as any[],
    hint: { raw: '', html: '', plainText: '', assets: [] as string[] },
    solution: { raw: '', html: '', plainText: '', assets: [] as string[] },
  });

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const data = await questionService.getQuestionById(questionId);
      setQuestion(data);
      
      // Initialize edit state
      setEditedQuestion({
        questionText: data.content.question ? {
          raw: data.content.question.raw || '',
          html: data.content.question.html,
          plainText: data.content.question.plain_text || '',
          assets: []
        } : { raw: '', html: '', plainText: '', assets: [] },
        options: data.answer?.pool?.options || [],
        hint: data.content.hints ? {
          raw: data.content.hints.raw || '',
          html: data.content.hints.html,
          plainText: data.content.hints.plain_text || '',
          assets: []
        } : { raw: '', html: '', plainText: '', assets: [] },
        solution: data.answer?.solution?.explanation ? {
          raw: data.answer.solution.explanation.raw || '',
          html: data.answer.solution.explanation.html,
          plainText: data.answer.solution.explanation.plain_text || '',
          assets: []
        } : { raw: '', html: '', plainText: '', assets: [] },
      });
    } catch (error) {
      console.error('Failed to fetch question:', error);
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, targetField: 'question' | 'option' | 'hint' | 'solution', optionId?: string) => {
    try {
      setUploadingImage(true);
      
      // Create custom file name: {questionId}-{timestamp}
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const customFileName = `${questionId}-${timestamp}.${fileExtension}`;
      
      // Create FormData with custom file name
      const formData = new FormData();
      const renamedFile = new File([file], customFileName, { type: file.type });
      formData.append('file', renamedFile);
      formData.append('folder', `diagrams/${questionId}`);
      
      // Upload to S3
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const imageUrl = data.url;
      
      // Copy URL to clipboard
      await navigator.clipboard.writeText(imageUrl);
      
      // Insert markdown into the appropriate field
      const markdown = `![Image](${imageUrl}){width=400px position=center}`;
      
      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">Image uploaded successfully!</p>
          <p className="text-xs text-gray-600">URL copied to clipboard</p>
          <div className="bg-gray-100 p-2 rounded text-xs break-all">
            {imageUrl}
          </div>
          <p className="text-xs text-blue-600">Markdown: {markdown}</p>
        </div>,
        { duration: 8000 }
      );
      return markdown;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!question) return;

    try {
      setIsSaving(true);

      // Build update payload matching the working editor format
      const updatePayload: any = {
        content: {
          question: {
            raw: editedQuestion.questionText.raw,
            html: editedQuestion.questionText.html,
            plain_text: editedQuestion.questionText.plainText || editedQuestion.questionText.raw
          },
          hints: editedQuestion.hint.raw ? {
            raw: editedQuestion.hint.raw,
            html: editedQuestion.hint.html,
            plain_text: editedQuestion.hint.plainText || editedQuestion.hint.raw
          } : undefined
        },
        answer: {
          pool: question.answer?.pool ? {
            options: editedQuestion.options.map((opt: any) => ({
              id: opt.id,
              label: opt.label,
              content: {
                raw: opt.content.raw,
                html: opt.content.html,
                plain_text: opt.content.plainText || opt.content.raw
              }
            }))
          } : null,
          key: question.answer?.key || {},
          solution: editedQuestion.solution.raw ? {
            explanation: {
              raw: editedQuestion.solution.raw,
              html: editedQuestion.solution.html,
              plain_text: editedQuestion.solution.plainText || editedQuestion.solution.raw
            }
          } : undefined
        }
      };

      await questionService.updateQuestion(questionId, updatePayload);
      toast.success('Question updated successfully!');
      setIsEditing(false);
      fetchQuestion(); // Refresh data
    } catch (error) {
      console.error('Failed to update question:', error);
      toast.error('Failed to update question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (question) {
      setEditedQuestion({
        questionText: question.content.question ? {
          raw: question.content.question.raw || '',
          html: question.content.question.html,
          plainText: question.content.question.plain_text || '',
          assets: []
        } : { raw: '', html: '', plainText: '', assets: [] },
        options: question.answer?.pool?.options || [],
        hint: question.content.hints ? {
          raw: question.content.hints.raw || '',
          html: question.content.hints.html,
          plainText: question.content.hints.plain_text || '',
          assets: []
        } : { raw: '', html: '', plainText: '', assets: [] },
        solution: question.answer?.solution?.explanation ? {
          raw: question.answer.solution.explanation.raw || '',
          html: question.answer.solution.explanation.html,
          plainText: question.answer.solution.explanation.plain_text || '',
          assets: []
        } : { raw: '', html: '', plainText: '', assets: [] },
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  if (!question) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <p className="text-gray-500">Question not found</p>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      </PageWrapper>
    );
  }

  const isCorrectOption = (optionId: string) => {
    if (question.answer_type === 'SINGLE_CHOICE') {
      return question.answer?.key?.correct_option_id === optionId;
    } else if (question.answer_type === 'MULTIPLE_CHOICE') {
      return question.answer?.key?.correct_option_ids?.includes(optionId);
    }
    return false;
  };

  return (
    <>
      <PageHeader title="Question View" />
      <PageWrapper>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <PageTitle backButton={{ enabled: true, onClick: () => router.back() }}>
                Question View
              </PageTitle>
              <p className="text-sm text-gray-500 mt-1">
                Student-facing view with edit capability
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Question
                </Button>
              )}
            </div>
          </div>

          {/* Question Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {question.answer_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Difficulty</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      question.difficulty_label === 'EASY' ? 'bg-green-500' :
                      question.difficulty_label === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm capitalize">{question.difficulty_label.toLowerCase()}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Marks</Label>
                  <p className="text-sm mt-1">+{question.positive_marks} / -{question.negative_marks}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Duration</Label>
                  <p className="text-sm mt-1">{question.duration_seconds ? `${question.duration_seconds}s` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div>
                  <RichContentEditor
                    label="Question Text"
                    value={editedQuestion.questionText}
                    onChange={(content) => setEditedQuestion(prev => ({ ...prev, questionText: content }))}
                    allowImages={true}
                    allowEquations={true}
                    placeholder="Enter question text..."
                  />
                  <div className="mt-2">
                    <Label htmlFor="question-image" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                        <ImageIcon className="w-4 h-4" />
                        Upload Image to S3
                      </div>
                    </Label>
                    <Input
                      id="question-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const markdown = await handleImageUpload(file, 'question');
                          if (markdown) {
                            const newRaw = editedQuestion.questionText.raw + '\n' + markdown;
                            setEditedQuestion(prev => ({
                              ...prev,
                              questionText: { ...prev.questionText, raw: newRaw }
                            }));
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <RichContentRenderer content={{
                    raw: question.content.question.raw || '',
                    html: question.content.question.html,
                    plainText: question.content.question.plain_text || '',
                    assets: []
                  }} />
                </div>
              )}

              {/* Correct Answer for NUMERICAL questions */}
              {question.answer_type === 'NUMERICAL' && question.answer?.key?.correct_value !== undefined && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Correct Answer:</Label>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-800">
                        {question.answer.key.correct_value}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Options */}
              {question.answer?.pool?.options && question.answer.pool.options.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Options:</Label>
                  {isEditing ? (
                    <div className="space-y-3">
                      {editedQuestion.options.map((option, index) => (
                        <div key={option.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className={`px-3 py-2 rounded font-semibold ${
                            isCorrectOption(option.id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {option.label}
                          </div>
                          <div className="flex-1">
                            <RichContentEditor
                              value={option.content}
                              onChange={(content) => {
                                const newOptions = [...editedQuestion.options];
                                newOptions[index] = { ...newOptions[index], content };
                                setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                              }}
                              allowImages={false}
                              allowEquations={true}
                              placeholder={`Option ${option.label}`}
                            />
                          </div>
                          {isCorrectOption(option.id) && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.answer.pool.options.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            isCorrectOption(option.id)
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className={`px-3 py-1 rounded font-semibold ${
                            isCorrectOption(option.id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {option.label}
                          </div>
                          <div className="flex-1">
                            <RichContentRenderer content={{
                              raw: option.content.raw || '',
                              html: option.content.html,
                              plainText: option.content.plain_text || '',
                              assets: []
                            }} />
                          </div>
                          {isCorrectOption(option.id) && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hint */}
              {(question.content.hints?.raw || isEditing) && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Hint:</Label>
                  {isEditing ? (
                    <RichContentEditor
                      value={editedQuestion.hint}
                      onChange={(content) => setEditedQuestion(prev => ({ ...prev, hint: content }))}
                      allowImages={true}
                      allowEquations={true}
                      placeholder="Enter hint (optional)..."
                    />
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {question.content.hints && (
                        <RichContentRenderer content={{
                          raw: question.content.hints.raw || '',
                          html: question.content.hints.html,
                          plainText: question.content.hints.plain_text || '',
                          assets: []
                        }} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Solution */}
              {(question.answer?.solution?.explanation?.raw || isEditing) && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Solution:</Label>
                  {isEditing ? (
                    <RichContentEditor
                      value={editedQuestion.solution}
                      onChange={(content) => setEditedQuestion(prev => ({ ...prev, solution: content }))}
                      allowImages={true}
                      allowEquations={true}
                      placeholder="Enter detailed solution..."
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      {question.answer.solution?.explanation && (
                        <RichContentRenderer content={{
                          raw: question.answer.solution.explanation.raw || '',
                          html: question.answer.solution.explanation.html,
                          plainText: question.answer.solution.explanation.plain_text || '',
                          assets: []
                        }} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
