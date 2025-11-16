import { Topic, Subject, Exam } from "@/src/types/exam";

/**
 * Builds the complete hierarchy path from root (subject) to leaf (topic)
 * Returns array of IDs: [subjectId, parentSubjectId?, parentTopicId?, topicId]
 * Note: Exam is separate and not part of the hierarchy path
 */
export function buildHierarchyPath(
  topicId: string,
  subjectId: string,
  parentTopicId: string | undefined,
  subjects: Subject[],
  topics: Topic[],
  exams: Exam[]
): string[] {
  const path: string[] = [];
  
  // 1. Find the subject
  const subject = subjects.find(s => s.id === subjectId);
  if (!subject) return [topicId]; // Fallback
  
  // 2. Build subject hierarchy (if nested subjects exist)
  const subjectChain = getSubjectChain(subject, subjects);
  path.push(...subjectChain);
  
  // 3. Build topic hierarchy (if nested topics exist)
  if (parentTopicId) {
    const topicChain = getTopicChain(parentTopicId, topics);
    path.push(...topicChain);
  }
  
  // 4. Add the current topic
  path.push(topicId);
  
  return path;
}

/**
 * Gets the chain of subject IDs from root to current subject
 */
function getSubjectChain(subject: Subject, subjects: Subject[]): string[] {
  const chain: string[] = [];
  let current: Subject | undefined = subject;
  
  // Build chain from current to root
  while (current) {
    chain.unshift(current.id);
    current = current.parentSubjectId 
      ? subjects.find(s => s.id === current!.parentSubjectId)
      : undefined;
  }
  
  return chain;
}

/**
 * Gets the chain of topic IDs from root to parent topic
 */
function getTopicChain(parentTopicId: string, topics: Topic[]): string[] {
  const chain: string[] = [];
  let currentId: string | undefined = parentTopicId;
  
  // Build chain from parent to root
  while (currentId) {
    const topic = topics.find(t => t.id === currentId);
    if (!topic) break;
    
    chain.unshift(topic.id);
    currentId = topic.parentTopicId;
  }
  
  return chain;
}

/**
 * Gets human-readable hierarchy path names
 */
export function getHierarchyNames(
  hierarchyPath: string[],
  exams: Exam[],
  subjects: Subject[],
  topics: Topic[]
): string[] {
  return hierarchyPath.map(id => {
    const exam = exams.find(e => e.id === id);
    if (exam) return exam.name;
    
    const subject = subjects.find(s => s.id === id);
    if (subject) return subject.name;
    
    const topic = topics.find(t => t.id === id);
    if (topic) return topic.name;
    
    return 'Unknown';
  });
}

/**
 * Formats hierarchy path as breadcrumb string
 */
export function formatHierarchyPath(
  hierarchyPath: string[],
  exams: Exam[],
  subjects: Subject[],
  topics: Topic[],
  separator: string = ' → '
): string {
  const names = getHierarchyNames(hierarchyPath, exams, subjects, topics);
  return names.join(separator);
}

/**
 * Gets all leaf topics (topics without children)
 */
export function getLeafTopics(topics: Topic[]): Topic[] {
  const parentIds = new Set(topics.map(t => t.parentTopicId).filter(Boolean));
  return topics.filter(t => !parentIds.has(t.id));
}

/**
 * Validates if a hierarchy path is valid
 */
export function validateHierarchyPath(
  hierarchyPath: string[],
  exams: Exam[],
  subjects: Subject[],
  topics: Topic[]
): boolean {
  if (hierarchyPath.length === 0) return false;
  
  // First should be subject (not exam)
  const subjectId = hierarchyPath[0];
  if (!subjects.find(s => s.id === subjectId)) return false;
  
  // Check all IDs exist
  return hierarchyPath.every(id => {
    return subjects.some(s => s.id === id) ||
           topics.some(t => t.id === id);
  });
}

/**
 * Filters topics by exam (through subject relationship)
 */
export function filterTopicsByExam(topics: Topic[], examId: string, subjects: Subject[]): Topic[] {
  const examSubjectIds = subjects.filter(s => s.examId === examId).map(s => s.id);
  return topics.filter(t => examSubjectIds.includes(t.subjectId));
}

/**
 * Filters topics by subject
 */
export function filterTopicsBySubject(topics: Topic[], subjectId: string): Topic[] {
  return topics.filter(t => t.hierarchyPath.includes(subjectId));
}

/**
 * Groups topics by their immediate parent subject
 */
export function groupTopicsBySubject(topics: Topic[]): Map<string, Topic[]> {
  const groups = new Map<string, Topic[]>();
  
  topics.forEach(topic => {
    const subjectId = topic.subjectId;
    if (!groups.has(subjectId)) {
      groups.set(subjectId, []);
    }
    groups.get(subjectId)!.push(topic);
  });
  
  return groups;
}
