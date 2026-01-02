"use client";

import React, { useState, useRef, useEffect } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  FileImage, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Settings,
  Eye,
  Save,
  Zap,
  Brain,
  Edit,
  X,
  RefreshCw,
  AlertCircle,
  Trash2
} from "lucide-react";
import { aiService, LLMProvider, ExtractedQuestion } from "@/src/services/ai.service";
import { RichContentRenderer } from "@/src/components/ui/rich-content-renderer";
import { RichContentEditor } from "@/src/components/ui/rich-content-editor";
import examService from "@/src/services/exam.service";
import paperService from "@/src/services/paper.service";
import questionService from "@/src/services/question.service";

interface ProcessedQuestion extends ExtractedQuestion {
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  backendId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  isEditing?: boolean;
}

export default function BulkQuestionUploadPage() {
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [includeHints, setIncludeHints] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(true);
  
  const [defaultPositiveMarks, setDefaultPositiveMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);
  const [defaultDuration, setDefaultDuration] = useState<number | null>(120);
  const [noDuration, setNoDuration] = useState<boolean>(false);
  
  const [exams, setExams] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<string>('');
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);
  
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ProcessedQuestion[]>([]);
  const [originalQuestionData, setOriginalQuestionData] = useState<Map<string, ProcessedQuestion>>(new Map());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const questionFileRef = useRef<HTMLInputElement>(null);
  const solutionFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      try {
        const fetchedExams = await examService.getAllExams();
        setExams(fetchedExams);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchPapers();
    } else {
      setPapers([]);
      setSelectedPaper('');
    }
  }, [selectedExam]);

  const fetchPapers = async () => {
    try {
      setLoadingPapers(true);
      const fetchedPapers = await paperService.getAllPapers(selectedExam);
      setPapers(fetchedPapers);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoadingPapers(false);
    }
  };

  const handleQuestionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuestionFile(file);
    }
  };

  const handleSolutionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSolutionFile(file);
    }
  };

  const processQuestions = async () => {
    if (!questionFile || !selectedExam || !selectedPaper) {
      alert('Please select exam, paper, and upload a question file');
      return;
    }

    setIsProcessing(true);
    setExtractedQuestions([]);
    setCurrentPage(0);
    setTotalPages(0);
    setProcessingProgress(0);

    try {
      aiService.configure({
        provider: llmProvider,
        model: model
      });

      let solutionBase64: string | undefined;
      if (solutionFile) {
        solutionBase64 = await fileToBase64(solutionFile);
      }

      const isPDF = questionFile.type === 'application/pdf';

      if (isPDF) {
        await aiService.extractQuestionsFromPDF(questionFile, {
          includeHints,
          includeSolutions,
          solutionPdfBase64: solutionBase64,
          defaultPositiveMarks,
          defaultNegativeMarks,
          defaultDuration,
          onPageProcessed: async (pageNumber, questions) => {
            const processedQuestions: ProcessedQuestion[] = [];
            
            for (let i = 0; i < questions.length; i++) {
              const q = questions[i];
              
              try {
                const hierarchy = await aiService.matchHierarchy(
                  q.questionText,
                  q.subjectName,
                  q.chapterName,
                  q.topicName
                );
                
                const processedQuestion: ProcessedQuestion = {
                  ...q,
                  id: `q_${pageNumber}_${i}`,
                  status: 'pending',
                  subjectId: hierarchy.subjectId,
                  chapterId: hierarchy.chapterId,
                  topicId: hierarchy.topicId,
                  options: q.options?.map(opt => ({
                    ...opt,
                    id: opt.id || crypto.randomUUID()
                  }))
                };
                
                processedQuestions.push(processedQuestion);
              } catch (error) {
                console.error('Hierarchy matching error:', error);
                processedQuestions.push({
                  ...q,
                  id: `q_${pageNumber}_${i}`,
                  status: 'pending',
                  options: q.options?.map(opt => ({
                    ...opt,
                    id: opt.id || crypto.randomUUID()
                  }))
                });
              }
            }
            
            setExtractedQuestions(prev => [...prev, ...processedQuestions]);
          },
          onProgress: (current, total) => {
            setCurrentPage(current);
            setTotalPages(total);
            setProcessingProgress((current / total) * 100);
          }
        });
      } else {
        const imageBase64 = await fileToBase64(questionFile);
        const result = await aiService.extractQuestionsFromImage(imageBase64, {
          includeHints,
          includeSolutions,
          solutionPdfBase64: solutionBase64,
          defaultPositiveMarks,
          defaultNegativeMarks,
          defaultDuration
        });

        const processedQuestions: ProcessedQuestion[] = [];
        
        for (let i = 0; i < result.questions.length; i++) {
          const q = result.questions[i];
          
          try {
            const hierarchy = await aiService.matchHierarchy(
              q.questionText,
              q.subjectName,
              q.chapterName,
              q.topicName
            );
            
            processedQuestions.push({
              ...q,
              id: `q_${i}`,
              status: 'pending',
              subjectId: hierarchy.subjectId,
              chapterId: hierarchy.chapterId,
              topicId: hierarchy.topicId,
              options: q.options?.map(opt => ({
                ...opt,
                id: opt.id || crypto.randomUUID()
              }))
            });
          } catch (error) {
            console.error('Hierarchy matching error:', error);
            processedQuestions.push({
              ...q,
              id: `q_${i}`,
              status: 'pending',
              options: q.options?.map(opt => ({
                ...opt,
                id: opt.id || crypto.randomUUID()
              }))
            });
          }
        }
        
        setExtractedQuestions(processedQuestions);
      }

    } catch (error: any) {
      console.error('Processing error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const retryQuestion = async (questionId: string) => {
    const question = extractedQuestions.find(q => q.id === questionId);
    if (!question) return;

    setExtractedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, status: 'uploading' as const } : q)
    );

    try {
      const payload = buildQuestionPayload(question);
      const result = await questionService.createQuestion(payload as any);

      setExtractedQuestions(prev =>
        prev.map(q => q.id === questionId ? {
          ...q,
          status: 'success' as const,
          backendId: result.id,
          error: undefined
        } : q)
      );
    } catch (error: any) {
      setExtractedQuestions(prev =>
        prev.map(q => q.id === questionId ? {
          ...q,
          status: 'error' as const,
          error: error.message
        } : q)
      );
    }
  };

  const uploadSingleQuestion = async (questionId: string) => {
    const question = extractedQuestions.find(q => q.id === questionId);
    if (!question) return;

    if (!selectedPaper) {
      alert('Please select a paper');
      return;
    }

    setExtractedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, status: 'uploading' as const } : q)
    );

    try {
      const payload = buildQuestionPayload(question);
      const result = await questionService.createQuestion(payload as any);

      setExtractedQuestions(prev =>
        prev.map(q => q.id === questionId ? {
          ...q,
          status: 'success' as const,
          backendId: result.id,
          error: undefined
        } : q)
      );
    } catch (error: any) {
      setExtractedQuestions(prev =>
        prev.map(q => q.id === questionId ? {
          ...q,
          status: 'error' as const,
          error: error.message
        } : q)
      );
    }
  };

  const uploadToBackend = async () => {
    if (!selectedPaper) {
      alert('Please select a paper');
      return;
    }

    for (let i = 0; i < extractedQuestions.length; i++) {
      const question = extractedQuestions[i];
      
      if (question.status === 'success') continue;
      
      try {
        setExtractedQuestions(prev =>
          prev.map(q => q.id === question.id ? { ...q, status: 'uploading' } : q)
        );

        const payload = buildQuestionPayload(question);
        const result = await questionService.createQuestion(payload as any);

        setExtractedQuestions(prev =>
          prev.map(q => q.id === question.id ? {
            ...q,
            status: 'success',
            backendId: result.id
          } : q)
        );

      } catch (error: any) {
        setExtractedQuestions(prev =>
          prev.map(q => q.id === question.id ? {
            ...q,
            status: 'error',
            error: error.message
          } : q)
        );
      }
    }
  };

  const createRichContent = (text: string, images: any[] = [], isSolution: boolean = false): any => {
    const raw = text;
    
    const plain_text = text
      .replace(/\$\$([^\$]+)\$\$/g, '$1')
      .replace(/\$([^\$]+)\$/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/!\[.*?\]\(.*?\)(\{.*?\})?/g, '')
      .replace(/\*\*.*?\*\*/g, '')
      .trim();
    
    let html = text
      .replace(/\$\$([^\$]+)\$\$/g, (match, latex) =>
        `<div class="equation-block" data-latex="${latex.replace(/"/g, '&quot;')}">${latex}</div>`)
      .replace(/\$([^\$]+)\$/g, (match, latex) =>
        `<span class="equation-inline" data-latex="${latex.replace(/"/g, '&quot;')}">${latex}</span>`);
    
    // Process markdown images: ![alt](url){width=300px height=200px position=center}
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)(\{([^}]+)\})?/g, (match, alt, url, _, attrs) => {
      let style = 'max-width: 100%; height: auto; margin: 10px 0;';
      let className = 'question-image';
      
      if (attrs) {
        const width = attrs.match(/width=([^\s}]+)/)?.[1];
        const height = attrs.match(/height=([^\s}]+)/)?.[1];
        const position = attrs.match(/position=([^\s}]+)/)?.[1];
        
        if (width) style += ` width: ${width};`;
        if (height) style += ` height: ${height};`;
        if (position === 'center') style += ' display: block; margin-left: auto; margin-right: auto;';
        if (position === 'left') style += ' float: left; margin-right: 15px;';
        if (position === 'right') style += ' float: right; margin-left: 15px;';
      }
      
      return `<img src="${url}" alt="${alt}" class="${className}" style="${style}" />`;
    });
    
    // Convert **text** to <strong>text</strong> for bold
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle line breaks - convert \n\n to <br/><br/> and \n to <br/>
    html = html
      .replace(/\\n\\n/g, '<br/><br/>')
      .replace(/\\n/g, '<br/>');
    
    if (isSolution) {
      // Additional solution-specific formatting
      html = html
        .replace(/Key Concept (\d+):/g, '<br/><strong>Key Concept $1:</strong>')
        .replace(/Step (\d+):/g, '<br/><strong>Step $1:</strong>')
        .replace(/Given:/g, '<strong>Given:</strong>')
        .replace(/Final Answer:/g, '<br/><strong>Final Answer:</strong>')
        .replace(/^<br\/>/g, '');
    }
    
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    images.forEach(img => {
      if (img.s3Url) {
        html += `<img src="${img.s3Url}" alt="Image" class="question-image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      }
    });
    
    return { raw, html, plain_text };
  };

  const buildQuestionPayload = (question: ProcessedQuestion) => {
    const images = question.images || [];

    const payload: any = {
      answer_type: question.questionType,
      subject_id: question.subjectId || null,
      chapter_id: question.chapterId || null,
      topic_id: question.topicId || null,
      exam_id: selectedExam,
      paper_id: selectedPaper,
      content: {
        question: createRichContent(
          question.questionText,
          images.filter(img => img.location === 'question')
        ),
        hints: question.hint ? createRichContent(
          question.hint,
          images.filter(img => img.location === 'hint')
        ) : undefined
      },
      answer: {
        pool: question.options && question.options.length > 0 ? {
          options: question.options.map((opt, idx) => ({
            id: opt.id,
            label: opt.label,
            content: createRichContent(opt.text)
          }))
        } : null,
        key: question.questionType === 'SINGLE_CHOICE'
          ? { correct_option_id: question.options?.find(o => o.isCorrect)?.id }
          : question.questionType === 'MULTIPLE_CHOICE'
          ? { correct_option_ids: question.options?.filter(o => o.isCorrect).map(o => o.id) || [] }
          : question.questionType === 'NUMERICAL'
          ? { correct_value: question.correctAnswer }
          : {},
        solution: question.solution ? {
          explanation: createRichContent(
            question.solution,
            images.filter(img => img.location === 'solution'),
            true
          )
        } : undefined
      },
      positive_marks: question.positiveMarks,
      negative_marks: question.negativeMarks,
      difficulty: question.difficulty,
      duration_seconds: noDuration ? null : (question.durationSeconds || defaultDuration),
      tags: question.tags || [],
      is_previous_year_question: true
    };
    
    return payload;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const toggleEditQuestion = (questionId: string) => {
    setExtractedQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          if (!q.isEditing) {
            // Entering edit mode - store original data
            setOriginalQuestionData(prevMap => {
              const newMap = new Map(prevMap);
              newMap.set(questionId, { ...q });
              return newMap;
            });
          }
          return { ...q, isEditing: !q.isEditing };
        }
        return q;
      })
    );
  };

  const cancelEditQuestion = (questionId: string) => {
    const originalData = originalQuestionData.get(questionId);
    if (originalData) {
      setExtractedQuestions(prev =>
        prev.map(q => q.id === questionId ? { ...originalData, isEditing: false } : q)
      );
      // Remove from original data map
      setOriginalQuestionData(prevMap => {
        const newMap = new Map(prevMap);
        newMap.delete(questionId);
        return newMap;
      });
    }
  };

  const updateQuestionField = (questionId: string, field: string, value: any) => {
    setExtractedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, [field]: value } : q)
    );
  };

  const updateOptionText = (questionId: string, optionId: string, newText: string) => {
    setExtractedQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map(opt =>
              opt.id === optionId ? { ...opt, text: newText } : opt
            )
          };
        }
        return q;
      })
    );
  };

  const toggleCorrectOption = (questionId: string, optionId: string) => {
    setExtractedQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          const isSingleChoice = q.questionType === 'SINGLE_CHOICE';
          return {
            ...q,
            options: q.options.map(opt => {
              if (opt.id === optionId) {
                return { ...opt, isCorrect: !opt.isCorrect };
              }
              if (isSingleChoice && opt.isCorrect) {
                return { ...opt, isCorrect: false };
              }
              return opt;
            })
          };
        }
        return q;
      })
    );
  };

  const deleteQuestion = (questionId: string) => {
    setExtractedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800';
    if (difficulty <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Easy';
    if (difficulty <= 7) return 'Medium';
    return 'Hard';
  };

  return (
    <PageWrapper>
      <PageHeader title="AI-Powered Bulk Question Upload" />
      <div className="mb-6">
        <PageTitle backButton={{ enabled: false }}>
          AI-Powered Bulk Question Upload
        </PageTitle>
        <p className="text-sm text-gray-500 mt-2">
          Upload PDFs/images and let AI extract, process, and upload questions with page-by-page processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure your LLM provider</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>LLM Provider</Label>
                <Select value={llmProvider} onValueChange={(value: LLMProvider) => {
                  setLlmProvider(value);
                  if (value === 'gemini') {
                    setModel('gemini-2.5-flash');
                  } else {
                    setModel('gpt-4o-mini');
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Google Gemini
                      </div>
                    </SelectItem>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        OpenAI GPT-4o
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {llmProvider === 'gemini' ? (
                      <>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                        <SelectItem value="gpt-5">GPT-5</SelectItem>
                        <SelectItem value="gpt-5.1">GPT-5.1</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold">Default Marking Schema</Label>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Positive</Label>
                    <Input
                      type="number"
                      value={defaultPositiveMarks}
                      onChange={(e) => setDefaultPositiveMarks(Number(e.target.value))}
                      min="0"
                      step="0.5"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Negative</Label>
                    <Input
                      type="number"
                      value={defaultNegativeMarks}
                      onChange={(e) => setDefaultNegativeMarks(Number(e.target.value))}
                      min="0"
                      step="0.5"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (s)</Label>
                    <Input
                      type="number"
                      value={defaultDuration || ''}
                      onChange={(e) => setDefaultDuration(e.target.value ? Number(e.target.value) : null)}
                      min="0"
                      step="10"
                      className="mt-1"
                      disabled={noDuration}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={noDuration}
                    onCheckedChange={(checked) => {
                      setNoDuration(checked);
                      if (checked) setDefaultDuration(null);
                      else setDefaultDuration(120);
                    }}
                  />
                  <Label className="text-xs">No duration</Label>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Generate Hints</Label>
                  <Switch checked={includeHints} onCheckedChange={setIncludeHints} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Generate Detailed Solutions</Label>
                  <Switch checked={includeSolutions} onCheckedChange={setIncludeSolutions} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exam & Paper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loadingExams}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={loadingExams ? "Loading..." : "Select exam"} />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Paper</Label>
                <Select
                  value={selectedPaper}
                  onValueChange={setSelectedPaper}
                  disabled={!selectedExam || loadingPapers}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={
                      !selectedExam ? "Select exam first" :
                      loadingPapers ? "Loading..." :
                      "Select paper"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {papers.map((paper) => (
                      <SelectItem key={paper.id} value={paper.id}>
                        {paper.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question Paper (Image/PDF)</Label>
                <input
                  ref={questionFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleQuestionFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => questionFileRef.current?.click()}
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  {questionFile ? questionFile.name : 'Choose File'}
                </Button>
              </div>

              <div>
                <Label>Solution PDF (Optional)</Label>
                <input
                  ref={solutionFileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleSolutionFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => solutionFileRef.current?.click()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {solutionFile ? solutionFile.name : 'Choose File'}
                </Button>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={processQuestions}
                disabled={!questionFile || !selectedExam || !selectedPaper || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start AI Processing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Progress</CardTitle>
                <CardDescription>
                  {totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'Initializing...'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={processingProgress} className="w-full" />
                <p className="text-sm text-gray-500 mt-2">
                  {extractedQuestions.length} questions extracted so far
                </p>
              </CardContent>
            </Card>
          )}

          {extractedQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Questions ({extractedQuestions.length})</CardTitle>
                    <CardDescription>Review, edit, and upload to backend</CardDescription>
                  </div>
                  <Button
                    onClick={uploadToBackend}
                    disabled={extractedQuestions.some(q => q.status === 'uploading')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Upload All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extractedQuestions.map((question, index) => (
                    <Card key={question.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Q{index + 1}</Badge>
                              {question.pageNumber && (
                                <Badge variant="secondary">Page {question.pageNumber}</Badge>
                              )}
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {getDifficultyLabel(question.difficulty)} ({question.difficulty}/10)
                              </Badge>
                              <Badge variant="outline">{question.questionType}</Badge>
                              {question.status === 'success' && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Uploaded
                                </Badge>
                              )}
                              {question.status === 'error' && (
                                <Badge className="bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {question.status === 'uploading' && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Uploading
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {question.subjectName} → {question.chapterName} → {question.topicName}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {question.isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => toggleEditQuestion(question.id)}
                                >
                                  <Save className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelEditQuestion(question.id)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleEditQuestion(question.id)}
                                title="Edit question"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {question.status === 'success' && question.backendId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/question-view/${question.backendId}`, '_blank')}
                                title="View question"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            {(question.status === 'pending' || question.status === 'error' || question.status === 'uploading') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => uploadSingleQuestion(question.id)}
                                disabled={question.status === 'uploading'}
                                title="Upload this question"
                              >
                                <Upload className="w-4 h-4" />
                              </Button>
                            )}
                            {question.status === 'error' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryQuestion(question.id)}
                                title="Retry upload"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteQuestion(question.id)}
                              title="Delete question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {question.isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <RichContentEditor
                                label="Question Text"
                                value={{
                                  raw: question.questionText,
                                  html: question.questionText,
                                  plainText: question.questionText,
                                  assets: []
                                }}
                                onChange={(content) => updateQuestionField(question.id, 'questionText', content.raw)}
                                placeholder="Enter your question here. You can use formatting, equations ($x^2$), and images..."
                                allowImages={true}
                                allowEquations={true}
                              />
                            </div>

                            {question.options && question.options.length > 0 && (
                              <div>
                                <Label>Options (Click button to toggle correct)</Label>
                                <div className="space-y-3 mt-2">
                                  {question.options.map((opt) => (
                                    <div key={opt.id} className="flex items-start gap-2 p-3 border rounded-lg">
                                      <Button
                                        size="sm"
                                        variant={opt.isCorrect ? "default" : "outline"}
                                        onClick={() => toggleCorrectOption(question.id, opt.id)}
                                        className="w-10 h-10 p-0 flex-shrink-0 mt-1"
                                      >
                                        {opt.label}
                                      </Button>
                                      <div className="flex-1">
                                        <RichContentEditor
                                          value={{
                                            raw: opt.text,
                                            html: opt.text,
                                            plainText: opt.text,
                                            assets: []
                                          }}
                                          onChange={(content) => updateOptionText(question.id, opt.id, content.raw)}
                                          placeholder={`Enter option ${opt.label} (supports equations: $x^2$)`}
                                          allowImages={false}
                                          allowEquations={true}
                                          className="min-h-[60px]"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <RichContentEditor
                                label="Hint (Optional)"
                                value={{
                                  raw: question.hint || '',
                                  html: question.hint || '',
                                  plainText: question.hint || '',
                                  assets: []
                                }}
                                onChange={(content) => updateQuestionField(question.id, 'hint', content.raw)}
                                placeholder="Provide a hint for this question..."
                                allowImages={true}
                                allowEquations={true}
                              />
                            </div>

                            <div>
                              <RichContentEditor
                                label="Solution (Optional)"
                                value={{
                                  raw: question.solution || '',
                                  html: question.solution || '',
                                  plainText: question.solution || '',
                                  assets: []
                                }}
                                onChange={(content) => updateQuestionField(question.id, 'solution', content.raw)}
                                placeholder="Provide a detailed solution with step-by-step explanation..."
                                allowImages={true}
                                allowEquations={true}
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Difficulty (1-10)</Label>
                                <Input
                                  type="number"
                                  value={question.difficulty}
                                  onChange={(e) => updateQuestionField(question.id, 'difficulty', Number(e.target.value))}
                                  min="1"
                                  max="10"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Positive Marks</Label>
                                <Input
                                  type="number"
                                  value={question.positiveMarks}
                                  onChange={(e) => updateQuestionField(question.id, 'positiveMarks', Number(e.target.value))}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Negative Marks</Label>
                                <Input
                                  type="number"
                                  value={question.negativeMarks}
                                  onChange={(e) => updateQuestionField(question.id, 'negativeMarks', Number(e.target.value))}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <div className="font-medium mb-2">Question:</div>
                              <RichContentRenderer content={createRichContent(question.questionText)} />
                            </div>

                            {question.options && question.options.length > 0 && (
                              <div>
                                <div className="font-medium mb-2">Options:</div>
                                <div className="space-y-1">
                                  {question.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className={`p-2 rounded ${opt.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                                    >
                                      <span className="font-semibold">{opt.label}.</span>{' '}
                                      <RichContentRenderer content={createRichContent(opt.text)} />
                                      {opt.isCorrect && <CheckCircle2 className="w-4 h-4 inline ml-2 text-green-600" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {question.hint && (
                              <div>
                                <div className="font-medium mb-2">Hint:</div>
                                <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                                  <RichContentRenderer content={createRichContent(question.hint)} />
                                </div>
                              </div>
                            )}

                            {question.solution && (
                              <div>
                                <div className="font-medium mb-2">Solution:</div>
                                <div className="text-sm bg-gray-50 p-3 rounded">
                                  <RichContentRenderer content={createRichContent(question.solution, [], true)} />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>+{question.positiveMarks} marks</span>
                              <span>-{question.negativeMarks} marks</span>
                              {question.durationSeconds && <span>{question.durationSeconds}s</span>}
                            </div>

                            {question.error && (
                              <div className="bg-red-50 border border-red-200 p-2 rounded text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                {question.error}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
