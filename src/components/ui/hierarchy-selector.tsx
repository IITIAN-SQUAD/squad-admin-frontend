"use client";

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Topic, Subject, Exam } from "@/src/types/exam";

interface HierarchySelectorProps {
  topics: Topic[];
  subjects: Subject[];
  exams: Exam[];
  selectedTopicId?: string;
  onSelect: (topicId: string) => void;
  placeholder?: string;
  className?: string;
}

interface HierarchyNode {
  id: string;
  name: string;
  type: 'exam' | 'subject' | 'topic';
}

export function HierarchySelector({
  topics,
  subjects,
  exams,
  selectedTopicId,
  onSelect,
  placeholder = "Select a topic",
  className,
}: HierarchySelectorProps) {
  
  // Build a map for quick lookups
  const entityMap = useMemo(() => {
    const map = new Map<string, { name: string; type: 'exam' | 'subject' | 'topic' }>();
    
    exams.forEach(exam => map.set(exam.id, { name: exam.name, type: 'exam' }));
    subjects.forEach(subject => map.set(subject.id, { name: subject.name, type: 'subject' }));
    topics.forEach(topic => map.set(topic.id, { name: topic.name, type: 'topic' }));
    
    return map;
  }, [exams, subjects, topics]);

  // Get hierarchy path names for a topic
  const getHierarchyPath = (topic: Topic): HierarchyNode[] => {
    return topic.hierarchyPath.map(id => {
      const entity = entityMap.get(id);
      return {
        id,
        name: entity?.name || 'Unknown',
        type: entity?.type || 'topic',
      };
    });
  };

  // Get display text for selected topic
  const getDisplayText = (topicId: string): string => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return '';
    
    const path = getHierarchyPath(topic);
    return path.map(node => node.name).join(' → ');
  };

  // Group topics by their exam (through subject relationship)
  const groupedTopics = useMemo(() => {
    const groups = new Map<string, Topic[]>();
    
    topics.forEach(topic => {
      const subject = subjects.find(s => s.id === topic.subjectId);
      const exam = subject ? exams.find(e => e.id === subject.examId) : null;
      const groupKey = exam?.name || 'Other';
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(topic);
    });
    
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [topics, subjects, exams]);

  return (
    <div className={className}>
      <Select value={selectedTopicId} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedTopicId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="truncate">{getDisplayText(selectedTopicId)}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {groupedTopics.map(([examName, examTopics]) => (
            <div key={examName}>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                {examName}
              </div>
              {examTopics.map(topic => {
                const path = getHierarchyPath(topic);
                return (
                  <SelectItem key={topic.id} value={topic.id} className="py-3">
                    <div className="flex flex-col gap-1">
                      {/* Breadcrumb path */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {path.slice(0, -1).map((node, index) => (
                          <React.Fragment key={node.id}>
                            <span>{node.name}</span>
                            {index < path.length - 2 && (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      {/* Topic name */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{topic.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            topic.difficulty === 'easy' ? 'text-green-600 border-green-300' :
                            topic.difficulty === 'medium' ? 'text-yellow-600 border-yellow-300' :
                            'text-red-600 border-red-300'
                          }`}
                        >
                          {topic.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          ))}
        </SelectContent>
      </Select>

      {/* Display full hierarchy path below selector */}
      {selectedTopicId && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
          <div className="text-xs font-medium text-gray-500 mb-2">Full Hierarchy:</div>
          <div className="flex items-center gap-2 flex-wrap">
            {getHierarchyPath(topics.find(t => t.id === selectedTopicId)!).map((node, index, arr) => (
              <React.Fragment key={node.id}>
                <Badge 
                  variant={node.type === 'exam' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {node.type === 'exam' && '📚 '}
                  {node.type === 'subject' && '📖 '}
                  {node.type === 'topic' && '📝 '}
                  {node.name}
                </Badge>
                {index < arr.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
