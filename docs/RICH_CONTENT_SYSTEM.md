# Rich Content System Documentation

## Overview

The IITian Squad exam management system now supports comprehensive rich content for questions, including equations, images, diagrams, and advanced formatting. This system is designed to be scalable, performant, and easy to use.

## Architecture

### Data Model

#### RichContent Interface
```typescript
interface RichContent {
  raw: string;        // Original input (JSON from editor)
  html: string;       // Rendered HTML for display
  plainText: string;  // Plain text for search/indexing
  assets: string[];   // Referenced asset IDs
}
```

#### MediaAsset Interface
```typescript
interface MediaAsset {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  createdAt: Date;
}
```

#### Enhanced Question Model
```typescript
interface Question {
  // ... existing fields
  content: {
    question: RichContent;
    explanation?: RichContent;
    solution?: RichContent;
  };
  assets: MediaAsset[];
  // ... rest of fields
}
```

## Components

### 1. RichContentEditor

**Location**: `/src/components/ui/rich-content-editor.tsx`

**Purpose**: Provides a rich text editing interface with support for:
- Text formatting (bold, italic, underline, code)
- Lists (bullet and numbered)
- Equations (LaTeX with KaTeX rendering)
- Images (upload and embed)
- Links and quotes
- Live preview toggle

**Usage**:
```tsx
<RichContentEditor
  label="Question Content"
  value={richContent}
  onChange={(content) => setRichContent(content)}
  allowImages={true}
  allowEquations={true}
  placeholder="Enter your question..."
/>
```

**Props**:
- `value: RichContent` - Current content
- `onChange: (content: RichContent) => void` - Content change handler
- `label?: string` - Field label
- `placeholder?: string` - Placeholder text
- `allowImages?: boolean` - Enable image uploads (default: true)
- `allowEquations?: boolean` - Enable equation editor (default: true)
- `allowFiles?: boolean` - Enable file attachments (default: false)
- `className?: string` - Additional CSS classes

### 2. RichContentRenderer

**Location**: `/src/components/ui/rich-content-renderer.tsx`

**Purpose**: Renders rich content for display in previews and exams

**Usage**:
```tsx
<RichContentRenderer
  content={richContent}
  enableMath={true}
  className="question-content"
/>
```

**Props**:
- `content: RichContent` - Content to render
- `enableMath?: boolean` - Enable equation rendering (default: true)
- `className?: string` - Additional CSS classes

### 3. FileUploadService

**Location**: `/src/utils/file-upload.ts`

**Purpose**: Handles file uploads with validation, compression, and thumbnail generation

**Usage**:
```typescript
import { fileUploadService } from '@/src/utils/file-upload';

const result = await fileUploadService.uploadFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png'],
  generateThumbnail: true
});

if (result.success) {
  console.log('Uploaded asset:', result.asset);
} else {
  console.error('Upload failed:', result.error);
}
```

## Features

### 1. Equation Support

The system supports LaTeX equations using KaTeX for fast rendering:

**Inline Equations**: `$x = 2$`
**Block Equations**: `$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$`

**Supported LaTeX Features**:
- Basic math: `+`, `-`, `*`, `/`, `^`, `_`
- Fractions: `\frac{a}{b}`
- Square roots: `\sqrt{x}`, `\sqrt[n]{x}`
- Greek letters: `\alpha`, `\beta`, `\gamma`, etc.
- Functions: `\sin`, `\cos`, `\tan`, `\log`, `\ln`
- Matrices: `\begin{matrix}...\end{matrix}`
- Integrals: `\int`, `\sum`, `\prod`
- And much more...

### 2. Image Support

**Upload Process**:
1. User selects image file
2. Client-side validation (size, type)
3. Automatic thumbnail generation
4. Upload to storage (currently mock, ready for backend)
5. Insert into content with proper markdown

