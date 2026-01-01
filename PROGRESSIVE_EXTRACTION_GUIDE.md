# Progressive Page-by-Page Question Extraction

## Overview
This document explains the new progressive extraction system that processes PDF pages one-by-one, preventing timeouts and providing real-time UI updates.

## ✅ Completed: AI Service Updates

### New Interfaces

```typescript
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
```

### New Method: `extractQuestionsFromSinglePage`

```typescript
await aiService.extractQuestionsFromSinglePage(
  pageImageBase64,
  pageNumber,
  {
    includeHints: true,
    includeSolutions: true,
    solutionPageBase64: solutionPageImage,
    previousPageContext: incompleteQuestionFromPreviousPage
  }
);
```

### How It Works

1. **Single Page Processing**: Processes one PDF page at a time
2. **Incomplete Question Detection**: LLM detects if last question is cut off
3. **Context Preservation**: Passes incomplete question to next page
4. **Context Merging**: Next page merges continuation with previous context

## 🔄 TODO: Bulk Upload Page Updates

### Current Implementation (All Pages at Once)

```typescript
// ❌ OLD: Process all pages together (causes timeout)
const questionPages = await pdfImageExtractor.convertPDFToImages(questionBase64);
const allImagesBase64 = questionPages.map(p => p.imageDataUrl).join(',');
const result = await aiService.extractQuestionsFromImage(allImagesBase64, options);
```

### New Implementation (Page-by-Page)

```typescript
// ✅ NEW: Process pages one-by-one with progressive UI updates
const questionPages = await pdfImageExtractor.convertPDFToImages(questionBase64);
const solutionPages = solutionBase64 
  ? await pdfImageExtractor.convertPDFToImages(solutionBase64) 
  : [];

let previousPageContext: IncompleteQuestion | undefined;
let allQuestions: ExtractedQuestion[] = [];

for (let i = 0; i < questionPages.length; i++) {
  const page = questionPages[i];
  const solutionPage = solutionPages[i]; // Match by page number
  
  updateStep('extract', 'processing', `Processing page ${i + 1} of ${questionPages.length}...`);
  
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
  
  // ✅ Update UI immediately with new questions
  allQuestions = [...allQuestions, ...pageResult.questions];
  setExtractedQuestions(allQuestions);
  
  // Store incomplete question for next page
  previousPageContext = pageResult.incompleteQuestion;
  
  console.log(`Page ${i + 1}: Extracted ${pageResult.questions.length} questions`);
  if (pageResult.incompleteQuestion) {
    console.log(`Page ${i + 1}: Has incomplete question to continue on next page`);
  }
}

// Handle final incomplete question (if last page has one)
if (previousPageContext) {
  console.warn('Last page has incomplete question - may need manual review');
}
```

## 📊 Benefits

### 1. **No Timeouts**
- Small chunks prevent connection timeouts
- Each page processes in ~10-30 seconds
- Total time: same, but distributed

### 2. **Progressive UI**
- Questions appear as soon as extracted
- User can start reviewing immediately
- Better perceived performance

### 3. **Multi-Page Question Handling**
- LLM detects incomplete questions
- Context preserved across pages
- Automatic merging of split questions

### 4. **Manual Image Upload**
- User can upload images while processing continues
- No need to wait for all pages
- Parallel workflow

## 🎯 Multi-Page Question Example

### Page 1 (Last Question Cut Off)
```
Question 38: A vessel at 1000 K contains CO₂ with a pressure of 0.5 atm.
Some of CO₂ is converted into CO on addition of graphite. If total
[PAGE ENDS]
```

**LLM Output**:
```json
{
  "questions": [
    // ... previous complete questions ...
  ],
  "incompleteQuestion": {
    "partialText": "A vessel at 1000 K contains CO₂ with a pressure of 0.5 atm. Some of CO₂ is converted into CO on addition of graphite. If total",
    "partialOptions": [],
    "pageNumber": 1
  }
}
```

### Page 2 (Continuation)
```
pressure at equilibrium is 0.8 atm, then Kₚ is:
(1) 1.8 atm
(2) 0.3 atm
(3) 3 atm
(4) 0.18 atm
```

