import apiClient from './api-client';

export type HierarchyType = 'SUBJECT' | 'CHAPTER' | 'TOPIC';

export interface HierarchyNode {
  id: string;
  type: HierarchyType;
  name: string;
  code?: string | null; // Only for SUBJECT
  parent_id?: string | null;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CreateSubjectRequest {
  type: 'SUBJECT';
  name: string;
  code: string;
  description?: string;
}

interface CreateChapterRequest {
  type: 'CHAPTER';
  name: string;
  parent_id: string;
  description?: string;
}

interface CreateTopicRequest {
  type: 'TOPIC';
  name: string;
  parent_id: string;
  description?: string;
}

type CreateHierarchyRequest = CreateSubjectRequest | CreateChapterRequest | CreateTopicRequest;

interface UpdateHierarchyRequest {
  name?: string;
  description?: string;
}

class HierarchyService {
  private readonly BASE_PATH = '/v1/admin/hierarchy';

  /**
   * Create a new hierarchy node (Subject, Chapter, or Topic)
   */
  async createHierarchy(data: CreateHierarchyRequest): Promise<HierarchyNode> {
    try {
      console.log('[HierarchyService] Creating hierarchy:', data);
      const response = await apiClient.post<HierarchyNode>(this.BASE_PATH, data);
      console.log('[HierarchyService] Hierarchy created:', response);
      return response;
    } catch (error: any) {
      console.error('[HierarchyService] Failed to create hierarchy:', error);
      throw new Error(error.message || 'Failed to create hierarchy');
    }
  }

  /**
   * Update hierarchy node (name and description only)
   */
  async updateHierarchy(id: string, data: UpdateHierarchyRequest): Promise<HierarchyNode> {
    try {
      console.log('[HierarchyService] Updating hierarchy:', id, data);
      const response = await apiClient.put<HierarchyNode>(`${this.BASE_PATH}/${id}`, data);
      console.log('[HierarchyService] Hierarchy updated:', response);
      return response;
    } catch (error: any) {
      console.error('[HierarchyService] Failed to update hierarchy:', error);
      throw new Error(error.message || 'Failed to update hierarchy');
    }
  }

  /**
   * Get single hierarchy node by ID
   */
  async getHierarchyById(id: string): Promise<HierarchyNode> {
    try {
      console.log('[HierarchyService] Fetching hierarchy:', id);
      const response = await apiClient.get<HierarchyNode>(`${this.BASE_PATH}/${id}`);
      console.log('[HierarchyService] Hierarchy fetched:', response);
      return response;
    } catch (error: any) {
      console.error('[HierarchyService] Failed to fetch hierarchy:', error);
      throw new Error(error.message || 'Failed to fetch hierarchy');
    }
  }

  /**
   * Get all subjects (top-level hierarchy nodes)
   */
  async getAllSubjects(): Promise<HierarchyNode[]> {
    try {
      console.log('[HierarchyService] Fetching all subjects');
      const response = await apiClient.get<HierarchyNode[]>(`${this.BASE_PATH}/subjects`);
      console.log('[HierarchyService] Subjects fetched:', response);
      return response;
    } catch (error: any) {
      console.error('[HierarchyService] Failed to fetch subjects:', error);
      throw new Error(error.message || 'Failed to fetch subjects');
    }
  }

  /**
   * Get all chapters under a specific subject
   */
  async getChaptersBySubject(subjectId: string): Promise<HierarchyNode[]> {
    try {
      console.log('[HierarchyService] Fetching chapters for subject:', subjectId);
      const response = await apiClient.get<HierarchyNode[]>(
        `${this.BASE_PATH}/subjects/${subjectId}/chapters`
      );
      console.log('[HierarchyService] Chapters fetched:', response);
      return response;
    } catch (error: any) {
      console.error('[HierarchyService] Failed to fetch chapters:', error);
      throw new Error(error.message || 'Failed to fetch chapters');
    }
  }

  /**
   * Get all topics under a specific chapter
   */
  async getTopicsByChapter(chapterId: string): Promise<HierarchyNode[]> {
    try {
      console.log('[HierarchyService] Fetching topics for chapter:', chapterId);
      const response = await apiClient.get<HierarchyNode[]>(
        `${this.BASE_PATH}/chapters/${chapterId}/topics`
      );
      console.log('[HierarchyService] Topics fetched:', response);
      return response;
    } catch (error: any) {
      console.error('[HierarchyService] Failed to fetch topics:', error);
      throw new Error(error.message || 'Failed to fetch topics');
    }
  }

  /**
   * Delete hierarchy node
   */
  async deleteHierarchy(id: string): Promise<void> {
    try {
      console.log('[HierarchyService] Deleting hierarchy:', id);
      await apiClient.delete(`${this.BASE_PATH}/${id}`);
      console.log('[HierarchyService] Hierarchy deleted successfully');
    } catch (error: any) {
      console.error('[HierarchyService] Failed to delete hierarchy:', error);
      throw new Error(error.message || 'Failed to delete hierarchy');
    }
  }
}

export default new HierarchyService();
