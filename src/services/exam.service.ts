import apiClient from './api-client';
import { Exam, ExamMetadata, ExamStatus, SubjectInfo } from '@/src/types/exam';

interface CreateExamRequest {
  name: string;
  description: string;
  countries: string[];
  subject_ids: string[];
  metadata?: Record<string, any>;
}

interface UpdateExamRequest {
  name?: string;
  description?: string;
  countries?: string[];
  subject_ids?: string[];
  metadata?: Record<string, any>;
  status?: ExamStatus;
}

interface ExamResponse {
  id: string;
  name: string;
  description: string;
  countries: string[];
  subject_ids?: string[];
  subjects?: SubjectInfo[];
  metadata?: Record<string, any>;
  status: string;
  created_at: number;
  updated_at: number;
}

class ExamService {
  private readonly BASE_PATH = '/v1/admin/exams';

  /**
   * Convert backend metadata object to frontend array format
   */
  private transformMetadataToArray(metadata?: Record<string, any>): ExamMetadata[] {
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  /**
   * Convert frontend metadata array to backend object format
   */
  private transformMetadataToObject(metadata?: ExamMetadata[]): Record<string, any> {
    if (!metadata || metadata.length === 0) return {};
    return metadata.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Get all exams
   */
  async getAllExams(): Promise<Exam[]> {
    try {
      console.log('[ExamService] Fetching all exams...');
      const response = await apiClient.get<ExamResponse[]>(this.BASE_PATH);
      console.log('[ExamService] Exams fetched:', response);
      
      // Transform response to match frontend Exam type
      return response.map(exam => ({
        id: exam.id,
        name: exam.name,
        description: exam.description,
        countries: exam.countries,
        subject_ids: exam.subject_ids,
        subjects: exam.subjects,
        status: exam.status as ExamStatus,
        createdAt: new Date(exam.created_at),
        updatedAt: new Date(exam.updated_at),
        metadata: this.transformMetadataToArray(exam.metadata),
      }));
    } catch (error: any) {
      console.error('[ExamService] Failed to fetch exams:', error);
      throw new Error(error.message || 'Failed to fetch exams');
    }
  }

  /**
   * Get exam by ID
   */
  async getExamById(id: string): Promise<Exam> {
    try {
      console.log('[ExamService] Fetching exam:', id);
      const response = await apiClient.get<ExamResponse>(`${this.BASE_PATH}/${id}`);
      console.log('[ExamService] Exam fetched:', response);
      
      return {
        id: response.id,
        name: response.name,
        description: response.description,
        countries: response.countries,
        subject_ids: response.subject_ids,
        subjects: response.subjects,
        status: response.status as ExamStatus,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at),
        metadata: this.transformMetadataToArray(response.metadata),
      };
    } catch (error: any) {
      console.error('[ExamService] Failed to fetch exam:', error);
      throw new Error(error.message || 'Failed to fetch exam');
    }
  }

  /**
   * Create new exam
   */
  async createExam(data: { name: string; description: string; countries: string[]; subject_ids?: string[]; metadata?: ExamMetadata[] }): Promise<Exam> {
    try {
      const requestData: CreateExamRequest = {
        name: data.name,
        description: data.description,
        countries: data.countries,
        subject_ids: data.subject_ids || [],
        metadata: this.transformMetadataToObject(data.metadata),
      };
      
      console.log('[ExamService] Creating exam:', requestData);
      const response = await apiClient.post<ExamResponse>(this.BASE_PATH, requestData);
      console.log('[ExamService] Exam created:', response);
      
      return {
        id: response.id,
        name: response.name,
        description: response.description,
        countries: response.countries,
        subject_ids: response.subject_ids,
        subjects: response.subjects,
        status: response.status as ExamStatus,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at),
        metadata: this.transformMetadataToArray(response.metadata),
      };
    } catch (error: any) {
      console.error('[ExamService] Failed to create exam:', error);
      throw new Error(error.message || 'Failed to create exam');
    }
  }

  /**
   * Update exam
   */
  async updateExam(id: string, data: { name?: string; description?: string; countries?: string[]; subject_ids?: string[]; status?: ExamStatus; metadata?: ExamMetadata[] }): Promise<Exam> {
    try {
      const requestData: UpdateExamRequest = {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.countries && { countries: data.countries }),
        ...(data.subject_ids && { subject_ids: data.subject_ids }),
        ...(data.status && { status: data.status }),
        ...(data.metadata && { metadata: this.transformMetadataToObject(data.metadata) }),
      };
      
      console.log('[ExamService] Updating exam:', id, requestData);
      const response = await apiClient.put<ExamResponse>(`${this.BASE_PATH}/${id}`, requestData);
      console.log('[ExamService] Exam updated:', response);
      
      return {
        id: response.id,
        name: response.name,
        description: response.description,
        countries: response.countries,
        subject_ids: response.subject_ids,
        subjects: response.subjects,
        status: response.status as ExamStatus,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at),
        metadata: this.transformMetadataToArray(response.metadata),
      };
    } catch (error: any) {
      console.error('[ExamService] Failed to update exam:', error);
      throw new Error(error.message || 'Failed to update exam');
    }
  }

  /**
   * Update exam status
   */
  async updateExamStatus(id: string, status: ExamStatus): Promise<Exam> {
    return this.updateExam(id, { status });
  }

  /**
   * Delete exam
   */
  async deleteExam(id: string): Promise<void> {
    try {
      console.log('[ExamService] Deleting exam:', id);
      await apiClient.delete(`${this.BASE_PATH}/${id}`);
      console.log('[ExamService] Exam deleted successfully');
    } catch (error: any) {
      console.error('[ExamService] Failed to delete exam:', error);
      throw new Error(error.message || 'Failed to delete exam');
    }
  }
}

export default new ExamService();
