"use client";

import React, { useState } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, ChevronDown, Edit, Trash2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubjectForm from "@/src/components/subject/SubjectForm";
import TopicForm from "@/src/components/subject/TopicForm";
import { Exam, Subject, Topic, ExamHierarchy, SubjectHierarchy, TopicHierarchy } from "@/src/types/exam";

// Mock data - Independent subject hierarchy
const mockSubjects: Subject[] = [
  {
    id: "1",
    name: "Physics",
    description: "Fundamental physics concepts",
    examId: "", // No longer tied to specific exam
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Mathematics",
    description: "Mathematical concepts and applications",
    examId: "",
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Chemistry",
    description: "Chemical principles and reactions",
    examId: "",
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Mechanics",
    description: "Classical Mechanics - Motion and Forces",
    examId: "",
    parentSubjectId: "1", // Under Physics
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    name: "Thermodynamics",
    description: "Heat and Energy Transfer",
    examId: "",
    parentSubjectId: "1", // Under Physics
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    name: "Calculus",
    description: "Differential and Integral Calculus",
    examId: "",
    parentSubjectId: "2", // Under Mathematics
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockTopics: Topic[] = [
  {
    id: "1",
    name: "Kinematics",
    description: "Motion in one and two dimensions",
    subjectId: "4", // Under Mechanics
    order: 1,
    difficulty: "medium",
    tags: ["motion", "velocity", "acceleration"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Laws of Motion",
    description: "Newton's laws and applications",
    subjectId: "4", // Under Mechanics
    order: 2,
    difficulty: "medium",
    tags: ["newton", "force", "momentum"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Heat Transfer",
    description: "Conduction, convection, and radiation",
    subjectId: "5", // Under Thermodynamics
    order: 1,
    difficulty: "hard",
    tags: ["heat", "conduction", "convection"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Derivatives",
    description: "Differentiation and applications",
    subjectId: "6", // Under Calculus
    order: 1,
    difficulty: "medium",
    tags: ["calculus", "derivatives", "limits"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface TreeNodeProps {
  level: number;
  children: React.ReactNode;
}

function TreeNode({ level, children }: TreeNodeProps) {
  return (
    <div className={`ml-${level * 6} border-l border-gray-200 pl-4`}>
      {children}
    </div>
  );
}

interface SubjectNodeProps {
  subject: SubjectHierarchy;
  level: number;
  onEdit: (subject: Subject) => void;
  onDelete: (subjectId: string) => void;
  onAddChapter: (parentId: string) => void;
  onAddTopic: (subjectId: string) => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topicId: string) => void;
  expandedSubjects: Set<string>;
  toggleExpanded: (subjectId: string) => void;
}

function SubjectNode({
  subject,
  level,
  onEdit,
  onDelete,
  onAddChapter,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  expandedSubjects,
  toggleExpanded,
}: SubjectNodeProps) {
  const isExpanded = expandedSubjects.has(subject.subject.id);
  const hasChildren = subject.children.length > 0 || subject.topics.length > 0;

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(subject.subject.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold">{subject.subject.name}</h3>
            <p className="text-sm text-gray-600">{subject.subject.description}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {level === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddChapter(subject.subject.id)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Chapter
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddTopic(subject.subject.id)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Topic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(subject.subject)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(subject.subject.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="mt-4 ml-6 space-y-3">
          {/* Topics */}
          {subject.topics.map((topic) => (
            <div key={topic.topic.id} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    topic.topic.difficulty === 'easy' ? 'bg-green-500' :
                    topic.topic.difficulty === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div>
                    <h4 className="font-medium">{topic.topic.name}</h4>
                    <p className="text-xs text-gray-600">{topic.topic.description}</p>
                    <div className="flex gap-1 mt-1">
                      {topic.topic.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditTopic(topic.topic)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => onDeleteTopic(topic.topic.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Child Subjects */}
          {subject.children.map((child) => (
            <SubjectNode
              key={child.subject.id}
              subject={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChapter={onAddChapter}
              onAddTopic={onAddTopic}
              onEditTopic={onEditTopic}
              onDeleteTopic={onDeleteTopic}
              expandedSubjects={expandedSubjects}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [topics, setTopics] = useState<Topic[]>(mockTopics);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [parentSubjectId, setParentSubjectId] = useState<string>("");
  const [selectedSubjectForTopic, setSelectedSubjectForTopic] = useState<string>("");

  const toggleExpanded = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const buildHierarchy = (): SubjectHierarchy[] => {
    const subjectMap = new Map<string, SubjectHierarchy>();
    const rootSubjects: SubjectHierarchy[] = [];

    // Initialize all subjects (no exam filtering)
    subjects.forEach(subject => {
      const subjectTopics = topics
        .filter(t => t.subjectId === subject.id)
        .map(topic => ({
          topic,
          children: [], // Topics don't have children in this implementation
          questionCount: 0, // Would be calculated from actual questions
        }));

      subjectMap.set(subject.id, {
        subject,
        children: [],
        topics: subjectTopics,
      });
    });

    // Build hierarchy
    subjectMap.forEach((subjectHierarchy) => {
      if (subjectHierarchy.subject.parentSubjectId) {
        const parent = subjectMap.get(subjectHierarchy.subject.parentSubjectId);
        if (parent) {
          parent.children.push(subjectHierarchy);
        }
      } else {
        rootSubjects.push(subjectHierarchy);
      }
    });

    return rootSubjects;
  };

  const handleCreateSubject = (subjectData: Omit<Subject, "id" | "createdAt" | "updatedAt">) => {
    const newSubject: Subject = {
      ...subjectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSubjects([...subjects, newSubject]);
    setIsSubjectDialogOpen(false);
    setParentSubjectId("");
  };

  const handleCreateTopic = (topicData: Omit<Topic, "id" | "createdAt" | "updatedAt">) => {
    const newTopic: Topic = {
      ...topicData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTopics([...topics, newTopic]);
    setIsTopicDialogOpen(false);
    setSelectedSubjectForTopic("");
  };

  const hierarchy = buildHierarchy();

  return (
    <>
      <PageHeader title="Subject Management" />
      <PageWrapper>
        <div className="flex justify-between items-center mb-6">
          <PageTitle backButton={{ enabled: false }}>Subject & Topic Management</PageTitle>
          <div className="flex gap-3">
            <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Subject</DialogTitle>
                </DialogHeader>
                <SubjectForm
                  examId=""
                  parentSubjectId={parentSubjectId}
                  onSubmit={handleCreateSubject}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Subject Hierarchy */}
        <div className="space-y-4">
          {hierarchy.length > 0 ? (
            hierarchy.map((subject) => (
              <SubjectNode
                key={subject.subject.id}
                subject={subject}
                level={0}
                onEdit={setEditingSubject}
                onDelete={(id) => {
                  if (confirm("Are you sure you want to delete this subject?")) {
                    setSubjects(subjects.filter(s => s.id !== id));
                  }
                }}
                onAddChapter={(parentId) => {
                  setParentSubjectId(parentId);
                  setIsSubjectDialogOpen(true);
                }}
                onAddTopic={(subjectId) => {
                  setSelectedSubjectForTopic(subjectId);
                  setIsTopicDialogOpen(true);
                }}
                onEditTopic={setEditingTopic}
                onDeleteTopic={(topicId) => {
                  if (confirm("Are you sure you want to delete this topic?")) {
                    setTopics(topics.filter(t => t.id !== topicId));
                  }
                }}
                expandedSubjects={expandedSubjects}
                toggleExpanded={toggleExpanded}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No subjects created yet. Create your first subject to get started.
            </div>
          )}
        </div>

        {/* Topic Dialog */}
        <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Topic</DialogTitle>
            </DialogHeader>
            <TopicForm
              subjectId={selectedSubjectForTopic}
              onSubmit={handleCreateTopic}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Topic Dialog */}
        <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
            </DialogHeader>
            <TopicForm
              initialData={editingTopic || undefined}
              subjectId={editingTopic?.subjectId || ""}
              onSubmit={(topicData) => {
                if (editingTopic) {
                  const updatedTopic: Topic = {
                    ...editingTopic,
                    ...topicData,
                    updatedAt: new Date(),
                  };
                  setTopics(topics.map(t => t.id === editingTopic.id ? updatedTopic : t));
                  setEditingTopic(null);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
