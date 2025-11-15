"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Eye,
  Clock,
  Hash,
  Target,
  ArrowLeft
} from "lucide-react";
import { Paper, PaperSection, Question } from "@/src/types/exam";
import SectionForm from "./SectionForm";

interface PaperEditorProps {
  paper: Paper;
  onBack: () => void;
  onUpdate: (paper: Paper) => void;
}

interface SectionNodeProps {
  section: PaperSection;
  level: number;
  onEdit: (section: PaperSection) => void;
  onDelete: (sectionId: string) => void;
  onAddSubsection: (parentId: string) => void;
  onAddQuestion: (sectionId: string) => void;
  onEditQuestion: (question: Question) => void;
  onViewQuestion: (question: Question) => void;
  expandedSections: Set<string>;
  toggleExpanded: (sectionId: string) => void;
}

function SectionNode({
  section,
  level,
  onEdit,
  onDelete,
  onAddSubsection,
  onAddQuestion,
  onEditQuestion,
  onViewQuestion,
  expandedSections,
  toggleExpanded,
}: SectionNodeProps) {
  const isExpanded = expandedSections.has(section.id);
  const hasQuestions = section.questions.length > 0;
  const hasSubsections = (section as any).children && (section as any).children.length > 0;
  const hasChildren = hasQuestions || hasSubsections;

  return (
    <div className={`border rounded-lg p-4 mb-3 bg-white ${level > 0 ? 'ml-6' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(section.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
          <FileText className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold">{section.name}</h3>
            <p className="text-sm text-gray-600">{section.description}</p>
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              <span>Questions: {section.questions.length}</span>
              <span>Marks: {section.questions.reduce((sum, q) => sum + q.positiveMarks, 0)}</span>
              {section.duration && <span>Duration: {Math.floor(section.duration / 60)}m</span>}
              {hasSubsections && <span className="text-blue-600">📁 {(section as any).children.length} sub-sections</span>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddSubsection(section.id)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Sub-section
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddQuestion(section.id)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Question
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(section)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(section.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-4 space-y-3">
          {/* Sub-sections */}
          {hasSubsections && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-blue-800 border-b border-blue-200 pb-1">
                📁 Sub-sections ({(section as any).children.length})
              </h4>
              {(section as any).children.map((childSection: PaperSection) => (
                <SectionNode
                  key={childSection.id}
                  section={childSection}
                  level={level + 1}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubsection={onAddSubsection}
                  onAddQuestion={onAddQuestion}
                  onEditQuestion={onEditQuestion}
                  onViewQuestion={onViewQuestion}
                  expandedSections={expandedSections}
                  toggleExpanded={toggleExpanded}
                />
              ))}
            </div>
          )}

          {/* Questions */}
          {hasQuestions && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-800 border-b border-green-200 pb-1">
                ❓ Questions ({section.questions.length})
              </h4>
              {section.questions.map((question, index) => (
                <div key={question.id} className="border rounded p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-2 flex-1"
                      onClick={() => onViewQuestion(question)}
                    >
                      <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        question.difficulty === 'easy' ? 'bg-green-500' :
                        question.difficulty === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2 hover:text-blue-600">{question.description}</p>
                        <div className="flex gap-2 text-xs text-gray-500 mt-1">
                          <span>+{question.positiveMarks}</span>
                          <span>{question.negativeMarks}</span>
                          <span>{question.options.length} options</span>
                          <span className="capitalize">{question.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewQuestion(question)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditQuestion(question)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PaperEditor({ paper, onBack, onUpdate }: PaperEditorProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<PaperSection | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [parentSectionId, setParentSectionId] = useState<string>("");

  // Handle navigation to question editor when editing a question
  React.useEffect(() => {
    if (editingQuestion) {
      router.push(`/question-editor/${editingQuestion.sectionId}?edit=${editingQuestion.id}`);
      setEditingQuestion(null);
    }
  }, [editingQuestion, router]);

  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const buildSectionHierarchy = (): (PaperSection & { children: PaperSection[] })[] => {
    const sectionMap = new Map<string, PaperSection & { children: PaperSection[] }>();
    const rootSections: (PaperSection & { children: PaperSection[] })[] = [];

    // Initialize all sections with children array
    paper.sections.forEach(section => {
      sectionMap.set(section.id, { ...section, children: [] });
    });

    // Build hierarchy
    paper.sections.forEach(section => {
      if (section.parentSectionId) {
        const parent = sectionMap.get(section.parentSectionId);
        if (parent) {
          const childSection = sectionMap.get(section.id);
          if (childSection) {
            parent.children.push(childSection);
          }
        }
      } else {
        const sectionWithChildren = sectionMap.get(section.id);
        if (sectionWithChildren) {
          rootSections.push(sectionWithChildren);
        }
      }
    });

    return rootSections;
  };

  const handleCreateSection = (sectionData: Omit<PaperSection, "id" | "createdAt" | "updatedAt" | "questions">) => {
    const newSection: PaperSection = {
      ...sectionData,
      id: Date.now().toString(),
      questions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedPaper = {
      ...paper,
      sections: [...paper.sections, newSection],
    };
    
    onUpdate(updatedPaper);
    setIsSectionDialogOpen(false);
    setParentSectionId("");
  };

  const handleUpdateSection = (sectionData: Omit<PaperSection, "id" | "createdAt" | "updatedAt" | "questions">) => {
    if (!editingSection) return;
    
    const updatedSection: PaperSection = {
      ...sectionData,
      id: editingSection.id,
      questions: editingSection.questions,
      createdAt: editingSection.createdAt,
      updatedAt: new Date(),
    };
    
    const updatedPaper = {
      ...paper,
      sections: paper.sections.map(s => s.id === editingSection.id ? updatedSection : s),
    };
    
    onUpdate(updatedPaper);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section and all its questions?")) {
      const updatedPaper = {
        ...paper,
        sections: paper.sections.filter(s => s.id !== sectionId),
      };
      onUpdate(updatedPaper);
    }
  };


  const sections = buildSectionHierarchy();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Papers
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{paper.name}</h1>
            <p className="text-gray-600">
              {paper.totalQuestions} questions • {paper.totalMarks} marks • {Math.floor(paper.duration / 3600)}h {Math.floor((paper.duration % 3600) / 60)}m
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const allSectionIds = new Set(paper.sections.map(s => s.id));
              setExpandedSections(allSectionIds);
            }}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            onClick={() => setExpandedSections(new Set())}
          >
            Collapse All
          </Button>
          <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Section</DialogTitle>
              </DialogHeader>
              <SectionForm
                paperId={paper.id}
                parentSectionId={parentSectionId}
                onSubmit={handleCreateSection}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Paper Structure */}
      <div className="space-y-4">
        {sections.length > 0 ? (
          sections.map((section) => (
            <SectionNode
              key={section.id}
              section={section}
              level={0}
              onEdit={setEditingSection}
              onDelete={handleDeleteSection}
              onAddSubsection={(parentId) => {
                setParentSectionId(parentId);
                setIsSectionDialogOpen(true);
              }}
              onAddQuestion={(sectionId) => {
                router.push(`/question-editor/${sectionId}`);
              }}
              onEditQuestion={setEditingQuestion}
              onViewQuestion={setViewingQuestion}
              expandedSections={expandedSections}
              toggleExpanded={toggleExpanded}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No sections yet</h3>
            <p className="mb-4">Start building your paper by adding sections</p>
            <Button
              onClick={() => setIsSectionDialogOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Section
            </Button>
          </div>
        )}
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <SectionForm
            initialData={editingSection || undefined}
            paperId={paper.id}
            onSubmit={handleUpdateSection}
          />
        </DialogContent>
      </Dialog>


      {/* View Question Dialog */}
      <Dialog open={!!viewingQuestion} onOpenChange={(open) => !open && setViewingQuestion(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          {viewingQuestion && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    viewingQuestion.difficulty === 'easy' ? 'bg-green-500' :
                    viewingQuestion.difficulty === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize">{viewingQuestion.difficulty}</span>
                  <span className="text-sm text-gray-600">
                    +{viewingQuestion.positiveMarks} / {viewingQuestion.negativeMarks} marks
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Question</h3>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: viewingQuestion.htmlContent || viewingQuestion.description 
                  }}
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Answer Options:</h4>
                <div className="space-y-2">
                  {viewingQuestion.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg ${
                        option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{option.label})</span>
                          <span>{option.value}</span>
                        </div>
                        {option.isCorrect && (
                          <span className="text-green-600 text-sm font-medium">✓ Correct</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {viewingQuestion.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingQuestion.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewingQuestion) {
                      router.push(`/question-editor/${viewingQuestion.sectionId}?edit=${viewingQuestion.id}`);
                      setViewingQuestion(null);
                    }
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Question
                </Button>
                <Button onClick={() => setViewingQuestion(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
