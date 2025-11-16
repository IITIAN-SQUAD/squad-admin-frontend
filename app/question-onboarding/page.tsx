"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, FileQuestion, BookOpen, CheckCircle2, ListTodo, Calculator, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question, Exam, Paper } from "@/src/types/exam";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

// Mock data - replace with actual API calls
const mockExams: Exam[] = [
  {
    id: "1",
    name: "JEE Main 2024",
    description: "Joint Entrance Examination Main",
    countries: ["India"],
    metadata: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "NEET 2024",
    description: "National Eligibility cum Entrance Test",
    countries: ["India"],
    metadata: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPapers: Paper[] = [
  {
    id: "1",
    name: "JEE Main 2024 - Paper 1",
    examId: "1",
    date: new Date("2024-04-15"),
    totalQuestions: 90,
    totalMarks: 300,
    duration: 10800,
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "JEE Main 2024 - Paper 2",
    examId: "1",
    date: new Date("2024-04-16"),
    totalQuestions: 82,
    totalMarks: 390,
    duration: 10800,
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "NEET 2024 - Paper 1",
    examId: "2",
    date: new Date("2024-05-05"),
    totalQuestions: 180,
    totalMarks: 720,
    duration: 10800,
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockSubjects = [
  { id: "1", name: "Physics", examId: "1" },
  { id: "2", name: "Chemistry", examId: "1" },
  { id: "3", name: "Mathematics", examId: "1" },
  { id: "4", name: "Biology", examId: "2" },
  { id: "5", name: "Physics", examId: "2" },
  { id: "6", name: "Chemistry", examId: "2" },
];

const mockTopics = [
  { id: "1", name: "Mechanics", subjectId: "1", chapterId: "1" },
  { id: "2", name: "Thermodynamics", subjectId: "1", chapterId: "2" },
  { id: "3", name: "Organic Chemistry", subjectId: "2", chapterId: "3" },
  { id: "4", name: "Inorganic Chemistry", subjectId: "2", chapterId: "4" },
  { id: "5", name: "Algebra", subjectId: "3", chapterId: "5" },
  { id: "6", name: "Calculus", subjectId: "3", chapterId: "6" },
  { id: "7", name: "Cell Biology", subjectId: "4", chapterId: "7" },
  { id: "8", name: "Genetics", subjectId: "4", chapterId: "8" },
];

const mockChapters = [
  { id: "1", name: "Kinematics", subjectId: "1" },
  { id: "2", name: "Heat Transfer", subjectId: "1" },
  { id: "3", name: "Hydrocarbons", subjectId: "2" },
  { id: "4", name: "Coordination Compounds", subjectId: "2" },
  { id: "5", name: "Matrices", subjectId: "3" },
  { id: "6", name: "Derivatives", subjectId: "3" },
  { id: "7", name: "Cell Structure", subjectId: "4" },
  { id: "8", name: "DNA & RNA", subjectId: "4" },
];

const mockQuestions: Question[] = [
  {
    id: "1",
    type: "single_choice_mcq",
    description: "What is the capital of France?",
    content: {
      question: { raw: "What is the capital of France?", html: "<p>What is the capital of France?</p>", plainText: "What is the capital of France?", assets: [] }
    },
    options: [
      { id: "1", label: "A", value: "Paris", isCorrect: true },
      { id: "2", label: "B", value: "London", isCorrect: false },
      { id: "3", label: "C", value: "Berlin", isCorrect: false },
      { id: "4", label: "D", value: "Madrid", isCorrect: false },
    ],
    correctAnswers: ["1"],
    positiveMarks: 4,
    negativeMarks: 1,
    difficulty: "easy",
    tags: ["geography"],
    subjectId: "1",
    topicId: "1",
    chapterId: "1",
    examId: "1",
    paperId: "1",
    examDate: new Date("2024-04-15"),
    isPreviousYearQuestion: true,
    status: "published",
    assets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function QuestionOnboardingPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [selectedPaperId, setSelectedPaperId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;
  const [newQuestionData, setNewQuestionData] = useState({
    examId: mockExams[0]?.id || "", // Default to first exam
    paperId: "",
    isPreviousYearQuestion: false,
  });

  const filteredPapers = selectedExamId && selectedExamId !== "all" 
    ? mockPapers.filter(paper => paper.examId === selectedExamId)
    : mockPapers;

  const filteredSubjects = selectedExamId && selectedExamId !== "all" 
    ? mockSubjects.filter(subject => subject.examId === selectedExamId)
    : mockSubjects;

  const filteredChapters = selectedSubjectId && selectedSubjectId !== "all" 
    ? mockChapters.filter(chapter => chapter.subjectId === selectedSubjectId)
    : mockChapters;

  const filteredTopics = selectedChapterId && selectedChapterId !== "all" 
    ? mockTopics.filter(topic => topic.chapterId === selectedChapterId)
    : mockTopics;

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = 
      question.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExam = !selectedExamId || selectedExamId === "all" || question.examId === selectedExamId;
    const matchesPaper = !selectedPaperId || selectedPaperId === "all" || question.paperId === selectedPaperId;
    const matchesSubject = !selectedSubjectId || selectedSubjectId === "all" || question.subjectId === selectedSubjectId;
    const matchesTopic = !selectedTopicId || selectedTopicId === "all" || question.topicId === selectedTopicId;
    const matchesChapter = !selectedChapterId || selectedChapterId === "all" || question.chapterId === selectedChapterId;
    return matchesSearch && matchesExam && matchesPaper && matchesSubject && matchesTopic && matchesChapter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Statistics
  const stats = {
    total: questions.length,
    filtered: filteredQuestions.length,
    pyq: questions.filter(q => q.isPreviousYearQuestion).length,
    mcq: questions.filter(q => q.type.includes('mcq')).length,
    integer: questions.filter(q => q.type === 'integer_based').length,
    published: questions.filter(q => q.status === 'published').length,
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedExamId, selectedPaperId, selectedSubjectId, selectedTopicId, selectedChapterId]);

  const handleCreateQuestion = () => {
    if (!newQuestionData.examId) {
      alert("Please select an exam");
      return;
    }
    
    if (newQuestionData.isPreviousYearQuestion && !newQuestionData.paperId) {
      alert("Please select a paper for previous year question");
      return;
    }
    
    // Navigate to question editor with the selected data
    const queryParams = new URLSearchParams({
      examId: newQuestionData.examId,
      paperId: newQuestionData.paperId || "",
      isPreviousYear: newQuestionData.isPreviousYearQuestion.toString(),
      standalone: "true"
    });
    
    router.push(`/question-onboarding/editor?${queryParams.toString()}`);
    setIsCreateDialogOpen(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const getExamName = (examId?: string) => {
    return mockExams.find(e => e.id === examId)?.name || "N/A";
  };

  const getPaperName = (paperId?: string) => {
    return mockPapers.find(p => p.id === paperId)?.name || "N/A";
  };

  const getSubjectName = (subjectId?: string) => {
    return mockSubjects.find(s => s.id === subjectId)?.name || "N/A";
  };

  const getChapterName = (chapterId?: string) => {
    return mockChapters.find(c => c.id === chapterId)?.name || "N/A";
  };

  const getTopicName = (topicId?: string) => {
    return mockTopics.find(t => t.id === topicId)?.name || "N/A";
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <>
      <PageHeader title="Question Onboarding" />
      <PageWrapper>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <PageTitle>Question Bank</PageTitle>
              <p className="text-gray-600 mt-1">Manage and organize your question repository</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Question</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="exam">Select Exam *</Label>
                    <Select
                      value={newQuestionData.examId}
                      onValueChange={(value) => {
                        setNewQuestionData({ 
                          ...newQuestionData, 
                          examId: value,
                          paperId: "" // Reset paper when exam changes
                        });
                      }}
                    >
                      <SelectTrigger id="exam" className="mt-1">
                        <SelectValue placeholder="Choose an exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockExams.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <Label htmlFor="previousYear" className="text-sm font-medium cursor-pointer">
                        Is this a Previous Year Question?
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Toggle if this question appeared in a previous exam
                      </p>
                    </div>
                    <Switch
                      id="previousYear"
                      checked={newQuestionData.isPreviousYearQuestion}
                      onCheckedChange={(checked) => {
                        setNewQuestionData({ 
                          ...newQuestionData, 
                          isPreviousYearQuestion: checked,
                          paperId: checked ? newQuestionData.paperId : "" // Clear paper if not PYQ
                        });
                      }}
                    />
                  </div>

                  {newQuestionData.isPreviousYearQuestion && (
                    <div>
                      <Label htmlFor="paper">Select Paper *</Label>
                      <Select
                        value={newQuestionData.paperId}
                        onValueChange={(value) => {
                          setNewQuestionData({ ...newQuestionData, paperId: value });
                        }}
                      >
                        <SelectTrigger id="paper" className="mt-1">
                          <SelectValue placeholder="Choose a paper" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockPapers
                            .filter(paper => paper.examId === newQuestionData.examId)
                            .map((paper) => (
                              <SelectItem key={paper.id} value={paper.id}>
                                {paper.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Required for previous year questions
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateQuestion}>
                      Continue to Editor
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Questions */}
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                  {stats.filtered !== stats.total && (
                    <p className="text-xs text-blue-600 mt-1">
                      {stats.filtered} filtered
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </Card>

            {/* Previous Year Questions */}
            <Card className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-1">PYQ</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.pyq}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {stats.total > 0 ? Math.round((stats.pyq / stats.total) * 100) : 0}% of total
                  </p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </Card>

            {/* MCQ Questions */}
            <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">MCQ Questions</p>
                  <p className="text-3xl font-bold text-green-900">{stats.mcq}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Integer: {stats.integer}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <ListTodo className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </Card>

            {/* Published Questions */}
            <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Published</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.published}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {stats.total - stats.published} drafts
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Search Questions</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by description or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-56">
                <Label htmlFor="filterExam">Filter by Exam</Label>
                <Select value={selectedExamId} onValueChange={(value) => {
                  setSelectedExamId(value);
                  setSelectedPaperId("all");
                  setSelectedSubjectId("all");
                  setSelectedChapterId("all");
                  setSelectedTopicId("all");
                }}>
                  <SelectTrigger id="filterExam" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {mockExams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label htmlFor="filterPaper">Filter by Paper</Label>
                <Select 
                  value={selectedPaperId} 
                  onValueChange={setSelectedPaperId}
                  disabled={selectedExamId === "all"}
                >
                  <SelectTrigger id="filterPaper" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Papers</SelectItem>
                    {filteredPapers.map((paper) => (
                      <SelectItem key={paper.id} value={paper.id}>
                        {paper.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second row of filters */}
            <div className="flex gap-4 items-end">
              <div className="w-56">
                <Label htmlFor="filterSubject">Filter by Subject</Label>
                <Select 
                  value={selectedSubjectId} 
                  onValueChange={(value) => {
                    setSelectedSubjectId(value);
                    setSelectedChapterId("all");
                    setSelectedTopicId("all");
                  }}
                  disabled={selectedExamId === "all"}
                >
                  <SelectTrigger id="filterSubject" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {filteredSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label htmlFor="filterChapter">Filter by Chapter</Label>
                <Select 
                  value={selectedChapterId} 
                  onValueChange={(value) => {
                    setSelectedChapterId(value);
                    setSelectedTopicId("all");
                  }}
                  disabled={selectedSubjectId === "all"}
                >
                  <SelectTrigger id="filterChapter" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {filteredChapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label htmlFor="filterTopic">Filter by Topic</Label>
                <Select 
                  value={selectedTopicId} 
                  onValueChange={setSelectedTopicId}
                  disabled={selectedChapterId === "all"}
                >
                  <SelectTrigger id="filterTopic" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {filteredTopics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedExamId("all");
                  setSelectedPaperId("all");
                  setSelectedSubjectId("all");
                  setSelectedChapterId("all");
                  setSelectedTopicId("all");
                }}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Questions Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Question</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Exam</TableHead>
                  <TableHead className="whitespace-nowrap">Paper</TableHead>
                  <TableHead className="whitespace-nowrap">Difficulty</TableHead>
                  <TableHead className="whitespace-nowrap">Marks</TableHead>
                  <TableHead className="whitespace-nowrap">PYQ</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      <FileQuestion className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No questions found</p>
                      <p className="text-sm">Add your first question to get started</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-gray-500">
                      No questions found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={question.description}>
                          {question.description}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                          {question.type.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={getExamName(question.examId)}>
                          {getExamName(question.examId)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={getPaperName(question.paperId)}>
                          {getPaperName(question.paperId)}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            question.difficulty === 'easy' ? 'bg-green-500' :
                            question.difficulty === 'medium' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <span className="capitalize text-sm">{question.difficulty}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm">+{question.positiveMarks} / -{question.negativeMarks}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {question.isPreviousYearQuestion ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded w-fit">
                              Yes
                            </span>
                            {question.examDate && (
                              <span className="text-xs text-gray-600">
                                📅 {new Date(question.examDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={question.status === "published"}
                            onCheckedChange={(checked) => {
                              const newQuestions = questions.map(q => 
                                q.id === question.id 
                                  ? { ...q, status: checked ? "published" as const : "draft" as const }
                                  : q
                              );
                              setQuestions(newQuestions);
                            }}
                          />
                          <span className={`text-xs font-medium ${
                            question.status === "published" 
                              ? "text-green-600" 
                              : "text-gray-500"
                          }`}>
                            {question.status === "published" ? "Published" : "Draft"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(question.createdAt)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const queryParams = new URLSearchParams({
                                examId: question.examId || "",
                                paperId: question.paperId || "",
                                isPreviousYear: (question.isPreviousYearQuestion || false).toString(),
                                standalone: "true",
                                questionId: question.id,
                                type: question.type
                              });
                              router.push(`/question-onboarding/editor?${queryParams.toString()}`);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredQuestions.length > 0 && (
            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, filteredQuestions.length)}</span> of <span className="font-semibold text-gray-900">{filteredQuestions.length}</span> questions
                </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-9 h-9 p-0"
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              </div>
            </Card>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
