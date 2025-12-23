"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Underline, 
  Image, 
  FileText, 
  Calculator,
  Upload,
  Eye,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Minus,
  Type,
  Palette
} from 'lucide-react';
import { RichContent, MediaAsset } from '@/src/types/exam';

// Helper to extract text from TipTap JSON while preserving LaTeX and images
const extractTextFromTipTapDoc = (doc: any): string => {
  let text = '';
  
  const processNode = (node: any): string => {
    let nodeText = '';
    
    // Handle different node types
    if (node.type === 'paragraph') {
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach((child: any) => {
          nodeText += processNode(child);
        });
      }
      nodeText += '\n';
    } else if (node.type === 'text') {
      nodeText += node.text || '';
    } else if (node.type === 'image') {
      // Preserve image markdown
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const id = node.attrs?.['data-id'] || node.attrs?.id || '';
      if (id) {
        nodeText += `![${alt}](${src}){#${id}}`;
      } else {
        nodeText += `![${alt}](${src})`;
      }
    } else if (node.type === 'hardBreak') {
      nodeText += '\n';
    }
    
    // Handle marks (formatting like bold, italic, etc.)
    if (node.marks && Array.isArray(node.marks)) {
      node.marks.forEach((mark: any) => {
        if (mark.type === 'bold') {
          nodeText = `**${nodeText}**`;
        } else if (mark.type === 'italic') {
          nodeText = `*${nodeText}*`;
        } else if (mark.type === 'code') {
          nodeText = `\`${nodeText}\``;
        }
      });
    }
    
    return nodeText;
  };
  
  if (doc.content && Array.isArray(doc.content)) {
    doc.content.forEach((node: any) => {
      text += processNode(node);
    });
  }
  
  return text.trim();
};

interface RichContentEditorProps {
  value: RichContent;
  onChange: (content: RichContent) => void;
  placeholder?: string;
  label?: string;
  allowImages?: boolean;
  allowEquations?: boolean;
  allowFiles?: boolean;
  className?: string;
}

