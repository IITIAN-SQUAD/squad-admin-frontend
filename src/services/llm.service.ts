/**
 * LLM Service - Unified interface for OpenAI and Gemini
 */

export type LLMProvider = 'openai' | 'gemini';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface BlogGenerationRequest {
  topic: string;
  context: string;
  tone?: string;
  targetAudience?: string;
  keywords?: string[];
}

export interface GeneratedBlog {
  heading: string;
  sub_heading: string;
  summary: string;
  body: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  tags: string[];
  banner_image?: string;
  meta_image?: string;
  quiz_questions?: Array<{
    text: string;
    options: Array<{ label: string; option_text: string }>;
    correct_answer_label: string;
  }>;
}

class LLMService {
  private readonly OPENAI_API_KEY: string;
  private readonly GEMINI_API_KEY: string;

  constructor() {
    this.OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  /**
   * Generate completion using specified provider and model
   */
  async generateCompletion(
    provider: LLMProvider,
    model: string,
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<LLMResponse> {
    if (provider === 'openai') {
      return this.generateOpenAICompletion(model, messages, options);
    } else if (provider === 'gemini') {
      return this.generateGeminiCompletion(model, messages, options);
    }
    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * OpenAI completion
   */
  private async generateOpenAICompletion(
    model: string,
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    try {
      console.log('[LLMService] Generating OpenAI completion with model:', model);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      console.error('[LLMService] OpenAI completion failed:', error);
      throw new Error(error.message || 'Failed to generate OpenAI completion');
    }
  }

  /**
   * Gemini completion
   */
  private async generateGeminiCompletion(
    model: string,
    messages: LLMMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    try {
      console.log('[LLMService] Generating Gemini completion with model:', model);

      // Convert messages to Gemini format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      // Add system message as first user message if exists
      const systemMessage = messages.find(m => m.role === 'system');
      if (systemMessage) {
        contents.unshift({
          role: 'user',
          parts: [{ text: systemMessage.content }],
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: options?.temperature || 0.7,
              maxOutputTokens: options?.maxTokens || 4000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        content: data.candidates[0].content.parts[0].text,
        model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error: any) {
      console.error('[LLMService] Gemini completion failed:', error);
      throw new Error(error.message || 'Failed to generate Gemini completion');
    }
  }

  /**
   * Generate a complete blog post using LLM
   */
  async generateBlog(
    provider: LLMProvider,
    model: string,
    request: BlogGenerationRequest
  ): Promise<GeneratedBlog> {
    try {
      console.log('[LLMService] Generating blog for topic:', request.topic);

      const systemPrompt = `You are an expert blog writer and researcher. Generate a comprehensive, well-researched, and authoritative blog post in JSON format.

CONTENT QUALITY REQUIREMENTS:
1. Include ACCURATE facts, statistics, and data points (with context from provided information)
2. Write in-depth, detailed explanations - minimum 800-1200 words
3. Use proper structure: Introduction, multiple detailed sections with H2/H3 headings, Conclusion
4. Include specific examples, case studies, or real-world applications
5. Add relevant technical details, methodologies, or step-by-step explanations where applicable
6. Reference key concepts and industry best practices
7. Make content authoritative and credible - avoid vague statements
8. Use markdown formatting: headings (##, ###), lists, bold, code blocks, blockquotes

IMAGE REQUIREMENTS:
1. For images, use Unsplash Source API: https://source.unsplash.com/800x400/?{topic_keywords}
2. DO NOT use direct photo URLs like https://images.unsplash.com/photo-xxxxx (they return 404)
3. Use relevant keywords in image URLs that match the blog topic

QUIZ REQUIREMENTS:
1. DO NOT include quiz questions in the body content - they go in quiz_questions array
2. Create 2-3 challenging quiz questions that test deep understanding
3. Questions should cover key concepts from the blog content

Return ONLY valid JSON with this exact structure:
{
  "heading": "Compelling, specific blog title that promises value",
  "sub_heading": "Descriptive subtitle that expands on the main topic",
  "summary": "Engaging 2-3 sentence summary highlighting key takeaways and value",
  "body": "## Introduction\n\nCompelling opening paragraph...\n\n## Main Section 1\n\nDetailed content with facts, examples, and data...\n\n### Subsection\n\nSpecific details, code examples, or step-by-step instructions...\n\n## Main Section 2\n\nMore in-depth analysis...\n\n## Conclusion\n\nSummary and key takeaways...",
  "meta_title": "SEO-optimized title (50-60 chars)",
  "meta_description": "Compelling meta description with key benefits (150-160 chars)",
  "slug": "descriptive-url-friendly-slug",
  "tags": ["specific-tag1", "relevant-tag2", "topic-tag3"],
  "banner_image": "https://source.unsplash.com/800x400/?technology,coding",
  "meta_image": "https://source.unsplash.com/800x400/?technology,coding",
  "quiz_questions": [
    {
      "text": "Question text",
      "options": [
        {"label": "A", "option_text": "Option A text"},
        {"label": "B", "option_text": "Option B text"},
        {"label": "C", "option_text": "Option C text"},
        {"label": "D", "option_text": "Option D text"}
      ],
      "correct_answer_label": "A"
    }
  ]
}`;

      const userPrompt = `Topic: ${request.topic}

${request.context ? `Context and Current Information:
${request.context}

` : ''}
${request.tone ? `Tone: ${request.tone}
` : ''}
${request.targetAudience ? `Target Audience: ${request.targetAudience}
` : ''}
${request.keywords?.length ? `Keywords to include: ${request.keywords.join(', ')}
` : ''}

Generate a comprehensive, well-researched blog post on this topic.

CRITICAL REQUIREMENTS:
1. **Content Quality**: Write 800-1200 words with accurate facts, statistics, and specific data points
2. **Structure**: Use proper markdown with ## headings, ### subheadings, lists, bold text, code blocks
3. **Depth**: Include detailed explanations, real-world examples, case studies, or step-by-step guides
4. **Authority**: Reference industry best practices, proven methodologies, and credible information
5. **Specificity**: Avoid generic statements - provide concrete details, numbers, and actionable insights
6. **Images**: Use Unsplash Source API format: https://source.unsplash.com/800x400/?{topic_keywords}
   - DO NOT use direct photo URLs (https://images.unsplash.com/photo-xxxxx) - they return 404
   - Example: https://source.unsplash.com/800x400/?technology,programming
7. **Quiz**: Create 2-3 challenging questions in quiz_questions array (NOT in body)
8. **References**: When using provided context, incorporate facts and data naturally into the content

Make this blog authoritative, detailed, and valuable to readers. Include specific examples and technical details where relevant.`;

      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.generateCompletion(provider, model, messages, {
        temperature: 0.7,
        maxTokens: 4000,
      });

      // Parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse blog JSON from LLM response');
      }

      const blog = JSON.parse(jsonMatch[0]) as GeneratedBlog;
      
      console.log('[LLMService] Blog generated successfully');
      return blog;
    } catch (error: any) {
      console.error('[LLMService] Blog generation failed:', error);
      throw new Error(error.message || 'Failed to generate blog');
    }
  }

  /**
   * Match topic to best category using LLM
   */
  async matchCategory(
    provider: LLMProvider,
    model: string,
    topic: string,
    categories: Array<{ id: string; name: string; display_name: string }>
  ): Promise<string> {
    try {
      console.log('[LLMService] Matching category for topic:', topic);

      const systemPrompt = `You are a category matching expert. Given a blog topic and a list of categories, determine the most appropriate category.
Return ONLY the category ID, nothing else.`;

      const userPrompt = `Topic: ${topic}

Available Categories:
${categories.map(c => `- ${c.id}: ${c.display_name || c.name}`).join('\n')}

Which category ID is most appropriate for this topic? Return only the ID.`;

      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.generateCompletion(provider, model, messages, {
        temperature: 0.3,
        maxTokens: 50,
      });

      const categoryId = response.content.trim();
      console.log('[LLMService] Matched category:', categoryId);
      
      return categoryId;
    } catch (error: any) {
      console.error('[LLMService] Category matching failed:', error);
      // Return first category as fallback
      return categories[0]?.id || '';
    }
  }
}

export const llmService = new LLMService();
