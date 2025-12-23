import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export type LLMProvider = 'gemini' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
}

export interface ExtractedQuestion {
  questionText: string;
  options: Array<{
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
  correctAnswer?: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'INTEGER' | 'PARAGRAPH';
  difficulty: number;
  positiveMarks: number;
  negativeMarks: number;
  durationSeconds: number;
  hint?: string;
  solution?: string;
  images: Array<{
    base64: string;
    location: 'question' | 'option' | 'hint' | 'solution';
    optionLabel?: string;
    s3Url?: string;
  }>;
  rawLatex: string[];
  tags: string[];
  subjectName?: string;
  chapterName?: string;
  topicName?: string;
}

export interface QuestionExtractionResult {
  questions: ExtractedQuestion[];
  sectionInstructions?: {
    positiveMarks: number;
    negativeMarks: number;
    duration?: number;
  };
  metadata: {
    totalQuestions: number;
    processingTime: number;
    provider: LLMProvider;
  };
}

class AIService {
  private config: LLMConfig | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;

  configure(config: LLMConfig) {
    this.config = config;
    
    if (config.provider === 'gemini') {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else if (config.provider === 'openai') {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_OPENAI_API_KEY not found in environment variables');
      }
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  async extractQuestionsFromImage(
    imageBase64: string,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPdfBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
    }
  ): Promise<QuestionExtractionResult> {
    if (!this.config) {
      throw new Error('AI service not configured. Please set up LLM provider.');
    }

    const startTime = Date.now();

    if (this.config.provider === 'gemini') {
      return this.extractWithGemini(imageBase64, options);
    } else {
      return this.extractWithOpenAI(imageBase64, options);
    }
  }

  private async extractWithGemini(
    imageBase64: string,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPdfBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
    }
  ): Promise<QuestionExtractionResult> {
    const startTime = Date.now();
    
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({ 
      model: this.config?.model || 'gemini-2.5-flash'
    });

    const prompt = this.buildExtractionPrompt(options);

    // Helper function to strip data URI prefix and get mime type
    const parseDataUri = (dataUri: string) => {
      const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          mimeType: matches[1],
          data: matches[2]
        };
      }
      // If no prefix, assume it's already base64
      return {
        mimeType: 'image/jpeg',
        data: dataUri
      };
    };

    const questionImage = parseDataUri(imageBase64);
    const imageParts = [
      {
        inlineData: {
          data: questionImage.data,
          mimeType: questionImage.mimeType
        }
      }
    ];

    // Add solution PDF if provided
    if (options?.solutionPdfBase64) {
      const solutionPdf = parseDataUri(options.solutionPdfBase64);
      imageParts.push({
        inlineData: {
          data: solutionPdf.data,
          mimeType: solutionPdf.mimeType
        }
      });
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response with better error handling
    let parsed;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = text;
      const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      } else {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        jsonText = jsonMatch[0];
      }

