"use client";

import React, { useState, useEffect, Suspense } from "react";
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
import { ArrowLeft, Plus, X, Save, Eye, Info, Crop as CropIcon } from "lucide-react";
import { Question, QuestionType, Exam, Paper } from "@/src/types/exam";
import { RichContentEditor } from '@/src/components/ui/rich-content-editor';
import { RichContentRenderer } from '@/src/components/ui/rich-content-renderer';
import { QuestionPreview } from '@/src/components/question-preview';
import examService from '@/src/services/exam.service';
import paperService from '@/src/services/paper.service';
import hierarchyService from '@/src/services/hierarchy.service';
import questionService, { CreateQuestionRequest, AnswerType } from '@/src/services/question.service';
import { toast } from 'sonner';
import { imageProcessingOrchestrator, ProcessedImage } from "@/src/services/image-processing-orchestrator.service";
import { aiService } from "@/src/services/ai.service";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const mockTopics = [
  { id: "1", name: "Kinematics", subject: "Physics" },
  { id: "2", name: "Laws of Motion", subject: "Physics" },
  { id: "3", name: "Derivatives", subject: "Mathematics" },
  { id: "4", name: "Heat Transfer", subject: "Chemistry" },
];

const focusedQuestionTypes: { value: QuestionType; label: string; description: string }[] = [
  { value: "single_choice_mcq", label: "Single Choice MCQ", description: "One correct answer" },
  { value: "multiple_choice_mcq", label: "Multiple Choice MCQ", description: "Multiple correct answers" },
  { value: "integer_based", label: "Integer Based", description: "Numerical answer" },
];

// Helper function to clean crop buttons from HTML
const cleanCropButtonsFromHTML = (html: string): string => {
  // Remove any crop buttons that might be embedded in the HTML
  return html.replace(/<button[^>]*class="[^"]*crop-button[^"]*"[^>]*>.*?<\/button>/gi, '');
};

function QuestionEditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialExamId = searchParams.get('examId') || "";
  const initialPaperId = searchParams.get('paperId') || "";
  const initialIsPreviousYear = searchParams.get('isPreviousYear') === 'true';
  const questionId = searchParams.get('questionId');
  const initialType = searchParams.get('type') as QuestionType | null;

  // API data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cropping flow state
  const [questionToCrop, setQuestionToCrop] = useState<Partial<Question> | null>(null);
  const [imageToCrop, setImageToCrop] = useState<ProcessedImage | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();

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
    difficulty: 5,
    tags: [],
    examId: initialExamId,
    paperId: initialPaperId,
    examDate: undefined,
    isPreviousYearQuestion: initialIsPreviousYear,
    status: "draft",
    assets: []
  });

  // Fetch exams, subjects, papers, and question data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [examsData, subjectsData] = await Promise.all([
          examService.getAllExams(),
          hierarchyService.getAllSubjects()
        ]);
        setExams(examsData);
        setSubjects(subjectsData);
        
        // If editing existing question, fetch it
        if (questionId) {
          const questionData = await questionService.getQuestionById(questionId);
          
          // Map backend response to frontend Question type
          const mappedQuestion: Partial<Question> = {
            id: questionData.id,
            type: questionData.answer_type === 'SINGLE_CHOICE' ? 'single_choice_mcq' : 
                  questionData.answer_type === 'MULTIPLE_CHOICE' ? 'multiple_choice_mcq' : 'integer_based',
            content: {
              question: {
                raw: questionData.content.question.raw || '',
                html: cleanCropButtonsFromHTML(questionData.content.question.html || ''),
                plainText: questionData.content.question.plain_text || '',
                assets: []
              },
              hints: questionData.content.hints ? {
                raw: questionData.content.hints.raw || '',
                html: questionData.content.hints.html || '',
                plainText: questionData.content.hints.plain_text || '',
                assets: []
              } : undefined,
              solution: questionData.answer.solution?.explanation ? {
                raw: questionData.answer.solution.explanation.raw || '',
                html: questionData.answer.solution.explanation.html || '',
                plainText: questionData.answer.solution.explanation.plain_text || '',
                assets: []
              } : undefined
            },
            description: questionData.content.question.plain_text,
            positiveMarks: questionData.positive_marks,
            negativeMarks: questionData.negative_marks,
            difficulty: questionData.difficulty,
            tags: questionData.tags || [],
            examId: questionData.exam_id,
            paperId: questionData.paper_id,
            subjectId: questionData.subject_id,
            chapterId: questionData.chapter_id,
            topicId: questionData.topic_id,
            isPreviousYearQuestion: questionData.is_previous_year_question,
            duration: questionData.duration_seconds,
            status: questionData.status.toLowerCase() as any
          };

          // Helper to extract text from TipTap JSON
          const extractTextFromTipTap = (raw: string): string => {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.type === 'doc' && parsed.content) {
                let text = '';
                parsed.content.forEach((node: any) => {
                  if (node.type === 'paragraph' && node.content) {
                    node.content.forEach((textNode: any) => {
                      if (textNode.type === 'text' && textNode.text) {
                        text += textNode.text;
                      }
                    });
                  }
                });
                return text.trim();
              }
            } catch {
              // Not JSON, return as-is
            }
            return raw;
          };

          // Map options for MCQ
          if (questionData.answer.pool?.options) {
            mappedQuestion.options = questionData.answer.pool.options.map((opt: any) => {
              // Extract text from TipTap JSON if needed
              const rawText = opt.content.raw ? extractTextFromTipTap(opt.content.raw) : '';
              
              return {
                id: opt.id,
                label: opt.label,
                value: opt.content.plain_text || rawText,
                content: {
                  raw: rawText, // Use extracted text, not TipTap JSON
                  html: opt.content.html || '',
                  plainText: opt.content.plain_text || rawText,
                  assets: []
                },
                isCorrect: questionData.answer_type === 'SINGLE_CHOICE' 
                  ? opt.id === questionData.answer.key.correct_option_id
                  : questionData.answer.key.correct_option_ids?.includes(opt.id) || false
              };
            });
          }

          // Map integer answer
          if (questionData.answer_type === 'NUMERICAL' && questionData.answer.key.correct_value !== undefined) {
            mappedQuestion.integerAnswer = questionData.answer.key.correct_value;
          }

          setQuestion(mappedQuestion);
          setSelectedType(mappedQuestion.type || '');

          // Fetch chapters and topics if subject/chapter are set
          if (questionData.subject_id) {
            const chaptersData = await hierarchyService.getChaptersBySubject(questionData.subject_id);
            setChapters(chaptersData);
            
            if (questionData.chapter_id) {
              const topicsData = await hierarchyService.getTopicsByChapter(questionData.chapter_id);
              setTopics(topicsData);
            }
          }
        }
        
        // If exam is selected, fetch papers
        if (initialExamId || questionId) {
          const examIdToUse = initialExamId || (questionId ? question.examId : '');
          if (examIdToUse) {
            const papersData = await paperService.getAllPapers(examIdToUse);
            setPapers(papersData);
            
            // Set exam date from paper if paper is selected
            const paperIdToUse = initialPaperId || (questionId ? question.paperId : '');
            if (paperIdToUse) {
              const selectedPaper = papersData.find(p => p.id === paperIdToUse);
              if (selectedPaper) {
                setQuestion(prev => ({ ...prev, examDate: selectedPaper.date }));
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [questionId]);

  // Fetch papers when exam changes
  useEffect(() => {
    const fetchPapers = async () => {
      if (question.examId) {
        try {
          const papersData = await paperService.getAllPapers(question.examId);
          setPapers(papersData);
        } catch (error) {
          console.error('Failed to fetch papers:', error);
          setPapers([]);
        }
      } else {
        setPapers([]);
      }
    };
    fetchPapers();
  }, [question.examId]);

  // Fetch chapters when subject changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (question.subjectId) {
        try {
          const chaptersData = await hierarchyService.getChaptersBySubject(question.subjectId);
          setChapters(chaptersData);
        } catch (error) {
          console.error('Failed to fetch chapters:', error);
          setChapters([]);
        }
      } else {
        setChapters([]);
      }
    };
    fetchChapters();
  }, [question.subjectId]);

  // Fetch topics when chapter changes
  useEffect(() => {
    const fetchTopics = async () => {
      if (question.chapterId) {
        try {
          const topicsData = await hierarchyService.getTopicsByChapter(question.chapterId);
          setTopics(topicsData);
        } catch (error) {
          console.error('Failed to fetch topics:', error);
          setTopics([]);
        }
      } else {
        setTopics([]);
      }
    };
    fetchTopics();
  }, [question.chapterId]);

  const [topicSearch, setTopicSearch] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  // Helper function to convert text with equations to proper HTML
  const convertTextToHTML = (text: string): string => {
    if (!text) return '';
    
    let html = text;
    
    // Convert block LaTeX equations ($$...$$)
    html = html.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
      return `<div class="equation-block" data-latex="${latex.trim()}">${latex.trim()}</div>`;
    });
    
    // Convert inline LaTeX equations ($...$)
    html = html.replace(/\$(.*?)\$/g, (match, latex) => {
      return `<span class="equation-inline" data-latex="${latex.trim()}">${latex.trim()}</span>`;
    });
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<div') && !html.startsWith('<p>')) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  };

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
      setQuestion(prev => ({ ...prev, tags: [...(prev.tags || []), currentTag.trim()] }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setQuestion(prev => ({ ...prev, tags: prev.tags?.filter(tag => tag !== tagToRemove) || [] }));
  };

  const extractImagesFromHTML = (html: string): string[] => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const images: string[] = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.push(match[1]);
    }
    return images;
  };

  // Load image as blob when selected for cropping
  useEffect(() => {
    if (!imageToCrop) {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
        setImageBlobUrl(null);
      }
      return;
    }

    const loadImageAsBlob = async () => {
      try {
        const response = await fetch(imageToCrop.s3Url, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache'
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageBlobUrl(blobUrl);
      } catch (error) {
        console.error('Failed to load image:', error);
        toast.error('Failed to load image for cropping');
        setImageToCrop(null);
      }
    };

    loadImageAsBlob();

    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [imageToCrop]);

  const handleSaveCrop = async () => {
    if (!imageToCrop || !crop || !imageBlobUrl) return;

    const image = new Image();
    image.src = imageBlobUrl;

    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        toast.error('Could not get canvas context');
        return;
      }

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Could not create blob from cropped image');
          return;
        }

        try {
          // Extract the original filename from the S3 URL to replace it
          const urlParts = imageToCrop.s3Url.split('/');
          const originalFileName = urlParts[urlParts.length - 1];
          
          // Upload with the same filename to replace the original image in S3
          const newS3Url = await aiService.uploadImageToS3(blob, originalFileName);

          setQuestion(prev => {
            if (!prev.content?.question) return prev;
            let newHtml = prev.content.question.html.replace(imageToCrop.s3Url, newS3Url);
            newHtml = cleanCropButtonsFromHTML(newHtml); // Remove any crop buttons
            const newRaw = prev.content.question.raw.replace(imageToCrop.s3Url, newS3Url);
            return {
              ...prev,
              content: {
                ...prev.content,
                question: {
                  ...prev.content.question,
                  html: newHtml,
                  raw: newRaw,
                }
              }
            };
          });

          setImageToCrop(null);
          setQuestionToCrop(null);
          setCrop(undefined);
          toast.success('Image cropped and updated successfully!');
        } catch (error) {
          console.error('Failed to upload cropped image:', error);
          toast.error('Failed to upload cropped image');
        }
      }, 'image/png');
    };

    image.onerror = () => {
      toast.error('Failed to load image for cropping.');
    };
  };

  const handleSave = async () => {
    // Validation
    if (!question.content?.question?.raw || !question.content?.question?.html) {
      toast.error("Please enter the question content");
      return;
    }
    if (!question.examId) {
      toast.error("Please select an exam");
      return;
    }
    if (!question.subjectId) {
      toast.error("Please select a subject");
      return;
    }
    if (!question.chapterId) {
      toast.error("Please select a chapter");
      return;
    }
    if (!question.topicId) {
      toast.error("Please select a topic");
      return;
    }
    if (question.isPreviousYearQuestion && !question.paperId) {
      toast.error("Please select a paper for previous year question");
      return;
    }
    if (question.isPreviousYearQuestion && (!question.positiveMarks || question.positiveMarks <= 0)) {
      toast.error("Please enter positive marks for previous year question");
      return;
    }
    if (question.isPreviousYearQuestion && (question.negativeMarks === undefined || question.negativeMarks < 0)) {
      toast.error("Please enter negative marks for previous year question (0 or greater)");
      return;
    }

    // Validate options for MCQ
    if ((question.type === 'single_choice_mcq' || question.type === 'multiple_choice_mcq') && question.options) {
      const hasCorrect = question.options.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        toast.error("Please mark at least one correct answer");
        return;
      }
      const allOptionsFilled = question.options.every(opt => opt.value && opt.value.trim());
      if (!allOptionsFilled) {
        toast.error("Please fill all option values");
        return;
      }
    }

    try {
      // Map answer type
      let answerType: AnswerType = 'SINGLE_CHOICE';
      if (question.type === 'multiple_choice_mcq') {
        answerType = 'MULTIPLE_CHOICE';
      } else if (question.type === 'integer_based') {
        answerType = 'NUMERICAL';
      }

      // Build answer object
      const answer: any = {
        pool: null,
        key: {},
        solution: undefined
      };

      // For MCQ questions
      if (question.type === 'single_choice_mcq' || question.type === 'multiple_choice_mcq') {
        answer.pool = {
          options: question.options?.map((opt, index) => {
            // Use existing content if available (from RichContentEditor), otherwise create from value
            const content = opt.content ? {
              raw: opt.content.raw || opt.value,
              html: opt.content.html || convertTextToHTML(opt.value),
              plain_text: opt.content.plainText || opt.value
            } : {
              raw: opt.value,
              html: convertTextToHTML(opt.value),
              plain_text: opt.value
            };
            
            return {
              id: `opt${index + 1}`,
              label: opt.label,
              content
            };
          }) || []
        };

        if (question.type === 'single_choice_mcq') {
          const correctOptionIndex = question.options?.findIndex(opt => opt.isCorrect);
          answer.key.correct_option_id = correctOptionIndex !== undefined && correctOptionIndex >= 0 ? `opt${correctOptionIndex + 1}` : undefined;
        } else {
          answer.key.correct_option_ids = question.options?.map((opt, index) => opt.isCorrect ? `opt${index + 1}` : null).filter(Boolean) || [];
        }
      }

      // For integer/numerical questions
      if (question.type === 'integer_based' && question.integerAnswer !== undefined) {
        answer.key.correct_value = question.integerAnswer;
        answer.key.tolerance = 0.01;
        answer.key.unit = null;
      }

      // Add solution if provided
      if (question.content?.solution?.raw && question.content?.solution?.html) {
        answer.solution = {
          explanation: {
            raw: question.content.solution.raw,
            html: question.content.solution.html,
            plain_text: question.content.solution.plainText || ''
          }
        };
      }

      // Build create request
      const createRequest: CreateQuestionRequest = {
        answer_type: answerType,
        difficulty: question.difficulty || 5,
        subject_id: question.subjectId!,
        chapter_id: question.chapterId,
        topic_id: question.topicId,
        content: {
          question: {
            raw: question.content.question.raw,
            html: question.content.question.html,
            plain_text: question.content.question.plainText || ''
          },
          hints: question.content?.hints?.raw && question.content?.hints?.html ? {
            raw: question.content.hints.raw,
            html: question.content.hints.html,
            plain_text: question.content.hints.plainText || ''
          } : undefined
        },
        answer,
        positive_marks: question.positiveMarks ?? 0,
        negative_marks: question.negativeMarks ?? 0,
        duration_seconds: question.duration,
        tags: question.tags && question.tags.length > 0 ? question.tags : undefined,
        exam_id: question.examId,
        paper_id: question.paperId || undefined,
        is_previous_year_question: question.isPreviousYearQuestion || false
      };

      console.log(questionId ? 'Updating question:' : 'Creating question:', createRequest);
      console.log('Options being sent:', answer.pool?.options);
      
      if (questionId) {
        // Update existing question
        await questionService.updateQuestion(questionId, createRequest as any);
        toast.success("Question updated successfully!");
      } else {
        // Create new question
        await questionService.createQuestion(createRequest);
        toast.success("Question created successfully!");
      }
      
      router.push('/question-onboarding');
    } catch (error: any) {
      console.error('Failed to create question:', error);
      toast.error(error.message || 'Failed to create question');
    }
  };

  const getExamName = () => exams.find(e => e.id === question.examId)?.name || "Unknown Exam";
  const getPaperName = () => papers.find(p => p.id === question.paperId)?.name || "No Paper";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                    {exams.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">No exams available</div>
                    ) : (
                      exams.map((exam) => (<SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>))
                    )}
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
                    const selectedPaper = papers.find(p => p.id === value);
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
                      {papers.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No papers available for this exam
                        </div>
                      ) : (
                        papers.map((paper) => (
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
                          value={option.content || { raw: "", html: "", plainText: "", assets: [] }}
                          onChange={(newContent) => {
                            console.log('Option content changed:', newContent);
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

            {/* Subject, Chapter, Topic Hierarchy */}
            <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Subject Hierarchy *</h3>
              
              <div>
                <Label htmlFor="subjectSelect">Subject *</Label>
                <Select 
                  value={question.subjectId} 
                  onValueChange={(value) => setQuestion(prev => ({ 
                    ...prev, 
                    subjectId: value, 
                    chapterId: "", 
                    topicId: "" 
                  }))}
                >
                  <SelectTrigger id="subjectSelect" className="mt-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">No subjects available</div>
                    ) : (
                      subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chapterSelect">Chapter *</Label>
                <Select 
                  value={question.chapterId} 
                  onValueChange={(value) => setQuestion(prev => ({ 
                    ...prev, 
                    chapterId: value, 
                    topicId: "" 
                  }))}
                  disabled={!question.subjectId}
                >
                  <SelectTrigger id="chapterSelect" className="mt-1">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        {question.subjectId ? 'No chapters available' : 'Select a subject first'}
                      </div>
                    ) : (
                      chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="topicSelect">Topic *</Label>
                <Select 
                  value={question.topicId} 
                  onValueChange={(value) => setQuestion(prev => ({ ...prev, topicId: value }))}
                  disabled={!question.chapterId}
                >
                  <SelectTrigger id="topicSelect" className="mt-1">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">
                        {question.chapterId ? 'No topics available' : 'Select a chapter first'}
                      </div>
                    ) : (
                      topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scoring and Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="positiveMarks">
                  Positive Marks {question.isPreviousYearQuestion ? '*' : '(Optional)'}
                </Label>
                <Input 
                  id="positiveMarks" 
                  type="number" 
                  value={question.positiveMarks || ""} 
                  onChange={(e) => setQuestion(prev => ({ ...prev, positiveMarks: e.target.value ? parseFloat(e.target.value) : undefined }))} 
                  placeholder="4" 
                  className="mt-1" 
                  min="0" 
                  step="0.25" 
                />
              </div>
              <div>
                <Label htmlFor="negativeMarks">
                  Negative Marks {question.isPreviousYearQuestion ? '*' : '(Optional)'}
                </Label>
                <Input 
                  id="negativeMarks" 
                  type="number" 
                  value={question.negativeMarks || ""} 
                  onChange={(e) => setQuestion(prev => ({ ...prev, negativeMarks: e.target.value ? parseFloat(e.target.value) : undefined }))} 
                  placeholder="1" 
                  className="mt-1" 
                  min="0" 
                  step="0.25" 
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  value={question.duration || ""} 
                  onChange={(e) => setQuestion(prev => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : undefined }))} 
                  placeholder="120" 
                  className="mt-1" 
                  min="0" 
                  step="10" 
                />
                <p className="text-xs text-gray-500 mt-1">Optional</p>
              </div>
            </div>

            {/* Difficulty - Integer 1-10 */}
            <div>
              <Label htmlFor="difficulty">Difficulty Level * (1-10)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input 
                  id="difficulty" 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={question.difficulty || 5} 
                  onChange={(e) => setQuestion(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={question.difficulty || 5} 
                    onChange={(e) => setQuestion(prev => ({ ...prev, difficulty: parseInt(e.target.value) || 5 }))}
                    className="w-16 text-center"
                  />
                  <span className="text-sm font-medium text-gray-600">
                    {(question.difficulty || 5) <= 3 ? '🟢 Easy' : 
                     (question.difficulty || 5) <= 7 ? '🟡 Medium' : 
                     '🔴 Hard'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                1-3: Easy | 4-7: Medium | 8-10: Hard
              </p>
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
                      {tag}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          removeTag(tag);
                        }} 
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
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
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold">Live Preview</h2>
                </div>
                <p className="text-sm text-gray-600">See how your question will appear to students</p>
              </div>
              {question.content?.question?.html?.includes('<img') && (
                <Button variant="outline" size="sm" onClick={() => setQuestionToCrop(question)}>
                  <CropIcon className="w-4 h-4 mr-2" />
                  Crop Image
                </Button>
              )}
            </div>
          </div>

          <div className="p-6">
            <QuestionPreview question={question as Question} selectedType={selectedType} />
          </div>
        </div>
      </div>

      {/* Image Selection Modal */}
      {questionToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
            <h2 className="text-xl font-bold mb-4">Select Image to Crop</h2>
            <div className="grid grid-cols-3 gap-4">
              {extractImagesFromHTML(questionToCrop.content?.question?.html || '').map((imageUrl, index) => (
                <div
                  key={index}
                  className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded p-2 transition-all"
                  onClick={() => {
                    setImageToCrop({ s3Url: imageUrl, fileName: `image_${index}` } as ProcessedImage);
                    setQuestionToCrop(null);
                  }}
                >
                  <img src={imageUrl} alt={`Image ${index + 1}`} className="w-full h-auto rounded" crossOrigin="anonymous" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setQuestionToCrop(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cropping Modal */}
      {imageToCrop && imageBlobUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-4">Crop Image</h2>
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
              <img src={imageBlobUrl} alt="Cropping preview" />
            </ReactCrop>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setImageToCrop(null); setCrop(undefined); }}>Cancel</Button>
              <Button onClick={handleSaveCrop} disabled={!crop}>Save Crop</Button>
            </div>
          </div>
        </div>
      )}
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