export function RichContentEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  label,
  allowImages = true,
  allowEquations = true,
  allowFiles = false,
  className = ""
}: RichContentEditorProps) {
  const [showEquationInput, setShowEquationInput] = useState(false);
  const [equationInput, setEquationInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to convert HTML back to markdown for editing (unused for now, kept for future use)
  const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    let markdown = html;
    
    // Convert equation spans back to LaTeX (handle both formats)
    markdown = markdown.replace(/<div[^>]*class="equation-block"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/div>/g, '$$$$1$$');
    markdown = markdown.replace(/<span[^>]*class="equation-inline"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, '$$$1$$');
    
    // Convert images back to markdown (handle different attribute orders)
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*data-id="([^"]*)"[^>]*\/?>/g, '![$2]($1){#$3}');
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*data-id="([^"]*)"[^>]*\/?>/g, '![$1]($2){#$3}');
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/g, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/g, '![$1]($2)');
    
    // Convert formatting
    markdown = markdown.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
    markdown = markdown.replace(/<u>([\s\S]*?)<\/u>/g, '__$1__');
    markdown = markdown.replace(/<code>([\s\S]*?)<\/code>/g, '`$1`');
    
    // Convert line breaks and paragraphs
    markdown = markdown.replace(/<br\s*\/?>/g, '\n');
    markdown = markdown.replace(/<\/p>\s*<p>/g, '\n\n');
    markdown = markdown.replace(/<\/?p>/g, '');
    markdown = markdown.replace(/<\/?div[^>]*>/g, '\n');
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
  };

  // Parse the raw content (assuming it's JSON from TipTap or markdown)
  const [editorContent, setEditorContent] = useState(() => {
    // Priority: raw > plainText
    // raw contains markdown with LaTeX and images
    if (value.raw) {
      return value.raw;
    }
    
    // Fallback to plainText only if raw is not available
    return value.plainText || '';
  });

  const updateContent = useCallback((newContent: string) => {
    setEditorContent(newContent);
    
    // Generate HTML and plain text from the content
    // newContent is the plain text from textarea, use it directly for conversion
    const html = convertToHTML(newContent);
    const plainText = stripHTML(html);
    const assets = extractAssets(newContent);

    onChange({
      raw: newContent, // Store plain text as raw, not JSON
      html,
      plainText,
      assets
    });
  }, [onChange]);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    
    const newText = editorContent.substring(0, start) + before + selectedText + after + editorContent.substring(end);
    updateContent(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertEquation = () => {
    if (equationInput.trim()) {
      insertText(`$$${equationInput}$$`);
      setEquationInput('');
      setShowEquationInput(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In production, upload to your backend/CDN
      const formData = new FormData();
      formData.append('file', file);
      
      // Mock upload - replace with actual API call
      const mockUpload = () => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const imageUrl = await mockUpload();
      const imageId = `img_${Date.now()}`;
      
      // Insert image markdown
      insertText(`![${file.name}](${imageUrl}){#${imageId}}`);
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };


  const convertToHTML = (content: string): string => {
    if (!content) return '';
    
    // Check if content is TipTap JSON format
    let textContent = content;
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'doc' && parsed.content) {
        // Extract text from TipTap JSON
        textContent = extractTextFromTipTapDoc(parsed);
      }
    } catch {
      // Not JSON, use as-is
      textContent = content;
    }
    
    let html = textContent;
    
    // Convert block LaTeX equations ($$...$$)
    html = html.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
      return `<div class="equation-block" data-latex="${latex.trim()}">${latex.trim()}</div>`;
    });
    
    // Convert inline LaTeX equations ($...$)
    html = html.replace(/\$(.*?)\$/g, (match, latex) => {
      return `<span class="equation-inline" data-latex="${latex.trim()}">${latex.trim()}</span>`;
    });
    
    // Convert markdown formatting
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/__(.*?)__/g, '<u>$1</u>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Convert images with optional width, height, and position
    // Syntax: ![alt](url){width=300px height=200px position=center #id}
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)(\{([^}]+)\})?/g, (match, alt, url, _, attrs) => {
      let width = '';
      let height = '';
      let position = '';
      let id = '';
      
      if (attrs) {
        const widthMatch = attrs.match(/width=([^\s}]+)/);
        const heightMatch = attrs.match(/height=([^\s}]+)/);
        const positionMatch = attrs.match(/position=(left|center|right)/);
        const idMatch = attrs.match(/#([^\s}]+)/);
        
        if (widthMatch) width = widthMatch[1];
        if (heightMatch) height = heightMatch[1];
        if (positionMatch) position = positionMatch[1];
        if (idMatch) id = idMatch[1];
      }
      
      let style = '';
      if (width) style += `width: ${width};`;
      if (height) style += `height: ${height};`;
      
      let className = 'content-image';
      if (position === 'left') className += ' float-left mr-4';
      else if (position === 'right') className += ' float-right ml-4';
      else if (position === 'center') className += ' mx-auto';
      
      return `<img src="${url}" alt="${alt}" ${id ? `data-id="${id}"` : ''} class="${className}" ${style ? `style="${style}"` : ''} />`;
    });
    
    // Convert links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Convert line breaks to <br> but preserve block equations
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped in block elements
    if (!html.startsWith('<div') && !html.startsWith('<p>')) {
      html = `<p>${html}</p>`;
    }
    
    return html;
  };

  const stripHTML = (html: string): string => {
    // First, restore equations from data-latex attributes before stripping HTML
    let text = html.replace(/<div class="equation-block" data-latex="([^"]*)">[^<]*<\/div>/g, '$$$$1$$');
    text = text.replace(/<span class="equation-inline" data-latex="([^"]*)">[^<]*<\/span>/g, '$$$1$$');
    
    // Restore images to markdown format before stripping HTML
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*data-id="([^"]*)"[^>]*>/g, '![$2]($1){#$3}');
    text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)');
    
    // Then strip remaining HTML tags
    return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  };

  const extractAssets = (content: string): string[] => {
    const assets: string[] = [];
    const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)(\{#([^}]+)\})?/g);
    
    if (imageMatches) {
      imageMatches.forEach(match => {
        const idMatch = match.match(/\{#([^}]+)\}/);
        if (idMatch) {
          assets.push(idMatch[1]);
        }
      });
    }
    
    return assets;
  };

  const renderPreview = () => {
    return (
      <div 
        className="prose max-w-none p-4 border rounded-lg bg-gray-50 min-h-[200px]"
        dangerouslySetInnerHTML={{ __html: value.html || 'No content to preview...' }}
      />
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-t-lg bg-gray-50 border-b-0">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('**', '**')}
            title="Bold"
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('*', '*')}
            title="Italic"
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('__', '__')}
            title="Underline"
            className="h-8 w-8 p-0"
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('`', '`')}
            title="Code"
            className="h-8 w-8 p-0"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('- ', '')}
            title="Bullet List"
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('1. ', '')}
            title="Numbered List"
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertText('> ', '')}
            title="Quote"
            className="h-8 w-8 p-0"
          >
            <Quote className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {allowEquations && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEquationInput(!showEquationInput)}
            title="Insert Equation"
            className="h-8 w-8 p-0"
          >
            <Calculator className="w-4 h-4" />
          </Button>
        )}

        {allowImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Insert Image"
            disabled={isUploading}
            className="h-8 w-8 p-0"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Image className="w-4 h-4" />
            )}
          </Button>
        )}

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          title="Toggle Preview"
          className="h-8 w-8 p-0"
        >
          <Eye className="w-4 h-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Equation Input */}
      {showEquationInput && (
        <div className="p-3 border border-t-0 bg-blue-50 rounded-b-lg">
          <Label className="text-sm font-medium mb-2 block">LaTeX Equation</Label>
          <div className="flex gap-2">
            <Input
              value={equationInput}
              onChange={(e) => setEquationInput(e.target.value)}
              placeholder="e.g., x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
              className="flex-1 font-mono text-sm"
              onKeyPress={(e) => e.key === 'Enter' && insertEquation()}
            />
            <Button onClick={insertEquation} size="sm">
              Insert
            </Button>
            <Button 
              onClick={() => setShowEquationInput(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Use LaTeX syntax. For inline equations use $...$ and for block equations use $$...$$
          </p>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={editorContent}
          onChange={(e) => updateContent(e.target.value)}
          placeholder={placeholder}
          className={`min-h-[200px] font-mono text-sm resize-none overflow-x-hidden whitespace-pre-wrap break-words ${
            showEquationInput ? 'rounded-t-none border-t-0' : 'rounded-t-none'
          }`}
          rows={10}
        />
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          {renderPreview()}
        </div>
      )}

      {/* Content Stats */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Characters: {editorContent.length}</span>
        <span>Words: {value.plainText ? value.plainText.split(/\s+/).filter(Boolean).length : 0}</span>
        {value.assets && value.assets.length > 0 && <span>Assets: {value.assets.length}</span>}
      </div>
    </div>
  );
}
