"use client";

import React, { useState, useEffect } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, FileQuestion, BookOpen, CheckCircle2, ListTodo, Calculator, TrendingUp, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RichContentRenderer } from "@/src/components/ui/rich-content-renderer";
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
import examService from '@/src/services/exam.service';
import paperService from '@/src/services/paper.service';
import hierarchyService from '@/src/services/hierarchy.service';
import questionService, { QuestionResponse, QuestionStatus, QuestionStatistics, QuestionDifficulty, AnswerType } from '@/src/services/question.service';
import { toast } from 'sonner';

export default function QuestionOnboardingPage() {
  const router = useRouter();
  
  // API data states
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [dialogPapers, setDialogPapers] = useState<Paper[]>([]); // Papers for create dialog
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<QuestionStatistics>({
    total_questions: 0,
    draft_questions: 0,
    under_review_questions: 0,
    published_questions: 0,
    pyq_questions: 0,
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [selectedPaperId, setSelectedPaperId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<QuestionStatus[]>(["DRAFT", "UNDER_REVIEW"]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<QuestionDifficulty[]>([]);
  const [selectedAnswerTypes, setSelectedAnswerTypes] = useState<AnswerType[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0); // API uses 0-based indexing
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQuestionData, setNewQuestionData] = useState({
    examId: "",
    paperId: "",
    isPreviousYearQuestion: false,
  });

  // Fetch papers for dialog when exam changes
  useEffect(() => {
    const fetchDialogPapers = async () => {
      if (newQuestionData.examId) {
        try {
          const papersData = await paperService.getAllPapers(newQuestionData.examId);
          setDialogPapers(papersData);
        } catch (error) {
          console.error('Failed to fetch papers for dialog:', error);
          setDialogPapers([]);
        }
      } else {
        setDialogPapers([]);
      }
    };
    fetchDialogPapers();
  }, [newQuestionData.examId]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [examsData, subjectsData] = await Promise.all([
          examService.getAllExams(),
          hierarchyService.getAllSubjects()
        ]);
        setExams(examsData);
        setSubjects(subjectsData);
        
        if (examsData.length > 0) {
          setNewQuestionData(prev => ({ ...prev, examId: examsData[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        toast.error('Failed to load data');
      }
    };
    fetchInitialData();
  }, []);

  // Fetch questions when filters change
  useEffect(() => {
    fetchQuestions();
  }, [currentPage, searchTerm, selectedExamId, selectedPaperId, selectedSubjectId, selectedChapterId, selectedTopicId, selectedStatuses, selectedDifficulties, selectedAnswerTypes]);

  // Fetch papers when exam changes
  useEffect(() => {
    if (selectedExamId && selectedExamId !== 'all') {
      fetchPapers(selectedExamId);
    } else {
      setPapers([]);
    }
  }, [selectedExamId]);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== 'all') {
      fetchChapters(selectedSubjectId);
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId]);

  // Fetch topics when chapter changes
  useEffect(() => {
    if (selectedChapterId && selectedChapterId !== 'all') {
      fetchTopics(selectedChapterId);
    } else {
      setTopics([]);
    }
  }, [selectedChapterId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionService.searchQuestions({
        page: currentPage,
        size: pageSize,
        sort_by: 'createdOn',
        sort_direction: 'DESC',
        statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        difficulties: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
        answer_types: selectedAnswerTypes.length > 0 ? selectedAnswerTypes : undefined,
        exam_id: selectedExamId !== 'all' ? selectedExamId : undefined,
        paper_id: selectedPaperId !== 'all' ? selectedPaperId : undefined,
        subject_id: selectedSubjectId !== 'all' ? selectedSubjectId : undefined,
        chapter_id: selectedChapterId !== 'all' ? selectedChapterId : undefined,
        topic_id: selectedTopicId !== 'all' ? selectedTopicId : undefined,
        search_text: searchTerm || undefined,
      });
      
      setQuestions(response.questions);
      setStatistics(response.statistics);
      setTotalPages(response.total_pages);
      setTotalElements(response.total_elements);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async (examId: string) => {
    try {
      const papersData = await paperService.getAllPapers(examId);
      setPapers(papersData);
    } catch (error) {
      console.error('Failed to fetch papers:', error);
    }
  };

  const fetchChapters = async (subjectId: string) => {
    try {
      const chaptersData = await hierarchyService.getChaptersBySubject(subjectId);
      setChapters(chaptersData);
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const fetchTopics = async (chapterId: string) => {
    try {
      const topicsData = await hierarchyService.getTopicsByChapter(chapterId);
      setTopics(topicsData);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const filteredPapers = papers;
  const filteredSubjects = subjects;
  const filteredChapters = chapters;
  const filteredTopics = topics;

  // Statistics from API
  const stats = {
    total: statistics.total_questions,
    draft: statistics.draft_questions,
    underReview: statistics.under_review_questions,
    pyq: statistics.pyq_questions,
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, selectedExamId, selectedPaperId, selectedSubjectId, selectedTopicId, selectedChapterId, selectedStatuses, selectedDifficulties, selectedAnswerTypes]);

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

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      try {
        await questionService.deleteQuestion(questionId);
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (error) {
        console.error('Failed to delete question:', error);
        toast.error('Failed to delete question');
      }
    }
  };

  const getExamName = (examId?: string) => {
    return exams.find(e => e.id === examId)?.name || "Unknown Exam";
  };

  const getPaperName = (paperId?: string) => {
    return papers.find(p => p.id === paperId)?.name || "No Paper";
  };

  const getSubjectName = (subjectId?: string) => {
    return subjects.find(s => s.id === subjectId)?.name || "N/A";
  };

  const getChapterName = (chapterId?: string) => {
    return chapters.find(c => c.id === chapterId)?.name || "N/A";
  };

  const getTopicName = (topicId?: string) => {
    return topics.find(t => t.id === topicId)?.name || "N/A";
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleStatusChange = async (questionId: string, newStatus: QuestionStatus) => {
    try {
      await questionService.updateQuestion(questionId, { status: newStatus } as any);
      toast.success('Status updated successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <>
      <PageHeader title="Question Onboarding" />
      <PageWrapper>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <PageTitle>Draft + Under Review Questions</PageTitle>
              <p className="text-gray-600 mt-1">Manage questions pending review and publication</p>
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
                        {exams.length === 0 ? (
                          <div className="p-2 text-center text-sm text-gray-500">
                            No exams available
                          </div>
                        ) : (
                          exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>
                              {exam.name}
                            </SelectItem>
                          ))
                        )}
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
                          {dialogPapers.length === 0 ? (
                            <div className="p-2 text-center text-sm text-gray-500">
                              No papers available for this exam
                            </div>
                          ) : (
                            dialogPapers.map((paper) => (
                              <SelectItem key={paper.id} value={paper.id}>
                                {paper.name}
                              </SelectItem>
                            ))
                          )}
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
                  <p className="text-sm font-medium text-blue-700 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <FileQuestion className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </Card>

            {/* Draft Questions */}
            <Card className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Draft</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.draft}</p>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <ListTodo className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </Card>

            {/* Under Review Questions */}
            <Card className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 mb-1">Under Review</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.underReview}</p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-lg">
                  <BookOpen className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </Card>

            {/* Previous Year Questions */}
            <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">PYQ</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.pyq}</p>
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
                    {exams.map((exam) => (
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
            </div>

            {/* Third row of filters - Status, Difficulty, Answer Type */}
            <div className="flex gap-4 items-end">
              <div className="w-56">
                <Label htmlFor="filterStatus">Filter by Status</Label>
                <Select 
                  value={selectedStatuses.join(',')} 
                  onValueChange={(value) => {
                    setSelectedStatuses(value ? value.split(',') as QuestionStatus[] : []);
                  }}
                >
                  <SelectTrigger id="filterStatus" className="mt-1">
                    <SelectValue placeholder="Select statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT,UNDER_REVIEW">Draft + Under Review</SelectItem>
                    <SelectItem value="DRAFT">Draft Only</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review Only</SelectItem>
                    <SelectItem value="PUBLISHED">Published Only</SelectItem>
                    <SelectItem value="ARCHIVED">Archived Only</SelectItem>
                    <SelectItem value="DRAFT,UNDER_REVIEW,PUBLISHED,ARCHIVED">All Statuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label htmlFor="filterDifficulty">Filter by Difficulty</Label>
                <Select 
                  value={selectedDifficulties.length === 0 ? 'all' : selectedDifficulties.join(',')} 
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedDifficulties([]);
                    } else {
                      setSelectedDifficulties(value.split(',').filter(Boolean) as QuestionDifficulty[]);
                    }
                  }}
                >
                  <SelectTrigger id="filterDifficulty" className="mt-1">
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="EASY">Easy Only</SelectItem>
                    <SelectItem value="MEDIUM">Medium Only</SelectItem>
                    <SelectItem value="HARD">Hard Only</SelectItem>
                    <SelectItem value="EASY,MEDIUM">Easy + Medium</SelectItem>
                    <SelectItem value="MEDIUM,HARD">Medium + Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label htmlFor="filterAnswerType">Filter by Answer Type</Label>
                <Select 
                  value={selectedAnswerTypes.length === 0 ? 'all' : selectedAnswerTypes.join(',')} 
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedAnswerTypes([]);
                    } else {
                      setSelectedAnswerTypes(value.split(',').filter(Boolean) as AnswerType[]);
                    }
                  }}
                >
                  <SelectTrigger id="filterAnswerType" className="mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="SINGLE_CHOICE">Single Choice</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                    <SelectItem value="NUMERICAL">Numerical</SelectItem>
                    <SelectItem value="PARAGRAPH">Paragraph</SelectItem>
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
                  setSelectedStatuses(["DRAFT", "UNDER_REVIEW"]);
                  setSelectedDifficulties([]);
                  setSelectedAnswerTypes([]);
                }}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Questions Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Question</TableHead>
                    <TableHead className="w-[12%]">Type</TableHead>
                    <TableHead className="w-[10%]">Difficulty</TableHead>
                    <TableHead className="w-[8%]">Marks</TableHead>
                    <TableHead className="w-[6%]">PYQ</TableHead>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[10%]">Created</TableHead>
                    <TableHead className="w-[9%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Loading questions...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : questions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <FileQuestion className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No questions found</p>
                      <p className="text-sm">Add your first question or adjust your filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div className="text-sm break-words overflow-hidden line-clamp-3">
                          {question.content.question.html ? (
                            <RichContentRenderer 
                              content={{
                                raw: question.content.question.raw || '',
                                html: question.content.question.html.replace(/<img[^>]*>/g, ''),
                                plainText: question.content.question.plain_text || '',
                                assets: []
                              }} 
                              className="text-sm"
                            />
                          ) : (
                            <span className="text-gray-400 italic">No content</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize whitespace-nowrap">
                          {question.answer_type.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            question.difficulty_label === 'EASY' ? 'bg-green-500' :
                            question.difficulty_label === 'MEDIUM' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <span className="capitalize text-sm whitespace-nowrap">{question.difficulty_label.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">+{question.positive_marks} / -{question.negative_marks}</span>
                      </TableCell>
                      <TableCell>
                        {question.is_previous_year_question ? (
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">No</span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <Select
                          value={question.status}
                          onValueChange={(value: QuestionStatus) => handleStatusChange(question.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT" disabled>
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                Draft
                              </span>
                            </SelectItem>
                            <SelectItem value="UNDER_REVIEW">
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                Under Review
                              </span>
                            </SelectItem>
                            <SelectItem value="PUBLISHED">
                              <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Published
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {new Date(question.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/question-view/${question.id}`)}
                            title="View question"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const queryParams = new URLSearchParams({
                                examId: question.exam_id || "",
                                paperId: question.paper_id || "",
                                isPreviousYear: question.is_previous_year_question.toString(),
                                standalone: "true",
                                questionId: question.id,
                                type: question.answer_type
                              });
                              router.push(`/question-onboarding/editor?${queryParams.toString()}`);
                            }}
                            title="Edit question"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            title="Delete question"
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
          </div>

          {/* Pagination Controls */}
          {!loading && totalElements > 0 && (
            <Card className="p-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{currentPage * pageSize + 1}</span> to <span className="font-semibold text-gray-900">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of <span className="font-semibold text-gray-900">{totalElements}</span> questions
                </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 0 ||
                      page === totalPages - 1 ||
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
                          {page + 1}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
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
