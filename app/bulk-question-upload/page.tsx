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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Image as ImageIcon,
  FileCheck,
  Edit,
  X
} from "lucide-react";
import { aiService, LLMProvider, ExtractedQuestion } from "@/src/services/ai.service";
import { RichContentRenderer } from "@/src/components/ui/rich-content-renderer";
import examService from "@/src/services/exam.service";
import paperService from "@/src/services/paper.service";
import questionService from "@/src/services/question.service";

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

interface ProcessedQuestion extends ExtractedQuestion {
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  backendId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
}

export default function BulkQuestionUploadPage() {
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [includeHints, setIncludeHints] = useState(true);
  const [includeSolutions, setIncludeSolutions] = useState(true);
  
  // Default marking schema (used if not found in PDF)
  const [defaultPositiveMarks, setDefaultPositiveMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);
  const [defaultDuration, setDefaultDuration] = useState<number | null>(120);
  const [noDuration, setNoDuration] = useState<boolean>(false);
  
  // Exam and Paper selection
  const [exams, setExams] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedPaper, setSelectedPaper] = useState<string>('');
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);
  
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [questionFilePreview, setQuestionFilePreview] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [extractedQuestions, setExtractedQuestions] = useState<ProcessedQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  const questionFileRef = useRef<HTMLInputElement>(null);
  const solutionFileRef = useRef<HTMLInputElement>(null);

  const steps: ProcessingStep[] = [
    { id: 'upload', name: 'File Upload', status: 'pending' },
    { id: 'parse', name: 'AI Parsing', status: 'pending' },
    { id: 'extract', name: 'Question Extraction', status: 'pending' },
    { id: 'hierarchy', name: 'Subject/Chapter/Topic Matching', status: 'pending' },
    { id: 'images', name: 'Image Processing', status: 'pending' },
    { id: 'latex', name: 'LaTeX Conversion', status: 'pending' },
    { id: 'hints', name: 'Hint Generation', status: 'pending' },
    { id: 'solutions', name: 'Solution Matching', status: 'pending' },
    { id: 'upload-backend', name: 'Backend Upload', status: 'pending' }
  ];

  // Fetch exams on mount
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

  // Fetch papers when exam is selected
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
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setQuestionFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolutionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSolutionFile(file);
    }
  };

  const updateStep = (stepId: string, status: ProcessingStep['status'], message?: string) => {
    setProcessingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status, message } : step
      )
    );
  };

  const processQuestions = async () => {
    if (!questionFile || !selectedExam || !selectedPaper) {
      alert('Please select exam, paper, and upload a question file');
      return;
    }

    setIsProcessing(true);
    setProcessingSteps(steps);
    setExtractedQuestions([]);

    try {
      // Step 1: File Upload
      updateStep('upload', 'processing', 'Reading file...');
      const questionBase64 = questionFilePreview;
      let solutionBase64: string | undefined;
      
      if (solutionFile) {
        solutionBase64 = await fileToBase64(solutionFile);
      }
      updateStep('upload', 'completed', 'Files loaded successfully');

      // Step 2: Configure AI
      updateStep('parse', 'processing', 'Initializing AI model...');
      aiService.configure({
        provider: llmProvider,
        model: model
      });
      updateStep('parse', 'completed', `${llmProvider.toUpperCase()} configured`);

      // Step 3: Extract Questions
      updateStep('extract', 'processing', 'AI is analyzing the document...');
      const result = await aiService.extractQuestionsFromImage(questionBase64, {
        includeHints,
        includeSolutions,
        solutionPdfBase64: solutionBase64,
        defaultPositiveMarks,
        defaultNegativeMarks,
        defaultDuration
      });
      updateStep('extract', 'completed', `Found ${result.questions.length} questions`);

      // Step 4: Match Subject/Chapter/Topic using AI
      updateStep('hierarchy', 'processing', 'Matching subjects, chapters, and topics...');
      const questionsWithHierarchy = [];
      
      for (let i = 0; i < result.questions.length; i++) {
        const q = result.questions[i];
        try {
          const hierarchy = await aiService.matchHierarchy(
            q.questionText,
            q.subjectName,
            q.chapterName,
            q.topicName
          );
          questionsWithHierarchy.push({
            ...q,
            subjectId: hierarchy.subjectId,
            chapterId: hierarchy.chapterId,
            topicId: hierarchy.topicId
          });
        } catch (error) {
          console.error('Hierarchy matching error:', error);
          questionsWithHierarchy.push(q);
        }
      }
      updateStep('hierarchy', 'completed', `Matched ${questionsWithHierarchy.length} questions to hierarchy`);

      // Step 5: Process Images (with live preview)
      updateStep('images', 'processing', 'Processing questions...');
      const processedQuestions: ProcessedQuestion[] = [];
      
      for (let i = 0; i < questionsWithHierarchy.length; i++) {
        const q = questionsWithHierarchy[i];
        updateStep('images', 'processing', `Processing question ${i + 1}/${questionsWithHierarchy.length}...`);
        
        const processedImages = [];
        
        // Only process images if they exist
        if (q.images && Array.isArray(q.images)) {
          for (const img of q.images) {
            try {
              const optimized = await aiService.cropAndOptimizeImage(img.base64);
              const s3Url = await aiService.uploadImageToS3(optimized, `question_${Date.now()}_${i}.jpg`);
              processedImages.push({
                ...img,
                s3Url
              });
            } catch (error) {
              console.error('Image processing error:', error);
            }
          }
        }
        
        const processedQuestion = {
          ...q,
          id: `q_${i}`,
          status: 'pending' as const,
          images: processedImages as any,
          // Generate UUIDs for options if they don't have IDs
          options: q.options?.map(opt => ({
            ...opt,
            id: opt.id || crypto.randomUUID()
          }))
        };
        
        processedQuestions.push(processedQuestion);
        
        // Update UI with current question immediately (live preview)
        setExtractedQuestions([...processedQuestions]);
      }
      
      updateStep('images', 'completed', `Processed ${processedQuestions.reduce((acc, q) => acc + q.images.length, 0)} images`);

      // Step 6: LaTeX Conversion
      updateStep('latex', 'completed', `Converted ${processedQuestions.reduce((acc, q) => acc + q.rawLatex.length, 0)} equations`);

      // Step 7: Hints
      if (includeHints) {
        updateStep('hints', 'completed', `Generated hints for ${processedQuestions.length} questions`);
      } else {
        updateStep('hints', 'completed', 'Skipped');
      }

      // Step 8: Solutions
      if (includeSolutions) {
        updateStep('solutions', 'completed', `Matched solutions for ${processedQuestions.length} questions`);
      } else {
        updateStep('solutions', 'completed', 'Skipped');
      }

      // Step 9: Ready for upload
      updateStep('upload-backend', 'pending', 'Ready to upload to backend');

    } catch (error: any) {
      console.error('Processing error:', error);
      const currentStepId = processingSteps.find(s => s.status === 'processing')?.id;
      if (currentStepId) {
        updateStep(currentStepId, 'error', error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadToBackend = async () => {
    if (!selectedPaper) {
      alert('Please select a paper');
      return;
    }

    updateStep('upload-backend', 'processing', 'Uploading questions...');

    for (let i = 0; i < extractedQuestions.length; i++) {
      const question = extractedQuestions[i];
      
      try {
        setExtractedQuestions(prev => 
          prev.map(q => q.id === question.id ? { ...q, status: 'uploading' } : q)
        );

        // Build question payload
        const payload = buildQuestionPayload(question);

        // Upload to backend using question service
        const result = await questionService.createQuestion(payload as any);

        setExtractedQuestions(prev => 
          prev.map(q => q.id === question.id ? { 
            ...q, 
            status: 'success',
            backendId: result.question_id 
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

    const successCount = extractedQuestions.filter(q => q.status === 'success').length;
    updateStep('upload-backend', 'completed', `Uploaded ${successCount}/${extractedQuestions.length} questions`);
  };

  // Helper to create RichContent with proper format (used in payload and preview)
  const createRichContent = (text: string, images: any[] = [], isSolution: boolean = false): any => {
    // Raw: Original text with LaTeX (e.g., "What is $x^2 + y^2$?")
    const raw = text;
    
    // Plain text: Strip LaTeX delimiters and HTML tags
    const plain_text = text
      .replace(/\$\$([^\$]+)\$\$/g, '$1') // Block LaTeX
      .replace(/\$([^\$]+)\$/g, '$1')     // Inline LaTeX
      .replace(/<[^>]*>/g, '')            // HTML tags
      .trim();
    
    // HTML: Convert LaTeX to format expected by RichContentRenderer
    // Use equation-block and equation-inline classes with data-latex attribute
    let html = text
      .replace(/\$\$([^\$]+)\$\$/g, (match, latex) => 
        `<div class="equation-block" data-latex="${latex.replace(/"/g, '&quot;')}">${latex}</div>`)
      .replace(/\$([^\$]+)\$/g, (match, latex) => 
        `<span class="equation-inline" data-latex="${latex.replace(/"/g, '&quot;')}">${latex}</span>`);
    
    // For solutions, add line breaks after step markers for better readability
    if (isSolution) {
      html = html
        .replace(/Step (\d+):/g, '<br/><strong>Step $1:</strong>')
        .replace(/^<br\/>/, ''); // Remove leading line break
    }
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }
    
    // Add images if any
    images.forEach(img => {
      if (img.s3Url) {
        html += `<img src="${img.s3Url}" alt="Image" class="question-image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      }
    });
    
    return { raw, html, plain_text };
  };

  // Helper functions for preview rendering
  const convertToHTML = (text: string, images: any[] = [], isSolution: boolean = false) => {
    return createRichContent(text, images, isSolution).html;
  };

  const stripHTML = (text: string) => {
    return createRichContent(text).plain_text;
  };

  const buildQuestionPayload = (question: ProcessedQuestion) => {
    // Ensure images array exists
    const images = question.images || [];

    // Log for debugging
    console.log('Building payload for question:', {
      subjectId: question.subjectId,
      chapterId: question.chapterId,
      topicId: question.topicId,
      hasOptions: !!question.options,
      optionCount: question.options?.length
    });

    // Build the payload according to API contract
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
            id: opt.id, // UUID generated during processing
            label: opt.label, // A, B, C, D or (A), (1), etc.
            content: createRichContent(opt.text)
          }))
        } : null,
        key: question.questionType === 'SINGLE_CHOICE' 
          ? { correct_option_id: question.options?.find(o => o.isCorrect)?.id }
          : question.questionType === 'MULTIPLE_CHOICE'
          ? { correct_option_ids: question.options?.filter(o => o.isCorrect).map(o => o.id) || [] }
          : {}, // For NUMERICAL type
        solution: question.solution ? {
          explanation: createRichContent(
            question.solution,
            images.filter(img => img.location === 'solution'),
            true // isSolution = true for formatting
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

  const handleEditQuestion = (question: ProcessedQuestion) => {
    setEditingQuestionId(question.id);
    setEditFormData({
      hint: question.hint || '',
      solution: question.solution || '',
      correctOptions: question.options.filter(o => o.isCorrect).map(o => o.label)
    });
  };

  const handleSaveEdit = () => {
    if (!editingQuestionId || !editFormData) return;

    setExtractedQuestions(prev => prev.map(q => {
      if (q.id === editingQuestionId) {
        return {
          ...q,
          hint: editFormData.hint,
          solution: editFormData.solution,
          options: q.options.map(opt => ({
            ...opt,
            isCorrect: editFormData.correctOptions.includes(opt.label)
          }))
        };
      }
      return q;
    }));

    setEditingQuestionId(null);
    setEditFormData(null);
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditFormData(null);
  };

  return (
    <PageWrapper>
      <PageHeader title="AI-Powered Bulk Question Upload" />
      <div className="mb-6">
        <PageTitle backButton={{ enabled: false }}>
          AI-Powered Bulk Question Upload
        </PageTitle>
        <p className="text-sm text-gray-500 mt-2">
          Upload images or PDFs and let AI extract, process, and upload questions automatically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
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
                  // Set default model based on provider
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
                        Google Gemini (Free Tier)
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
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast & Free)</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (More Accurate)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Most Capable)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                </div>

              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-semibold">Default Marking Schema</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Used if not found in question paper
                </p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Positive Marks</Label>
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
                    <Label className="text-xs">Negative Marks</Label>
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
                    <Label className="text-xs">Duration (sec)</Label>
                    <Input 
                      type="number" 
                      value={defaultDuration || ''}
                      onChange={(e) => setDefaultDuration(e.target.value ? Number(e.target.value) : null)}
                      min="0"
                      step="10"
                      className="mt-1"
                      disabled={noDuration}
                      placeholder={noDuration ? "No duration" : "120"}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Switch 
                    checked={noDuration} 
                    onCheckedChange={(checked) => {
                      setNoDuration(checked);
                      if (checked) setDefaultDuration(null);
                      else setDefaultDuration(120);
                    }}
                  />
                  <Label className="text-xs cursor-pointer" onClick={() => {
                    const newValue = !noDuration;
                    setNoDuration(newValue);
                    if (newValue) setDefaultDuration(null);
                    else setDefaultDuration(120);
                  }}>
                    No duration per question (null)
                  </Label>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Generate Hints</Label>
                  <Switch checked={includeHints} onCheckedChange={setIncludeHints} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Generate Solutions</Label>
                  <Switch checked={includeSolutions} onCheckedChange={setIncludeSolutions} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Exam & Paper Selection
              </CardTitle>
              <CardDescription>Select target exam and paper</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam} disabled={loadingExams}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={loadingExams ? "Loading exams..." : "Select exam"} />
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
                      loadingPapers ? "Loading papers..." :
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

        {/* Right Panel - Processing & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Processing Steps */}
          {processingSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Pipeline</CardTitle>
                <CardDescription>AI is working its magic ✨</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processingSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {step.status === 'completed' && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        {step.status === 'processing' && (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        )}
                        {step.status === 'error' && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{step.name}</span>
                          <Badge variant={
                            step.status === 'completed' ? 'default' :
                            step.status === 'processing' ? 'secondary' :
                            step.status === 'error' ? 'destructive' : 'outline'
                          }>
                            {step.status}
                          </Badge>
                        </div>
                        {step.message && (
                          <p className="text-sm text-gray-500 mt-1">{step.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Questions */}
          {extractedQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Questions ({extractedQuestions.length})</CardTitle>
                    <CardDescription>Review and upload to backend</CardDescription>
                  </div>
                  <Button
                    onClick={uploadToBackend}
                    disabled={extractedQuestions.some(q => q.status === 'uploading')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Upload All to Backend
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extractedQuestions.map((question, index) => (
                    <Card key={question.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge>Difficulty: {question.difficulty}/10</Badge>
                            <Badge variant="outline">+{question.positiveMarks}/-{question.negativeMarks}</Badge>
                            {question.status === 'success' && (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Uploaded
                              </Badge>
                            )}
                            {question.status === 'uploading' && (
                              <Badge variant="secondary">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Uploading...
                              </Badge>
                            )}
                            {question.status === 'error' && (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {editingQuestionId === question.id ? (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={handleSaveEdit} className="h-7">
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleEditQuestion(question)} className="h-7">
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-500">Question</Label>
                          <RichContentRenderer 
                            content={{
                              raw: question.questionText,
                              html: convertToHTML(question.questionText, (question.images || []).filter(img => img.location === 'question')),
                              plainText: stripHTML(question.questionText),
                              assets: []
                            }}
                            className="mt-1 p-3 bg-gray-50 rounded"
                          />
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500">Options {editingQuestionId === question.id && "(Click to select correct answer)"}</Label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {(question.options || []).map(opt => (
                              <div 
                                key={opt.label}
                                className={`p-2 rounded border ${
                                  editingQuestionId === question.id 
                                    ? (editFormData?.correctOptions.includes(opt.label) ? 'bg-green-50 border-green-500 cursor-pointer' : 'bg-gray-50 cursor-pointer hover:bg-gray-100')
                                    : (opt.isCorrect ? 'bg-green-50 border-green-500' : 'bg-gray-50')
                                }`}
                                onClick={() => {
                                  if (editingQuestionId === question.id) {
                                    setEditFormData((prev: any) => ({
                                      ...prev,
                                      correctOptions: prev.correctOptions.includes(opt.label)
                                        ? prev.correctOptions.filter((l: string) => l !== opt.label)
                                        : [...prev.correctOptions, opt.label]
                                    }));
                                  }
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  {editingQuestionId === question.id && (
                                    <Checkbox 
                                      checked={editFormData?.correctOptions.includes(opt.label)}
                                      className="mt-0.5"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <span className="font-medium">{opt.label}.</span>
                                    <RichContentRenderer 
                                      content={{
                                        raw: opt.text,
                                        html: convertToHTML(opt.text, []),
                                        plainText: stripHTML(opt.text),
                                        assets: []
                                      }}
                                      className="inline"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {(question.hint || editingQuestionId === question.id) && (
                          <div>
                            <Label className="text-xs text-gray-500">Hint</Label>
                            {editingQuestionId === question.id ? (
                              <Textarea
                                value={editFormData?.hint || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, hint: e.target.value }))}
                                placeholder="Enter hint (optional)"
                                className="mt-1 text-sm"
                                rows={2}
                              />
                            ) : question.hint ? (
                              <RichContentRenderer 
                                content={{
                                  raw: question.hint,
                                  html: convertToHTML(question.hint, (question.images || []).filter(img => img.location === 'hint')),
                                  plainText: stripHTML(question.hint),
                                  assets: []
                                }}
                                className="text-sm mt-1 p-2 bg-blue-50 rounded"
                              />
                            ) : null}
                          </div>
                        )}

                        {(question.solution || editingQuestionId === question.id) && (
                          <div>
                            <Label className="text-xs text-gray-500">Solution</Label>
                            {editingQuestionId === question.id ? (
                              <Textarea
                                value={editFormData?.solution || ''}
                                onChange={(e) => setEditFormData((prev: any) => ({ ...prev, solution: e.target.value }))}
                                placeholder="Enter solution (optional)"
                                className="mt-1 text-sm"
                                rows={4}
                              />
                            ) : question.solution ? (
                              <RichContentRenderer 
                                content={{
                                  raw: question.solution,
                                  html: convertToHTML(question.solution, (question.images || []).filter(img => img.location === 'solution'), true),
                                  plainText: stripHTML(question.solution),
                                  assets: []
                                }}
                                className="mt-1 p-2 bg-purple-50 rounded text-sm"
                              />
                            ) : null}
                          </div>
                        )}

                        {question.images && question.images.length > 0 && (
                          <div>
                            <Label className="text-xs text-gray-500">Images ({question.images.length})</Label>
                            <div className="flex gap-2 mt-1">
                              {question.images.map((img, idx) => (
                                <Badge key={idx} variant="outline">
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  {img.location}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Preview */}
          {questionFilePreview && !isProcessing && extractedQuestions.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>File Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={questionFilePreview} alt="Preview" className="w-full rounded" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
