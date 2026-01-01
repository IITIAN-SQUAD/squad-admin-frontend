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
import { imageProcessingOrchestrator, ProcessedImage, ImageProcessingProgress } from "@/src/services/image-processing-orchestrator.service";
import { pdfImageExtractor } from "@/src/services/pdf-image-extractor.service";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [imageProcessingProgress, setImageProcessingProgress] = useState<ImageProcessingProgress | null>(null);
  const [croppingImage, setCroppingImage] = useState<ProcessedImage | null>(null);
  const [croppingImageBlobUrl, setCroppingImageBlobUrl] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<ProcessedImage | null>(null);
  const [crop, setCrop] = useState<Crop>();
  
  const questionFileRef = useRef<HTMLInputElement>(null);
  const solutionFileRef = useRef<HTMLInputElement>(null);

  const steps: ProcessingStep[] = [
    { id: 'upload', name: 'File Upload', status: 'pending' },
    { id: 'parse', name: 'AI Parsing', status: 'pending' },
    { id: 'image-extract', name: 'Diagram Extraction & S3 Upload', status: 'pending' },
    { id: 'extract', name: 'Question Extraction', status: 'pending' },
    { id: 'hierarchy', name: 'Subject/Chapter/Topic Matching', status: 'pending' },
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

      // Step 2.5: Extract and Upload Images (Diagrams) to S3
      updateStep('image-extract', 'processing', 'Identifying diagrams in PDF...');
      let imageResults: ProcessedImage[] = [];
      try {
        const imageProcessingResult = await imageProcessingOrchestrator.processImagesFromPDF(
          questionBase64,
          solutionBase64,
          (progress: ImageProcessingProgress) => {
            setImageProcessingProgress(progress);
            updateStep('image-extract', 'processing', progress.message);
          }
        );
        imageResults = imageProcessingResult.processedImages;
        setProcessedImages(imageResults);
        updateStep('image-extract', 'completed', `Extracted and uploaded ${imageResults.length} diagrams to S3`);
      } catch (error: any) {
        console.error('Image processing error:', error);
        const errorMsg = error?.message || 'Unknown error';
        if (errorMsg.includes('base64') || errorMsg.includes('atob')) {
          updateStep('image-extract', 'completed', '⚠️ Image extraction skipped (file format issue) - continuing with questions');
        } else {
          updateStep('image-extract', 'completed', '⚠️ No diagrams found - continuing with questions');
        }
        // Continue processing even if image extraction fails
      }

      // Step 3: Convert PDFs to images for AI processing
      updateStep('extract', 'processing', 'Converting files to images for AI...');
      
      // Convert question file (PDF or image) to image format
      const questionPages = await pdfImageExtractor.convertPDFToImages(questionBase64, 2.0);
      
      // Convert solution file if provided
      let solutionPages: any[] = [];
      if (solutionBase64) {
        solutionPages = await pdfImageExtractor.convertPDFToImages(solutionBase64, 2.0);
      }
      
      // Step 3.5: Process pages one-by-one to avoid 500 errors
      updateStep('extract', 'processing', 'AI is analyzing the document...');
      
      // Clear any previous questions to ensure fresh processing
      setExtractedQuestions([]);
      
      let allQuestions: ExtractedQuestion[] = [];
      let previousPageContext: any = undefined;
      
      for (let i = 0; i < questionPages.length; i++) {
        const page = questionPages[i];
        const solutionPage = solutionPages[i]; // Match by page number
        
        updateStep('extract', 'processing', `Processing page ${i + 1} of ${questionPages.length}...`);
        
        try {
          const pageResult = await aiService.extractQuestionsFromSinglePage(
            page.imageDataUrl,
            i + 1,
            {
              includeHints,
              includeSolutions,
              solutionPageBase64: solutionPage?.imageDataUrl,
              previousPageContext,
              defaultPositiveMarks,
              defaultNegativeMarks,
              defaultDuration
            }
          );
          
          // Add questions from this page
          const questionsWithParsedOptions = pageResult.questions.map(q => ({
            ...q,
            options: parseLlmOptions(q.options)
          }));
          
          // Try to identify correct options
          const questionsWithCorrectOptions = questionsWithParsedOptions.map(q => ({
            ...q,
            options: identifyCorrectOptions(q)
          }));
          
          allQuestions = [...allQuestions, ...questionsWithCorrectOptions];
          
          console.log(`After adding page ${i + 1}, total questions: ${allQuestions.length}`);
          console.log('All questions so far:', allQuestions.map((q, idx) => ({
            index: idx,
            questionText: q.questionText?.substring(0, 50),
            questionType: q.questionType,
            optionsCount: q.options?.length,
            correctOptions: q.options?.filter(o => o.isCorrect).length,
            hasCorrectAnswer: !!q.correctAnswer
          })));
          
          // Update UI immediately with new questions
          const processedQuestions = allQuestions.map((q, idx) => ({
            ...q,
            id: `q_${idx + 1}`, // Use 1-based indexing for consistency
            status: 'pending' as const
          }));
          setExtractedQuestions(processedQuestions);
          
          // Store incomplete question for next page
          previousPageContext = pageResult.incompleteQuestion;
          
          console.log(`Page ${i + 1}: Extracted ${pageResult.questions.length} questions`);
          if (pageResult.questions.length > 0) {
            console.log('Raw pageResult.questions[0]:', pageResult.questions[0]);
            console.log('Sample question:', pageResult.questions[0].questionText?.substring(0, 100));
          }
          if (pageResult.incompleteQuestion) {
            console.log(`Page ${i + 1}: Has incomplete question to continue on next page`);
          }
        } catch (error: any) {
          console.error(`Error processing page ${i + 1}:`, error);
          updateStep('extract', 'processing', `⚠️ Error on page ${i + 1}, continuing...`);
          // Continue with next page even if one fails
        }
      }
      
      // Handle final incomplete question
      if (previousPageContext) {
        console.warn('Last page has incomplete question - may need manual review');
      }
      
      updateStep('extract', 'completed', `Found ${allQuestions.length} questions from ${questionPages.length} pages`);

      // Step 4: Match Subject/Chapter/Topic using AI
      updateStep('hierarchy', 'processing', 'Matching subjects, chapters, and topics...');
      const questionsWithHierarchy = [];
      
      for (let i = 0; i < allQuestions.length; i++) {
        const q = allQuestions[i];
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

      // Step 5: Inject S3 Image URLs into Questions
      const processedQuestions: ProcessedQuestion[] = [];
      const imagesByQuestion = imageProcessingOrchestrator.groupImagesByQuestion(imageResults);
      
      for (let i = 0; i < questionsWithHierarchy.length; i++) {
        const q = questionsWithHierarchy[i];
        const questionIndex = i + 1; // Questions are 1-indexed
        
        // Get images for this question
        const questionImages = imagesByQuestion.get(questionIndex) || [];
        
        // Inject images into question text, hint, and solution
        let questionText = q.questionText;
        let hint = q.hint;
        let solution = q.solution;
        
        if (questionImages.length > 0) {
          // Add images to question text
          const questionImgs = questionImages.filter(img => img.region.purpose === 'question');
          if (questionImgs.length > 0) {
            questionText = imageProcessingOrchestrator.insertImagesIntoQuestionText(
              questionText,
              questionImgs,
              'question'
            );
          }
          
          // Add images to hint
          if (hint) {
            const hintImgs = questionImages.filter(img => img.region.purpose === 'hint');
            if (hintImgs.length > 0) {
              hint = imageProcessingOrchestrator.insertImagesIntoQuestionText(
                hint,
                hintImgs,
                'hint'
              );
            }
          }
          
          // Add images to solution
          if (solution) {
            const solutionImgs = questionImages.filter(img => img.region.purpose === 'solution');
            if (solutionImgs.length > 0) {
              solution = imageProcessingOrchestrator.insertImagesIntoQuestionText(
                solution,
                solutionImgs,
                'solution'
              );
            }
          }
        }
        
        const processedQuestion = {
          ...q,
          id: `q_${i}`,
          status: 'pending' as const,
          questionText,
          hint,
          solution,
          images: questionImages.map(img => ({
            base64: '', // No longer needed
            location: img.region.purpose,
            s3Url: img.s3Url
          })) as any,
          // Generate UUIDs for options if they don't have IDs
          options: q.options?.map(opt => ({
            ...opt,
            id: opt.id || crypto.randomUUID()
          }))
        };
        
        processedQuestions.push(processedQuestion);
        
        // Update UI with current question immediately (live preview)
        setExtractedQuestions([...processedQuestions]);
        console.log('Final processed questions:', processedQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText?.substring(0, 50)
        })));
      }

      // Step 6: Ready for upload
      updateStep('upload-backend', 'pending', 'Ready to upload to backend');

    } catch (error: any) {
      console.error('Processing error:', error);
      const currentStepId = processingSteps.find(s => s.status === 'processing')?.id;
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      if (currentStepId) {
        updateStep(currentStepId, 'error', `Failed: ${errorMessage}`);
      }
      // Show error toast
      alert(`Processing failed: ${errorMessage}`);
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

    // Only upload questions that haven't been successfully uploaded yet
    const questionsToUpload = extractedQuestions.filter(q => q.status !== 'success');

    for (let i = 0; i < questionsToUpload.length; i++) {
      const question = questionsToUpload[i];
      
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
        const errorMessage = error?.response?.data?.message || error?.message || 'Upload failed';
        console.error('Upload error for question:', question.id, errorMessage);
        setExtractedQuestions(prev => 
          prev.map(q => q.id === question.id ? { 
            ...q, 
            status: 'error',
            error: errorMessage
          } : q)
        );
      }
    }

    const successCount = extractedQuestions.filter(q => q.status === 'success').length;
    updateStep('upload-backend', 'completed', `Uploaded ${successCount}/${extractedQuestions.length} questions`);
  };

  // Helper to identify correct options from solution or answer patterns
  const identifyCorrectOptions = (question: any): any[] => {
    const { options, solution, questionType } = question;
    
    if (!options || options.length === 0) return options;
    
    // If already has correct options marked, return as is
    if (options.some((opt: any) => opt.isCorrect)) {
      return options;
    }
    
    // Try to identify correct options from solution text
    if (solution) {
      const solutionText = solution.toLowerCase();
      
      // Look for patterns like "answer: (1)", "option (2)", "correct answer is a", etc.
      const patterns = [
        /answer:?\s*\(?([a-d1-4])\)?/i,
        /correct:?\s*\(?([a-d1-4])\)?/i,
        /option\s*\(?([a-d1-4])\)?/i,
        /\(?([a-d1-4])\)\s*is correct/i,
        /choice\s*\(?([a-d1-4])\)?/i
      ];
      
      for (const pattern of patterns) {
        const match = solutionText.match(pattern);
        if (match) {
          const correctLabel = match[1].toUpperCase();
          return options.map((opt: any) => ({
            ...opt,
            isCorrect: opt.label.replace(/[()]/g, '') === correctLabel
          }));
        }
      }
    }
    
    // For single choice, try to identify from context clues
    if (questionType === 'SINGLE_CHOICE' && options.length === 4) {
      // Look for numerical patterns or other clues
      // This is a fallback - ideally LLM should mark correctly
      console.log('Could not identify correct option for question, leaving unmarked');
    }
    
  };

  // Helper to parse LLM options from strings to objects
  const parseLlmOptions = (options: string[] | any[]): any[] => {
    if (!options || !Array.isArray(options)) return [];
    
    return options.map((option, index) => {
      // If it's already an object, ensure it has all required fields
      if (typeof option === 'object' && option !== null) {
        return {
          id: option.id || `opt_${index + 1}`,
          label: option.label || `(${index + 1})`,
          text: option.text || option.content || option, // Handle different possible field names
          isCorrect: option.isCorrect || false
        };
      }
      
      // If it's a string, parse it
      if (typeof option === 'string') {
        // Extract label and text from format like "(1) content" or "A) content"
        const labelMatch = option.match(/^(\([^)]+\)|\w\))\s*(.*)$/);
        if (labelMatch) {
          return {
            id: `opt_${index + 1}`,
            label: labelMatch[1],
            text: labelMatch[2].trim(),
            isCorrect: false
          };
        } else {
          // Fallback if no label pattern found
          return {
            id: `opt_${index + 1}`,
            label: `(${index + 1})`,
            text: option.trim(),
            isCorrect: false
          };
        }
      }
      
      return null;
    }).filter(Boolean);
  };

  // Helper to create RichContent with proper format (used in payload and preview)
  const createRichContent = (text: string | null | undefined): any => {
    if (!text) {
      return {
        html: '<div class="italic text-gray-500">No content available</div>',
        plain_text: 'No content available',
        raw: ''
      };
    }
    
    // Raw: Original text with LaTeX (e.g., "What is $x^2 + y^2$?")
    const raw = text;
    
    // Plain text: Strip LaTeX delimiters and HTML tags
    const plain_text = text
      .replace(/\$\$([^\$]+)\$\$/g, '$1') // Block LaTeX
      .replace(/\$([^\$]+)\$/g, '$1')     // Inline LaTeX
      .replace(/\\\((.*?)\\\)/gs, '$1') // LaTeX inline delimiters
      .replace(/\\\[(.*?)\\\]/gs, '$1')  // LaTeX display delimiters
      .replace(/<[^>]*>/g, '')            // HTML tags
      .replace(/\\n/g, ' ')              // Remove escaped newlines
      .trim();
    
    // HTML: Convert LaTeX to format expected by RichContentRenderer
    // Use equation-block and equation-inline classes with data-latex attribute
    const escapeHtml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };
    
    let html = text
      // First, handle escaped newlines from LLM (\n\n becomes paragraph breaks)
      .replace(/\\n\\n/g, '<br/><br/>')
      // Convert single escaped \n to <br/>
      .replace(/\\n/g, '<br/>')
      // Then convert actual newlines to <br/> tags
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>')
      // Convert markdown images with attributes: ![alt](url){width=300px height=200px position=center}
      .replace(/!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g, (match, alt, url, attrs) => {
        const widthMatch = attrs.match(/width=(\S+)/);
        const heightMatch = attrs.match(/height=(\S+)/);
        const positionMatch = attrs.match(/position=(\S+)/);
        
        const width = widthMatch ? widthMatch[1] : 'auto';
        const height = heightMatch ? heightMatch[1] : 'auto';
        const position = positionMatch ? positionMatch[1] : 'center';
        
        let style = `max-width: 100%; width: ${width}; height: ${height}; margin: 10px 0; display: block;`;
        if (position === 'center') {
          style += ' margin-left: auto; margin-right: auto;';
        } else if (position === 'left') {
          style += ' margin-right: auto;';
        } else if (position === 'right') {
          style += ' margin-left: auto;';
        }
        
        return `<img src="${url}" alt="${alt}" style="${style}" />`;
      })
      // Convert simple markdown images: ![alt](url)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
        return `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; margin: 10px 0; display: block; margin-left: auto; margin-right: auto;" />`;
      })
      // Then handle LaTeX - support multiple formats
      // Process block equations first ($$...$$)
      .replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
        // LaTeX already has single backslashes from LLM, keep as is
        return `<div class="equation-block" data-latex="${escapeHtml(latex.trim())}">${escapeHtml(latex.trim())}</div>`;
      })
      // Process inline equations ($...$)
      .replace(/\$([^\$]+)\$/g, (match, latex) => {
        // LaTeX already has single backslashes from LLM, keep as is
        return `<span class="equation-inline" data-latex="${escapeHtml(latex.trim())}">${escapeHtml(latex.trim())}</span>`;
      })
      // Support LaTeX delimiters \( \) for inline math
      .replace(/\\\((.*?)\\\)/gs, (match, latex) => {
        return `<span class="equation-inline" data-latex="${escapeHtml(latex.trim())}">${escapeHtml(latex.trim())}</span>`;
      })
      // Support LaTeX delimiters \[ \] for display math
      .replace(/\\\[(.*?)\\\]/gs, (match, latex) => {
        return `<div class="equation-block" data-latex="${escapeHtml(latex.trim())}">${escapeHtml(latex.trim())}</div>`;
      })
      // Format bold text markers (e.g., **Answer:**)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Wrap content in div with proper styling
    if (!html.startsWith('<div') && !html.startsWith('<p')) {
      html = `<div>${html}</div>`;
    }
    
    // Debug logging
    if (text.includes('\\text') || text.includes('\\frac') || text.includes('\\sqrt')) {
      console.log('createRichContent - Input text:', text.substring(0, 200));
      console.log('createRichContent - Output HTML:', html.substring(0, 200));
    }
    
    // NOTE: Images are now embedded in the text as markdown and converted above
    // Do NOT add images separately here to avoid double rendering
    
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

    // Map question type to backend answer type enum
    const mapAnswerType = (type: string) => {
      switch(type) {
        case 'SINGLE_CHOICE': return 'SINGLE_CHOICE';
        case 'MULTIPLE_CHOICE': return 'MULTIPLE_CHOICE';
        case 'INTEGER': return 'NUMERICAL'; // Backend uses NUMERICAL
        case 'PARAGRAPH': return 'LONG_ANSWER';
        default: return type;
      }
    };

    // Build the payload according to API contract
    const payload: any = {
      answer_type: mapAnswerType(question.questionType),
      subject_id: question.subjectId || null,
      chapter_id: question.chapterId || null,
      topic_id: question.topicId || null,
      exam_id: selectedExam,
      paper_id: selectedPaper,
      content: {
        question: createRichContent(
          question.questionText
        ),
        hints: question.hint ? createRichContent(
          question.hint
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
          : question.questionType === 'INTEGER'
          ? { 
              correct_value: parseFloat(question.correctAnswer || '0'),
              tolerance: 0.01,
              unit: null
            }
          : {}, // For other types
        solution: question.solution ? {
          explanation: createRichContent(
            question.solution
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
      questionText: question.questionText || '',
      hint: question.hint || '',
      solution: question.solution || '',
      correctOptions: question.options?.filter(o => o.isCorrect).map(o => o.label) || []
    });
  };

  const handleOpenCropper = (imageUrl: string) => {
    const imageToCrop = processedImages.find(img => img.s3Url === imageUrl);
    if (imageToCrop) {
      setCroppingImage(imageToCrop);
    }
  };

  // Load cropping image as blob when selected
  useEffect(() => {
    if (!croppingImage) {
      if (croppingImageBlobUrl) {
        URL.revokeObjectURL(croppingImageBlobUrl);
        setCroppingImageBlobUrl(null);
      }
      return;
    }

    const loadImageAsBlob = async () => {
      try {
        const response = await fetch(croppingImage.s3Url, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache'
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setCroppingImageBlobUrl(blobUrl);
      } catch (error) {
        console.error('Failed to load image:', error);
        alert('Failed to load image for cropping');
        setCroppingImage(null);
      }
    };

    loadImageAsBlob();

    return () => {
      if (croppingImageBlobUrl) {
        URL.revokeObjectURL(croppingImageBlobUrl);
      }
    };
  }, [croppingImage]);

  const handleSaveEdit = () => {
    if (!editingQuestionId || !editFormData) return;

    setExtractedQuestions(prev => prev.map(q => {
      if (q.id === editingQuestionId) {
        return {
          ...q,
          questionText: editFormData.questionText,
          hint: editFormData.hint,
          solution: editFormData.solution,
          options: q.options?.map(opt => ({
            ...opt,
            isCorrect: editFormData.correctOptions.includes(opt.label)
          })) || []
        };
      }
      return q;
    }));

    setEditingQuestionId(null);
    setEditFormData(null);
  };

  const handleSaveCrop = async (crop: Crop | undefined) => {
    if (!croppingImage || !crop || !croppingImageBlobUrl) return;

    const image = new Image();
    image.src = croppingImageBlobUrl;

    image.onload = async () => {
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        alert('Could not get canvas context');
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
        if (!crop) return;
        if (!blob) {
          alert('Could not create blob from cropped image');
          return;
        }

        try {
          // Extract the original filename from the S3 URL to replace it
          const urlParts = croppingImage.s3Url.split('/');
          const originalFileName = urlParts[urlParts.length - 1];
          
          // Upload with the same filename to replace the original image in S3
          const newS3Url = await aiService.uploadImageToS3(blob, originalFileName);

          // Update the question text and images array
          setExtractedQuestions(prev => prev.map(q => {
            const oldUrl = croppingImage.s3Url;
            let updated = false;
            
            if (q.questionText.includes(oldUrl)) {
              q.questionText = q.questionText.replace(oldUrl, newS3Url);
              updated = true;
            }
            if (q.hint?.includes(oldUrl)) {
              q.hint = q.hint.replace(oldUrl, newS3Url);
              updated = true;
            }
            if (q.solution?.includes(oldUrl)) {
              q.solution = q.solution.replace(oldUrl, newS3Url);
              updated = true;
            }
            
            // Update the images array if this question was affected
            if (updated && q.images) {
              q.images = q.images.map((img: any) => 
                img.s3Url === oldUrl ? { ...img, s3Url: newS3Url } : img
              );
            }
            
            return q;
          }));

          // Update the processed images list
          setProcessedImages(prev => prev.map(img => 
            img.s3Url === croppingImage.s3Url ? { ...img, s3Url: newS3Url } : img
          ));

          setCroppingImage(null);
          setImageToCrop(null); // Close the image selection modal too
        } catch (error) {
          console.error('Failed to upload cropped image:', error);
          alert('Failed to upload cropped image');
        }
      }, 'image/png');
    };

    image.onerror = () => {
      alert('Failed to load image for cropping.');
    };
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditFormData(null);
  };

  const uploadIndividualQuestion = async (questionId: string) => {
    const question = extractedQuestions.find(q => q.id === questionId);
    if (!question) return;

    if (!selectedPaper) {
      alert('Please select a paper first');
      return;
    }

    try {
      setExtractedQuestions(prev => 
        prev.map(q => q.id === questionId ? { ...q, status: 'uploading', error: undefined } : q)
      );

      const payload = buildQuestionPayload(question);
      const result = await questionService.createQuestion(payload as any);

      setExtractedQuestions(prev => 
        prev.map(q => q.id === questionId ? { 
          ...q, 
          status: 'success',
          backendId: result.question_id,
          error: undefined
        } : q)
      );

      alert('Question uploaded successfully!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Upload failed';
      console.error('Individual upload error:', errorMessage);
      
      setExtractedQuestions(prev => 
        prev.map(q => q.id === questionId ? { 
          ...q, 
          status: 'error',
          error: errorMessage
        } : q)
      );

      alert(`Upload failed: ${errorMessage}`);
    }
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
                <Label>Solution PDF/Image (Optional)</Label>
                <input
                  ref={solutionFileRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleSolutionFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => solutionFileRef.current?.click()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {solutionFile ? solutionFile.name : 'Choose PDF/PNG/JPG'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, PNG, JPG formats
                </p>
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
                  <CardTitle>Extracted Questions</CardTitle>
                  <div className="flex gap-2">
                    {extractedQuestions.some(q => q.status === 'error') && (
                      <Button
                        onClick={() => {
                          extractedQuestions.forEach(q => {
                            if (q.status === 'error') {
                              uploadIndividualQuestion(q.id);
                            }
                          });
                        }}
                        variant="outline"
                        size="sm"
                        disabled={extractedQuestions.every(q => q.status === 'uploading')}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Retry Failed
                      </Button>
                    )}
                    <Button
                      onClick={uploadToBackend}
                      disabled={extractedQuestions.every(q => q.status === 'success' || q.status === 'uploading')}
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Remaining ({extractedQuestions.filter(q => q.status !== 'success').length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extractedQuestions.map((question, index) => (
                    <Card key={question.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Question {index + 1}</h3>
                            <Badge variant={question.status === 'success' ? 'success' : question.status === 'error' ? 'destructive' : 'secondary'}>
                              {question.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {question.status === 'success' && question.backendId && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(`/question-onboarding/editor?questionId=${question.backendId}`, '_blank')}
                                className="h-7"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            )}
                            {editingQuestionId !== question.id ? (
                              <div className="flex gap-1">
                                {question.images && question.images.length > 0 && (
                                  <Button variant="outline" size="sm" onClick={() => setImageToCrop(question as any)} className="h-7">
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    Crop
                                  </Button>
                                )}
                                {question.status !== 'success' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditQuestion(question)}
                                    className="h-7"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                                {question.status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => uploadIndividualQuestion(question.id)} 
                                    className="h-7 bg-green-500 hover:bg-green-600"
                                    disabled={question.status === 'uploading'}
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Upload
                                  </Button>
                                )}
                                {question.status === 'error' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => uploadIndividualQuestion(question.id)} 
                                    className="h-7 bg-orange-500 hover:bg-orange-600"
                                    disabled={question.status === 'uploading'}
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Retry
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={handleSaveEdit} className="h-7">
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7">Cancel</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-500">Question {editingQuestionId === question.id && "(Raw LaTeX - edit chemical formulas here)"}</Label>
                          {editingQuestionId === question.id ? (
                            <Textarea
                              value={editFormData?.questionText || ''}
                              onChange={(e) => setEditFormData((prev: any) => ({ ...prev, questionText: e.target.value }))}
                              placeholder="Enter question text with LaTeX (e.g., $\text{CO}_2$)"
                              className="mt-1 text-sm font-mono"
                              rows={4}
                            />
                          ) : (
                            <RichContentRenderer 
                              content={createRichContent(question.questionText)}
                              onCropImage={handleOpenCropper}
                              enableMath={true}
                              className="mt-1 p-3 bg-gray-50 rounded"
                            />
                          )}
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
                                content={createRichContent(question.hint)}
                                onCropImage={handleOpenCropper}
                                enableMath={true}
                                className="text-sm mt-1 p-2 bg-blue-50 rounded"
                              />
                            ) : null}
                          </div>
                        )}

                        {/* Options for MCQ */}
                        {question.options && question.options.length > 0 && (
                          <div>
                            <Label className="text-xs text-gray-500">Options</Label>
                            {editingQuestionId === question.id ? (
                              <div className="space-y-2 mt-1">
                                {question.options.map((opt, idx) => (
                                  <div key={opt.id} className="space-y-1">
                                    <div className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        checked={editFormData?.correctOptions?.includes(opt.label)}
                                        onChange={(e) => {
                                          const newCorrect = e.target.checked
                                            ? [...(editFormData?.correctOptions || []), opt.label]
                                            : editFormData?.correctOptions?.filter((l: string) => l !== opt.label) || [];
                                          setEditFormData((prev: any) => ({ ...prev, correctOptions: newCorrect }));
                                        }}
                                        className="mt-1"
                                      />
                                      <div className="flex-1">
                                        <Label className="text-xs font-medium">{opt.label}</Label>
                                        <Textarea
                                          value={opt.text}
                                          onChange={(e) => {
                                            const newOptions = [...question.options];
                                            newOptions[idx] = { ...opt, text: e.target.value };
                                            setExtractedQuestions(prev => prev.map(q => 
                                              q.id === question.id ? { ...q, options: newOptions } : q
                                            ));
                                          }}
                                          placeholder="Enter option text with LaTeX"
                                          className="mt-1 text-sm font-mono"
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1 mt-1">
                                {question.options.map((opt) => (
                                  <div key={opt.id} className="flex items-start gap-2">
                                    <input
                                      type={question.questionType === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                      checked={opt.isCorrect}
                                      disabled
                                      className=""
                                    />
                                    <RichContentRenderer 
                                      content={createRichContent(opt.text)}
                                      enableMath={true}
                                      className=""
                                    />
                                    {opt.isCorrect && <span className="ml-2 text-green-600 font-semibold">✓</span>}
                                  </div>
                                ))}
                              </div>
                            )}
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
                                content={createRichContent(question.solution)}
                                onCropImage={handleOpenCropper}
                                enableMath={true}
                                className="mt-1 p-2 bg-purple-50 rounded text-sm"
                              />
                            ) : null}
                          </div>
                        )}

                        {question.error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <Label className="text-xs font-semibold text-red-700">Upload Error</Label>
                                <p className="text-sm text-red-600 mt-1">{question.error}</p>
                              </div>
                            </div>
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

      {imageToCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-4">Select Image to Crop</h2>
            <div className="grid grid-cols-4 gap-4">
              {imageToCrop.images?.map((image: any) => (
                <div key={image.s3Url} className="cursor-pointer" onClick={() => setCroppingImage(image)}>
                  <img src={image.s3Url} alt="Select to crop" className="w-full h-auto rounded" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setImageToCrop(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {croppingImage && croppingImageBlobUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-4">Crop Image</h2>
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
              <img src={croppingImageBlobUrl} alt="Cropping preview" />
            </ReactCrop>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCroppingImage(null)}>Cancel</Button>
              <Button onClick={() => handleSaveCrop(crop)}>Save Crop</Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
