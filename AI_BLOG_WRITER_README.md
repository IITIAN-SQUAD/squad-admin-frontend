# AI Blog Writer - Documentation

## Overview

The AI Blog Writer is a powerful feature that leverages multiple AI services to automatically generate high-quality blog posts. It integrates with OpenAI, Google Gemini, Tavily (for current context), and Unsplash (for banner images) to create comprehensive, SEO-optimized blog content.

## Features

### ✨ Core Capabilities

1. **Multi-LLM Support**
   - OpenAI (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4, GPT-3.5-turbo)
   - Google Gemini (Gemini-1.5-pro, Gemini-1.5-flash, Gemini-pro)

2. **Current Context Integration**
   - Uses Tavily API to fetch real-time information about topics
   - Incorporates latest news, trends, and data into blog content
   - Provides source citations for credibility

3. **Automated Content Generation**
   - Generates complete blog posts with proper structure
   - Creates SEO-optimized titles and meta descriptions
   - Generates URL-friendly slugs automatically
   - Suggests relevant tags and keywords

4. **Quiz Question Generation**
   - Automatically creates 2-3 quiz questions per blog
   - Multiple choice format with 4 options
   - Tests reader comprehension of the content

5. **Smart Category Matching**
   - Uses LLM to match blog topics to existing categories
   - Ensures proper categorization automatically

6. **Banner Image Integration**
   - Fetches relevant images from Unsplash
   - Automatically selects appropriate images based on topic

7. **Bulk Generation**
   - Generate 1-10 blogs at once
   - Batch processing with rate limiting

8. **Preview & Edit Workflow**
   - Preview all generated blogs before publishing
   - Edit each blog in a new tab using the existing blog editor
   - Publish directly to the backend with DRAFT status

## Required API Keys

Add the following environment variables to your `.env.local` file:

```bash
# Tavily API (for current context fetching)
NEXT_PUBLIC_TAVILY_API_KEY=your_tavily_api_key_here

# OpenAI API (for GPT models)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini API (for Gemini models)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Unsplash API (optional - falls back to source.unsplash.com)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

### How to Get API Keys

#### 1. Tavily API Key
- Visit: https://tavily.com/
- Sign up for an account
- Navigate to API Keys section
- Copy your API key

#### 2. OpenAI API Key
- Visit: https://platform.openai.com/
- Sign up or log in
- Go to API Keys section
- Create a new API key
- **Important**: Add billing information to use the API

#### 3. Google Gemini API Key
- Visit: https://makersuite.google.com/app/apikey
- Sign in with Google account
- Create a new API key
- Copy the key

#### 4. Unsplash API Key (Optional)
- Visit: https://unsplash.com/developers
- Create a new application
- Copy the Access Key
- **Note**: Without this key, the system will use `source.unsplash.com` as fallback

## Usage Guide

### Step 1: Access AI Blog Writer
Navigate to **Content Management → AI Blog Writer** in the sidebar.

### Step 2: Configure Settings

#### LLM Configuration
- **Provider**: Choose between OpenAI or Google Gemini
- **Model**: Select the specific model to use
  - For OpenAI: Recommended `gpt-4o-mini` for cost-effectiveness
  - For Gemini: Recommended `gemini-1.5-flash` for speed

#### Blog Parameters
- **Topic** (Required): The main subject of your blog
  - Example: "Machine Learning in Healthcare"
  - Example: "Best React Hooks for State Management"

- **Number of Blogs**: How many blogs to generate (1-10)
  - Start with 1-2 for testing
  - Use higher numbers for bulk content creation

- **Tone** (Optional): Writing style
  - Examples: "Professional", "Casual", "Technical", "Beginner-friendly"

- **Target Audience** (Optional): Who the blog is for
  - Examples: "Developers", "Students", "Business Executives", "Beginners"

- **Keywords** (Optional): Comma-separated keywords to include
  - Example: "React, Hooks, useState, useEffect, performance"

- **Use Current Context**: Enable/disable Tavily integration
  - ✅ Enabled: Fetches latest information (recommended)
  - ❌ Disabled: Uses only LLM knowledge

### Step 3: Generate Blogs
Click the **"Generate Blogs"** button and wait for the AI to create your content.

**Generation Time:**
- 1 blog: ~30-60 seconds
- 5 blogs: ~3-5 minutes
- 10 blogs: ~5-10 minutes

### Step 4: Preview Generated Blogs
- View all generated blogs in tabs
- Click on each tab to preview different blogs
- Review content, metadata, SEO info, and quiz questions
- Delete unwanted blogs using the trash icon

### Step 5: Edit & Publish
1. Click **"Edit & Publish"** button on a blog
2. Blog opens in a new tab with the full editor
3. Make any necessary edits
4. Select the author
5. Verify category (auto-selected by AI)
6. Click **"Save"** to publish as DRAFT

## Architecture

### Services Created

#### 1. Tavily Service (`/src/services/tavily.service.ts`)
- Fetches current context and information
- Provides search results with sources
- Generates summaries and key points

#### 2. LLM Service (`/src/services/llm.service.ts`)
- Unified interface for OpenAI and Gemini
- Handles API calls and response parsing
- Generates blog content and matches categories

#### 3. Unsplash Service (`/src/services/unsplash.service.ts`)
- Fetches random images based on topics
- Handles API errors with fallbacks
- Supports batch image fetching

#### 4. AI Blog Generator Service (`/src/services/ai-blog-generator.service.ts`)
- Orchestrates all services
- Manages blog generation workflow
- Handles batch processing and rate limiting

### Pages Created

#### 1. AI Blog Writer (`/app/ai-blog-writer/page.tsx`)
- Main configuration and generation interface
- Preview panel for generated blogs
- Batch management and deletion

#### 2. Edit AI Blog (`/app/ai-blog-writer/edit/page.tsx`)
- Opens in new tab for editing
- Uses existing BlogForm component
- Publishes directly to backend

## Data Flow

```
User Input (Topic, Config)
    ↓
