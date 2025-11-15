"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownEditor } from '@/src/components/ui/markdown-editor';
import { FileText, Save, Settings, AlertCircle } from 'lucide-react';

interface SectionGuidelines {
  id: string;
  instructions: string;
  markingScheme?: string;
  specialInstructions?: string;
}

interface SectionGuidelinesEditorProps {
  section: {
    id: string;
    name: string;
    maxMarks: number;
    questionCount: number;
  };
  guidelines: SectionGuidelines;
  onChange: (guidelines: SectionGuidelines) => void;
  onSave: () => void;
}

export function SectionGuidelinesEditor({
  section,
  guidelines,
  onChange,
  onSave
}: SectionGuidelinesEditorProps) {
  const [activeTab, setActiveTab] = useState<'instructions' | 'marking' | 'special'>('instructions');

  const updateGuidelines = (field: keyof SectionGuidelines, value: string) => {
    onChange({ ...guidelines, [field]: value });
  };

  const getBlankTemplate = () => {
    return `# Section ${section.name}

## Instructions
[Enter your custom instructions here]

## Guidelines
[Add specific guidelines for this section]

## Important Notes
[Add any important notes or reminders]`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Section Guidelines: {section.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm mb-4">
            <span>{section.questionCount} Questions</span>
            <span>{section.maxMarks} Marks</span>
          </div>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
            <Button
              variant={activeTab === 'instructions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('instructions')}
            >
              Instructions
            </Button>
            <Button
              variant={activeTab === 'marking' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('marking')}
            >
              Marking
            </Button>
            <Button
              variant={activeTab === 'special' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('special')}
            >
              Special
            </Button>
          </div>

          {activeTab === 'instructions' && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="font-medium">Section Instructions</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateGuidelines('instructions', getBlankTemplate())}
                >
                  Insert Template
                </Button>
              </div>
              <MarkdownEditor
                value={guidelines.instructions || ''}
                onChange={(value: string) => updateGuidelines('instructions', value)}
                placeholder="Enter section instructions..."
                minHeight="250px"
              />
            </div>
          )}

          {activeTab === 'marking' && (
            <MarkdownEditor
              value={guidelines.markingScheme || ''}
              onChange={(value: string) => updateGuidelines('markingScheme', value)}
              placeholder="Enter marking scheme..."
              minHeight="250px"
            />
          )}

          {activeTab === 'special' && (
            <MarkdownEditor
              value={guidelines.specialInstructions || ''}
              onChange={(value: string) => updateGuidelines('specialInstructions', value)}
              placeholder="Enter special instructions..."
              minHeight="250px"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Guidelines
        </Button>
      </div>
    </div>
  );
}
