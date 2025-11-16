"use client";

/**
 * HierarchySelector Demo Component
 * 
 * This demonstrates the improved hierarchy system where:
 * 1. Admin selects only the LEAF topic from a dropdown
 * 2. System automatically shows the FULL HIERARCHY PATH
 * 3. No need to manually select Exam → Subject → Chapter → Topic
 * 
 * Usage: Import this component to see the HierarchySelector in action
 */

import React, { useState } from "react";
import { HierarchySelector } from '@/src/components/ui/hierarchy-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Exam, Subject, Topic } from "@/src/types/exam";

// Mock data demonstrating the hierarchy
const demoExams: Exam[] = [
  {
    id: "exam-jee-2024",
    name: "JEE Main 2024",
    description: "Joint Entrance Examination Main",
    countries: ["India"],
    metadata: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "exam-neet-2024",
    name: "NEET 2024",
    description: "National Eligibility cum Entrance Test",
    countries: ["India"],
    metadata: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const demoSubjects: Subject[] = [
  {
    id: "subject-physics",
    name: "Physics",
    description: "Physics subject",
    examId: "exam-jee-2024",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subject-chemistry",
    name: "Chemistry",
    description: "Chemistry subject",
    examId: "exam-jee-2024",
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "subject-biology",
    name: "Biology",
    description: "Biology subject",
    examId: "exam-neet-2024",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const demoTopics: Topic[] = [
  // Physics topics
  {
    id: "topic-mechanics",
    name: "Mechanics",
    description: "Classical mechanics",
    subjectId: "subject-physics",
    hierarchyPath: ["exam-jee-2024", "subject-physics", "topic-mechanics"],
    order: 1,
    difficulty: "medium",
    tags: ["classical", "motion"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "topic-kinematics",
    name: "Kinematics",
    description: "Study of motion",
    subjectId: "subject-physics",
    parentTopicId: "topic-mechanics",
    hierarchyPath: ["exam-jee-2024", "subject-physics", "topic-mechanics", "topic-kinematics"],
    order: 1,
    difficulty: "easy",
    tags: ["motion", "velocity", "acceleration"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "topic-dynamics",
    name: "Dynamics",
    description: "Forces and motion",
    subjectId: "subject-physics",
    parentTopicId: "topic-mechanics",
    hierarchyPath: ["exam-jee-2024", "subject-physics", "topic-mechanics", "topic-dynamics"],
    order: 2,
    difficulty: "medium",
    tags: ["force", "newton"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "topic-thermodynamics",
    name: "Thermodynamics",
    description: "Heat and energy",
    subjectId: "subject-physics",
    hierarchyPath: ["exam-jee-2024", "subject-physics", "topic-thermodynamics"],
    order: 2,
    difficulty: "hard",
    tags: ["heat", "energy", "entropy"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  
  // Chemistry topics
  {
    id: "topic-organic",
    name: "Organic Chemistry",
    description: "Carbon compounds",
    subjectId: "subject-chemistry",
    hierarchyPath: ["exam-jee-2024", "subject-chemistry", "topic-organic"],
    order: 1,
    difficulty: "medium",
    tags: ["organic", "carbon"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "topic-hydrocarbons",
    name: "Hydrocarbons",
    description: "Compounds of C and H",
    subjectId: "subject-chemistry",
    parentTopicId: "topic-organic",
    hierarchyPath: ["exam-jee-2024", "subject-chemistry", "topic-organic", "topic-hydrocarbons"],
    order: 1,
    difficulty: "easy",
    tags: ["alkanes", "alkenes"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  
  // Biology topics
  {
    id: "topic-cell-biology",
    name: "Cell Biology",
    description: "Study of cells",
    subjectId: "subject-biology",
    hierarchyPath: ["exam-neet-2024", "subject-biology", "topic-cell-biology"],
    order: 1,
    difficulty: "easy",
    tags: ["cells", "organelles"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function HierarchySelectorDemo() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  
  const selectedTopic = demoTopics.find(t => t.id === selectedTopicId);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Improved Hierarchy System Demo</CardTitle>
          <CardDescription>
            Select any topic from the dropdown. The system will automatically show the complete hierarchy path.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* The new HierarchySelector */}
          <div>
            <h3 className="text-sm font-medium mb-2">Select Topic (Leaf Node)</h3>
            <HierarchySelector
              topics={demoTopics}
              subjects={demoSubjects}
              exams={demoExams}
              selectedTopicId={selectedTopicId}
              onSelect={setSelectedTopicId}
              placeholder="Search and select any topic..."
            />
          </div>

          {/* Show what gets stored */}
          {selectedTopic && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">What Gets Stored in Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Topic ID:</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border">
                    {selectedTopic.id}
                  </code>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Hierarchy Path (Array of IDs):</p>
                  <code className="text-sm bg-white px-2 py-1 rounded border block overflow-x-auto">
                    {JSON.stringify(selectedTopic.hierarchyPath, null, 2)}
                  </code>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Topic Details:</p>
                  <div className="bg-white p-3 rounded border space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{selectedTopic.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Difficulty:</span>
                      <Badge variant={
                        selectedTopic.difficulty === 'easy' ? 'default' :
                        selectedTopic.difficulty === 'medium' ? 'secondary' :
                        'destructive'
                      }>
                        {selectedTopic.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Tags:</span>
                      <div className="flex gap-1">
                        {selectedTopic.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg text-green-900">✅ Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-green-900">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span><strong>Single Selection:</strong> Admin selects only the leaf topic, not the entire path</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span><strong>Auto Display:</strong> Full hierarchy automatically shown (Exam → Subject → Topic)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span><strong>Efficient Storage:</strong> Path stored as array of IDs in database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span><strong>Fast Filtering:</strong> Easy to filter questions by exam, subject, or topic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">5.</span>
                  <span><strong>Better UX:</strong> Search across all topics, grouped by exam</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Old vs New Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm text-red-900">❌ Old Approach</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-red-900 space-y-2">
                <p>1. Select Exam dropdown</p>
                <p>2. Select Subject dropdown</p>
                <p>3. Select Chapter dropdown</p>
                <p>4. Select Topic dropdown</p>
                <p className="pt-2 font-medium">= 4 separate selections!</p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-sm text-green-900">✅ New Approach</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-green-900 space-y-2">
                <p>1. Select Topic from single dropdown</p>
                <p>2. Hierarchy auto-displayed</p>
                <p className="pt-2 invisible">.</p>
                <p className="pt-2 invisible">.</p>
                <p className="pt-2 font-medium">= 1 selection only!</p>
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