Tavily API (Current Context)
    ↓
LLM Service (Blog Generation)
    ↓
Category Matching (LLM)
    ↓
Unsplash (Banner Image)
    ↓
Preview Interface
    ↓
Edit in New Tab
    ↓
Publish to Backend (DRAFT)
```

## Generated Blog Structure

Each generated blog includes:

```typescript
{
  heading: string;              // Main title
  sub_heading: string;          // Subtitle
  summary: string;              // 2-3 sentence summary
  body: string;                 // Full content in markdown
  meta_title: string;           // SEO title (50-60 chars)
  meta_description: string;     // SEO description (150-160 chars)
  slug: string;                 // URL-friendly slug
  tags: string[];               // Relevant tags
  banner_image: string;         // Unsplash image URL
  category_id: string;          // Auto-matched category
  author_id: string;            // Default author
  blog_visibility_status: 'DRAFT';
  quiz_questions: [             // 2-3 questions
    {
      text: string;
      options: [
        { label: 'A', option_text: string },
        { label: 'B', option_text: string },
        { label: 'C', option_text: string },
        { label: 'D', option_text: string }
      ],
      correct_answer_label: string;
    }
  ]
}
```

## Best Practices

### 1. Topic Selection
- ✅ Be specific: "React Server Components in Next.js 14"
- ❌ Too broad: "Web Development"

### 2. Model Selection
- **For technical content**: Use GPT-4o or Gemini-1.5-pro
- **For general content**: Use GPT-4o-mini or Gemini-1.5-flash
- **For cost optimization**: Use GPT-3.5-turbo or Gemini-1.5-flash

### 3. Context Usage
- Always enable "Use Current Context" for:
  - News-related topics
  - Technology trends
  - Recent events
  - Statistical data
- Disable for:
  - Timeless educational content
  - Historical topics
  - Theoretical concepts

### 4. Batch Generation
- Start with 1-2 blogs to test configuration
- Use 5-10 blogs for bulk content creation
- Review and delete poor-quality results
- Edit and customize before publishing

### 5. Quality Control
- Always review generated content
- Verify facts and statistics
- Check for plagiarism if needed
- Ensure brand voice consistency
- Update author information

## Troubleshooting

### Issue: "Failed to fetch context from Tavily"
**Solution**: Check your `NEXT_PUBLIC_TAVILY_API_KEY` in `.env.local`

### Issue: "OpenAI API error: 401"
**Solution**: Verify your `NEXT_PUBLIC_OPENAI_API_KEY` and ensure billing is set up

### Issue: "Gemini API error: 400"
**Solution**: Check your `NEXT_PUBLIC_GEMINI_API_KEY` and API quota

### Issue: "No blogs were generated"
**Solution**: 
- Check browser console for errors
- Verify all API keys are correct
- Try with a simpler topic
- Reduce number of blogs to 1

### Issue: "Images not loading"
**Solution**: 
- Unsplash API key is optional
- System will use `source.unsplash.com` as fallback
- Check Next.js image configuration in `next.config.ts`

### Issue: "Category not matched correctly"
**Solution**: 
- Ensure categories exist in the system
- Try more specific topic names
- Manually change category in edit mode

## Rate Limits & Costs

### OpenAI
- **GPT-4o**: $2.50 per 1M input tokens, $10 per 1M output tokens
- **GPT-4o-mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **GPT-3.5-turbo**: $0.50 per 1M input tokens, $1.50 per 1M output tokens

### Google Gemini
- **Gemini-1.5-pro**: Free tier available (50 requests/day)
- **Gemini-1.5-flash**: Free tier available (1500 requests/day)

### Tavily
- Free tier: 1000 searches/month
- Paid plans available for higher usage

### Unsplash
- Free tier: 50 requests/hour
- No API key required for basic usage

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Always use `.env.local` for sensitive data
3. **Client-Side Exposure**: Keys prefixed with `NEXT_PUBLIC_` are exposed to the browser
4. **Rate Limiting**: Implement proper rate limiting in production
5. **Cost Monitoring**: Monitor API usage to avoid unexpected costs

## Future Enhancements

- [ ] Add support for Claude (Anthropic)
- [ ] Implement content scheduling
- [ ] Add plagiarism checking
- [ ] Support for multiple languages
- [ ] Custom prompt templates
- [ ] A/B testing for different LLM outputs
- [ ] Analytics for generated content performance
- [ ] Automated SEO scoring
- [ ] Integration with grammar checking tools
- [ ] Bulk export to CSV/JSON

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Verify API keys and quotas
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: IITian Squad Development Team
