"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface FillInBlanksEditorProps {
  value: string;
  onChange: (value: string, blanksData: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function FillInBlanksEditor({
  value,
  onChange,
  placeholder = "Enter question text with blanks. Use %%answer%% to mark blanks.",
  label = "Question with Blanks"
}: FillInBlanksEditorProps) {
  const [text, setText] = useState(value);
  const [blanks, setBlanks] = useState<string[]>([]);

  useEffect(() => {
    // Extract blanks from text
    const blankPattern = /%%([^%]+)%%/g;
    const matches = [...text.matchAll(blankPattern)];
    const extractedBlanks = matches.map(match => match[1].trim());
    setBlanks(extractedBlanks);
    onChange(text, extractedBlanks);
  }, [text]);

  const getPreviewText = () => {
    // Replace %%answer%% with underscores for preview
    return text.replace(/%%([^%]+)%%/g, '________');
  };

  const getSolutionText = () => {
    // Replace %%answer%% with the actual answer for solution
    return text.replace(/%%([^%]+)%%/g, '$1');
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] font-mono"
        />
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How to create blanks:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Use <code className="bg-gray-100 px-1">%%answer%%</code> to create a blank</li>
            <li>• Example: "The capital of France is <code>%%Paris%%</code>"</li>
            <li>• Multiple blanks: "%%H2O%% is the formula for %%water%%"</li>
          </ul>
        </AlertDescription>
      </Alert>

      {blanks.length > 0 && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Detected Blanks ({blanks.length}):</h4>
            <div className="space-y-1">
              {blanks.map((blank, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-blue-700">Blank {index + 1}:</span>
                  <span className="bg-white px-2 py-1 rounded border border-blue-200">{blank}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Student View:</h4>
              <p className="text-sm whitespace-pre-wrap">{getPreviewText()}</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Solution View:</h4>
              <p className="text-sm whitespace-pre-wrap">{getSolutionText()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
