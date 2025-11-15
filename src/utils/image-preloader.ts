/**
 * Utility functions for extracting and preloading images from question content
 */

import { imageCacheService } from '@/src/services/image-cache.service';

/**
 * Extract all S3 image URLs from HTML or markdown content
 */
export function extractImageUrls(content: string): string[] {
  if (!content) return [];

  const urls: string[] = [];
  
  // Match markdown images: ![alt](url)
  const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownRegex.exec(content)) !== null) {
    const url = match[2];
    if (isS3Url(url)) {
      urls.push(url);
    }
  }
  
  // Match HTML img tags: <img src="url" />
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/g;
  
  while ((match = htmlRegex.exec(content)) !== null) {
    const url = match[1];
    if (isS3Url(url)) {
      urls.push(url);
    }
  }
  
  // Remove duplicates
  return [...new Set(urls)];
}

/**
 * Check if URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  return url.includes('s3.amazonaws.com') || url.includes('.s3.');
}

/**
 * Extract all images from a question object
 */
export function extractQuestionImages(question: any): string[] {
  const urls: string[] = [];
  
  // Extract from question content
  if (question.content?.question?.raw) {
    urls.push(...extractImageUrls(question.content.question.raw));
  }
  if (question.content?.question?.html) {
    urls.push(...extractImageUrls(question.content.question.html));
  }
  
  // Extract from hints
  if (question.content?.hints?.raw) {
    urls.push(...extractImageUrls(question.content.hints.raw));
  }
  if (question.content?.hints?.html) {
    urls.push(...extractImageUrls(question.content.hints.html));
  }
  
  // Extract from solution
  if (question.content?.solution?.raw) {
    urls.push(...extractImageUrls(question.content.solution.raw));
  }
  if (question.content?.solution?.html) {
    urls.push(...extractImageUrls(question.content.solution.html));
  }
  
  // Extract from options (MCQ)
  if (question.options && Array.isArray(question.options)) {
    question.options.forEach((option: any) => {
      if (option.text) {
        urls.push(...extractImageUrls(option.text));
      }
    });
  }
  
  // Remove duplicates
  return [...new Set(urls)];
}

/**
 * Extract all images from multiple questions
 */
export function extractQuestionsImages(questions: any[]): string[] {
  const allUrls = questions.flatMap(q => extractQuestionImages(q));
  return [...new Set(allUrls)];
}

/**
 * Preload images from questions
 */
export async function preloadQuestionImages(questions: any[]): Promise<void> {
  const urls = extractQuestionsImages(questions);
  
  if (urls.length === 0) {
    console.log('[Image Preloader] No images to preload');
    return;
  }
  
  console.log(`[Image Preloader] Preloading ${urls.length} images...`);
  
  try {
    await imageCacheService.preloadImages(urls);
    console.log(`[Image Preloader] Successfully preloaded ${urls.length} images`);
  } catch (error) {
    console.error('[Image Preloader] Failed to preload images:', error);
  }
}

/**
 * Preload images from a single question
 */
export async function preloadSingleQuestionImages(question: any): Promise<void> {
  const urls = extractQuestionImages(question);
  
  if (urls.length === 0) {
    return;
  }
  
  console.log(`[Image Preloader] Preloading ${urls.length} images for question...`);
  
  try {
    await imageCacheService.preloadImages(urls);
  } catch (error) {
    console.error('[Image Preloader] Failed to preload question images:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return imageCacheService.getStats();
}

/**
 * Clear image cache
 */
export function clearImageCache() {
  imageCacheService.clear();
  console.log('[Image Preloader] Cache cleared');
}
