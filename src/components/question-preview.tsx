"use client";

import React from 'react';
import { Question, QuestionType } from '@/src/types/exam';
import { RichContentRenderer } from '@/src/components/ui/rich-content-renderer';

interface QuestionPreviewProps {
  question: Partial<Question>;
  selectedType: QuestionType | "";
}

export function QuestionPreview({ question, selectedType }: QuestionPreviewProps) {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-6 overflow-x-hidden max-w-full break-words">
      {/* Question Header */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize">
          {selectedType ? selectedType.replace(/_/g, ' ') : 'No type selected'}
        </span>
        <div className={`w-2 h-2 rounded-full ${
          question.difficulty === 'easy' ? 'bg-green-500' :
          question.difficulty === 'medium' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <span className="text-sm capitalize">{question.difficulty}</span>
        <span className="text-sm text-gray-600 ml-auto">
          +{question.positiveMarks} / -{question.negativeMarks}
        </span>
      </div>

      {/* Question Content */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Question:</h3>
        {question.content?.question?.html ? (
          <RichContentRenderer content={question.content.question} />
        ) : (
          <p className="text-gray-400 italic">No question content yet...</p>
        )}
      </div>

      {/* Options Preview */}
      {(selectedType === "single_choice_mcq" || selectedType === "multiple_choice_mcq") && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Options:</h3>
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-start p-3 border rounded-lg ${
                  option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                }`}
              >
                <span className="font-medium mr-3 min-w-[24px]">{option.label})</span>
                <div className="flex-1">
                  {option.content?.html ? (
                    <RichContentRenderer content={option.content} />
                  ) : (
                    <span className="text-gray-400 italic">Option not set</span>
                  )}
                </div>
                {option.isCorrect && (
                  <span className="ml-auto text-green-600 text-sm font-medium">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integer Answer Preview */}
      {selectedType === "integer_based" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Answer:</h3>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="font-medium">
              {question.integerAnswer !== undefined ? question.integerAnswer : 'Not set'}
            </span>
          </div>
        </div>
      )}

      {/* Hints Preview */}
      {question.content?.hints?.html && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Hints:</h3>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <RichContentRenderer content={question.content.hints} />
          </div>
        </div>
      )}

      {/* Solution Preview */}
      {question.content?.solution?.html && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Solution:</h3>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <RichContentRenderer content={question.content.solution} />
          </div>
        </div>
      )}

      {/* Tags Preview */}
      {question.tags && question.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
