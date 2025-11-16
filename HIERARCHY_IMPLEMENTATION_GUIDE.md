# Hierarchy Path Implementation Guide

## Overview
This guide explains how to implement the improved hierarchy system where topics store their complete path from root (exam) to leaf (topic), and the UI shows the full hierarchy when a topic is selected.

## Database Schema Changes

### Topic Table
```sql
ALTER TABLE topics ADD COLUMN hierarchy_path TEXT[] NOT NULL DEFAULT '{}';
-- hierarchy_path stores: [examId, subjectId, parentSubjectId?, parentTopicId?, topicId]
```

### Example Data
```json
{
  "id": "topic-123",
  "name": "Kinematics",
  "subjectId": "subject-physics",
  "hierarchyPath": [
    "exam-jee-2024",           // Exam
    "subject-physics",          // Subject
    "topic-mechanics",          // Parent Topic (optional)
    "topic-123"                 // Current Topic
  ]
}
```

## Implementation Steps

### 1. Update Topic Creation/Update

When creating or updating a topic, automatically build the hierarchy path:

```typescript
import { buildHierarchyPath } from '@/src/utils/hierarchy-utils';

// In your topic creation handler
const handleCreateTopic = async (topicData: TopicFormData) => {
  const newTopicId = generateId();
  
  // Build hierarchy path
  const hierarchyPath = buildHierarchyPath(
    newTopicId,
    topicData.subjectId,
    topicData.parentTopicId,
    subjects,
    topics,
    exams
  );
  
  const newTopic: Topic = {
    ...topicData,
    id: newTopicId,
    hierarchyPath,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Save to database
  await saveTopic(newTopic);
};
```

### 2. Use HierarchySelector in Question Editor

Replace the old topic dropdown with the new HierarchySelector:

```typescript
import { HierarchySelector } from '@/src/components/ui/hierarchy-selector';

function QuestionEditor() {
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Topic</Label>
        <HierarchySelector
          topics={topics}
          subjects={subjects}
          exams={exams}
          selectedTopicId={selectedTopicId}
          onSelect={setSelectedTopicId}
          placeholder="Search and select a topic..."
          className="w-full"
        />
      </div>
    </div>
  );
}
```

### 3. Display Hierarchy in Question List

Show the full hierarchy path for each question:

```typescript
import { formatHierarchyPath } from '@/src/utils/hierarchy-utils';

function QuestionList({ questions, topics, subjects, exams }) {
  return (
    <div>
      {questions.map(question => {
        const topic = topics.find(t => t.id === question.topicId);
        const hierarchyText = topic 
          ? formatHierarchyPath(topic.hierarchyPath, exams, subjects, topics)
          : 'No topic';
        
        return (
          <div key={question.id}>
            <h3>{question.description}</h3>
            <p className="text-sm text-gray-500">{hierarchyText}</p>
          </div>
        );
      })}
    </div>
  );
}
```

### 4. Filter Topics by Exam or Subject

```typescript
import { filterTopicsByExam, filterTopicsBySubject } from '@/src/utils/hierarchy-utils';

// Filter topics for a specific exam
const jeeTopics = filterTopicsByExam(allTopics, 'exam-jee-2024');

// Filter topics for a specific subject
const physicsTopics = filterTopicsBySubject(allTopics, 'subject-physics');
```

### 5. Update Existing Topics (Migration)

Run this once to populate hierarchy paths for existing topics:

```typescript
async function migrateExistingTopics() {
  const allTopics = await fetchAllTopics();
  const allSubjects = await fetchAllSubjects();
  const allExams = await fetchAllExams();
  
  for (const topic of allTopics) {
    if (!topic.hierarchyPath || topic.hierarchyPath.length === 0) {
      const hierarchyPath = buildHierarchyPath(
        topic.id,
        topic.subjectId,
        topic.parentTopicId,
        allSubjects,
        allTopics,
        allExams
      );
      
      await updateTopic(topic.id, { hierarchyPath });
    }
  }
}
```

## UI Features

### HierarchySelector Component Features

