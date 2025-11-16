"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowLeft, Plus, X, Save, Eye } from "lucide-react";
import { Question, QuestionType, RichContent, MediaAsset } from "@/src/types/exam";
import { RichContentEditor } from '@/src/components/ui/rich-content-editor';
import { RichContentRenderer } from '@/src/components/ui/rich-content-renderer';
import { FillInBlanksEditor } from '@/src/components/fill-in-blanks-editor';

// Mock data for topics with search
const mockTopics = [
  { id: "1", name: "Kinematics", subject: "Physics" },
  { id: "2", name: "Laws of Motion", subject: "Physics" },
  { id: "3", name: "Derivatives", subject: "Mathematics" },
  { id: "4", name: "Heat Transfer", subject: "Chemistry" },
];

const questionTypes: { value: QuestionType; label: string; description: string }[] = [
  { value: "single_choice_mcq", label: "Single Choice MCQ", description: "One correct answer from multiple options" },
  { value: "multiple_choice_mcq", label: "Multiple Choice MCQ", description: "Multiple correct answers possible" },
  { value: "integer_based", label: "Integer Based", description: "Answer is a whole number" },
  { value: "paragraph", label: "Paragraph", description: "Long text answer" },
  { value: "fill_in_blanks", label: "Fill in the Blanks", description: "Complete the missing words" },
  { value: "match_following", label: "Match the Following", description: "Match items from two columns" },
  { value: "nested_questions", label: "Nested Questions", description: "Main question with sub-questions" },
];

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params.sectionId as string;

  const [selectedType, setSelectedType] = useState<QuestionType | "">("");
  const [question, setQuestion] = useState<Partial<Question>>({
    type: "single_choice_mcq",
    description: "",
    htmlContent: "",
    content: {
      question: { raw: "", html: "", plainText: "", assets: [] },
      hints: { raw: "", html: "", plainText: "", assets: [] },
      solution: { raw: "", html: "", plainText: "", assets: [] }
    },
    options: [
      { id: "1", label: "A", value: "", isCorrect: false },
      { id: "2", label: "B", value: "", isCorrect: false },
      { id: "3", label: "C", value: "", isCorrect: false },
      { id: "4", label: "D", value: "", isCorrect: false },
    ],
    correctAnswers: [],
    positiveMarks: 4,
    negativeMarks: 1,
    difficulty: "medium",
    tags: [],
    topicId: "",
    sectionId: sectionId,
    assets: []
  });

  const [topicSearch, setTopicSearch] = useState("");
  const [currentTag, setCurrentTag] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  const filteredTopics = mockTopics.filter(topic =>
    topic.name.toLowerCase().includes(topicSearch.toLowerCase()) ||
    topic.subject.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const handleTypeSelection = (type: QuestionType) => {
    setSelectedType(type);
    setQuestion(prev => ({ ...prev, type }));
  };

  const addTag = () => {
    if (currentTag.trim() && !question.tags?.includes(currentTag.trim())) {
      setQuestion(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setQuestion(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const generatePreview = () => {
    const html = `
      <div class="question-preview p-6 bg-white rounded-lg border">
        <div class="question-header mb-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${question.type?.replace('_', ' ').toUpperCase()}</span>
            <div class="w-3 h-3 rounded-full ${
              question.difficulty === 'easy' ? 'bg-green-500' :
              question.difficulty === 'medium' ? 'bg-yellow-500' :
              'bg-red-500'
            }"></div>
            <span class="text-sm capitalize">${question.difficulty}</span>
            <span class="text-sm text-gray-600">+${question.positiveMarks} / ${question.negativeMarks}</span>
          </div>
        </div>
        
        <div class="question-content mb-4">
          <h3 class="text-lg font-semibold mb-2">Question</h3>
          <div class="prose max-w-none">
            ${question.htmlContent || question.description || "No question content yet..."}
          </div>
        </div>
        
        ${question.type === 'single_choice_mcq' || question.type === 'multiple_choice_mcq' ? `
          <div class="options-content">
            <h4 class="text-md font-medium mb-3">Options:</h4>
            <div class="space-y-2">
              ${question.options?.map((option, index) => `
                <div class="flex items-center p-3 border rounded-lg ${option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'}">
                  <span class="font-medium mr-3">${option.label})</span>
                  <span>${option.content?.html || option.value || 'Option not set'}</span>
                  ${option.isCorrect ? '<span class="ml-auto text-green-600 text-sm font-medium">✓ Correct</span>' : ''}
                </div>
              `).join('') || ''}
            </div>
          </div>
        ` : ''}
        
        ${question.type === 'integer_based' ? `
          <div class="answer-content">
            <h4 class="text-md font-medium mb-2">Answer:</h4>
            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <span class="font-medium">${question.integerAnswer || 'Not set'}</span>
            </div>
          </div>
        ` : ''}
        
        ${question.type === 'paragraph' ? `
          <div class="answer-content">
            <h4 class="text-md font-medium mb-2">Answer Type:</h4>
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span class="text-blue-800">Long text answer expected</span>
            </div>
          </div>
        ` : ''}
        
        ${question.type === 'fill_in_blanks' ? `
          <div class="blanks-content">
            <h4 class="text-md font-medium mb-3">Fill in the Blanks:</h4>
            <div class="p-4 bg-gray-50 border rounded-lg mb-3">
              <div class="font-mono">${(question.blanksData?.text || '').replace(/_____/g, '<span class="bg-yellow-200 px-2 py-1 mx-1 rounded">_____</span>')}</div>
            </div>
            ${question.blanksData?.blanks?.length ? `
              <div class="answers-content">
                <h5 class="text-sm font-medium mb-2">Correct Answers:</h5>
                <div class="space-y-1">
                  ${question.blanksData.blanks.map((blank, i) => `
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium w-16">Blank ${i + 1}:</span>
                      <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">${blank || 'Not set'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${question.type === 'match_following' ? `
          <div class="matching-content">
            <h4 class="text-md font-medium mb-3">Match the Following:</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h5 class="text-sm font-medium mb-2 text-center">Column A</h5>
                <div class="space-y-2">
                  ${(question.matchingPairs || []).map((pair, i) => `
                    <div class="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                      ${pair.left || 'Item not set'}
                    </div>
                  `).join('')}
                </div>
              </div>
              <div>
                <h5 class="text-sm font-medium mb-2 text-center">Column B</h5>
                <div class="space-y-2">
                  ${(question.matchingPairs || []).map((pair, i) => `
                    <div class="p-2 bg-green-50 border border-green-200 rounded text-center">
                      ${pair.right || 'Item not set'}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${question.type === 'nested_questions' ? `
          <div class="nested-content">
            <h4 class="text-md font-medium mb-3">Reading Passage:</h4>
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div class="prose max-w-none">
                ${question.htmlContent || 'No passage content yet...'}
              </div>
            </div>
            <div class="bg-yellow-50 p-3 rounded-lg">
              <p class="text-sm text-yellow-800">
                <strong>Sub-questions will be added after saving this parent question.</strong>
              </p>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    setPreviewHtml(html);
  };

  React.useEffect(() => {
    generatePreview();
  }, [question]);

  const handleSave = () => {
    // Save question logic here
    console.log("Saving question:", question);
  };

  const handleSaveAndNext = () => {
    handleSave();
    // Reset form for next question
    setQuestion({
      type: selectedType as QuestionType,
      description: "",
      htmlContent: "",
      options: [
        { id: "1", label: "A", value: "", isCorrect: false },
        { id: "2", label: "B", value: "", isCorrect: false },
        { id: "3", label: "C", value: "", isCorrect: false },
        { id: "4", label: "D", value: "", isCorrect: false },
      ],
      correctAnswers: [],
      positiveMarks: 4,
      negativeMarks: -1,
      difficulty: "medium",
      tags: [],
      topicId: "",
      sectionId: sectionId,
    });
  };

  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Paper
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Question</h1>
              <p className="text-gray-600">Choose the type of question you want to create</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionTypes.map((type) => (
              <div
                key={type.value}
                className="bg-white p-6 rounded-lg border hover:border-yellow-300 hover:shadow-md cursor-pointer transition-all"
                onClick={() => handleTypeSelection(type.value)}
              >
                <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-1/2 bg-white border-r overflow-y-auto">
          <div className="p-6 max-w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Question Editor</h1>
                  <p className="text-sm text-gray-600 capitalize">{selectedType.replace('_', ' ')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedType("")}
                className="text-sm"
              >
                Change Type
              </Button>
            </div>

            <div className="space-y-6 overflow-hidden">
              {/* Question Content */}
              {selectedType === "fill_in_blanks" ? (
                <div>
                  <FillInBlanksEditor
                    value={question.content?.question?.raw || ""}
                    onChange={(text, blanksData) => setQuestion(prev => ({
                      ...prev,
                      content: {
                        ...prev.content,
                        question: {
                          raw: text,
                          html: text.replace(/%%([^%]+)%%/g, '<span class="blank">________</span>'),
                          plainText: text.replace(/%%([^%]+)%%/g, '________'),
                          assets: []
                        }
                      },
                      blanksData: {
                        text: text,
                        blanks: blanksData
                      },
                      description: text.replace(/%%([^%]+)%%/g, '________'),
                      htmlContent: text.replace(/%%([^%]+)%%/g, '<span class="blank">________</span>')
                    }))}
                    label="Question with Blanks"
                    placeholder="Enter text with blanks. Use %%answer%% to mark blanks. Example: The capital of France is %%Paris%%"
                  />
                </div>
              ) : (
                <div>
                  <RichContentEditor
                    label="Question Content"
                    value={question.content?.question || { raw: "", html: "", plainText: "", assets: [] }}
                    onChange={(content) => setQuestion(prev => ({
                      ...prev,
                      content: {
                        ...prev.content,
                        question: content
                      },
                      // Update legacy fields for backward compatibility
                      description: content.plainText,
                      htmlContent: content.html
                    }))}
                    placeholder="Enter your question here. You can use formatting, equations, and images..."
                    allowImages={true}
                    allowEquations={true}
                  />
                </div>
              )}

              {/* Hints (Optional) */}
              <div>
                <RichContentEditor
                  label="Hints (Optional)"
                  value={question.content?.hints || { raw: "", html: "", plainText: "", assets: [] }}
                  onChange={(content) => setQuestion(prev => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      hints: content,
                      question: prev.content?.question
                    }
                  }))}
                  placeholder="Provide an explanation or hint for this question..."
                  allowImages={true}
                  allowEquations={true}
                />
              </div>

              {/* Solution (Optional) */}
              <div>
                <RichContentEditor
                  label="Solution (Optional)"
                  value={question.content?.solution || { raw: "", html: "", plainText: "", assets: [] }}
                  onChange={(content) => setQuestion(prev => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      solution: content
                    }
                  }))}
                  placeholder="Provide a detailed solution with step-by-step explanation..."
                  allowImages={true}
                  allowEquations={true}
                />
              </div>

              {/* Type-specific fields */}
              {(selectedType === "single_choice_mcq" || selectedType === "multiple_choice_mcq") && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label>Answer Options *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOption = {
                          id: Date.now().toString(),
                          label: String.fromCharCode(65 + (question.options?.length || 0)),
                          value: "",
                          isCorrect: false
                        };
                        setQuestion(prev => ({
                          ...prev,
                          options: [...(prev.options || []), newOption]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.options?.map((option, index) => (
                      <div key={option.id} className="flex gap-2 items-start p-3 border rounded-lg">
                        <div className="w-16">
                          <Input
                            value={option.label}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[index] = { ...option, label: e.target.value };
                              setQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder="A"
                            className="text-center font-medium"
                          />
                        </div>
                        <div className="flex-1">
                          <RichContentEditor
                            value={option.content || { raw: option.value || "", html: option.value || "", plainText: option.value || "", assets: [] }}
                            onChange={(newContent) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[index] = { 
                                ...option, 
                                content: newContent,
                                value: newContent.plainText // Keep backward compatibility
                              };
                              setQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Enter option ${option.label} (supports equations: $x^2$)`}
                            allowImages={false}
                            allowFiles={false}
                            className="min-h-[60px]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type={selectedType === "single_choice_mcq" ? "radio" : "checkbox"}
                              name={selectedType === "single_choice_mcq" ? "correct-answer" : undefined}
                              checked={option.isCorrect}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                if (selectedType === "single_choice_mcq") {
                                  // Single choice - uncheck others
                                  newOptions.forEach((opt, i) => {
                                    opt.isCorrect = i === index ? e.target.checked : false;
                                  });
                                } else {
                                  // Multiple choice
                                  newOptions[index] = { ...option, isCorrect: e.target.checked };
                                }
                                setQuestion(prev => ({ ...prev, options: newOptions }));
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">Correct</span>
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newOptions = question.options?.filter((_, i) => i !== index) || [];
                              setQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            disabled={(question.options?.length || 0) <= 2}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedType === "integer_based" && (
                <div>
                  <Label htmlFor="integerAnswer">Correct Answer *</Label>
                  <Input
                    id="integerAnswer"
                    type="number"
                    value={question.integerAnswer || ""}
                    onChange={(e) => setQuestion(prev => ({ 
                      ...prev, 
                      integerAnswer: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Enter the correct integer answer"
                    className="mt-1"
                  />
                </div>
              )}

              {selectedType === "paragraph" && (
                <div>
                  <Label htmlFor="paragraphGuidelines">Answer Guidelines</Label>
                  <Textarea
                    id="paragraphGuidelines"
                    placeholder="Provide guidelines for evaluating the paragraph answer..."
                    className="mt-1"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This will help evaluators understand what to look for in student responses.
                  </p>
                </div>
              )}

              {selectedType === "fill_in_blanks" && (
                <div>
                  <Label htmlFor="blanksText">Text with Blanks *</Label>
                  <Textarea
                    id="blanksText"
                    value={question.blanksData?.text || ""}
                    onChange={(e) => setQuestion(prev => ({
                      ...prev,
                      blanksData: { ...prev.blanksData, text: e.target.value, blanks: prev.blanksData?.blanks || [] }
                    }))}
                    placeholder="Enter text with _____ for blanks. Example: The capital of India is _____."
                    className="mt-1"
                    rows={4}
                  />
                  <div className="mt-3">
                    <Label>Correct Answers for Blanks</Label>
                    <div className="space-y-2 mt-2">
                      {(question.blanksData?.text || "").split("_____").length - 1 > 0 && 
                        Array.from({ length: (question.blanksData?.text || "").split("_____").length - 1 }, (_, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="text-sm font-medium w-16">Blank {i + 1}:</span>
                            <Input
                              value={question.blanksData?.blanks?.[i] || ""}
                              onChange={(e) => {
                                const newBlanks = [...(question.blanksData?.blanks || [])];
                                newBlanks[i] = e.target.value;
                                setQuestion(prev => ({
                                  ...prev,
                                  blanksData: { ...prev.blanksData, text: prev.blanksData?.text || "", blanks: newBlanks }
                                }));
                              }}
                              placeholder="Correct answer"
                              className="flex-1"
                            />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}

              {selectedType === "match_following" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label>Matching Pairs *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPair = { left: "", right: "" };
                        setQuestion(prev => ({
                          ...prev,
                          matchingPairs: [...(prev.matchingPairs || []), newPair]
                        }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Pair
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(question.matchingPairs || [{ left: "", right: "" }]).map((pair, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
                        <div>
                          <Label className="text-sm">Left Column</Label>
                          <Input
                            value={pair.left}
                            onChange={(e) => {
                              const newPairs = [...(question.matchingPairs || [])];
                              newPairs[index] = { ...pair, left: e.target.value };
                              setQuestion(prev => ({ ...prev, matchingPairs: newPairs }));
                            }}
                            placeholder="Item to match"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-sm">Right Column</Label>
                            <Input
                              value={pair.right}
                              onChange={(e) => {
                                const newPairs = [...(question.matchingPairs || [])];
                                newPairs[index] = { ...pair, right: e.target.value };
                                setQuestion(prev => ({ ...prev, matchingPairs: newPairs }));
                              }}
                              placeholder="Matching item"
                              className="mt-1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPairs = question.matchingPairs?.filter((_, i) => i !== index) || [];
                              setQuestion(prev => ({ ...prev, matchingPairs: newPairs }));
                            }}
                            disabled={(question.matchingPairs?.length || 0) <= 1}
                            className="mt-6"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedType === "nested_questions" && (
                <div>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Nested Questions</h4>
                    <p className="text-sm text-blue-800">
                      This is a parent question (like a reading passage) that will contain multiple sub-questions.
                      After creating this parent question, you can add individual sub-questions.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="passageContent">Reading Passage / Context *</Label>
                    <Textarea
                      id="passageContent"
                      value={question.htmlContent}
                      onChange={(e) => setQuestion(prev => ({ ...prev, htmlContent: e.target.value }))}
                      placeholder="Enter the reading passage or context that students will use to answer the sub-questions..."
                      className="mt-1"
                      rows={8}
                    />
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg mt-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> After saving this parent question, you'll be able to add individual sub-questions 
                      that reference this passage.
                    </p>
                  </div>
                </div>
              )}

              {/* Topic Selection with Search */}
              <div>
                <Label htmlFor="topicSearch">Topic</Label>
                <div className="mt-1">
                  <Input
                    id="topicSearch"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Search topics..."
                    className="mb-2"
                  />
                  {topicSearch && (
                    <div className="max-h-32 overflow-y-auto border rounded-lg">
                      {filteredTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setQuestion(prev => ({ ...prev, topicId: topic.id }));
                            setTopicSearch(`${topic.name} (${topic.subject})`);
                          }}
                        >
                          <div className="font-medium">{topic.name}</div>
                          <div className="text-sm text-gray-500">{topic.subject}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Scoring and Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="positiveMarks">Positive Marks *</Label>
                  <Input
                    id="positiveMarks"
                    type="number"
                    value={question.positiveMarks}
                    onChange={(e) => setQuestion(prev => ({ 
                      ...prev, 
                      positiveMarks: parseFloat(e.target.value) || 0 
                    }))}
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
                    value={question.negativeMarks}
                    onChange={(e) => setQuestion(prev => ({ 
                      ...prev, 
                      negativeMarks: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="-1"
                    className="mt-1"
                    max="0"
                    step="0.25"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level *</Label>
                <Select
                  value={question.difficulty}
                  onValueChange={(value: "easy" | "medium" | "hard") => 
                    setQuestion(prev => ({ ...prev, difficulty: value }))
                  }
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
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="mt-1">
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      placeholder="Add a tag (press Enter)"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {question.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 pt-6 mt-6 border-t">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Question
                </Button>
                <Button
                  onClick={handleSaveAndNext}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Save & Add Next
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <div className="p-6 max-w-full">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Live Preview</h2>
            </div>
            
            <div className="bg-white rounded-lg border p-6 space-y-6 break-words">
              {/* Question Content */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    question.difficulty === 'easy' ? 'bg-green-500' :
                    question.difficulty === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize">{question.difficulty}</span>
                  <span className="text-sm text-gray-600">
                    +{question.positiveMarks} / {question.negativeMarks} marks
                  </span>
                </div>
                
                <div className="mb-4">
                  <RichContentRenderer 
                    key="question-preview"
                    content={question.content?.question || { raw: "", html: "", plainText: "", assets: [] }}
                    className="question-content"
                  />
                </div>
              </div>

              {/* Options Preview */}
              {(question.type === "single_choice_mcq" || question.type === "multiple_choice_mcq") && (
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div 
                      key={option.id} 
                      className={`p-3 border rounded-lg ${
                        option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <input
                            type={question.type === "single_choice_mcq" ? "radio" : "checkbox"}
                            checked={option.isCorrect}
                            readOnly
                            className="mr-2"
                          />
                          <span className="font-medium">{option.label})</span>
                        </div>
                        <RichContentRenderer 
                          key={`option-${option.id}`}
                          content={option.content || { raw: option.value || "", html: option.value || "", plainText: option.value || "", assets: [] }}
                          className="option-content"
                        />
                        {option.isCorrect && (
                          <span className="text-green-600 text-sm font-medium ml-auto">✓ Correct</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Integer Answer Preview */}
              {question.type === "integer_based" && question.integerAnswer !== undefined && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-medium">Expected Answer: </span>
                  <span className="text-blue-700 font-mono">{question.integerAnswer}</span>
                </div>
              )}

              {/* Hints Preview */}
              {question.content?.hints?.html && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-gray-700">Hints:</h4>
                  <RichContentRenderer 
                    key="hints-preview"
                    content={question.content.hints}
                    className="explanation-content text-sm"
                  />
                </div>
              )}

              {/* Solution Preview */}
              {question.content?.solution?.html && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-gray-700">Solution:</h4>
                  <RichContentRenderer 
                    key="solution-preview"
                    content={question.content.solution}
                    className="solution-content text-sm"
                  />
                </div>
              )}

              {/* Tags Preview */}
              {question.tags && question.tags.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 text-gray-700">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
