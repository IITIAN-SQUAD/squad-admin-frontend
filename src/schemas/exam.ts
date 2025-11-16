import { z } from "zod";

export const examMetadataSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export const examSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Exam name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(500, "Description too long"),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  metadata: z.array(examMetadataSchema).default([]),
});

export const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Subject name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(300, "Description too long"),
  examId: z.string().min(1, "Exam ID is required"),
  parentSubjectId: z.string().optional(),
  order: z.number().min(0, "Order must be positive"),
});

export const topicSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Topic name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(300, "Description too long"),
  subjectId: z.string().min(1, "Subject ID is required"),
  parentTopicId: z.string().optional(),
  hierarchyPath: z.array(z.string()).default([]),
  order: z.number().min(0, "Order must be positive"),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()).default([]),
});

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
  isCorrect: z.boolean().default(false),
});

export const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['single_choice_mcq', 'multiple_choice_mcq', 'integer_based', 'paragraph', 'fill_in_blanks', 'match_following', 'nested_questions']),
  description: z.string().min(1, "Question description is required"),
  htmlContent: z.string().optional(),
  options: z.array(questionOptionSchema).optional(),
  correctAnswers: z.array(z.string()).optional(),
  positiveMarks: z.number().min(0, "Positive marks must be non-negative"),
  negativeMarks: z.number().max(0, "Negative marks must be non-positive"),
  duration: z.number().min(0, "Duration must be positive").optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()).default([]),
  topicId: z.string().optional(),
  sectionId: z.string().optional(),
  parentQuestionId: z.string().optional(),
  integerAnswer: z.number().optional(),
  blanksData: z.object({
    text: z.string(),
    blanks: z.array(z.string())
  }).optional(),
  matchingPairs: z.array(z.object({
    left: z.string(),
    right: z.string()
  })).optional(),
});

export const paperSectionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Section name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required").max(300, "Description too long"),
  paperId: z.string().min(1, "Paper ID is required"),
  parentSectionId: z.string().optional(),
  totalMarks: z.number().min(0, "Total marks must be positive").optional(),
  totalQuestions: z.number().min(0, "Total questions must be positive").optional(),
  duration: z.number().min(0, "Duration must be positive").optional(),
  order: z.number().min(0, "Order must be positive"),
});

export const paperSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Paper name is required").max(100, "Name too long"),
  examId: z.string().min(1, "Exam ID is required"),
  date: z.date(),
  totalQuestions: z.number().min(1, "Must have at least 1 question"),
  totalMarks: z.number().min(1, "Must have at least 1 mark"),
  duration: z.number().min(1, "Duration must be at least 1 second"),
});

export type ExamFormData = z.infer<typeof examSchema>;
export type SubjectFormData = z.infer<typeof subjectSchema>;
export type TopicFormData = z.infer<typeof topicSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type PaperSectionFormData = z.infer<typeof paperSectionSchema>;
export type PaperFormData = z.infer<typeof paperSchema>;
