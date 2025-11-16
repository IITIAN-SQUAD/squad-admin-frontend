# Hierarchy Selector - Usage Examples

## Example 1: Question Editor Integration

Replace the old topic dropdown in your question editor with the new HierarchySelector:

### Before (Old Approach)
```tsx
<div>
  <Label>Topic</Label>
  <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
    <SelectTrigger>
      <SelectValue placeholder="Select topic" />
    </SelectTrigger>
    <SelectContent>
      {topics.map(topic => (
        <SelectItem key={topic.id} value={topic.id}>
          {topic.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### After (New Approach)
```tsx
import { HierarchySelector } from '@/src/components/ui/hierarchy-selector';

<div>
  <Label>Topic</Label>
  <HierarchySelector
    topics={topics}
    subjects={subjects}
    exams={exams}
    selectedTopicId={selectedTopicId}
    onSelect={setSelectedTopicId}
    placeholder="Search and select a topic..."
  />
</div>
```

## Example 2: Complete Question Editor Component

```tsx
"use client";

import React, { useState } from "react";
import { HierarchySelector } from '@/src/components/ui/hierarchy-selector';
import { buildHierarchyPath } from '@/src/utils/hierarchy-utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock data - replace with your actual data fetching
const mockExams = [
  { id: "1", name: "JEE Main 2024", description: "JEE", countries: ["India"], metadata: [], createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "NEET 2024", description: "NEET", countries: ["India"], metadata: [], createdAt: new Date(), updatedAt: new Date() },
];

const mockSubjects = [
  { id: "s1", name: "Physics", description: "Physics", examId: "1", order: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "s2", name: "Chemistry", description: "Chemistry", examId: "1", order: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "s3", name: "Biology", description: "Biology", examId: "2", order: 1, createdAt: new Date(), updatedAt: new Date() },
];

