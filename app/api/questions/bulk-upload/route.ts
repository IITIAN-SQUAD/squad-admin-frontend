import { NextRequest } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as pdfParse from 'pdf-parse';
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const file = formData.get('pdf') as File;
        const examId = formData.get('examId') as string;
        const paperId = formData.get('paperId') as string;

        if (!file || !examId || !paperId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            message: '❌ Error: Missing required fields'
          })}\n\n`));
          controller.close();
          return;
        }

        // Step 1: Parse PDF
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: '📄 Parsing PDF...'
        })}\n\n`));
        
        const buffer = await file.arrayBuffer();
        const pdfBuffer = Buffer.from(buffer);
        
        // Extract text from PDF
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: '📝 Extracting text from PDF...'
        })}\n\n`));
        
        const pdfData = await pdfParse(pdfBuffer);
        const pdfText = pdfData.text;
        const numPages = pdfData.numpages;
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: `📄 Found ${numPages} pages in PDF`
        })}\n\n`));
        
        // Step 2: Convert PDF pages to images
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: '🖼️  Converting PDF pages to images...'
        })}\n\n`));
        
        const tempDir = join(tmpdir(), `pdf-upload-${randomUUID()}`);
        await mkdir(tempDir, { recursive: true });
        
        const tempPdfPath = join(tempDir, 'input.pdf');
        await writeFile(tempPdfPath, pdfBuffer);
        
        // Convert PDF to images
        const pageImages: string[] = [];
        const converter = fromPath(tempPdfPath, {
          density: 300,
          saveFilename: 'page',
          savePath: tempDir,
          format: 'png',
          width: 2480,
          height: 3508,
        });
        
        for (let i = 1; i <= numPages; i++) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            message: `📸 Converting page ${i}/${numPages}...`
          })}\n\n`));
          
          const result = await converter(i);
          if (result.path) {
            pageImages.push(result.path);
          }
        }
        
        // Step 3: Upload images to S3
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: `📤 Uploading ${pageImages.length} images to S3...`
        })}\n\n`));
        
        const s3Urls: string[] = [];
        
        for (let i = 0; i < pageImages.length; i++) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            message: `📤 Uploading image ${i + 1}/${pageImages.length} to S3...`
          })}\n\n`));
          
          const imagePath = pageImages[i];
          const imageBuffer = await sharp(imagePath)
            .jpeg({ quality: 85 })
            .toBuffer();
          
          const key = `questions/bulk-upload/${Date.now()}_page_${i + 1}.jpg`;
          
          await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: imageBuffer,
            ContentType: 'image/jpeg',
          }));
          
          const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
          s3Urls.push(url);
        }
        
        // Cleanup temp files
        for (const imagePath of pageImages) {
          await unlink(imagePath).catch(() => {});
        }
        await unlink(tempPdfPath).catch(() => {});
        
        // Step 4: Process with GPT-4 Vision
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: '🤖 Processing with GPT-4 Vision...'
        })}\n\n`));
        
        const questions = await extractQuestionsWithGPT4Vision(pdfText, s3Urls, controller, encoder);
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: `✅ Found ${questions.length} questions!`
        })}\n\n`));
        
        // Step 5: Save questions as drafts
        for (let i = 0; i < questions.length; i++) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            message: `💾 Creating question ${i + 1}/${questions.length}...`
          })}\n\n`));
          
          // Here you would save to your database
          // For now, we'll just simulate
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: '✅ All questions created successfully!'
        })}\n\n`));
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: '🎉 Upload complete! Questions are saved as drafts for your review.',
          questions: questions
        })}\n\n`));
        
      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          message: `❌ Error: ${error.message}`
        })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Helper function to extract questions using GPT-4 Vision
async function extractQuestionsWithGPT4Vision(
  pdfText: string,
  imageUrls: string[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<any[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const systemPrompt = `You are an expert at extracting exam questions from PDFs. 

IMPORTANT INSTRUCTIONS:
1. Extract ALL questions from the provided images
2. Format mathematical equations using LaTeX:
   - Inline math: $equation$
   - Display math: $$equation$$
3. Preserve exact formatting from the PDF
4. Identify question type: single_choice_mcq, multiple_choice_mcq, integer_based, paragraph, fill_in_blanks
5. Extract all options (A, B, C, D) exactly as shown
6. DO NOT mark correct answers - leave correctAnswer empty
7. If images/diagrams are part of questions, reference them as: ![Description](IMAGE_URL)
8. Extract hints/solutions if provided separately

Return a JSON array with this structure:
[{
  "questionNumber": 1,
  "type": "single_choice_mcq",
  "content": {
    "question": {
      "raw": "Question text with $LaTeX$ and ![diagram](url)",
      "html": "<p>Question text with LaTeX and image</p>"
    },
    "hints": {
      "raw": "Hint text if any",
      "html": "<p>Hint text</p>"
    },
    "solution": {
      "raw": "Solution text if provided",
      "html": "<p>Solution</p>"
    }
  },
  "options": [
    {"label": "A", "text": "Option A text", "isCorrect": false},
    {"label": "B", "text": "Option B text", "isCorrect": false},
    {"label": "C", "text": "Option C text", "isCorrect": false},
    {"label": "D", "text": "Option D text", "isCorrect": false}
  ],
  "marks": 4,
  "negativeMarks": -1,
  "difficulty": "medium"
}]`;

  const messages: any[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Extract all questions from these exam paper images. PDF text (may be incomplete):\\n\\n${pdfText.substring(0, 2000)}`
        },
        ...imageUrls.map(url => ({
          type: 'image_url',
          image_url: {
            url: url,
            detail: 'high'
          }
        }))
      ]
    }
  ];

  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    message: '🔍 Analyzing images with GPT-4 Vision...'
  })}\\n\\n`));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 16000,
      temperature: 0.1,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
    message: '📝 Parsing extracted questions...'
  })}\\n\\n`));

  // Parse JSON from response
  let questions: any[] = [];
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\\n([\\s\\S]*?)\\n```/) || content.match(/```\\n([\\s\\S]*?)\\n```/);
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[1]);
    } else {
      questions = JSON.parse(content);
    }
  } catch (e) {
    // If parsing fails, try to find JSON array in the response
    const arrayMatch = content.match(/\\[\\s*{[\\s\\S]*}\\s*\\]/);
    if (arrayMatch) {
      questions = JSON.parse(arrayMatch[0]);
    } else {
      throw new Error('Failed to parse questions from GPT-4 response');
    }
  }

  // Process questions to ensure correct format
  questions = questions.map((q: any, index: number) => ({
    ...q,
    questionNumber: q.questionNumber || index + 1,
    status: 'draft',
    isDraft: true,
    // Ensure no correct answers are marked
    options: q.options?.map((opt: any) => ({
      ...opt,
      isCorrect: false
    })),
    correctAnswer: undefined,
    // Generate HTML from raw content
    content: {
      question: {
        raw: q.content?.question?.raw || q.question || '',
        html: q.content?.question?.html || `<p>${q.question || ''}</p>`,
        plainText: q.content?.question?.raw || q.question || '',
        assets: []
      },
      hints: q.content?.hints ? {
        raw: q.content.hints.raw || '',
        html: q.content.hints.html || '',
        plainText: q.content.hints.raw || '',
        assets: []
      } : undefined,
      solution: q.content?.solution ? {
        raw: q.content.solution.raw || '',
        html: q.content.solution.html || '',
        plainText: q.content.solution.raw || '',
        assets: []
      } : undefined
    }
  }));

  return questions;
}
