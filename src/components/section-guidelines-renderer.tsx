"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { SectionGuidelines } from '@/src/types/exam';

interface SectionGuidelinesRendererProps {
  guidelines: SectionGuidelines;
  sectionName: string;
  questionCount: number;
  maxMarks: number;
  timeLimit?: number;
  className?: string;
}

export function SectionGuidelinesRenderer({
  guidelines,
  sectionName,
  questionCount,
  maxMarks,
  timeLimit,
  className = ""
}: SectionGuidelinesRendererProps) {
  
  const renderMarkdown = (text: string): string => {
    return text
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 mt-4 text-gray-800">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mb-3 mt-4 text-gray-900">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-4 text-gray-900">$1</h1>')
      
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      
      // Code
      .replace(/`(.*?)`/g, '<code class="bg-blue-100 px-2 py-1 rounded text-sm font-mono text-blue-800">$1</code>')
      
      // Lists
      .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1 flex items-start"><span class="text-blue-500 mr-2">•</span><span>$1</span></li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-1">$1</li>')
      
      // Blockquotes
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 italic text-gray-700 my-2">$1</blockquote>')
      
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="w-5 h-5" />
            {sectionName} - Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <Users className="w-4 h-4" />
              <span className="font-medium">{questionCount} Questions</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <Target className="w-4 h-4" />
              <span className="font-medium">{maxMarks} Marks</span>
            </div>
            {timeLimit && (
              <div className="flex items-center gap-2 text-orange-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{timeLimit} Minutes</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Instructions */}
      {guidelines.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="w-5 h-5 text-blue-500" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(guidelines.instructions) 
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Marking Scheme */}
      {guidelines.markingScheme && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Target className="w-5 h-5 text-green-500" />
              Marking Scheme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(guidelines.markingScheme) 
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      {guidelines.specialInstructions && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(guidelines.specialInstructions) 
              }}
            />
          </CardContent>
        </Card>
      )}

    </div>
  );
}
