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

  // Parse the raw content (assuming it's JSON from TipTap or markdown)
  const [editorContent, setEditorContent] = useState(() => {
    try {
      return value.raw ? JSON.parse(value.raw) : '';
    } catch {
      return value.raw || '';
    }
  });

  const updateContent = useCallback((newContent: string) => {
    setEditorContent(newContent);
    
    // Generate HTML and plain text from the content
    const html = convertToHTML(newContent);
    const plainText = stripHTML(html);
    const assets = extractAssets(newContent);

    onChange({
      raw: typeof newContent === 'string' ? newContent : JSON.stringify(newContent),
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
    
    let html = content;
    
    // Convert LaTeX equations
    html = html.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
      return `<div class="equation-block" data-latex="${latex}">${latex}</div>`;
    });
    
    html = html.replace(/\$(.*?)\$/g, (match, latex) => {
      return `<span class="equation-inline" data-latex="${latex}">${latex}</span>`;
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
    
    // Convert line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  const stripHTML = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
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
        <span>Words: {value.plainText.split(/\s+/).filter(Boolean).length}</span>
        {value.assets.length > 0 && <span>Assets: {value.assets.length}</span>}
      </div>
    </div>
  );
}
