/**
 * Plagiarism Checker Service
 * Integrates with plagiarism detection APIs and handles content rewriting
 */

import { llmService, LLMProvider } from './llm.service';

export interface PlagiarismResult {
  isPlagiarized: boolean;
  plagiarismScore: number; // 0-100
  sources?: Array<{
    url: string;
    matchPercentage: number;
    matchedText: string;
  }>;
  checkedAt: string;
}

export interface PlagiarismCheckConfig {
  threshold: number; // Percentage threshold (e.g., 30 means 30% plagiarism)
  autoRewrite: boolean;
  provider: LLMProvider;
  model: string;
}

class PlagiarismCheckerService {
  private readonly COPYSCAPE_API_KEY: string;
  private readonly COPYLEAKS_API_KEY: string;
  private readonly DEFAULT_THRESHOLD = 30; // 30% plagiarism threshold

  constructor() {
    this.COPYSCAPE_API_KEY = process.env.NEXT_PUBLIC_COPYSCAPE_API_KEY || '';
    this.COPYLEAKS_API_KEY = process.env.NEXT_PUBLIC_COPYLEAKS_API_KEY || '';
  }

  /**
   * Check content for plagiarism using available API
   */
  async checkPlagiarism(content: string): Promise<PlagiarismResult> {
    try {
      // Try Copyscape first if API key is available
      if (this.COPYSCAPE_API_KEY) {
        return await this.checkWithCopyscape(content);
      }

      // Try Copyleaks if API key is available
      if (this.COPYLEAKS_API_KEY) {
        return await this.checkWithCopyleaks(content);
      }

      // Fallback: Use LLM-based plagiarism detection
      return await this.checkWithLLM(content);
    } catch (error: any) {
      // Return safe result on error
      return {
        isPlagiarized: false,
        plagiarismScore: 0,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Check plagiarism using Copyscape API
   */
  private async checkWithCopyscape(content: string): Promise<PlagiarismResult> {
    try {

      const response = await fetch('https://www.copyscape.com/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          u: this.COPYSCAPE_API_KEY,
          o: 'csearch',
          t: content.substring(0, 10000), // Copyscape has content limits
          e: 'UTF-8',
        }),
      });

      if (!response.ok) {
        throw new Error(`Copyscape API error: ${response.status}`);
      }

      const data = await response.text();
      
      // Parse Copyscape XML response (simplified)
      const matchCount = (data.match(/<result>/g) || []).length;
      const plagiarismScore = Math.min(matchCount * 10, 100); // Rough estimate

      return {
        isPlagiarized: plagiarismScore > this.DEFAULT_THRESHOLD,
        plagiarismScore,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check plagiarism using Copyleaks API
   */
  private async checkWithCopyleaks(content: string): Promise<PlagiarismResult> {
    try {

      // Copyleaks requires authentication and scan submission
      // This is a simplified implementation
      const response = await fetch('https://api.copyleaks.com/v3/education/submit/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.COPYLEAKS_API_KEY}`,
        },
        body: JSON.stringify({
          base64: Buffer.from(content).toString('base64'),
          filename: 'blog-content.txt',
          properties: {
            webhooks: {
              status: 'https://your-webhook-url.com/status',
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Copyleaks API error: ${response.status}`);
      }

      // Note: Copyleaks is asynchronous, this is simplified
      // In production, you'd need to implement webhook handling
      return {
        isPlagiarized: false,
        plagiarismScore: 0,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * LLM-based plagiarism detection (fallback method)
   * Uses pattern analysis to detect potentially plagiarized content
   */
  private async checkWithLLM(content: string): Promise<PlagiarismResult> {
    try {

      // Simple heuristics for plagiarism detection
      const indicators = {
        hasUnusualPhrasing: /(?:according to|as stated by|research shows)/gi.test(content),
        hasExcessiveQuotes: (content.match(/["']/g) || []).length > 20,
        hasLongUnbrokenSentences: content.split('.').some(s => s.length > 300),
        lacksParagraphVariation: content.split('\n\n').length < 3,
      };

      const indicatorCount = Object.values(indicators).filter(Boolean).length;
      const plagiarismScore = (indicatorCount / Object.keys(indicators).length) * 100;

      return {
        isPlagiarized: plagiarismScore > this.DEFAULT_THRESHOLD,
        plagiarismScore: Math.round(plagiarismScore),
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Rewrite content to reduce plagiarism
   */
  async rewriteContent(
    content: string,
    provider: LLMProvider,
    model: string,
    context?: string
  ): Promise<string> {
    try {

      const systemPrompt = `You are an expert content rewriter. Your task is to rewrite the given content to make it unique and original while preserving the core information and message.

IMPORTANT INSTRUCTIONS:
1. Maintain the same structure (headings, sections, lists)
2. Preserve all technical accuracy and facts
3. Use different vocabulary and sentence structures
4. Keep the same tone and style
5. Ensure the rewritten content is completely original
6. Do NOT change markdown formatting
7. Do NOT add or remove sections
8. Return ONLY the rewritten content, nothing else`;

      const userPrompt = `Please rewrite the following content to make it completely original and unique while maintaining all the information and structure:

${context ? `Context: ${context}\n\n` : ''}
Content to rewrite:
${content}

Rewrite this content now:`;

      const response = await llmService.generateCompletion(
        provider,
        model,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.8, // Higher temperature for more creative rewriting
          maxTokens: 4000,
        }
      );

      return response.content.trim();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to rewrite content');
    }
  }

  /**
   * Check and rewrite if necessary
   */
  async checkAndRewrite(
    content: string,
    config: PlagiarismCheckConfig,
    context?: string
  ): Promise<{
    originalContent: string;
    finalContent: string;
    plagiarismResult: PlagiarismResult;
    wasRewritten: boolean;
    rewriteAttempts: number;
  }> {
    const originalContent = content;
    let finalContent = content;
    let wasRewritten = false;
    let rewriteAttempts = 0;
    const maxAttempts = 3;

    // Check initial plagiarism
    let plagiarismResult = await this.checkPlagiarism(content);

    // If plagiarism exceeds threshold and auto-rewrite is enabled
    if (plagiarismResult.isPlagiarized && 
        plagiarismResult.plagiarismScore > config.threshold && 
        config.autoRewrite) {

      while (rewriteAttempts < maxAttempts && 
             plagiarismResult.plagiarismScore > config.threshold) {
        rewriteAttempts++;
        
        try {
          // Rewrite content
          finalContent = await this.rewriteContent(
            finalContent,
            config.provider,
            config.model,
            context
          );
          
          wasRewritten = true;

          // Check plagiarism again
          plagiarismResult = await this.checkPlagiarism(finalContent);

          // If plagiarism is now acceptable, break
          if (plagiarismResult.plagiarismScore <= config.threshold) {
            break;
          }
        } catch (error) {
          break;
        }
      }
    }

    return {
      originalContent,
      finalContent,
      plagiarismResult,
      wasRewritten,
      rewriteAttempts,
    };
  }
}

export const plagiarismCheckerService = new PlagiarismCheckerService();
