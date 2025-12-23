"use client";

import React, { useEffect, useRef } from 'react';
import { RichContent } from '@/src/types/exam';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichContentRendererProps {
  content: RichContent;
  className?: string;
  enableMath?: boolean;
}

export function RichContentRenderer({ 
  content, 
  className = "",
  enableMath = true 
}: RichContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content.html) return;
    
    // Set the HTML content
    containerRef.current.innerHTML = content.html;
    
    // Render math equations if enabled
    if (enableMath) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          renderMathEquations(containerRef.current);
        }
      });
    }
  }, [content.html, enableMath]);

  const renderMathEquations = (container: HTMLElement) => {
    // Render block equations ($$...$$)
    const blockEquations = container.querySelectorAll('.equation-block');
    blockEquations.forEach((element) => {
      if (element.classList.contains('katex-rendered')) return;
      
      const latex = element.getAttribute('data-latex');
      if (latex) {
        try {
          element.innerHTML = katex.renderToString(latex, {
            displayMode: true,
            throwOnError: false
          });
          element.classList.add('katex-rendered');
        } catch (error) {
          console.error('KaTeX error:', error);
        }
      }
    });

    // Render inline equations ($...$)
    const inlineEquations = container.querySelectorAll('.equation-inline');
    inlineEquations.forEach((element) => {
      if (element.classList.contains('katex-rendered')) return;
      
      const latex = element.getAttribute('data-latex');
      if (latex) {
        try {
          element.innerHTML = katex.renderToString(latex, {
            displayMode: false,
            throwOnError: false
          });
          element.classList.add('katex-rendered');
        } catch (error) {
          console.error('KaTeX error:', error);
        }
      }
    });
  };


  if (!content.html) {
    return (
      <div className={`text-gray-500 italic ${className}`}>
        No content available
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`rich-content prose prose-sm max-w-none overflow-x-hidden break-words ${className}`}
      style={{
        // Custom styles for rich content
        '--prose-body': 'rgb(55 65 81)',
        '--prose-headings': 'rgb(17 24 39)',
        '--prose-links': 'rgb(59 130 246)',
        '--prose-bold': 'rgb(17 24 39)',
        '--prose-counters': 'rgb(107 114 128)',
        '--prose-bullets': 'rgb(209 213 219)',
        '--prose-hr': 'rgb(229 231 235)',
        '--prose-quotes': 'rgb(17 24 39)',
        '--prose-quote-borders': 'rgb(229 231 235)',
        '--prose-captions': 'rgb(107 114 128)',
        '--prose-code': 'rgb(17 24 39)',
        '--prose-pre-code': 'rgb(229 231 235)',
        '--prose-pre-bg': 'rgb(17 24 39)',
        '--prose-th-borders': 'rgb(209 213 219)',
        '--prose-td-borders': 'rgb(229 231 235)',
      } as React.CSSProperties}
    />
  );
}

// Utility component for rendering equations only
export function EquationRenderer({ 
  latex, 
  displayMode = false,
  className = "" 
}: { 
  latex: string; 
  displayMode?: boolean;
  className?: string;
}) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      try {
        elementRef.current.innerHTML = katex.renderToString(latex, {
          displayMode,
          throwOnError: false
        });
      } catch (error) {
        console.warn('KaTeX render error:', error);
        if (elementRef.current) {
          elementRef.current.textContent = `[Math Error: ${latex}]`;
        }
      }
    }
  }, [latex, displayMode]);

  return (
    <span 
      ref={elementRef}
      className={`equation ${displayMode ? 'equation-block' : 'equation-inline'} ${className}`}
    >
      {latex}
    </span>
  );
}

// Component for rendering images with caching and proper loading/error handling
export function ContentImage({ 
  src, 
  alt, 
  caption,
  className = "" 
}: { 
  src: string; 
  alt?: string; 
  caption?: string;
  className?: string;
}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [cachedSrc, setCachedSrc] = React.useState<string>(src);

  // Import cache service dynamically to avoid SSR issues
  React.useEffect(() => {
    let mounted = true;

    const loadCachedImage = async () => {
      try {
        // Only cache S3 images
        if (src.includes('s3.amazonaws.com') || src.includes('.s3.')) {
          const { imageCacheService } = await import('@/src/services/image-cache.service');
          const cached = await imageCacheService.getImage(src);
          if (mounted) {
            setCachedSrc(cached);
          }
        }
      } catch (err) {
        console.error('Failed to cache image:', err);
        // Fallback to original src
        if (mounted) {
          setCachedSrc(src);
        }
      }
    };

    loadCachedImage();

    return () => {
      mounted = false;
    };
  }, [src]);

  return (
    <figure className={`content-image-figure ${className}`}>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {error ? (
          <div className="flex items-center justify-center h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300">
            <span className="text-gray-500 text-sm">Failed to load image</span>
          </div>
        ) : (
          <img
            src={cachedSrc}
            alt={alt || 'Content image'}
            className={`max-w-full h-auto rounded border ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
      
      {caption && (
        <figcaption className="text-sm text-gray-600 mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