**Supported Formats**: JPEG, PNG, GIF, WebP
**Max Size**: 10MB (configurable)
**Features**: Automatic thumbnails, alt text, captions

### 3. Rich Text Formatting

**Markdown Support**:
- **Bold**: `**text**` or toolbar button
- *Italic*: `*text*` or toolbar button
- __Underline__: `__text__` or toolbar button
- `Code`: `` `text` `` or toolbar button
- Lists: `- item` or `1. item`
- Quotes: `> text`
- Links: `[text](url)`

### 4. Content Processing Pipeline

```
User Input → Editor → Rich Content Object → Storage
                ↓
            Live Preview ← Content Renderer ← Processed HTML
```

**Processing Steps**:
1. **Raw Content**: Store original editor input (markdown/JSON)
2. **HTML Generation**: Convert to HTML with proper formatting
3. **Plain Text**: Extract for search indexing
4. **Asset Extraction**: Identify referenced images/files
5. **Rendering**: Display with KaTeX for equations

## Integration with Question Editor

The question editor now supports three rich content fields:

1. **Question Content**: Main question text with full rich content support
2. **Explanation**: Optional hint or explanation for students
3. **Solution**: Detailed solution with step-by-step explanation

**Backward Compatibility**: The system maintains compatibility with existing questions through legacy fields (`description`, `htmlContent`).

## Performance Considerations

### 1. Equation Rendering
- KaTeX loads dynamically when needed
- Equations cached after first render
- Fallback display for rendering errors

### 2. Image Optimization
- Client-side compression before upload
- Automatic thumbnail generation
- Lazy loading for large images
- CDN-ready for production scaling

### 3. Content Caching
- Rendered HTML cached in RichContent object
- Plain text pre-extracted for search
- Asset references tracked for cleanup

## Security

### 1. File Upload Security
- File type validation (whitelist)
- Size limits enforced
- Virus scanning ready (backend integration)
- Content-Type verification

### 2. HTML Sanitization
- All user HTML is processed and sanitized
- XSS protection through content filtering
- CSP headers recommended for production

### 3. LaTeX Security
- KaTeX is XSS-safe by design
- Input validation for LaTeX syntax
- Resource limits for complex equations

## Production Deployment

### 1. Backend Requirements

**File Upload Endpoint**: `/api/upload`
```typescript
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "asset": {
    "id": "asset_123",
    "url": "https://cdn.example.com/images/file.jpg",
    "thumbnailUrl": "https://cdn.example.com/thumbnails/file_thumb.jpg",
    // ... other asset properties
  }
}
```

**Storage Options**:
- AWS S3 + CloudFront CDN
- Google Cloud Storage + CDN
- Cloudinary (recommended for images)
- Local storage + nginx (development)

### 2. Environment Variables

```env
# File Upload
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# CDN
CDN_BASE_URL=https://cdn.yourdomain.com
CDN_THUMBNAILS_URL=https://cdn.yourdomain.com/thumbnails

# KaTeX
KATEX_CDN_URL=https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/
```

### 3. Database Schema Updates

**Questions Table**:
```sql
ALTER TABLE questions 
ADD COLUMN content_question_raw TEXT,
ADD COLUMN content_question_html TEXT,
ADD COLUMN content_question_plain TEXT,
ADD COLUMN content_explanation_raw TEXT,
ADD COLUMN content_explanation_html TEXT,
ADD COLUMN content_solution_raw TEXT,
ADD COLUMN content_solution_html TEXT;
```

**Assets Table**:
```sql
CREATE TABLE media_assets (
  id VARCHAR(255) PRIMARY KEY,
  type ENUM('image', 'file', 'audio', 'video'),
  original_name VARCHAR(255),
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  size BIGINT,
  url TEXT,
  thumbnail_url TEXT,
  alt_text TEXT,
  caption TEXT,
  width INT,
  height INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_assets (
  question_id VARCHAR(255),
  asset_id VARCHAR(255),
  PRIMARY KEY (question_id, asset_id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (asset_id) REFERENCES media_assets(id)
);
```

