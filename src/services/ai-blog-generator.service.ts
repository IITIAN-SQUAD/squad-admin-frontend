/**
 * AI Blog Generator Service - Orchestrates blog generation using LLM, Tavily, and Unsplash
 */

import { llmService, LLMProvider, GeneratedBlog } from './llm.service';
import { tavilyService } from './tavily.service';
import { unsplashService } from './unsplash.service';
import { categoryService } from './category.service';
import { authorService } from './author.service';
import { plagiarismCheckerService } from './plagiarism-checker.service';

export interface BlogGenerationConfig {
  provider: LLMProvider;
  model: string;
  topic: string;
  numberOfBlogs: number;
  tone?: string;
  targetAudience?: string;
  keywords?: string[];
  useCurrentContext?: boolean;
  checkPlagiarism?: boolean;
  plagiarismThreshold?: number;
  autoRewrite?: boolean;
}

export interface GeneratedBlogWithMetadata extends GeneratedBlog {
  banner_image: string;
  meta_image: string;
  category_id: string;
  author_id: string;
  blog_visibility_status: 'DRAFT';
  canonical_url: string;
  schema: string[];
  plagiarismScore?: number;
  wasRewritten?: boolean;
  rewriteAttempts?: number;
}

class AIBlogGeneratorService {
  /**
   * Detect if a topic requires current/latest information
   */
  private requiresCurrentInfo(topic: string): boolean {
    const currentInfoKeywords = [
      'latest', 'recent', 'current', 'today', 'now', '2024', '2025', '2026',
      'news', 'update', 'trend', 'new', 'this year', 'this month',
      'breaking', 'announcement', 'release', 'launch', 'upcoming',
      'market', 'stock', 'price', 'economy', 'election', 'politics',
      'covid', 'pandemic', 'war', 'conflict', 'crisis',
      'technology update', 'ai advancement', 'breakthrough'
    ];
    
    const lowerTopic = topic.toLowerCase();
    return currentInfoKeywords.some(keyword => lowerTopic.includes(keyword));
  }

