export interface ExamMetadata {
  key: string;
  value: string;
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  countries: string[];
  metadata: ExamMetadata[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionGuidelines {
  id: string;
  instructions: string;
  markingScheme?: string;
  specialInstructions?: string;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  maxMarks: number;
  timeLimit?: number; // in minutes
  questions: Question[];
  guidelines?: SectionGuidelines;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  examId: string;
  parentSubjectId?: string; // For nested subjects
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  subjectId: string;
  parentTopicId?: string; // For nested topics
  hierarchyPath: string[]; // Array of IDs from root to this node [subjectId, parentSubjectId?, parentTopicId?, topicId]
  order: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  label: string; // A, B, C, D or 1, 2, 3, 4
  value: string;
  content?: RichContent; // Rich content for complex options
  isCorrect: boolean;
}

export type QuestionType = 
  | "single_choice_mcq"
  | "multiple_choice_mcq" 
  | "integer_based"
  | "paragraph"
  | "fill_in_blanks"
  | "match_following"
  | "nested_questions";

// Rich content support
export interface RichContent {
  raw: string;        // Original input (JSON from TipTap editor)
  html: string;       // Rendered HTML for display
  plainText: string;  // Plain text for search/indexing
  assets: string[];   // Referenced asset IDs (images, files)
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  createdAt: Date;
}

export interface QuestionContent {
  question?: RichContent;
  hints?: RichContent;
  solution?: RichContent;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: QuestionContent;
  // Legacy fields for backward compatibility
  description: string;
  htmlContent?: string;
  // Question-specific data
  options: QuestionOption[];
  correctAnswers: string[];
  positiveMarks: number;
  negativeMarks: number;
  duration?: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  sectionId?: string; // Made optional for standalone questions
  
  // Paper association (for standalone question onboarding)
  examId?: string;
  paperId?: string;
  examDate?: Date; // Denormalized from paper for query performance
  isPreviousYearQuestion?: boolean;
  status?: "draft" | "published";
  
  // Nested questions support
  parentQuestionId?: string;
  subQuestions?: Question[];
  
  // Type-specific data
  integerAnswer?: number;
  blanksData?: { text: string; blanks: string[] };
  matchingPairs?: { left: string; right: string }[];
  
  // Media assets
  assets: MediaAsset[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PaperSection {
  id: string;
  name: string;
  description?: string; // Made optional as requested
  paperId: string;
  parentSectionId?: string; // For nested sections
  totalMarks: number;
  totalQuestions: number;
  duration?: number; // in seconds
  order: number;
  questions: Question[];
  guidelines?: SectionGuidelines; // Added guidelines support
  createdAt: Date;
  updatedAt: Date;
}

export interface Paper {
  id: string;
  name: string;
  examId: string;
  date: Date;
  totalQuestions: number;
  totalMarks: number;
  duration: number; // in seconds
  sections: PaperSection[];
  createdAt: Date;
  updatedAt: Date;
}

// Hierarchical tree structures for UI
export interface ExamHierarchy {
  exam: Exam;
  subjects: SubjectHierarchy[];
}

export interface SubjectHierarchy {
  subject: Subject;
  children: SubjectHierarchy[];
  topics: TopicHierarchy[];
}

export interface TopicHierarchy {
  topic: Topic;
  children: TopicHierarchy[];
  questionCount: number;
}