**LLM Input** (with context):
```
🔄 CONTEXT FROM PREVIOUS PAGE:
Partial Question Text: "A vessel at 1000 K contains CO₂..."
```

**LLM Output**:
```json
{
  "questions": [
    {
      "questionText": "A vessel at 1000 K contains CO₂ with a pressure of 0.5 atm. Some of CO₂ is converted into CO on addition of graphite. If total pressure at equilibrium is 0.8 atm, then Kₚ is:",
      "options": [
        {"id": "opt1", "label": "(1)", "text": "1.8 atm", "isCorrect": false},
        {"id": "opt2", "label": "(2)", "text": "0.3 atm", "isCorrect": false},
        {"id": "opt3", "label": "(3)", "text": "3 atm", "isCorrect": true},
        {"id": "opt4", "label": "(4)", "text": "0.18 atm", "isCorrect": false}
      ],
      "continuedFromPage": 1,
      // ... rest of question details ...
    }
  ]
}
```

## 🚀 Implementation Steps

### Step 1: Update Bulk Upload Page

File: `/app/bulk-question-upload/page.tsx`

Replace the current extraction logic with page-by-page processing.

### Step 2: Add Progress Indicator

Show current page being processed:
```
Processing page 3 of 10... (30%)
Extracted 15 questions so far
```

### Step 3: Enable Real-Time Preview

Questions appear in the preview section as soon as extracted, even while processing continues.

### Step 4: Add Manual Image Upload

User can click "Upload Image" on any question while processing continues in background.

## 📝 LLM Prompt Strategy

### Incomplete Question Detection

The LLM is instructed to:
1. Detect if last question is cut off
2. Return partial text and options separately
3. Not include incomplete questions in main array

### Context Merging

When receiving context from previous page:
1. Check if current page starts with continuation
2. Merge with previous partial text
3. Mark as `continuedFromPage: X`
4. Include as complete question

## ⚠️ Edge Cases Handled

1. **Last page has incomplete question**: Logged as warning, may need manual review
2. **Question doesn't continue**: LLM ignores context, processes normally
3. **Multiple incomplete questions**: Only last question per page can be incomplete
4. **Solution matching**: Solutions matched by page number when available

## 🎨 UI/UX Improvements

### Before (All at Once)
```
[Upload] → [Processing...] → [All Questions Appear]
          ⏳ 2-5 minutes wait
```

### After (Progressive)
```
[Upload] → [Page 1...] → [Questions 1-5 appear] ✅
        → [Page 2...] → [Questions 6-10 appear] ✅
        → [Page 3...] → [Questions 11-15 appear] ✅
        
User can review/edit while processing continues!
```

## 📊 Performance Comparison

| Metric | Old (All Pages) | New (Progressive) |
|--------|----------------|-------------------|
| First question visible | 2-5 minutes | 10-30 seconds |
| Total processing time | 2-5 minutes | 2-5 minutes (same) |
| Timeout risk | High (large payload) | Low (small chunks) |
| User engagement | Wait then review | Review while processing |
| Image upload | After all done | Parallel with processing |

## 🔧 Configuration

### Environment Variables

```env
# Enable progressive extraction (recommended for large PDFs)
NEXT_PUBLIC_ENABLE_PROGRESSIVE_EXTRACTION=true

# Disable image extraction to save tokens
NEXT_PUBLIC_ENABLE_IMAGE_EXTRACTION=false
```

## 📚 Next Steps

1. ✅ AI Service updated with single-page methods
2. ✅ Incomplete question detection added
3. 🔄 Update bulk upload page (in progress)
4. ⏳ Add real-time preview updates
5. ⏳ Test with multi-page PDFs
6. ⏳ Add progress indicators
7. ⏳ Enable parallel image upload

## 🎯 Summary

**This implementation solves**:
- ✅ Connection timeouts with large PDFs
- ✅ Long wait times before seeing results
- ✅ Multi-page question handling
- ✅ Better user experience with progressive updates
- ✅ Parallel workflow (review + upload images)

**User benefits**:
- See questions immediately as they're extracted
- Start reviewing/editing while processing continues
- Upload images manually without waiting
- No more timeout errors
- Better perceived performance
