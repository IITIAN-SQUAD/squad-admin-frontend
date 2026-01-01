import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export type LLMProvider = 'gemini' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  model?: string;
}

export interface IncompleteQuestion {
  partialText: string;
  partialOptions?: string[];
  pageNumber: number;
}

export interface PageExtractionResult {
  questions: ExtractedQuestion[];
  incompleteQuestion?: IncompleteQuestion;
  pageNumber: number;
  processingTime: number;
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

  async extractQuestionsFromSinglePage(
    pageImageBase64: string,
    pageNumber: number,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPageBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
      previousPageContext?: IncompleteQuestion;
    }
  ): Promise<PageExtractionResult> {
    if (!this.config) {
      throw new Error('AI service not configured. Please set up LLM provider.');
    }

    const startTime = Date.now();

    if (this.config.provider === 'gemini') {
      return this.extractPageWithGemini(pageImageBase64, pageNumber, options);
    } else {
      return this.extractPageWithOpenAI(pageImageBase64, pageNumber, options);
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
      model: this.config?.model || 'gemini-2.0-flash-exp'
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

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      throw new Error(`Failed to parse AI response: ${error}`);
    }

    const { questions = [], sectionInstructions = {} } = parsed;

    const normalizedQuestions = questions.map((q: any) => ({
      ...q,
      positiveMarks: q.positiveMarks || sectionInstructions.positiveMarks || options?.defaultPositiveMarks || 4,
      negativeMarks: q.negativeMarks || sectionInstructions.negativeMarks || options?.defaultNegativeMarks || 1,
      durationSeconds: q.durationSeconds || sectionInstructions.durationPerQuestion || options?.defaultDuration || 120,
      difficulty: q.difficulty || 5,
      tags: q.tags || [],
      images: q.images || [],
      rawLatex: q.rawLatex || [],
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
              url: imageBase64
            }
          }
        ]
      }
    ];

    if (options?.solutionPdfBase64) {
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: options.solutionPdfBase64
        }
      });
    }

    const response = await this.openai.chat.completions.create({
      model: this.config?.model || 'gpt-4o',
      messages,
      max_tokens: 16000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(text);

    const { questions = [], sectionInstructions = {} } = parsed;

    const normalizedQuestions = questions.map((q: any) => ({
      ...q,
      positiveMarks: q.positiveMarks || sectionInstructions.positiveMarks || options?.defaultPositiveMarks || 4,
      negativeMarks: q.negativeMarks || sectionInstructions.negativeMarks || options?.defaultNegativeMarks || 1,
      durationSeconds: q.durationSeconds || sectionInstructions.durationPerQuestion || options?.defaultDuration || 120,
      difficulty: q.difficulty || 5,
      tags: q.tags || [],
      images: q.images || [],
      rawLatex: q.rawLatex || [],
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

  private async extractPageWithGemini(
    pageImageBase64: string,
    pageNumber: number,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPageBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
      previousPageContext?: IncompleteQuestion;
    }
  ): Promise<PageExtractionResult> {
    const startTime = Date.now();
    
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized');
    }

    const model = this.genAI.getGenerativeModel({ 
      model: this.config?.model || 'gemini-2.0-flash-exp'
    });

    const prompt = this.buildSinglePagePrompt(pageNumber, options);

    const parseDataUri = (dataUri: string) => {
      const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return { mimeType: matches[1], data: matches[2] };
      }
      return { mimeType: 'image/jpeg', data: dataUri };
    };

    const imageParts = [];
    const parsedImage = parseDataUri(pageImageBase64);
    imageParts.push({
      inlineData: {
        data: parsedImage.data,
        mimeType: parsedImage.mimeType
      }
    });

    if (options?.solutionPageBase64) {
      const parsedSolution = parseDataUri(options.solutionPageBase64);
      imageParts.push({
        inlineData: {
          data: parsedSolution.data,
          mimeType: parsedSolution.mimeType
        }
      });
    }

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Post-process to fix missing $ delimiters (Gemini)
    const fixLatexDelimiters = (text: string): string => {
      if (!text) return text;
      
      console.log('[Gemini] fixLatexDelimiters INPUT:', text.substring(0, 150));
      
      let result = text;
      
      // Helper to match balanced braces
      const matchBalancedBraces = (str: string, startIdx: number): number => {
        let depth = 0;
        for (let i = startIdx; i < str.length; i++) {
          if (str[i] === '{') depth++;
          else if (str[i] === '}') {
            depth--;
            if (depth === 0) return i;
          }
        }
        return -1;
      };
      
      // Match LaTeX expressions with proper brace matching
      const latexPattern = /\\[a-zA-Z]+/g;
      let match;
      const replacements: Array<{original: string, wrapped: string, index: number}> = [];
      
      while ((match = latexPattern.exec(text)) !== null) {
        let latexExpr = match[0];
        let endIdx = match.index + latexExpr.length;
        
        // Extend to include all braces, subscripts, superscripts
        while (endIdx < text.length) {
          const char = text[endIdx];
          if (char === '{') {
            const closeIdx = matchBalancedBraces(text, endIdx);
            if (closeIdx === -1) break;
            endIdx = closeIdx + 1;
          } else if (char === '_' || char === '^') {
            endIdx++;
            if (text[endIdx] === '{') {
              const closeIdx = matchBalancedBraces(text, endIdx);
              if (closeIdx === -1) break;
              endIdx = closeIdx + 1;
            } else if (/[a-zA-Z0-9]/.test(text[endIdx])) {
              endIdx++;
            }
          } else {
            break;
          }
        }
        
        latexExpr = text.substring(match.index, endIdx);
        
        // Check if already wrapped
        const before = text.substring(Math.max(0, match.index - 1), match.index);
        const after = text.substring(endIdx, endIdx + 1);
        
        if (before !== '$' && after !== '$') {
          replacements.push({
            original: latexExpr,
            wrapped: `$${latexExpr}$`,
            index: match.index
          });
        }
      }
      
      // Apply in reverse
      replacements.reverse().forEach(repl => {
        result = result.substring(0, repl.index) + repl.wrapped + result.substring(repl.index + repl.original.length);
      });
      
      // Wrap chemical notation and formulas
      // Pattern 1: SN1, SN2, E1, E2 reactions
      result = result.replace(/\b(SN1|SN2|E1|E2|S_N1|S_N2)\b/g, (match) => {
        const idx = result.indexOf(match);
        const before = idx > 0 ? result[idx - 1] : '';
        if (before === '$') return match;
        return `$\\text{${match}}$`;
      });
      
      // Pattern 2: Chemical formulas like CH3, CH2, CO2, H2O, NH3, etc.
      result = result.replace(/\b([A-Z][a-z]?)(\d+)/g, (match, element, number) => {
        const idx = result.indexOf(match);
        const before = idx > 0 ? result[idx - 1] : '';
        const after = idx + match.length < result.length ? result[idx + match.length] : '';
        // Skip if already in LaTeX or part of a word
        if (before === '$' || before === '\\' || /[a-zA-Z]/.test(after)) return match;
        return `$\\text{${element}}_${number}$`;
      });
      
      console.log('[Gemini] fixLatexDelimiters OUTPUT:', result.substring(0, 150));
      console.log('[Gemini] fixLatexDelimiters WRAPPED:', replacements.length, 'expressions');
      
      return result;
    };

    // Fix LaTeX in all questions
    if (parsed.questions) {
      parsed.questions = parsed.questions.map((q: any) => ({
        ...q,
        questionText: fixLatexDelimiters(q.questionText),
        options: q.options?.map((opt: any) => ({
          ...opt,
          text: fixLatexDelimiters(opt.text)
        })),
        hint: q.hint ? fixLatexDelimiters(q.hint) : q.hint,
        solution: q.solution ? fixLatexDelimiters(q.solution) : q.solution
      }));
    }

    return {
      questions: parsed.questions || [],
      incompleteQuestion: parsed.incompleteQuestion,
      pageNumber,
      processingTime: Date.now() - startTime
    };
  }

  private async extractPageWithOpenAI(
    pageImageBase64: string,
    pageNumber: number,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      solutionPageBase64?: string;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
      previousPageContext?: IncompleteQuestion;
    }
  ): Promise<PageExtractionResult> {
    const startTime = Date.now();
    
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const prompt = this.buildSinglePagePrompt(pageNumber, options);

    const content: any[] = [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: {
          url: pageImageBase64.startsWith('data:') ? pageImageBase64 : `data:image/jpeg;base64,${pageImageBase64}`
        }
      }
    ];

    if (options?.solutionPageBase64) {
      content.push({
        type: 'image_url',
        image_url: {
          url: options.solutionPageBase64.startsWith('data:') ? options.solutionPageBase64 : `data:image/jpeg;base64,${options.solutionPageBase64}`
        }
      });
    }

    const messages: any[] = [{ role: 'user', content }];

    const response = await this.openai.chat.completions.create({
      model: this.config?.model || 'gpt-4o',
      messages,
      max_tokens: 16000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(text);

    // Post-process to fix missing $ delimiters (OpenAI)
    const fixLatexDelimiters = (text: string): string => {
      if (!text) return text;
      
      console.log('[OpenAI] fixLatexDelimiters INPUT:', text.substring(0, 150));
      
      let result = text;
      
      // Helper to match balanced braces
      const matchBalancedBraces = (str: string, startIdx: number): number => {
        let depth = 0;
        for (let i = startIdx; i < str.length; i++) {
          if (str[i] === '{') depth++;
          else if (str[i] === '}') {
            depth--;
            if (depth === 0) return i;
          }
        }
        return -1;
      };
      
      // Match LaTeX expressions with proper brace matching
      const latexPattern = /\\[a-zA-Z]+/g;
      let match;
      const replacements: Array<{original: string, wrapped: string, index: number}> = [];
      
      while ((match = latexPattern.exec(text)) !== null) {
        let latexExpr = match[0];
        let endIdx = match.index + latexExpr.length;
        
        // Extend to include all braces, subscripts, superscripts
        while (endIdx < text.length) {
          const char = text[endIdx];
          if (char === '{') {
            const closeIdx = matchBalancedBraces(text, endIdx);
            if (closeIdx === -1) break;
            endIdx = closeIdx + 1;
          } else if (char === '_' || char === '^') {
            endIdx++;
            if (text[endIdx] === '{') {
              const closeIdx = matchBalancedBraces(text, endIdx);
              if (closeIdx === -1) break;
              endIdx = closeIdx + 1;
            } else if (/[a-zA-Z0-9]/.test(text[endIdx])) {
              endIdx++;
            }
          } else {
            break;
          }
        }
        
        latexExpr = text.substring(match.index, endIdx);
        
        // Check if already wrapped
        const before = text.substring(Math.max(0, match.index - 1), match.index);
        const after = text.substring(endIdx, endIdx + 1);
        
        if (before !== '$' && after !== '$') {
          replacements.push({
            original: latexExpr,
            wrapped: `$${latexExpr}$`,
            index: match.index
          });
        }
      }
      
      // Apply in reverse
      replacements.reverse().forEach(repl => {
        result = result.substring(0, repl.index) + repl.wrapped + result.substring(repl.index + repl.original.length);
      });
      
      // Wrap chemical notation and formulas
      // Pattern 1: SN1, SN2, E1, E2 reactions
      result = result.replace(/\b(SN1|SN2|E1|E2|S_N1|S_N2)\b/g, (match) => {
        const idx = result.indexOf(match);
        const before = idx > 0 ? result[idx - 1] : '';
        if (before === '$') return match;
        return `$\\text{${match}}$`;
      });
      
      // Pattern 2: Chemical formulas like CH3, CH2, CO2, H2O, NH3, etc.
      result = result.replace(/\b([A-Z][a-z]?)(\d+)/g, (match, element, number) => {
        const idx = result.indexOf(match);
        const before = idx > 0 ? result[idx - 1] : '';
        const after = idx + match.length < result.length ? result[idx + match.length] : '';
        // Skip if already in LaTeX or part of a word
        if (before === '$' || before === '\\' || /[a-zA-Z]/.test(after)) return match;
        return `$\\text{${element}}_${number}$`;
      });
      
      console.log('[OpenAI] fixLatexDelimiters OUTPUT:', result.substring(0, 150));
      console.log('[OpenAI] fixLatexDelimiters WRAPPED:', replacements.length, 'expressions');
      
      return result;
    };

    // Fix LaTeX in all questions
    if (parsed.questions) {
      parsed.questions = parsed.questions.map((q: any) => ({
        ...q,
        questionText: fixLatexDelimiters(q.questionText),
        options: q.options?.map((opt: any) => ({
          ...opt,
          text: fixLatexDelimiters(opt.text)
        })),
        hint: q.hint ? fixLatexDelimiters(q.hint) : q.hint,
        solution: q.solution ? fixLatexDelimiters(q.solution) : q.solution
      }));
    }

    return {
      questions: parsed.questions || [],
      incompleteQuestion: parsed.incompleteQuestion,
      pageNumber,
      processingTime: Date.now() - startTime
    };
  }

  private buildSinglePagePrompt(
    pageNumber: number,
    options?: {
      includeHints?: boolean;
      includeSolutions?: boolean;
      previousPageContext?: IncompleteQuestion;
      defaultPositiveMarks?: number;
      defaultNegativeMarks?: number;
      defaultDuration?: number | null;
    }
  ): string {
    let contextSection = '';
    
    if (options?.previousPageContext) {
      contextSection = `
🔄 CONTEXT FROM PREVIOUS PAGE:
The previous page (Page ${options.previousPageContext.pageNumber}) had an INCOMPLETE question that was cut off:

Partial Question Text: "${options.previousPageContext.partialText}"
${options.previousPageContext.partialOptions ? `Partial Options: ${JSON.stringify(options.previousPageContext.partialOptions)}` : ''}

CRITICAL: If this page (Page ${pageNumber}) starts with a continuation of this question:
1. MERGE the continuation with the partial text from previous page
2. Complete the question with all options and details
3. Include it as a COMPLETE question in the output
4. Mark it with "continuedFromPage": ${options.previousPageContext.pageNumber}

If this page does NOT continue the previous question, ignore the context and process normally.
`;
    }

    const hintsSection = options?.includeHints 
      ? `Generate 1-2 line hints for each question`
      : `DO NOT generate hints. Omit "hint" field`;

    const solutionsSection = options?.includeSolutions
      ? `Generate detailed step-by-step solutions with \\n\\n for line breaks between steps`
      : `DO NOT generate solutions. Omit "solution" field`;

    return `You are an expert question extraction AI for competitive exams. You are analyzing Page ${pageNumber} of an exam paper.

${contextSection}

🚨 CRITICAL INSTRUCTIONS FOR PAGE-BY-PAGE PROCESSING:

1. **INCOMPLETE QUESTION DETECTION**:
   - If the LAST question on this page is CUT OFF (incomplete text, missing options, or ends mid-sentence)
   - Return it separately in "incompleteQuestion" field
   - Include: partial text, partial options (if any), and page number
   - Do NOT include incomplete questions in the main "questions" array

2. **COMPLETE QUESTIONS ONLY**:
   - Only include FULLY COMPLETE questions in the "questions" array
   - A complete question has: full question text, all options (for MCQ), and is not cut off

3. **LANGUAGE FILTERING**:
   - ONLY extract ENGLISH questions
   - IGNORE Hindi or other language questions

4. ${hintsSection}

5. ${solutionsSection}

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "questionText": "Full question text...",
      "options": [
        {"id": "opt1", "label": "(1)", "text": "option content", "isCorrect": false},
        {"id": "opt2", "label": "(2)", "text": "option content", "isCorrect": true}
      ],
      "questionType": "SINGLE_CHOICE",
      "difficulty": 5,
      "positiveMarks": ${options?.defaultPositiveMarks || 4},
      "negativeMarks": ${options?.defaultNegativeMarks || 1},
      "durationSeconds": ${options?.defaultDuration || 120},
      "tags": ["subject", "topic"],
      "hint": "Brief hint...",
      "solution": "**Given:**\\n\\n...\\n\\n**Solution:**\\n\\n...\\n\\n**Answer:**...",
      "images": [],
      "rawLatex": []
    }
  ],
  "incompleteQuestion": {
    "partialText": "The last question that was cut off...",
    "partialOptions": [
      {"id": "opt1", "label": "(1)", "text": "partial option", "isCorrect": false}
    ],
    "pageNumber": ${pageNumber}
  }
}

NOTE: If all questions on this page are complete, set "incompleteQuestion" to null or omit it.

LATEX RULES: Use DOUBLE backslashes in JSON (\\\\text, \\\\frac, \\\\sqrt)
LINE BREAKS: Use \\n\\n (double backslash-n) for line breaks in solutions

Return ONLY valid JSON with no markdown code blocks.`;
  }

  private buildExtractionPrompt(options?: {
    includeHints?: boolean;
    includeSolutions?: boolean;
    solutionPdfBase64?: string;
  }): string {
    const hintsSection = options?.includeHints 
      ? `
**HINTS**: Generate 1-2 line hints that guide thinking WITHOUT giving away the answer:
- Point to the KEY CONCEPT or formula needed
- Help students who are stuck to START solving
- Example: "Use ideal gas equation and consider equilibrium constant expression"
- Keep it brief but insightful`
      : `
**HINTS**: CRITICAL: DO NOT GENERATE HINTS. Set "hint" field to null or omit it completely from JSON`;

    const solutionsSection = options?.includeSolutions
      ? `
**SOLUTIONS**: Generate detailed step-by-step solutions showing EVERY calculation:

CRITICAL: Solution MUST follow this structure with \\n\\n for line breaks:
- Start with "**Given:**\\n\\n" followed by all known values
- Add "\\n\\n**Solution:**\\n\\n" before calculations  
- End with "\\n\\n**Answer:**" with final result
- Use \\n\\n between EVERY major step
- Show ALL arithmetic operations explicitly
- Example: "**Given:**\\n\\nVoltage: $V = 0.9$ V\\n\\n**Solution:**\\n\\nUsing Ohm's law:\\n\\n$I = \\frac{V}{R}$\\n\\nSubstituting values:\\n\\n$I = \\frac{0.9}{3} = 0.3$ A\\n\\n**Answer:** 0.3 A"`
      : `
**SOLUTIONS**: CRITICAL: DO NOT GENERATE SOLUTIONS. Set "solution" field to null or omit it completely from JSON`;

    return `You are an expert question extraction AI for competitive exams. Analyze the provided image(s) and extract ALL questions with complete metadata.

CRITICAL INSTRUCTIONS:
1. Extract ALL questions from the image(s) - these are PREVIOUS YEAR QUESTIONS
2. Identify question type: SINGLE_CHOICE, MULTIPLE_CHOICE, INTEGER, or PARAGRAPH
3. Extract all options with unique IDs (opt1, opt2, etc.) and labels (A, B, C, D or (1), (2), (3), (4))
4. Identify correct answer(s) from answer keys or solutions - NEVER leave questions without correct answers marked
5. Convert ALL equations to LaTeX with DOUBLE backslashes in JSON: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\text{CO}_2
6. For line breaks in solutions: Use \\n\\n (single backslash-n) NOT \\\\n\\\\n
7. Extract subject/chapter/topic from question content or headers
8. Generate relevant tags (e.g., "physics", "mechanics", "kinematics")

${hintsSection}

${solutionsSection}

🚨 CRITICAL LATEX FORMATTING - EVERY EXPRESSION MUST HAVE $ DELIMITERS:

**MANDATORY RULES:**
1. ALL math expressions wrapped in $...$: "length $\\frac{a}{2}$" NOT "length \\frac{a}{2}"
2. ALL variables wrapped in $...$: "density $\\lambda$" NOT "density \\lambda"
3. ALL symbols wrapped in $...$: "permittivity $\\epsilon_0$" NOT "permittivity \\epsilon_0"
4. Use DOUBLE backslashes in JSON: \\\\frac, \\\\text, \\\\lambda
5. Chemical formulas MUST use \\\\text{} and be wrapped in $...$

**CHEMICAL FORMULA EXAMPLES - CRITICAL:**
- BAD: "CH3-O-CH2-Cl" or "CO2" or "H2O"
- GOOD: "$\\\\text{CH}_3$-O-$\\\\text{CH}_2$-Cl" or "$\\\\text{CO}_2$" or "$\\\\text{H}_2\\\\text{O}$"
- BAD: "SN1 reaction" or "SN2 reaction"
- GOOD: "$\\\\text{S}_\\\\text{N}1$ reaction" or "$\\\\text{S}_\\\\text{N}2$ reaction"
- BAD: "Statement I: CH3 - O - CH2 - Cl will undergo"
- GOOD: "Statement I: $\\\\text{CH}_3$ - O - $\\\\text{CH}_2$ - Cl will undergo"

**MATH EXAMPLES:**
- BAD: "A vessel contains \\text{CO}_2 at pressure P"
- GOOD: "A vessel contains $\\text{CO}_2$ at pressure $P$"
- BAD: "Find \\frac{a}{b} where a = 5"
- GOOD: "Find $\\frac{a}{b}$ where $a = 5$"

OUTPUT FORMAT (JSON):
{
  "sectionInstructions": {
    "positiveMarks": 4,
    "negativeMarks": 1,
    "durationPerQuestion": 120
  },
  "questions": [
    {
      "questionText": "A vessel contains $\\\\text{CO}_2$ at $0.5$ atm",
      "options": [
        {"id": "opt1", "label": "(1)", "text": "$1.8$ atm", "isCorrect": false},
        {"id": "opt2", "label": "(2)", "text": "$3$ atm", "isCorrect": true}
      ],
      "questionType": "SINGLE_CHOICE",
      "difficulty": 5,
      "positiveMarks": 4,
      "negativeMarks": 1,
      "durationSeconds": 180,
      "tags": ["chemistry", "equilibrium"],
      "subjectName": "Chemistry",
      "chapterName": "Chemical Equilibrium",
      "topicName": "Equilibrium Constant",
      "hint": "Use ideal gas equation and $K_p$ expression",
      "solution": "**Given:**\\n\\nReaction: $2\\\\text{CO}_2 \\\\rightarrow 2\\\\text{CO} + \\\\text{O}_2$\\n\\nInitial pressure: $P = 0.5$ atm\\n\\n**Solution:**\\n\\nLet $x$ atm dissociate.\\n\\nAt equilibrium: $P_{\\\\text{CO}_2} = 0.5 - x$\\n\\nCalculating: $K_p = 3$ atm\\n\\n**Answer:** $3$ atm",
      "images": [],
      "rawLatex": ["\\text{CO}_2", "K_p"]
    }
  ]
}

CRITICAL: NEVER output LaTeX without $ delimiters!

Return ONLY valid JSON with no markdown code blocks.`;
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
    console.log('🔍 matchHierarchy called with:', {
      questionText: questionText.substring(0, 100),
      subjectName,
      chapterName,
      topicName,
      hasGenAI: !!this.genAI,
      hasOpenAI: !!this.openai
    });

    try {
      const subjectsResponse = await fetch('/api/backend/v1/admin/hierarchy/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const subjects = await subjectsResponse.json();
      console.log('📚 Fetched subjects:', subjects.map((s: any) => s.name));

      let bestSubject = subjects[0];
      if (subjectName) {
        console.log('🎯 Matching subject with LLM, hint:', subjectName);
        if (this.genAI) {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
          const prompt = `Given this question: "${questionText}" and subject hint: "${subjectName}", which of these subjects is the best match? Return ONLY the subject name, nothing else.\n\nSubjects: ${subjects.map((s: any) => s.name).join(', ')}`;
          const result = await model.generateContent(prompt);
          const matchedName = result.response.text().trim();
          bestSubject = subjects.find((s: any) => s.name.toLowerCase().includes(matchedName.toLowerCase())) || subjects[0];
        } else if (this.openai) {
          const prompt = `Given this question: "${questionText}" and subject hint: "${subjectName}", which of these subjects is the best match? Return ONLY the subject name, nothing else.\n\nSubjects: ${subjects.map((s: any) => s.name).join(', ')}`;
          const response = await this.openai.chat.completions.create({
            model: this.config?.model || 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0
          });
          const matchedName = response.choices[0].message.content?.trim() || '';
          console.log('🤖 OpenAI matched subject:', matchedName);
          bestSubject = subjects.find((s: any) => s.name.toLowerCase().includes(matchedName.toLowerCase())) || subjects[0];
        }
      }

      const chaptersResponse = await fetch(`/api/backend/v1/admin/hierarchy/subjects/${bestSubject.id}/chapters`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const chapters = await chaptersResponse.json();

      let bestChapter = chapters[0];
      
      // Always use LLM to match chapter based on question text
      console.log('🎯 Matching chapter with LLM using question text');
      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const hintText = chapterName ? ` (hint: "${chapterName}")` : '';
        const prompt = `Given this question: "${questionText}"${hintText}, which of these chapters is the best match? Return ONLY the chapter name, nothing else.\n\nChapters: ${chapters.map((c: any) => c.name).join(', ')}`;
        const result = await model.generateContent(prompt);
        const matchedName = result.response.text().trim();
        console.log('🤖 Gemini matched chapter:', matchedName);
        bestChapter = chapters.find((c: any) => c.name.toLowerCase().includes(matchedName.toLowerCase())) || chapters[0];
      } else if (this.openai) {
        const hintText = chapterName ? ` (hint: "${chapterName}")` : '';
        const prompt = `Given this question: "${questionText}"${hintText}, which of these chapters is the best match? Return ONLY the chapter name, nothing else.\n\nChapters: ${chapters.map((c: any) => c.name).join(', ')}`;
        const response = await this.openai.chat.completions.create({
          model: this.config?.model || 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0
        });
        const matchedName = response.choices[0].message.content?.trim() || '';
        console.log('🤖 OpenAI matched chapter:', matchedName);
        bestChapter = chapters.find((c: any) => c.name.toLowerCase().includes(matchedName.toLowerCase())) || chapters[0];
      }
      console.log('✅ Selected chapter:', bestChapter.name);

      const topicsResponse = await fetch(`/api/backend/v1/admin/hierarchy/chapters/${bestChapter.id}/topics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const topics = await topicsResponse.json();

      let bestTopic = topics[0];
      if (topicName) {
        if (this.genAI) {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
          const prompt = `Given this question: "${questionText}" and topic hint: "${topicName}", which of these topics is the best match? Return ONLY the topic name, nothing else.\n\nTopics: ${topics.map((t: any) => t.name).join(', ')}`;
          const result = await model.generateContent(prompt);
          const matchedName = result.response.text().trim();
          bestTopic = topics.find((t: any) => t.name.toLowerCase().includes(matchedName.toLowerCase())) || topics[0];
        } else if (this.openai) {
          const prompt = `Given this question: "${questionText}" and topic hint: "${topicName}", which of these topics is the best match? Return ONLY the topic name, nothing else.\n\nTopics: ${topics.map((t: any) => t.name).join(', ')}`;
          const response = await this.openai.chat.completions.create({
            model: this.config?.model || 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 50,
            temperature: 0
          });
          const matchedName = response.choices[0].message.content?.trim() || '';
          console.log('🤖 OpenAI matched topic:', matchedName);
          bestTopic = topics.find((t: any) => t.name.toLowerCase().includes(matchedName.toLowerCase())) || topics[0];
        }
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
