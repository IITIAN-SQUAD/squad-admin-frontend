import apiClient from './api-client';

// API Types based on backend contract
export type QuestionStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type AnswerType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMERICAL';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface RichContent {
  raw?: string;
  html: string;
  plain_text: string;
}

export interface OptionContent {
  id: string;
  label?: string;
  content: RichContent;
}

export interface QuestionContent {
  question: RichContent;
  hints?: RichContent;
}

export interface AnswerPool {
  options: OptionContent[];
}

export interface AnswerKey {
  correct_option_id?: string;
  correct_option_ids?: string[];
  correct_value?: number;
  tolerance?: number;
  unit?: string | null;
}

export interface Solution {
  explanation: RichContent;
  video_url?: string;
}

export interface Answer {
  pool: AnswerPool | null;
  key: AnswerKey;
  solution?: Solution;
}

export interface QuestionResponse {
  id: string;
  question_id: string;
  type: 'OPTION_BASED' | 'NUMERICAL';
  answer_type: AnswerType;
  status: QuestionStatus;
  difficulty: number;
  difficulty_label: QuestionDifficulty;
  content: QuestionContent;
  answer: Answer;
  positive_marks: number;
  negative_marks: number;
  duration_seconds?: number;
  tags: string[];
  exam_id?: string;
  paper_id?: string;
  subject_id: string;
  chapter_id?: string;
  topic_id?: string;
  year?: number;
  is_previous_year_question: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionRequest {
  answer_type: AnswerType;
  difficulty: number;
  subject_id: string;
  chapter_id?: string;
  topic_id?: string;
  content: QuestionContent;
  answer: Answer;
  positive_marks: number;
  negative_marks: number;
  duration_seconds?: number;
  tags?: string[];
  exam_id?: string;
  paper_id?: string;
  is_previous_year_question?: boolean;
}

export interface UpdateQuestionRequest {
  answer_type?: AnswerType;
  difficulty?: number;
  subject_id?: string;
  chapter_id?: string;
  topic_id?: string;
  content?: QuestionContent;
  answer?: Answer;
  positive_marks?: number;
  negative_marks?: number;
  duration_seconds?: number;
  tags?: string[];
  exam_id?: string;
  paper_id?: string;
  is_previous_year_question?: boolean;
}

export interface SearchQuestionsRequest {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_direction?: 'ASC' | 'DESC';
  search_text?: string;
  statuses?: QuestionStatus[];
  answer_types?: AnswerType[];
  difficulties?: QuestionDifficulty[];
  exam_id?: string;
  paper_id?: string;
  subject_id?: string;
  chapter_id?: string;
  topic_id?: string;
  year?: number;
  is_previous_year_question?: boolean;
  tags?: string[];
}

export interface QuestionStatistics {
  total_questions: number;
  draft_questions: number;
  under_review_questions: number;
  published_questions: number;
  pyq_questions: number;
}

export interface SearchQuestionsResponse {
  questions: QuestionResponse[];
  total_elements: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  statistics: QuestionStatistics;
}

class QuestionService {
  private BASE_PATH = '/v1/admin/questions';

  /**
   * Search questions with filters and pagination
   */
  async searchQuestions(request: SearchQuestionsRequest = {}): Promise<SearchQuestionsResponse> {
    try {
      const response = await apiClient.post<SearchQuestionsResponse>(
        `${this.BASE_PATH}/search`,
        request
      );
      return response;
    } catch (error: any) {
      console.error('[QuestionService] Failed to search questions:', error);
      throw new Error(error.message || 'Failed to search questions');
    }
  }

  /**
   * Create a new question (status: DRAFT)
   */
  async createQuestion(data: CreateQuestionRequest): Promise<QuestionResponse> {
    try {
      const response = await apiClient.post<QuestionResponse>(this.BASE_PATH, data);
      return response;
    } catch (error: any) {
      console.error('[QuestionService] Failed to create question:', error);
      throw new Error(error.message || 'Failed to create question');
    }
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(id: string): Promise<QuestionResponse> {
    try {
      const response = await apiClient.get<QuestionResponse>(`${this.BASE_PATH}/${id}`);
      return response;
    } catch (error: any) {
      console.error('[QuestionService] Failed to get question:', error);
      throw new Error(error.message || 'Failed to get question');
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, data: UpdateQuestionRequest): Promise<QuestionResponse> {
    try {
      const response = await apiClient.put<QuestionResponse>(`${this.BASE_PATH}/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('[QuestionService] Failed to update question:', error);
      throw new Error(error.message || 'Failed to update question');
    }
  }

  /**
   * Delete a question (hard delete)
   */
  async deleteQuestion(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_PATH}/${id}`);
    } catch (error: any) {
      console.error('[QuestionService] Failed to delete question:', error);
      throw new Error(error.message || 'Failed to delete question');
    }
  }
}

const questionService = new QuestionService();
export default questionService;