const mockTopics = [
  {
    id: "t1",
    name: "Kinematics",
    description: "Motion",
    subjectId: "s1",
    hierarchyPath: ["1", "s1", "t1"],
    order: 1,
    difficulty: "medium" as const,
    tags: ["motion"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "t2",
    name: "Thermodynamics",
    description: "Heat",
    subjectId: "s1",
    hierarchyPath: ["1", "s1", "t2"],
    order: 2,
    difficulty: "hard" as const,
    tags: ["heat", "energy"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "t3",
    name: "Organic Chemistry",
    description: "Carbon compounds",
    subjectId: "s2",
    hierarchyPath: ["1", "s2", "t3"],
    order: 1,
    difficulty: "medium" as const,
    tags: ["organic"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "t4",
    name: "Cell Biology",
    description: "Cells",
    subjectId: "s3",
    hierarchyPath: ["2", "s3", "t4"],
    order: 1,
    difficulty: "easy" as const,
    tags: ["cells"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function QuestionEditorExample() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  const [questionText, setQuestionText] = useState("");

  const handleSave = () => {
    if (!selectedTopicId) {
      alert("Please select a topic");
      return;
    }

    const question = {
      text: questionText,
      topicId: selectedTopicId,
      // ... other question fields
    };

    console.log("Saving question:", question);
    // Save to backend
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Create Question</h1>

      <div className="space-y-4">
        {/* Topic Selector */}
        <div>
          <Label>Select Topic *</Label>
          <HierarchySelector
            topics={mockTopics}
            subjects={mockSubjects}
            exams={mockExams}
            selectedTopicId={selectedTopicId}
            onSelect={setSelectedTopicId}
            placeholder="Search and select a topic..."
          />
        </div>

        {/* Question Text */}
        <div>
          <Label>Question Text *</Label>
          <Input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question..."
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={!selectedTopicId || !questionText}>
          Save Question
        </Button>
      </div>
    </div>
  );
}
```

## Example 3: Creating Topics with Hierarchy Path

```tsx
import { buildHierarchyPath } from '@/src/utils/hierarchy-utils';

async function handleCreateTopic(formData: TopicFormData) {
  // Generate new topic ID
  const newTopicId = `topic-${Date.now()}`;
  
  // Build hierarchy path automatically
  const hierarchyPath = buildHierarchyPath(
    newTopicId,
    formData.subjectId,
    formData.parentTopicId,
    subjects,
    topics,
    exams
  );
  
  const newTopic: Topic = {
    id: newTopicId,
    name: formData.name,
    description: formData.description,
    subjectId: formData.subjectId,
    parentTopicId: formData.parentTopicId,
    hierarchyPath, // Automatically built!
    order: formData.order,
    difficulty: formData.difficulty,
    tags: formData.tags,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Save to database
  await saveTopic(newTopic);
  
  console.log("Created topic with hierarchy:", hierarchyPath);
  // Example output: ["exam-jee-2024", "subject-physics", "topic-mechanics", "topic-123"]
}
```

## Example 4: Displaying Hierarchy in Question List

```tsx
import { formatHierarchyPath } from '@/src/utils/hierarchy-utils';

function QuestionListItem({ question, topics, subjects, exams }) {
  const topic = topics.find(t => t.id === question.topicId);
  
  if (!topic) return null;
  
  const hierarchyText = formatHierarchyPath(
    topic.hierarchyPath,
    exams,
    subjects,
    topics,
    ' → '
  );
  
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium">{question.description}</h3>
      <p className="text-sm text-gray-500 mt-1">
        📍 {hierarchyText}
      </p>
      <div className="flex gap-2 mt-2">
        <Badge>{topic.difficulty}</Badge>
        {topic.tags.map(tag => (
          <Badge key={tag} variant="outline">{tag}</Badge>
        ))}
      </div>
    </div>
  );
}
```

## Example 5: Filtering Topics

```tsx
import { filterTopicsByExam, filterTopicsBySubject } from '@/src/utils/hierarchy-utils';

function TopicFilter() {
  const [selectedExamId, setSelectedExamId] = useState<string>();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>();
  
  // Filter topics based on selections
  let filteredTopics = topics;
  
  if (selectedExamId) {
    filteredTopics = filterTopicsByExam(filteredTopics, selectedExamId);
  }
  
  if (selectedSubjectId) {
    filteredTopics = filterTopicsBySubject(filteredTopics, selectedSubjectId);
  }
  
  return (
    <div className="space-y-4">
      <Select value={selectedExamId} onValueChange={setSelectedExamId}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by exam" />
        </SelectTrigger>
        <SelectContent>
          {exams.map(exam => (
            <SelectItem key={exam.id} value={exam.id}>
              {exam.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <HierarchySelector
        topics={filteredTopics}
        subjects={subjects}
        exams={exams}
        selectedTopicId={selectedTopicId}
        onSelect={setSelectedTopicId}
      />
    </div>
  );
}
```

## Example 6: Breadcrumb Navigation

```tsx
import { getHierarchyNames } from '@/src/utils/hierarchy-utils';
import { ChevronRight } from 'lucide-react';

function HierarchyBreadcrumb({ topic, exams, subjects, topics }) {
  const names = getHierarchyNames(topic.hierarchyPath, exams, subjects, topics);
  
  return (
    <nav className="flex items-center gap-2 text-sm">
      {names.map((name, index) => (
        <React.Fragment key={index}>
          <button 
            className="hover:underline text-blue-600"
            onClick={() => handleNavigate(topic.hierarchyPath[index])}
          >
            {name}
          </button>
          {index < names.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

## Visual Output Examples

### When selecting "Kinematics" topic:

**Dropdown shows:**
```
JEE Main 2024
  Physics
  └─ Kinematics [medium]
  
  Physics
  └─ Thermodynamics [hard]
  
  Chemistry
  └─ Organic Chemistry [medium]

NEET 2024
  Biology
  └─ Cell Biology [easy]
```

**After selection, displays:**
```
┌────────────────────────────────────────┐
│ JEE Main 2024 → Physics → Kinematics   │
└────────────────────────────────────────┘

Full Hierarchy:
[📚 JEE Main 2024] → [📖 Physics] → [📝 Kinematics]
```

## Benefits Summary

✅ **Admin selects only the leaf topic** (e.g., "Kinematics")  
✅ **System automatically shows full path** (JEE Main 2024 → Physics → Kinematics)  
✅ **No manual hierarchy selection needed**  
✅ **Stored efficiently in database** as array of IDs  
✅ **Fast filtering and searching**  
✅ **Clear visual hierarchy** for users  

## Next Steps

1. Update your backend to store `hierarchyPath` in the topics table
2. Replace old topic dropdowns with `HierarchySelector`
3. Use `buildHierarchyPath()` when creating/updating topics
4. Use `formatHierarchyPath()` to display full paths in UI
5. Test with nested hierarchies (subjects with parents, topics with parents)
