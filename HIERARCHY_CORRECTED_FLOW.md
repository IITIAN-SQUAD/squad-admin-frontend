# Corrected Hierarchy System

## 🎯 Important: Exam is Separate!

The hierarchy path **does NOT include Exam**. Exam is a separate entity that subjects belong to.

### Hierarchy Structure:

```
Exam (Separate - not in hierarchy path)
  ↓ (has many)
Subject → Chapter (Subject) → Topic → Sub-Topic
  ↑                                      ↑
  └──────── This is the hierarchy ───────┘
```

---

## 📊 Corrected Data Model

### Example 1: Root Topic (No Parent)

```json
{
  "id": "topic-mechanics",
  "name": "Mechanics",
  "subjectId": "subject-physics",
  "hierarchyPath": ["subject-physics", "topic-mechanics"],
  "examId": null  // Exam is NOT in hierarchy, accessed through subject
}
```

**Display:** `Physics → Mechanics`

### Example 2: Nested Topic (With Parent)

```json
{
  "id": "topic-kinematics",
  "name": "Kinematics",
  "subjectId": "subject-physics",
  "parentTopicId": "topic-mechanics",
  "hierarchyPath": ["subject-physics", "topic-mechanics", "topic-kinematics"]
}
```

**Display:** `Physics → Mechanics → Kinematics`

### Example 3: Nested Subject (Chapter)

```json
{
  "id": "subject-modern-physics",
  "name": "Modern Physics",
  "examId": "exam-jee-2024",
  "parentSubjectId": "subject-physics",
  "order": 2
}

// Topic under this chapter
{
  "id": "topic-quantum",
  "name": "Quantum Mechanics",
  "subjectId": "subject-modern-physics",
  "hierarchyPath": ["subject-physics", "subject-modern-physics", "topic-quantum"]
}
```

**Display:** `Physics → Modern Physics → Quantum Mechanics`

---

## 🔄 How Hierarchy Path is Built

### Scenario 1: Simple Topic

```
Admin creates: "Kinematics"
├─ Subject: Physics
└─ Parent Topic: Mechanics

System builds:
hierarchyPath = ["subject-physics", "topic-mechanics", "topic-kinematics"]
                  ↑                  ↑                   ↑
                  Subject            Parent Topic        Current Topic
```

### Scenario 2: Topic in Nested Subject (Chapter)

```
Admin creates: "Quantum Mechanics"
├─ Subject: Modern Physics (which has parent: Physics)
└─ Parent Topic: None

System traces:
Modern Physics → parent is → Physics → no parent

System builds:
hierarchyPath = ["subject-physics", "subject-modern-physics", "topic-quantum"]
                  ↑                  ↑                         ↑
                  Root Subject       Chapter (Sub-subject)    Topic
```

### Scenario 3: Deeply Nested

```
Admin creates: "Projectile Motion"
├─ Subject: Physics
└─ Parent Topic: Kinematics (which has parent: Mechanics)

System traces:
Projectile Motion → parent is → Kinematics → parent is → Mechanics → no parent
All belong to → Physics

System builds:
hierarchyPath = ["subject-physics", "topic-mechanics", "topic-kinematics", "topic-projectile"]
                  ↑                  ↑                   ↑                    ↑
                  Subject            Grandparent         Parent               Current
```

---

## 🎨 UI Display Examples

### When selecting "Kinematics":

**Dropdown shows:**
```
JEE Main 2024  ← (Group label, not in path)
  Physics → Mechanics → Kinematics [medium]
  Physics → Thermodynamics [hard]

NEET 2024  ← (Group label, not in path)
  Biology → Cell Biology [easy]
```

**After selection:**
```
┌────────────────────────────────────┐
│ Physics → Mechanics → Kinematics ▼ │
└────────────────────────────────────┘

Full Hierarchy:
[📖 Physics] → [📝 Mechanics] → [📝 Kinematics]

Belongs to Exam: 📚 JEE Main 2024
```

---

## 💾 Database Structure

### Topics Table
```sql
CREATE TABLE topics (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  subject_id VARCHAR NOT NULL REFERENCES subjects(id),
  parent_topic_id VARCHAR REFERENCES topics(id),
  hierarchy_path TEXT[] NOT NULL,  -- [subjectId, parentSubjectId?, parentTopicId?, topicId]
  order INT NOT NULL,
  difficulty VARCHAR CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Subjects Table (includes chapters)
```sql
CREATE TABLE subjects (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  exam_id VARCHAR NOT NULL REFERENCES exams(id),  -- Links to exam
  parent_subject_id VARCHAR REFERENCES subjects(id),  -- For chapters
  order INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Exams Table (separate)
```sql
CREATE TABLE exams (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  countries TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Querying Examples

### Get all topics for an exam:
```sql
SELECT t.* 
FROM topics t
JOIN subjects s ON t.subject_id = s.id
WHERE s.exam_id = 'exam-jee-2024';
```

### Get full hierarchy for a topic:
```typescript
const topic = await getTopic('topic-kinematics');
// topic.hierarchyPath = ["subject-physics", "topic-mechanics", "topic-kinematics"]

const names = await Promise.all(
  topic.hierarchyPath.map(async id => {
    if (id.startsWith('subject-')) {
      const subject = await getSubject(id);
      return subject.name;
    } else {
      const topic = await getTopic(id);
      return topic.name;
    }
  })
);
// names = ["Physics", "Mechanics", "Kinematics"]
```

---

## ✅ Corrected Benefits

1. **Exam is Separate**: Exam doesn't clutter the hierarchy path
2. **Cleaner Paths**: Only Subject → Chapter → Topic in path
3. **Flexible**: Can change exam without affecting hierarchy
4. **Efficient**: Smaller arrays, faster queries
5. **Clear Separation**: Exam is organizational, hierarchy is structural

---

## 📝 Summary

### What's in Hierarchy Path:
✅ Subject (root)  
✅ Parent Subject (chapter, if exists)  
✅ Parent Topic (if exists)  
✅ Current Topic  

### What's NOT in Hierarchy Path:
❌ Exam (accessed through subject.examId)

### Example Paths:

| Scenario | Hierarchy Path | Display |
|----------|---------------|---------|
| Root topic | `["subject-physics", "topic-mechanics"]` | Physics → Mechanics |
| Nested topic | `["subject-physics", "topic-mechanics", "topic-kinematics"]` | Physics → Mechanics → Kinematics |
| Topic in chapter | `["subject-physics", "subject-modern", "topic-quantum"]` | Physics → Modern Physics → Quantum Mechanics |

---

## 🚀 Updated Code

The following files have been updated:
- ✅ `/src/types/exam.ts` - Updated comment
- ✅ `/src/utils/hierarchy-utils.ts` - Removed exam from path building
- ✅ `/src/components/ui/hierarchy-selector.tsx` - Groups by exam through subject
- ✅ This documentation file

**Next**: Update your backend to build paths without exam ID!
