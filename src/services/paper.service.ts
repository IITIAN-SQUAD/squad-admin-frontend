import apiClient from './api-client';
import { Paper, PaperStatus } from '@/src/types/exam';

interface CreatePaperRequest {
  exam_id: string;
  name: string;
  exam_date: number; // Timestamp in milliseconds
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
}

interface UpdatePaperRequest {
  name?: string;
  exam_date?: number; // Timestamp in milliseconds
  total_questions?: number;
  total_marks?: number;
  duration_minutes?: number;
  status?: PaperStatus;
}

interface PaperResponse {
  id: string;
  exam_id: string;
  exam_name: string;
  name: string;
  exam_date: number; // Timestamp in milliseconds
  total_questions: number;
  total_marks: number;
  duration_minutes: number;
  status: string;
  created_at: number | null;
  updated_at: number | null;
}

class PaperService {
  private readonly BASE_PATH = '/v1/admin/papers';

  /**
   * Transform backend response to frontend Paper type
   */
  private transformToPaper(response: PaperResponse): Paper {
    return {
      id: response.id,
      name: response.name,
      examId: response.exam_id,
      examName: response.exam_name,
      date: new Date(response.exam_date),
      totalQuestions: response.total_questions,
      totalMarks: response.total_marks,
      duration: response.duration_minutes, // Duration in minutes
      status: response.status as PaperStatus,
      sections: [], // Sections are managed separately
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get all papers or filter by exam
   */
  async getAllPapers(examId?: string): Promise<Paper[]> {
    try {
      const url = examId ? `${this.BASE_PATH}?examId=${examId}` : this.BASE_PATH;
      console.log('[PaperService] Fetching papers:', url);
      const response = await apiClient.get<PaperResponse[]>(url);
      console.log('[PaperService] Papers fetched:', response);
      
      return response.map(paper => this.transformToPaper(paper));
    } catch (error: any) {
      console.error('[PaperService] Failed to fetch papers:', error);
      throw new Error(error.message || 'Failed to fetch papers');
    }
  }

  /**
   * Get paper by ID
   */
  async getPaperById(id: string): Promise<Paper> {
    try {
      console.log('[PaperService] Fetching paper:', id);
      const response = await apiClient.get<PaperResponse>(`${this.BASE_PATH}/${id}`);
      console.log('[PaperService] Paper fetched:', response);
      
      return this.transformToPaper(response);
    } catch (error: any) {
      console.error('[PaperService] Failed to fetch paper:', error);
      throw new Error(error.message || 'Failed to fetch paper');
    }
  }

  /**
   * Create new paper
   */
  async createPaper(data: {
    examId: string;
    name: string;
    date: Date;
    totalQuestions: number;
    totalMarks: number;
    duration: number;
  }): Promise<Paper> {
    try {
      const requestData: CreatePaperRequest = {
        exam_id: data.examId,
        name: data.name,
        exam_date: data.date.getTime(), // Convert Date to timestamp in milliseconds
        total_questions: data.totalQuestions,
        total_marks: data.totalMarks,
        duration_minutes: data.duration, // Duration already in minutes
      };
      
      console.log('[PaperService] Creating paper:', requestData);
      const response = await apiClient.post<PaperResponse>(this.BASE_PATH, requestData);
      console.log('[PaperService] Paper created:', response);
      
      return this.transformToPaper(response);
    } catch (error: any) {
      console.error('[PaperService] Failed to create paper:', error);
      throw new Error(error.message || 'Failed to create paper');
    }
  }

  /**
   * Update paper
   */
  async updatePaper(id: string, data: {
    name?: string;
    date?: Date;
    totalQuestions?: number;
    totalMarks?: number;
    duration?: number;
    status?: PaperStatus;
  }): Promise<Paper> {
    try {
      const requestData: UpdatePaperRequest = {};
      
      if (data.name !== undefined) requestData.name = data.name;
      if (data.date !== undefined) requestData.exam_date = data.date.getTime(); // Convert Date to timestamp
      if (data.totalQuestions !== undefined) requestData.total_questions = data.totalQuestions;
      if (data.totalMarks !== undefined) requestData.total_marks = data.totalMarks;
      if (data.duration !== undefined) requestData.duration_minutes = data.duration; // Duration already in minutes
      if (data.status !== undefined) requestData.status = data.status;
      
      console.log('[PaperService] Updating paper:', id, requestData);
      const response = await apiClient.put<PaperResponse>(`${this.BASE_PATH}/${id}`, requestData);
      console.log('[PaperService] Paper updated:', response);
      
      return this.transformToPaper(response);
    } catch (error: any) {
      console.error('[PaperService] Failed to update paper:', error);
      throw new Error(error.message || 'Failed to update paper');
    }
  }

  /**
   * Update paper status
   */
  async updatePaperStatus(id: string, status: PaperStatus): Promise<Paper> {
    return this.updatePaper(id, { status });
  }

  /**
   * Delete paper (soft delete - sets status to ARCHIVED)
   */
  async deletePaper(id: string): Promise<void> {
    try {
      console.log('[PaperService] Deleting paper:', id);
      await apiClient.delete(`${this.BASE_PATH}/${id}`);
      console.log('[PaperService] Paper deleted successfully');
    } catch (error: any) {
      console.error('[PaperService] Failed to delete paper:', error);
      throw new Error(error.message || 'Failed to delete paper');
    }
  }
}

export default new PaperService();