      // Clean up the JSON text before parsing
      // This is tricky - we need to handle actual newlines in JSON strings
      // First, replace literal newlines within string values with spaces
      const cleanedText = jsonText
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control chars except \n and \t
        .replace(/\\\\\\\\+/g, '\\\\') // Fix multiple backslashes (4+ → 2)
        .replace(/\\'/g, "'"); // Fix escaped single quotes
      
      parsed = JSON.parse(cleanedText);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Response text (first 1000 chars):', text.substring(0, 1000));
      console.error('Response text (last 1000 chars):', text.substring(text.length - 1000));
      
      // Try one more time with aggressive cleaning
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // Remove ALL newlines and tabs from the JSON string
          const aggressiveClean = jsonMatch[0]
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/\r/g, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .replace(/\\\\\\\\+/g, '\\\\')
            .replace(/\\'/g, "'");
          parsed = JSON.parse(aggressiveClean);
          console.log('Successfully parsed with aggressive cleaning');
        } else {
          throw error;
        }
      } catch (secondError) {
        throw new Error(`Failed to parse AI response: ${error}`);
      }
    }

    // Apply default values if marking schema not found (use UI defaults or fallback)
    const defaultMarks = {
      positiveMarks: options?.defaultPositiveMarks || 4,
      negativeMarks: options?.defaultNegativeMarks || 1,
      durationPerQuestion: options?.defaultDuration !== undefined ? options.defaultDuration : 120
    };

    const sectionInstructions = {
      positiveMarks: parsed.sectionInstructions?.positiveMarks || defaultMarks.positiveMarks,
      negativeMarks: parsed.sectionInstructions?.negativeMarks || defaultMarks.negativeMarks,
      durationPerQuestion: parsed.sectionInstructions?.durationPerQuestion || defaultMarks.durationPerQuestion
    };

    // Apply defaults to each question if not present
    const questions = (parsed.questions || []).map((q: any) => ({
      ...q,
      positiveMarks: q.positiveMarks || sectionInstructions.positiveMarks,
      negativeMarks: q.negativeMarks || sectionInstructions.negativeMarks,
      durationSeconds: q.durationSeconds || sectionInstructions.durationPerQuestion,
      difficulty: q.difficulty || 5, // Default medium difficulty
      tags: q.tags || [],
      images: q.images || [], // Ensure images array always exists
      options: (q.options || []).map((opt: any, idx: number) => ({
        ...opt,
        id: opt.id || `opt${idx + 1}`
      }))
    }));

    return {
      questions,
      sectionInstructions,
      metadata: {
        totalQuestions: questions.length,
        processingTime: Date.now() - startTime,
        provider: 'gemini'
      }
    };
  }

  private async extractWithOpenAI(
    imageBase64: string,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPdfBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
    }
  ): Promise<QuestionExtractionResult> {
    const startTime = Date.now();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const prompt = this.buildExtractionPrompt(options);

    // Prepare messages with images
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ];

    // Add solution PDF if provided
    if (options?.solutionPdfBase64) {
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: options.solutionPdfBase64.startsWith('data:') ? options.solutionPdfBase64 : `data:application/pdf;base64,${options.solutionPdfBase64}`
        }
      });
    }

    const response = await this.openai.chat.completions.create({
      model: this.config?.model || 'gpt-4o-mini',
      messages,
      max_tokens: 16000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0].message.content || '{}';

    // Parse the JSON response with better error handling
    let parsed;
    try {
      // OpenAI with json_object format should return clean JSON
      // But still apply some cleaning just in case
      const cleanedText = text
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove control chars except \n and \t
        .replace(/\\\\\\\\+/g, '\\\\') // Fix multiple backslashes
        .replace(/\\'/g, "'"); // Fix escaped single quotes
      
      parsed = JSON.parse(cleanedText);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      console.error('Response text (first 1000 chars):', text.substring(0, 1000));
      console.error('Response text (last 1000 chars):', text.substring(text.length - 1000));
      
      // Try aggressive cleaning
      try {
        const aggressiveClean = text
          .replace(/\n/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/\r/g, '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\\\\\\\\+/g, '\\\\')
          .replace(/\\'/g, "'");
        parsed = JSON.parse(aggressiveClean);
        console.log('Successfully parsed with aggressive cleaning');
      } catch (secondError) {
        throw new Error(`Failed to parse AI response: ${error}`);
      }
    }

    const { questions = [], sectionInstructions = {} } = parsed;

    // Normalize questions
    const normalizedQuestions = questions.map((q: any) => ({
      ...q,
      positiveMarks: q.positiveMarks || sectionInstructions.positiveMarks || options?.defaultPositiveMarks || 4,
      negativeMarks: q.negativeMarks || sectionInstructions.negativeMarks || options?.defaultNegativeMarks || 1,
      durationSeconds: q.durationSeconds || sectionInstructions.durationPerQuestion || options?.defaultDuration || 120,
      difficulty: q.difficulty || 5,
      tags: q.tags || [],
      images: q.images || [], // Ensure images array always exists
      options: (q.options || []).map((opt: any, idx: number) => ({
        ...opt,
        id: opt.id || `opt${idx + 1}`
      }))
    }));

    return {
      questions: normalizedQuestions,
      sectionInstructions,
      metadata: {
        totalQuestions: normalizedQuestions.length,
        processingTime: Date.now() - startTime,
        provider: 'openai'
      }
    };
  }

  private buildExtractionPrompt(options?: {
    includeHints?: boolean;
    includeSolutions?: boolean;
    solutionPdfBase64?: string;
  }): string {
    return `You are an expert question extraction AI for competitive exams. Analyze the provided image(s) and extract ALL questions with complete metadata.

CRITICAL INSTRUCTIONS:
1. Extract ALL questions from the image(s) - these are PREVIOUS YEAR QUESTIONS
2. Identify question type: SINGLE_CHOICE, MULTIPLE_CHOICE, INTEGER, or PARAGRAPH
3. Extract all options with unique IDs (opt1, opt2, etc.) and labels (A, B, C, D)
4. Identify correct answer(s) from answer keys or solutions
5. Convert ALL equations to LaTeX: x^2, \\frac{a}{b}, \\sqrt{x}, etc.
6. DO NOT generate images - only reference existing images from the PDF
7. For complex equations that can't be converted to LaTeX, note the image location
8. Read section instructions for: positive marks, negative marks, duration per question
9. Estimate difficulty 1-10 based on concept complexity
10. Extract subject/chapter/topic from question content or headers
11. Generate relevant tags (e.g., "physics", "mechanics", "kinematics")
${options?.includeHints 
  ? '12. Generate SHORT, CONCISE hints (1 sentence max, key concept only)' 
  : '12. DO NOT include "hint" field - leave it empty or omit it'}
${options?.includeSolutions 
  ? '13. Generate BRIEF solutions (2-3 sentences max, essential steps only, NO detailed explanations)' 
  : '13. DO NOT include "solution" field - leave it empty or omit it'}
${options?.solutionPdfBase64 ? '14. Match solutions from provided PDF (may be different order)' : ''}

OUTPUT FORMAT (JSON):
{
  "sectionInstructions": {
    "positiveMarks": 4,
    "negativeMarks": 1,
    "durationPerQuestion": 120
  },
  "questions": [
    {
      "questionText": "What is the capital of France? $x^2 + y^2 = r^2$",
      "options": [
        {"id": "opt1", "label": "A", "text": "Berlin", "isCorrect": false},
        {"id": "opt2", "label": "B", "text": "Madrid", "isCorrect": false},
        {"id": "opt3", "label": "C", "text": "Paris", "isCorrect": true},
        {"id": "opt4", "label": "D", "text": "Rome", "isCorrect": false}
      ],
      "questionType": "SINGLE_CHOICE",
      "difficulty": 3,
      "positiveMarks": 4,
      "negativeMarks": 1,
      "durationSeconds": 120,
      "tags": ["geography", "capitals", "europe"],
      "subjectName": "Geography",
      "chapterName": "World Capitals",
      "topicName": "European Capitals",
      "hint": "Think about the Eiffel Tower",
      "solution": "Paris is the capital of France.",
      "images": [
        {
          "base64": "data:image/jpeg;base64,...",
          "location": "question"
        }
      ],
      "rawLatex": ["x^2 + y^2 = r^2"]
    }
  ]
}

LATEX RULES:
- Superscripts: x^2, x^{10}
- Subscripts: x_1, x_{10}
- Fractions: \\frac{a}{b}
- Square root: \\sqrt{x}, \\sqrt[n]{x}
- Greek: \\alpha, \\beta, \\theta, \\pi
- Summation: \\sum_{i=1}^{n}
- Integration: \\int_{a}^{b}
- Limits: \\lim_{x \\to 0}
- Matrices: \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}

IMPORTANT RULES:
- Keep hints ULTRA-BRIEF (1 sentence, key concept only)
- Keep solutions CONCISE (3-5 key steps max, essential steps only)
- Format solutions with numbered steps for readability (e.g., "Step 1: ... Step 2: ...")
- DO NOT generate or describe images - only reference existing ones
- Focus on data extraction, not explanations
- Use proper JSON escaping for LaTeX backslashes (use \\\\ for \\)
- Write solutions as single-line strings with step markers for formatting
- Avoid special characters that break JSON parsing

Return ONLY valid JSON with no markdown code blocks, no additional text.`;
  }

  async cropAndOptimizeImage(
    base64Image: string,
    maxWidth: number = 800,
    maxHeight: number = 600
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Image;
    });
  }

  async uploadImageToS3(base64Image: string, fileName: string): Promise<string> {
    // This will call your backend API to upload to S3
    const response = await fetch('/api/backend/v1/admin/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        image: base64Image,
        fileName: fileName,
        folder: 'questions'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to S3');
    }

    const data = await response.json();
    return data.url;
  }

  async matchHierarchy(
    questionText: string,
    subjectName?: string,
    chapterName?: string,
    topicName?: string
  ): Promise<{
    subjectId: string;
    chapterId: string;
    topicId: string;
  }> {
    try {
      // Step 1: Fetch all subjects
      const subjectsResponse = await fetch('/api/backend/v1/admin/hierarchy/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const subjects = await subjectsResponse.json();

      // Step 2: Match best subject using AI
      let bestSubject = subjects[0];
      if (subjectName && this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Given this question: "${questionText}" and subject hint: "${subjectName}", which of these subjects is the best match? Return ONLY the subject name, nothing else.\n\nSubjects: ${subjects.map((s: any) => s.name).join(', ')}`;
        const result = await model.generateContent(prompt);
        const matchedName = result.response.text().trim();
        bestSubject = subjects.find((s: any) => s.name.toLowerCase().includes(matchedName.toLowerCase())) || subjects[0];
      }

      // Step 3: Fetch chapters for the matched subject
      const chaptersResponse = await fetch(`/api/backend/v1/admin/hierarchy/subjects/${bestSubject.id}/chapters`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const chapters = await chaptersResponse.json();

      // Step 4: Match best chapter
      let bestChapter = chapters[0];
      if (chapterName && this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Given this question: "${questionText}" and chapter hint: "${chapterName}", which of these chapters is the best match? Return ONLY the chapter name, nothing else.\n\nChapters: ${chapters.map((c: any) => c.name).join(', ')}`;
        const result = await model.generateContent(prompt);
        const matchedName = result.response.text().trim();
        bestChapter = chapters.find((c: any) => c.name.toLowerCase().includes(matchedName.toLowerCase())) || chapters[0];
      }

      // Step 5: Fetch topics for the matched chapter
      const topicsResponse = await fetch(`/api/backend/v1/admin/hierarchy/chapters/${bestChapter.id}/topics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const topics = await topicsResponse.json();

      // Step 6: Match best topic
      let bestTopic = topics[0];
      if (topicName && this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Given this question: "${questionText}" and topic hint: "${topicName}", which of these topics is the best match? Return ONLY the topic name, nothing else.\n\nTopics: ${topics.map((t: any) => t.name).join(', ')}`;
        const result = await model.generateContent(prompt);
        const matchedName = result.response.text().trim();
        bestTopic = topics.find((t: any) => t.name.toLowerCase().includes(matchedName.toLowerCase())) || topics[0];
      }

      return {
        subjectId: bestSubject.id,
        chapterId: bestChapter.id,
        topicId: bestTopic.id
      };
    } catch (error) {
      console.error('Hierarchy matching error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
