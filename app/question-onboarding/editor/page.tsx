"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X, Save, Eye, Info } from "lucide-react";
import { Question, QuestionType, Exam, Paper } from "@/src/types/exam";
import { RichContentEditor } from '@/src/components/ui/rich-content-editor';
import { RichContentRenderer } from '@/src/components/ui/rich-content-renderer';
import { QuestionPreview } from '@/src/components/question-preview';

// Mock data
const mockExams: Exam[] = [
  { id: "1", name: "JEE Main 2024", description: "Joint Entrance Examination Main", countries: ["India"], metadata: [], createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "NEET 2024", description: "National Eligibility cum Entrance Test", countries: ["India"], metadata: [], createdAt: new Date(), updatedAt: new Date() },
];

const mockPapers: Paper[] = [
  { id: "1", name: "JEE Main 2024 - Paper 1", examId: "1", date: new Date("2024-04-15"), totalQuestions: 90, totalMarks: 300, duration: 10800, sections: [], createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "JEE Main 2024 - Paper 2", examId: "1", date: new Date("2024-04-16"), totalQuestions: 82, totalMarks: 390, duration: 10800, sections: [], createdAt: new Date(), updatedAt: new Date() },
];

const mockTopics = [
  { id: "1", name: "Kinematics", subject: "Physics" },
  { id: "2", name: "Laws of Motion", subject: "Physics" },
  { id: "3", name: "Derivatives", subject: "Mathematics" },
  { id: "4", name: "Heat Transfer", subject: "Chemistry" },
];

const focusedQuestionTypes: { value: QuestionType; label: string; description: string }[] = [
  { value: "single_choice_mcq", label: "Single Choice MCQ", description: "One correct answer" },
  { value: "multiple_choice_mcq", label: "Multiple Choice MCQ", description: "Multiple correct answers" },
  { value: "integer_based", label: "Integer Based", description: "Whole number answer" },
];

function QuestionEditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialExamId = searchParams.get('examId') || "";
  const initialPaperId = searchParams.get('paperId') || "";
  const initialIsPreviousYear = searchParams.get('isPreviousYear') === 'true';
  const questionId = searchParams.get('questionId');
  const initialType = searchParams.get('type') as QuestionType | null;

  // Get initial exam date from paper if available
  const initialPaper = initialPaperId ? mockPapers.find(p => p.id === initialPaperId) : null;
  const initialExamDate = initialPaper?.date;

  const [selectedType, setSelectedType] = useState<QuestionType | "">(initialType || "");
  const [question, setQuestion] = useState<Partial<Question>>({
    type: initialType || "single_choice_mcq",
    description: "",
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
    positiveMarks: 4,
    negativeMarks: 1,
    difficulty: "medium",
    tags: [],
    examId: initialExamId,
    paperId: initialPaperId,
    examDate: initialExamDate,
    isPreviousYearQuestion: initialIsPreviousYear,
    status: "draft",
    assets: []
  });

  const [topicSearch, setTopicSearch] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  const filteredTopics = mockTopics.filter(topic =>
    topic.name.toLowerCase().includes(topicSearch.toLowerCase()) ||
    topic.subject.toLowerCase().includes(topicSearch.toLowerCase())
  );

  const filteredPapers = mockPapers.filter(paper => paper.examId === question.examId);

  const handleTypeSelection = (type: QuestionType) => {
    setSelectedType(type);
    setQuestion(prev => ({ ...prev, type }));
  };

  const addTag = () => {
    if (currentTag.trim() && !question.tags?.includes(currentTag.trim())) {
      setQuestion(prev => ({ ...prev, tags: [...(prev.tags || []), currentTag.trim()] }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setQuestion(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] }));
  };

  const handleSave = () => {
    if (!question.content?.question?.raw) {
      alert("Please enter the question content");
      return;
    }
    console.log("Saving question:", question);
    alert("Question saved successfully!");
    router.push('/question-onboarding');
  };

  const getExamName = () => mockExams.find(e => e.id === question.examId)?.name || "Unknown Exam";
  const getPaperName = () => mockPapers.find(p => p.id === question.paperId)?.name || "No Paper";

  // Type selection screen
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.push('/question-onboarding')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />Back to Questions
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Create New Question</h1>
              <p className="text-gray-600">Choose the type of question you want to create</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getExamName()}</Badge>
                {question.isPreviousYearQuestion && <Badge className="bg-yellow-500">PYQ - {getPaperName()}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {focusedQuestionTypes.map((type) => (
              <div key={type.value} className="bg-white p-6 rounded-lg border hover:border-yellow-300 hover:shadow-md cursor-pointer transition-all" onClick={() => handleTypeSelection(type.value)}>
                <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                <p className="text-gray-600 text-sm">{type.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">KaTeX & Markdown Support</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Inline equations: <code className="bg-blue-100 px-1">$x^2 + y^2$</code></li>
                  <li>• Block equations: <code className="bg-blue-100 px-1">$$\frac{"{-b}"}{"{2a}"}$$</code></li>
                  <li>• Images: <code className="bg-blue-100 px-1">![alt](url)</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor with side-by-side preview
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-1/2 bg-white border-r overflow-y-auto overflow-x-hidden">
          <div className="p-6 sticky top-0 bg-white border-b z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => router.push('/question-onboarding')} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <div>
                  <h1 className="text-xl font-bold">
                    {questionId ? "Edit Question" : "Create Question"}
                  </h1>
                  <p className="text-sm text-gray-600 capitalize">{selectedType.replace('_', ' ')}</p>
                </div>
              </div>
              {!questionId && (
                <Button variant="outline" onClick={() => setSelectedType("")} className="text-sm">Change Type</Button>
              )}
            </div>
            
            {/* Status, Exam and Paper Info */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Switch 
                  checked={question.status === "published"} 
                  onCheckedChange={(checked) => setQuestion(prev => ({ ...prev, status: checked ? "published" : "draft" }))} 
                />
                <span className={`text-sm font-medium ${question.status === "published" ? "text-green-600" : "text-gray-600"}`}>
                  {question.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <Badge variant="outline" className="text-sm font-medium">{getExamName()}</Badge>
              {question.isPreviousYearQuestion && question.paperId && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-bold px-3 py-1.5 shadow-sm">
                  📄 PYQ: {getPaperName()}
                </Badge>
              )}
              {question.isPreviousYearQuestion && !question.paperId && (
                <Badge className="bg-orange-500 text-white text-sm font-bold px-3 py-1.5 shadow-sm animate-pulse">
                  ⚠️ Select Paper Below
                </Badge>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Exam and PYQ Settings */}
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <div>
                <Label htmlFor="examSelect">Exam *</Label>
                <Select value={question.examId} onValueChange={(value) => setQuestion(prev => ({ ...prev, examId: value, paperId: "" }))}>
                  <SelectTrigger id="examSelect" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mockExams.map((exam) => (<SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pyqSwitch" className="font-medium">Previous Year Question</Label>
                  <p className="text-xs text-gray-500">Toggle if this appeared in a previous exam</p>
                </div>
                <Switch id="pyqSwitch" checked={question.isPreviousYearQuestion || false} onCheckedChange={(checked) => setQuestion(prev => ({ ...prev, isPreviousYearQuestion: checked, paperId: checked ? prev.paperId : "" }))} />
              </div>

              {question.isPreviousYearQuestion && (
                <div className="p-4 border-2 border-yellow-500 bg-yellow-50 rounded-lg space-y-2">
                  <Label htmlFor="paperSelect" className="text-base font-semibold text-yellow-900">
                    📄 Select Paper for Previous Year Question *
                  </Label>
                  <Select value={question.paperId} onValueChange={(value) => {
                    const selectedPaper = mockPapers.find(p => p.id === value);
                    setQuestion(prev => ({ 
                      ...prev, 
                      paperId: value,
                      examDate: selectedPaper?.date 
                    }));
                  }}>
                    <SelectTrigger id="paperSelect" className="mt-2 border-2 border-yellow-600 bg-white hover:bg-yellow-50 font-medium text-gray-900">
                      <SelectValue placeholder="👉 Choose a paper" className="text-gray-700" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPapers.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No papers available for this exam
                        </div>
                      ) : (
                        filteredPapers.map((paper) => (
                          <SelectItem key={paper.id} value={paper.id} className="font-medium">
                            {paper.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {question.paperId && question.examDate && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <span className="text-green-700 text-xs font-medium">
                        ✓ Exam Date: {new Date(question.examDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ This field is required for previous year questions
                  </p>
                </div>
              )}
            </div>

            {/* Question Content */}
            <div>
              <RichContentEditor
                label="Question Content *"
                value={question.content?.question || { raw: "", html: "", plainText: "", assets: [] }}
                onChange={(content) => setQuestion(prev => ({ ...prev, content: { ...prev.content, question: content }, description: content.plainText, htmlContent: content.html }))}
                placeholder="Enter question. Supports KaTeX ($x^2$) and markdown images ![alt](url)..."
                allowImages={true}
                allowEquations={true}
              />
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Need to upload images?</strong> Visit <a href="/media-library" className="font-semibold underline hover:text-blue-900">Media Library</a> in the sidebar to upload images and get shortened links.
                </p>
              </div>
            </div>

            {/* Type-specific fields */}
            {(selectedType === "single_choice_mcq" || selectedType === "multiple_choice_mcq") && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Answer Options *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const newOption = { id: Date.now().toString(), label: String.fromCharCode(65 + (question.options?.length || 0)), value: "", isCorrect: false };
                    setQuestion(prev => ({ ...prev, options: [...(prev.options || []), newOption] }));
                  }}>
                    <Plus className="w-4 h-4 mr-1" />Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {question.options?.map((option, index) => (
                    <div key={option.id} className="flex gap-2 items-start p-3 border rounded-lg">
                      <div className="w-16">
                        <Input value={option.label} onChange={(e) => {
                          const newOptions = [...(question.options || [])];
                          newOptions[index] = { ...option, label: e.target.value };
                          setQuestion(prev => ({ ...prev, options: newOptions }));
                        }} placeholder="A" className="text-center font-medium" />
                      </div>
                      <div className="flex-1">
                        <RichContentEditor
                          value={option.content || { raw: option.value || "", html: option.value || "", plainText: option.value || "", assets: [] }}
                          onChange={(newContent) => {
                            const newOptions = [...(question.options || [])];
                            newOptions[index] = { ...option, content: newContent, value: newContent.plainText };
                            setQuestion(prev => ({ ...prev, options: newOptions }));
                          }}
                          placeholder={`Option ${option.label} (supports $x^2$)`}
                          allowImages={false}
                          allowFiles={false}
                          className="min-h-[60px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type={selectedType === "single_choice_mcq" ? "radio" : "checkbox"} name={selectedType === "single_choice_mcq" ? "correct-answer" : undefined} checked={option.isCorrect} onChange={(e) => {
                            const newOptions = [...(question.options || [])];
                            if (selectedType === "single_choice_mcq") {
                              newOptions.forEach((opt, i) => { opt.isCorrect = i === index ? e.target.checked : false; });
                            } else {
                              newOptions[index] = { ...option, isCorrect: e.target.checked };
                            }
                            setQuestion(prev => ({ ...prev, options: newOptions }));
                          }} className="rounded" />
                          <span className="text-sm">Correct</span>
                        </label>
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          const newOptions = question.options?.filter((_, i) => i !== index) || [];
                          setQuestion(prev => ({ ...prev, options: newOptions }));
                        }} disabled={(question.options?.length || 0) <= 2}>
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
                <Input id="integerAnswer" type="number" value={question.integerAnswer || ""} onChange={(e) => setQuestion(prev => ({ ...prev, integerAnswer: parseInt(e.target.value) || 0 }))} placeholder="Enter the correct integer answer" className="mt-1" />
              </div>
            )}

            {/* Hints */}
            <div>
              <RichContentEditor label="Hints (Optional)" value={question.content?.hints || { raw: "", html: "", plainText: "", assets: [] }} onChange={(content) => setQuestion(prev => ({ ...prev, content: { ...prev.content, hints: content, question: prev.content?.question } }))} placeholder="Provide hints..." allowImages={true} allowEquations={true} />
            </div>

            {/* Solution */}
            <div>
              <RichContentEditor label="Solution (Optional)" value={question.content?.solution || { raw: "", html: "", plainText: "", assets: [] }} onChange={(content) => setQuestion(prev => ({ ...prev, content: { ...prev.content, solution: content } }))} placeholder="Provide detailed solution..." allowImages={true} allowEquations={true} />
            </div>

            {/* Topic */}
            <div>
              <Label htmlFor="topicSearch">Topic</Label>
              <Input id="topicSearch" value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)} placeholder="Search topics..." className="mt-1" />
              {topicSearch && (
                <div className="max-h-32 overflow-y-auto border rounded-lg mt-2">
                  {filteredTopics.map((topic) => (
                    <div key={topic.id} className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => {
                      setQuestion(prev => ({ ...prev, topicId: topic.id }));
                      setTopicSearch(`${topic.name} (${topic.subject})`);
                    }}>
                      <div className="font-medium">{topic.name}</div>
                      <div className="text-sm text-gray-500">{topic.subject}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scoring */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="positiveMarks">Positive Marks *</Label>
                <Input id="positiveMarks" type="number" value={question.positiveMarks} onChange={(e) => setQuestion(prev => ({ ...prev, positiveMarks: parseFloat(e.target.value) || 0 }))} placeholder="4" className="mt-1" min="0" step="0.25" />
              </div>
              <div>
                <Label htmlFor="negativeMarks">Negative Marks *</Label>
                <Input id="negativeMarks" type="number" value={question.negativeMarks} onChange={(e) => setQuestion(prev => ({ ...prev, negativeMarks: parseFloat(e.target.value) || 0 }))} placeholder="1" className="mt-1" min="0" step="0.25" />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select value={question.difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setQuestion(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger id="difficulty" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input id="tags" value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add a tag and press Enter" />
                <Button type="button" onClick={addTag} variant="outline">Add</Button>
              </div>
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}<X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white pb-6">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />Save Question
              </Button>
              <Button onClick={() => { handleSave(); setSelectedType(""); }} variant="outline">
                Save & Add Another
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto overflow-x-hidden">
          <div className="p-6 sticky top-0 bg-gray-50 border-b z-10">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Live Preview</h2>
            </div>
            <p className="text-sm text-gray-600">See how your question will appear to students</p>
          </div>

          <div className="p-6">
            <QuestionPreview question={question as Question} selectedType={selectedType} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionEditorPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <QuestionEditorPageContent />
    </Suspense>
  );
}