## Usage Examples

### 1. Creating a Physics Question with Equations

```typescript
const physicsQuestion = {
  type: "single_choice_mcq",
  content: {
    question: {
      raw: "A particle moves with velocity $v = 10t^2$ m/s. Find acceleration at t=2s.\n\n$$a = \\frac{dv}{dt}$$",
      html: "A particle moves with velocity <span class='equation-inline'>v = 10t^2</span> m/s. Find acceleration at t=2s.<br><br><div class='equation-block'>a = \\frac{dv}{dt}</div>",
      plainText: "A particle moves with velocity v = 10t^2 m/s. Find acceleration at t=2s. a = dv/dt",
      assets: []
    },
    solution: {
      raw: "Given: $v = 10t^2$\n\nAcceleration: $a = \\frac{dv}{dt} = \\frac{d(10t^2)}{dt} = 20t$\n\nAt t=2s: $a = 20 \\times 2 = 40$ m/s²",
      html: "...", // Processed HTML
      plainText: "...", // Extracted text
      assets: []
    }
  },
  options: [
    { id: "1", label: "A", value: "40 m/s²", isCorrect: true },
    { id: "2", label: "B", value: "20 m/s²", isCorrect: false },
    { id: "3", label: "C", value: "80 m/s²", isCorrect: false },
    { id: "4", label: "D", value: "10 m/s²", isCorrect: false }
  ]
};
```

### 2. Creating a Chemistry Question with Diagrams

```typescript
const chemistryQuestion = {
  type: "single_choice_mcq",
  content: {
    question: {
      raw: "Identify the compound shown in the diagram below:\n\n![Benzene Structure](https://cdn.example.com/diagrams/benzene.png){#img_benzene}",
      html: "Identify the compound shown in the diagram below:<br><br><img src='https://cdn.example.com/diagrams/benzene.png' alt='Benzene Structure' class='content-image' />",
      plainText: "Identify the compound shown in the diagram below: Benzene Structure",
      assets: ["img_benzene"]
    }
  },
  assets: [
    {
      id: "img_benzene",
      type: "image",
      originalName: "benzene_structure.png",
      fileName: "img_benzene_benzene_structure.png",
      url: "https://cdn.example.com/diagrams/benzene.png",
      thumbnailUrl: "https://cdn.example.com/thumbnails/benzene_thumb.png",
      alt: "Benzene Structure",
      mimeType: "image/png",
      size: 45678,
      createdAt: new Date()
    }
  ]
};
```

## Troubleshooting

### Common Issues

1. **Equations not rendering**:
   - Check KaTeX is loaded: `window.katex`
   - Verify LaTeX syntax is correct
   - Check browser console for errors

2. **Images not uploading**:
   - Check file size limits
   - Verify file type is allowed
   - Check network connectivity

3. **Preview not updating**:
   - Ensure `onChange` handler is called
   - Check React state updates
   - Verify content processing pipeline

### Debug Mode

Enable debug logging:
```typescript
// In development
localStorage.setItem('richContentDebug', 'true');
```

This will log:
- Content processing steps
- Equation rendering attempts
- File upload progress
- Asset management operations

## Future Enhancements

1. **Advanced Diagrams**: Integration with drawing tools (Excalidraw, etc.)
2. **Audio/Video**: Support for multimedia questions
3. **Interactive Elements**: Graphs, simulations, drag-and-drop
4. **Collaborative Editing**: Real-time collaboration on questions
5. **Version Control**: Track changes to question content
6. **Import/Export**: Support for various question formats (QTI, etc.)

## Conclusion

The rich content system provides a solid foundation for creating professional, engaging exam questions with support for complex mathematical content, diagrams, and multimedia. The architecture is designed to scale from hundreds to millions of questions while maintaining performance and user experience.
