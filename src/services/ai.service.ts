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
  difficulty: number; // 1-10 scale: 1-3 easy, 4-7 medium, 8-10 hard
  positiveMarks: number;
  negativeMarks: number;
  durationSeconds: number;
  hint?: string;
  solution?: string; // Detailed step-by-step solution for students
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
  pageNumber?: number; // Track which page this question came from
  contextFromPreviousPage?: string; // For multi-page questions
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
    totalPages?: number;
    currentPage?: number;
  };
}

export interface PageProcessingCallback {
  onPageProcessed: (pageNumber: number, questions: ExtractedQuestion[]) => void;
  onProgress: (current: number, total: number) => void;
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
      pageNumber?: number;
      previousPageContext?: string;
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

  async extractQuestionsFromPDF(
    pdfFile: File,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPdfBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
      onPageProcessed?: (pageNumber: number, questions: ExtractedQuestion[]) => void;
      onProgress?: (current: number, total: number) => void;
    }
  ): Promise<QuestionExtractionResult> {
    if (!this.config) {
      throw new Error('AI service not configured. Please set up LLM provider.');
    }

    const allQuestions: ExtractedQuestion[] = [];
    let previousPageContext = '';
    const startTime = Date.now();

    // Convert PDF to images (page by page)
    const pdfPages = await this.convertPDFToImages(pdfFile);
    const totalPages = pdfPages.length;

    for (let i = 0; i < pdfPages.length; i++) {
      const pageNumber = i + 1;
      options?.onProgress?.(pageNumber, totalPages);

      try {
        const result = await this.extractQuestionsFromImage(pdfPages[i], {
          ...options,
          pageNumber,
          previousPageContext
        });

        // Add page number to each question
        const questionsWithPage = result.questions.map(q => ({
          ...q,
          pageNumber,
          contextFromPreviousPage: previousPageContext || undefined
        }));

        allQuestions.push(...questionsWithPage);
        
        // Update context for next page (last question text + any incomplete info)
        if (questionsWithPage.length > 0) {
          const lastQuestion = questionsWithPage[questionsWithPage.length - 1];
          previousPageContext = `Previous page ended with: ${lastQuestion.questionText.substring(0, 200)}...`;
        }

        // Notify callback with processed questions
        options?.onPageProcessed?.(pageNumber, questionsWithPage);

      } catch (error) {
        console.error(`Error processing page ${pageNumber}:`, error);
        // Continue with next page
      }
    }

    return {
      questions: allQuestions,
      metadata: {
        totalQuestions: allQuestions.length,
        processingTime: Date.now() - startTime,
        provider: this.config.provider,
        totalPages,
        currentPage: totalPages
      }
    };
  }

  private async convertPDFToImages(pdfFile: File): Promise<string[]> {
    // Use pdf.js to convert PDF pages to images
    const pdfjsLib = await import('pdfjs-dist');
    
    // Use local worker file from node_modules instead of CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        images.push(canvas.toDataURL('image/jpeg', 0.95));
      }
    }

    return images;
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
      pageNumber?: number;
      previousPageContext?: string;
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
      pageNumber?: number;
      previousPageContext?: string;
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
      max_completion_tokens: 32000,
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
    pageNumber?: number;
    previousPageContext?: string;
  }): string {
    const contextNote = options?.previousPageContext 
      ? `\n\nCONTEXT FROM PREVIOUS PAGE:\n${options.previousPageContext}\nIf a question on this page continues from the previous page, use this context.`
      : '';

    return `You are an expert question extraction AI for competitive exams. Analyze the provided image(s) and extract ALL questions with complete metadata.
${contextNote}

CRITICAL INSTRUCTIONS:
1. Extract ALL questions from the image(s) - these are PREVIOUS YEAR QUESTIONS
2. **REMOVE question numbers** (Q1, Q2, Q71, etc.) from the beginning of question text
3. Identify question type: SINGLE_CHOICE, MULTIPLE_CHOICE, NUMERICAL, or PARAGRAPH
4. Extract all options with unique IDs (opt1, opt2, etc.) and labels (A, B, C, D)
5. Identify correct answer(s) from answer keys or solutions
6. Convert ALL equations to LaTeX: x^2, \\frac{a}{b}, \\sqrt{x}, etc.
7. DO NOT generate images - only reference existing images from the PDF
8. For complex equations that can't be converted to LaTeX, note the image location
9. Read section instructions for: positive marks, negative marks, duration per question
9. **DIFFICULTY RATING (1-10 scale):**
   - 1-3: EASY - Basic recall, simple calculations, direct application
   - 4-7: MEDIUM - Multi-step problems, concept application, moderate complexity
   - 8-10: HARD - Advanced concepts, complex multi-step, requires deep understanding
   Analyze the question's conceptual depth, calculation complexity, and required knowledge to assign accurate difficulty.
10. Extract subject/chapter/topic from question content or headers
11. Generate relevant tags (e.g., "physics", "mechanics", "kinematics")
${options?.includeHints 
  ? '12. Generate SHORT, CONCISE hints (1-2 sentences max, key concept or approach only)' 
  : '12. DO NOT include "hint" field - leave it empty or omit it'}
${options?.includeSolutions 
  ? `13. **SOLUTION GENERATION - KEY CONCEPTS + DETAILED STEPS:**
   
   **SOLUTION STRUCTURE - MANDATORY FORMAT:**
   
   **Part 1: KEY CONCEPTS (Start with this)**
   - List 2-4 key concepts/principles needed to solve this problem
   - Explain each concept in 1-2 simple sentences
   - This helps students understand the foundation and solve similar problems
   - Format: "**Key Concept 1:** [Concept Name]\\n[Brief explanation]\\n\\n**Key Concept 2:** ..."
   
   **Part 2: DETAILED SOLUTION**
   ${options?.solutionPdfBase64 
     ? `- SOLUTION PDF PROVIDED: Extract EVERY step from the provided solution
   - Use it as PRIMARY REFERENCE for correctness
   - VERIFY all calculations match exactly`
     : `- NO SOLUTION PROVIDED: Solve step-by-step with EXTREME detail
   - VERIFY final answer matches the correct option`}
   
   **FORMATTING RULES - CRITICAL:**
   - Use \\n\\n for paragraph breaks (double line break)
   - Use \\n for single line breaks
   - Start each major section on a new line
   - Add blank lines between steps for readability
   - Example: "Step 1: [Title]\\n[Explanation]\\n\\nStep 2: [Title]\\n[Explanation]"
   
   **DETAIL REQUIREMENTS:**
   - Assume student is a complete beginner
   - Show EVERY calculation: $5 + 3 = 8$, then $8 \\times 2 = 16$
   - Explain EVERY formula before using it
   - Define EVERY variable with units
   - Show intermediate results after EACH operation
   - NEVER skip steps or write "after simplification" without showing it
   
   **MANDATORY STRUCTURE:**
   
   **Key Concepts:**\\n
   [List key concepts here with explanations]\\n\\n
   **Given:**\\n
   - [List all given information with units]\\n
   - Find: [What needs to be found]\\n\\n
   **Step 1: [Step Title]**\\n
   [Explanation of what and why]\\n
   [Formula if applicable]\\n
   [Calculation with every operation shown]\\n
   [Result with units]\\n\\n
   **Step 2: [Step Title]**\\n
   [Continue same format]\\n\\n
   **Final Answer:**\\n
   [Numerical value with units and option reference if MCQ]
   
   **EXAMPLE FORMAT:**
   
   "**Key Concepts:**\\n\\n**Key Concept 1: Newton's Second Law**\\nForce is directly proportional to mass and acceleration. When an object accelerates, the force acting on it equals mass times acceleration.\\n\\n**Key Concept 2: Units in Physics**\\nForce is measured in Newtons (N), which equals kg⋅m/s². Always include units in calculations to verify correctness.\\n\\n**Given:**\\n- Mass of object: $m = 5$ kg\\n- Acceleration: $a = 3$ m/s²\\n- Find: Force $F$\\n\\n**Step 1: Identify the applicable formula**\\nWe use Newton's Second Law: $F = m \\times a$\\nThis relates force directly to mass and acceleration.\\n\\n**Step 2: Substitute the values**\\n$F = 5 \\times 3$\\nWe multiply the mass by the acceleration.\\n\\n**Step 3: Calculate the result**\\n$5 \\times 3 = 15$\\n\\n**Step 4: Add units**\\n$F = 15$ N (Newtons)\\n\\n**Final Answer:**\\nThe force acting on the object is **15 N** (Option C)"
   
   **REMEMBER: Key concepts help students learn patterns. Proper formatting makes solutions beautiful and easy to understand.**` 
  : '13. DO NOT include "solution" field - leave it empty or omit it'}
${options?.solutionPdfBase64 ? '\n14. **CRITICAL: Solution PDF is provided - Use it as your PRIMARY reference for solution accuracy. Match the approach and verify all steps.**' : ''}

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
      "hint": "Think about the Eiffel Tower and French culture.",
      "solution": "Given: Question asks for capital of France\\n\\nStep 1: Identify key landmarks\\nFrance is known for the Eiffel Tower, which is located in Paris.\\n\\nStep 2: Recall geographical knowledge\\nParis is the largest city and capital of France.\\n\\nFinal Answer: Paris (Option C)",
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

LATEX FORMATTING RULES - ABSOLUTELY CRITICAL - NO EXCEPTIONS:
- **EVERY mathematical expression MUST be wrapped in $ delimiters**
- **NEVER write raw LaTeX without $ delimiters**
- **NEVER write expressions like \\(x\\) or \\[equation\\] - ALWAYS use $ delimiters**
- Inline equations: Use single $ like: $x^2 + y^2 = r^2$
- Block equations: Use double $$ like: $$\frac{a}{b} = c$$
- Variables: $x$, $y$, $P(1, 0, 3)$, $\alpha$, $\beta$, $\gamma$
- Example question text: "If the image of point $P(1, 0, 3)$ is $Q(\alpha, \beta, \gamma)$, then $\alpha + \beta + \gamma$ equals:"
- Example option text: "A. $x = -2$ or $x = -3$"
- Example solution: "Step 1: Factor the equation $(x + 2)(x + 3) = 0$"
- **WRONG:** "If the image of the point \\(P(1, 0, 3)\\)" ❌
- **CORRECT:** "If the image of the point $P(1, 0, 3)$" ✅

LATEX SYNTAX:
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
- Keep hints BRIEF (1-2 sentences, key concept or approach)
- Make solutions DETAILED and EDUCATIONAL with clear step-by-step explanations
- Format solutions with "Given:", "Step 1:", "Step 2:", etc., and "Final Answer:"
- Use \\n for line breaks in solutions to make them readable
- DO NOT generate or describe images - only reference existing ones
- Use proper JSON escaping for LaTeX backslashes (use \\\\ for \\)
- Avoid special characters that break JSON parsing
- Difficulty rating must accurately reflect question complexity (1-10 scale)

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
      if (!this.config) {
        throw new Error('AI service not configured. Please configure before using hierarchy matching.');
      }

      // Step 1: Fetch all subjects
      const subjectsResponse = await fetch('/api/backend/v1/admin/hierarchy/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const subjects = await subjectsResponse.json();

      // Step 2: Match best subject using configured LLM
      let bestSubject = subjects[0];
      if (subjectName && subjects.length > 0) {
        const prompt = `Given this question: "${questionText.substring(0, 300)}" and subject hint: "${subjectName}", which of these subjects is the best match? Return ONLY the exact subject name from the list, nothing else.\n\nSubjects: ${subjects.map((s: any) => s.name).join(', ')}`;
        const matchedName = await this.callLLM(prompt);
        bestSubject = subjects.find((s: any) => 
          s.name.toLowerCase() === matchedName.toLowerCase() ||
          s.name.toLowerCase().includes(matchedName.toLowerCase()) ||
          matchedName.toLowerCase().includes(s.name.toLowerCase())
        ) || subjects[0];
      }

      // Step 3: Fetch chapters for the matched subject
      const chaptersResponse = await fetch(`/api/backend/v1/admin/hierarchy/subjects/${bestSubject.id}/chapters`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const chapters = await chaptersResponse.json();

      // Step 4: Match best chapter using configured LLM
      let bestChapter = chapters[0];
      if (chapterName && chapters.length > 0) {
        const prompt = `Given this question: "${questionText.substring(0, 300)}" and chapter hint: "${chapterName}", which of these chapters is the best match? Return ONLY the exact chapter name from the list, nothing else.\n\nChapters: ${chapters.map((c: any) => c.name).join(', ')}`;
        const matchedName = await this.callLLM(prompt);
        bestChapter = chapters.find((c: any) => 
          c.name.toLowerCase() === matchedName.toLowerCase() ||
          c.name.toLowerCase().includes(matchedName.toLowerCase()) ||
          matchedName.toLowerCase().includes(c.name.toLowerCase())
        ) || chapters[0];
      }

      // Step 5: Fetch topics for the matched chapter
      const topicsResponse = await fetch(`/api/backend/v1/admin/hierarchy/chapters/${bestChapter.id}/topics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const topics = await topicsResponse.json();

      // Step 6: Match best topic using configured LLM
      let bestTopic = topics[0];
      if (topicName && topics.length > 0) {
        const prompt = `Given this question: "${questionText.substring(0, 300)}" and topic hint: "${topicName}", which of these topics is the best match? Return ONLY the exact topic name from the list, nothing else.\n\nTopics: ${topics.map((t: any) => t.name).join(', ')}`;
        const matchedName = await this.callLLM(prompt);
        bestTopic = topics.find((t: any) => 
          t.name.toLowerCase() === matchedName.toLowerCase() ||
          t.name.toLowerCase().includes(matchedName.toLowerCase()) ||
          matchedName.toLowerCase().includes(t.name.toLowerCase())
        ) || topics[0];
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

  private async callLLM(prompt: string): Promise<string> {
    if (!this.config) {
      throw new Error('AI service not configured');
    }

    if (this.config.provider === 'gemini') {
      if (!this.genAI) {
        throw new Error('Gemini AI not initialized');
      }
      const model = this.genAI.getGenerativeModel({ model: this.config.model || 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } else {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }
      const response = await this.openai.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 100
      });
      return response.choices[0].message.content?.trim() || '';
    }
  }
}

export const aiService = new AIService();