  /**
   * Generate multiple blogs based on configuration
   */
  async generateBlogs(
    config: BlogGenerationConfig
  ): Promise<GeneratedBlogWithMetadata[]> {
    try {
      const blogs: GeneratedBlogWithMetadata[] = [];

      // Detect if topic requires current information
      const needsCurrentInfo = this.requiresCurrentInfo(config.topic);
      const shouldUseTavily = config.useCurrentContext !== false || needsCurrentInfo;
      
      if (needsCurrentInfo && config.useCurrentContext === false) {
        console.warn('[AIBlogGenerator] Topic requires current information. Tavily will be used automatically.');
      }

      // Fetch categories for matching
      const categoriesResponse = await categoryService.getAllCategories();
      const categories = categoriesResponse.category_response_dto_list.map(c => ({
        id: c.id,
        name: c.name,
        display_name: c.display_name,
      }));

      // Fetch authors for default selection
      const authors = await authorService.getAllAuthors();
      const defaultAuthorId = authors[0]?.id || '';

      for (let i = 0; i < config.numberOfBlogs; i++) {
        try {
          // Get current context from Tavily if needed
          let context = '';
          if (shouldUseTavily) {
            if (needsCurrentInfo) {
              console.log('[AIBlogGenerator] Topic detected as requiring current information. Fetching latest data from Tavily...');
            }
            const tavilyContext = await tavilyService.getContextForBlog(config.topic);
            context = `
=== IMPORTANT: USE THIS CURRENT INFORMATION ===
This topic requires up-to-date information. You MUST use the following current data from ${new Date().toLocaleDateString()} in your blog content.
DO NOT rely on your training data. Use ONLY the information provided below.

Current Information Summary:
${tavilyContext.summary}

Key Facts and Data Points:
${tavilyContext.keyPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

Verified Sources (Reference these in your content):
${tavilyContext.sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}

=== END OF CURRENT INFORMATION ===
            `.trim();
          }

          // Generate blog using LLM
          let blog = await llmService.generateBlog(
            config.provider,
            config.model,
            {
              topic: config.topic,
              context,
              tone: config.tone,
              targetAudience: config.targetAudience,
              keywords: config.keywords,
            }
          );

          // Check for plagiarism if enabled
          let plagiarismScore = 0;
          let wasRewritten = false;
          let rewriteAttempts = 0;

          if (config.checkPlagiarism !== false) {
            const plagiarismThreshold = config.plagiarismThreshold || 30;
            const autoRewrite = config.autoRewrite !== false;

            const plagiarismResult = await plagiarismCheckerService.checkAndRewrite(
              blog.body,
              {
                threshold: plagiarismThreshold,
                autoRewrite,
                provider: config.provider,
                model: config.model,
              },
              context
            );

            plagiarismScore = plagiarismResult.plagiarismResult.plagiarismScore;
            wasRewritten = plagiarismResult.wasRewritten;
            rewriteAttempts = plagiarismResult.rewriteAttempts;

            // Update blog body if it was rewritten
            if (wasRewritten) {
              blog = {
                ...blog,
                body: plagiarismResult.finalContent,
              };
            }
          }

          // Match category using LLM
          const categoryId = await llmService.matchCategory(
            config.provider,
            config.model,
            config.topic,
            categories
          );

          // Find the matched category to get its display_name
          const matchedCategory = categories.find(c => c.id === categoryId) || categories[0];
          const categoryDisplayName = matchedCategory?.display_name || matchedCategory?.name || 'general';
          
          // Convert category display name to URL-friendly format (replace spaces with hyphens, lowercase)
          const urlFriendlyCategoryName = categoryDisplayName.toLowerCase().replace(/\s+/g, '-');

          // Construct canonical URL with category display name
          const canonicalUrl = `https://www.iitiansquad.com/blog/${urlFriendlyCategoryName}/${blog.slug}`;

          // Validate and use LLM-provided images, with fallback to Unsplash
          let bannerImage = blog.banner_image;
          let metaImage = blog.meta_image;
          
          // Validate banner image URL
          if (bannerImage && bannerImage.startsWith('http')) {
            const isBannerValid = await this.validateImageUrl(bannerImage);
            if (!isBannerValid) {
              bannerImage = await unsplashService.getRandomImage(config.topic);
            }
          } else {
            bannerImage = await unsplashService.getRandomImage(config.topic);
          }
          
          // Validate meta image URL
          if (metaImage && metaImage.startsWith('http')) {
            const isMetaValid = await this.validateImageUrl(metaImage);
            if (!isMetaValid) {
              metaImage = bannerImage; // Use validated banner image
            }
          } else {
            metaImage = bannerImage; // Use validated banner image
          }

          // Combine everything
          const completeBlog: GeneratedBlogWithMetadata = {
            ...blog,
            banner_image: bannerImage,
            meta_image: metaImage,
            canonical_url: canonicalUrl,
            category_id: categoryId || categories[0]?.id || '',
            author_id: defaultAuthorId,
            blog_visibility_status: 'DRAFT',
            schema: [],
            plagiarismScore,
            wasRewritten,
            rewriteAttempts,
          };

          blogs.push(completeBlog);

          // Add delay between generations to avoid rate limiting
          if (i < config.numberOfBlogs - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          // Continue with next blog instead of failing completely
        }
      }

      return blogs;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate blogs');
    }
  }

  /**
   * Validate if an image URL is accessible and returns a valid image
   */
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      // Check if response is OK and content type is an image
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        return contentType ? contentType.startsWith('image/') : false;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available LLM models
   */
  getAvailableModels(): Record<LLMProvider, string[]> {
    return {
      openai: [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
      ],
      gemini: [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-pro',
      ],
    };
  }
}

export const aiBlogGeneratorService = new AIBlogGeneratorService();