1. **Grouped by Exam**: Topics are grouped under their exam names
2. **Breadcrumb Display**: Shows parent hierarchy above topic name
3. **Difficulty Badge**: Color-coded difficulty indicator
4. **Full Path Display**: Shows complete hierarchy below the selector
5. **Search**: Built-in search functionality
6. **Visual Icons**: 📚 Exam, 📖 Subject, 📝 Topic

### Example UI Output

When a topic is selected:
```
┌─────────────────────────────────────────────┐
│ JEE Main 2024 → Physics → Mechanics → Kinematics │
└─────────────────────────────────────────────┘

Full Hierarchy:
[📚 JEE Main 2024] → [📖 Physics] → [📝 Mechanics] → [📝 Kinematics]
```

## API Integration

### Backend Endpoint Example

```typescript
// POST /api/topics
{
  "name": "Kinematics",
  "description": "Study of motion",
  "subjectId": "subject-physics",
  "parentTopicId": "topic-mechanics",
  "difficulty": "medium",
  "tags": ["motion", "velocity"],
  // hierarchyPath will be built on backend
}

// Response
{
  "id": "topic-123",
  "name": "Kinematics",
  "hierarchyPath": [
    "exam-jee-2024",
    "subject-physics",
    "topic-mechanics",
    "topic-123"
  ],
  // ... other fields
}
```

### Backend Implementation (Node.js/Express)

```javascript
async function createTopic(req, res) {
  const { subjectId, parentTopicId, ...topicData } = req.body;
  
  // Fetch related entities
  const subject = await Subject.findById(subjectId);
  const parentTopic = parentTopicId ? await Topic.findById(parentTopicId) : null;
  
  // Build hierarchy path
  const hierarchyPath = [];
  hierarchyPath.push(subject.examId);
  
  // Add subject chain
  let currentSubject = subject;
  const subjectChain = [];
  while (currentSubject) {
    subjectChain.unshift(currentSubject.id);
    currentSubject = currentSubject.parentSubjectId 
      ? await Subject.findById(currentSubject.parentSubjectId)
      : null;
  }
  hierarchyPath.push(...subjectChain);
  
  // Add topic chain if parent exists
  if (parentTopic) {
    hierarchyPath.push(...parentTopic.hierarchyPath.slice(hierarchyPath.length));
  }
  
  // Create new topic
  const newTopic = await Topic.create({
    ...topicData,
    subjectId,
    parentTopicId,
    hierarchyPath,
  });
  
  res.json(newTopic);
}
```

## Benefits

1. **Performance**: No need to traverse the tree on every query
2. **Simplicity**: Single field contains complete path
3. **Flexibility**: Easy to filter, search, and display
4. **Scalability**: Works with unlimited hierarchy depth
5. **User Experience**: Clear visual hierarchy in UI

## Testing

### Test Cases

1. **Create root topic** (no parent)
   - Path: [examId, subjectId, topicId]

2. **Create nested topic** (with parent)
   - Path: [examId, subjectId, parentTopicId, topicId]

3. **Create deeply nested topic**
   - Path: [examId, subjectId, parentSubjectId, grandparentTopicId, parentTopicId, topicId]

4. **Update topic parent**
   - Rebuild hierarchy path with new parent

5. **Delete parent topic**
   - Handle orphaned topics (reassign or delete)

## Migration Checklist

- [ ] Add `hierarchyPath` column to topics table
- [ ] Create utility functions (`hierarchy-utils.ts`)
- [ ] Create HierarchySelector component
- [ ] Update TopicForm to build hierarchy path
- [ ] Update Question Editor to use HierarchySelector
- [ ] Migrate existing topics to populate hierarchy paths
- [ ] Update API endpoints to return hierarchy paths
- [ ] Test with nested hierarchies
- [ ] Update documentation

## Future Enhancements

1. **Caching**: Cache hierarchy lookups for better performance
2. **Breadcrumb Navigation**: Click on any level to navigate
3. **Bulk Operations**: Move multiple topics at once
4. **Hierarchy Validation**: Prevent circular references
5. **Search Optimization**: Index hierarchy paths for faster search
