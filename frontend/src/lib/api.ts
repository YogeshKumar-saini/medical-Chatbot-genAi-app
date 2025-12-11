import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface User {
  username: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'GEN_ADMIN' | 'PATIENT' | 'THERAPIST';
}

export interface AuthResponse {
  otp?: any;
  access_token: string;
  token_type: string;
  user?: {
    email: string;
    role: string;
    name?: string;
    id: string;
  };
  // Legacy fields for backward compatibility
  username?: string;
  role?: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  type: 'VIDEO' | 'ARTICLE';
  url: string;
  condition_tags: string[];
  thumbnail_url?: string;
  quiz?: any[]; // Simplified for now
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  sources?: string[];
  timestamp?: string;
  answer_type?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  type: string;
}

export interface DocumentUploadResponse {
  message: string;
  doc_id: string;
  accessible_to: string;
}

export interface SuggestionResponse {
  suggested_queries: string[];
  personalized: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  version: string;
}

class ApiClient {
  public client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log the API URL for debugging
    if (typeof window !== 'undefined') {
      console.log('API Base URL:', this.baseURL);
    }

    // Request interceptor to add auth headers
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');

        if (token && config.url?.includes('/api/v1/')) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth data on unauthorized
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = '/auth/login';
          }
        }

        // Log error for debugging
        if (typeof window !== 'undefined') {
          const errorMessage = error?.response?.data || error?.message || 'Unknown API Error';
          console.error('API Error:', errorMessage);
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.client.post(
        '/api/v1/auth/login',
        { email, password }
      );

      // Store token and user data
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        if (response.data.user) {
          localStorage.setItem('username', response.data.user.email);
          localStorage.setItem('role', response.data.user.role);
          localStorage.setItem('userId', response.data.user.id);
        }
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }

  // Chat methods
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const formData = new FormData();
      formData.append('message', message);

      const response: AxiosResponse<ChatResponse> = await this.client.post(
        '/api/v1/chat/chat',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to send message');
    }
  }

  // Streaming chat method
  async sendMessageStream(
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string, sources: string[]) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('message', message);

      const response = await fetch(`${this.baseURL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        onError(errorText || 'Streaming failed');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('Unable to read response stream');
        return;
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          onChunk(chunk);
        }

        // For streaming, we don't get structured sources, so we'll provide a basic response
        onComplete(fullResponse, ['Real-time Response']);
      } catch (streamError) {
        onError('Stream reading failed');
      }
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Streaming request failed');
    }
  }

  async getSuggestions(): Promise<SuggestionResponse> {
    try {
      const response: AxiosResponse<SuggestionResponse> = await this.client.get(
        '/api/v1/chat/suggestions'
      );
      return response.data;
    } catch {
      // Return empty suggestions on error
      return { suggested_queries: [], personalized: false };
    }
  }

  async getChatHistory(limit: number = 50): Promise<{ messages: ChatMessage[] }> {
    try {
      const response = await this.client.get(`/api/v1/chat/history?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.warn("Failed to fetch chat history:", error.message);
      return { messages: [] };
    }
  }

  async clearChatHistory(): Promise<{ message: string }> {
    const response = await this.client.delete('/api/v1/chat/history');
    return response.data;
  }

  async clearConversationMemory(): Promise<{ message: string }> {
    const response = await this.client.delete('/api/v1/chat/memory');
    return response.data;
  }

  async getFollowupSuggestions(): Promise<{ suggestions: string[]; contextual: boolean }> {
    try {
      const response = await this.client.get('/api/v1/chat/followup');
      return response.data;
    } catch {
      return { suggestions: [], contextual: false };
    }
  }

  // Document methods
  async uploadDocument(
    file: File,
    role: string
  ): Promise<DocumentUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', role);

      const response: AxiosResponse<DocumentUploadResponse> = await this.client.post(
        '/api/v1/docs/upload_docs',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds for file upload
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Document upload failed');
    }
  }

  async analyzeImage(
    file: File,
    prompt: string
  ): Promise<{ analysis: string; type: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);

      const response = await this.client.post(
        '/api/v1/chat/analyze',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Image analysis failed');
    }
  }

  // Voice methods
  async transcribeAudio(file: File): Promise<{ text: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.client.post(
        '/api/v1/voice/transcribe',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Transcription failed');
    }
  }

  async textToSpeech(text: string): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append('text', text);

      const response = await this.client.post(
        '/api/v1/voice/speak',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'TTS failed');
    }
  }

  // Analytics
  async getSystemStats(): Promise<any> {
    try {
      const response = await this.client.get('/api/v1/analytics/stats');
      return response.data;
    } catch (error) {
      console.error("Failed to fetch stats", error);
      return null;
    }
  }

  async getAnalyticsLogs(limit: number = 50): Promise<any> {
    // Pointing to Admin System Logs for real data instead of mock analytics logs
    const response = await this.client.get(`/api/v1/admin/logs/system?limit=${limit}`);
    // The Dashboard expects { logs: [] } format or array.
    // The admin endpoint returns Array directly.
    // Let's ensure we match what the component expects (useEffect setLogs(logsData.logs || []))
    // To support the component, we'll wrap it if it returns array.
    if (Array.isArray(response.data)) {
      return { logs: response.data };
    }
    return response.data;
  }

  async createAdminUser(userData: any): Promise<any> {
    const response = await this.client.post('/api/v1/admin/users', userData);
    return response.data;
  }

  async updateAdminUserDetails(userId: string, data: any): Promise<any> {
    const response = await this.client.put(`/api/v1/admin/users/${userId}`, data);
    return response.data;
  }

  async getClinicalSummary(patientId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/analytics/clinical/summary/${patientId}`);
    return response.data;
  }

  async getPopulationTrends(): Promise<any> {
    const response = await this.client.get('/api/v1/analytics/clinical/trends');
    return response.data;
  }

  async analyzeRisk(data: { patient_id: string; messages: string[] }): Promise<any> {
    const response = await this.client.post('/api/v1/analytics/clinical/analyze-risk', data);
    return response.data;
  }

  // Onboarding
  async createOrganization(data: { name: string; slug: string; description?: string }): Promise<any> {
    const response = await this.client.post('/api/v1/onboarding/organizations', data);
    return response.data;
  }

  async getOrganizations(): Promise<any> {
    const response = await this.client.get('/api/v1/onboarding/organizations');
    return response.data;
  }

  async createDoctorProfile(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/onboarding/doctor/profile', data);
    return response.data;
  }

  async createPatientProfile(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/onboarding/patient/profile', data);
    return response.data;
  }

  async requestDoctorPatientLink(data: any): Promise<any> {
    const response = await this.client.post('/api/v1/onboarding/links/request', data);
    return response.data;
  }

  async getDoctorLinks(): Promise<any> {
    const response = await this.client.get('/api/v1/onboarding/doctor/links');
    return response.data;
  }

  async updateLinkStatus(linkId: string, status: string): Promise<any> {
    const response = await this.client.put(`/api/v1/onboarding/links/${linkId}/status?status=${status}`);
    return response.data;
  }

  async getOnboardingStatus(): Promise<any> {
    const response = await this.client.get('/api/v1/onboarding/status');
    return response.data;
  }

  // Hierarchy / Verification
  async verifyOrganization(orgId: string, verified: boolean): Promise<any> {
    const response = await this.client.put(`/api/v1/onboarding/admin/organizations/${orgId}/verify?verified=${verified}`);
    return response.data;
  }

  async getOrgDoctorRequests(): Promise<any> {
    const response = await this.client.get('/api/v1/onboarding/org/doctor-requests');
    return response.data;
  }

  async updateDoctorRequestStatus(doctorId: string, approved: boolean): Promise<any> {
    const response = await this.client.put(`/api/v1/onboarding/org/doctor-requests/${doctorId}/status?approved=${approved}`);
    return response.data;
  }

  async getOrgDoctors(orgId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/onboarding/organizations/${orgId}/doctors`);
    return response.data;
  }

  // Appointments
  async createAppointmentSlot(data: { start_time: string; end_time: string; is_available: boolean }): Promise<any> {
    const response = await this.client.post('/api/v1/appointments/slots', data);
    return response.data;
  }

  async bookAppointment(data: { slot_id: string; reason: string; notes?: string }): Promise<any> {
    const response = await this.client.post('/api/v1/appointments', data);
    return response.data;
  }

  async getAppointmentSlots(doctorId?: string): Promise<any> {
    const url = doctorId ? `/api/v1/appointments/slots?doctor_id=${doctorId}` : '/api/v1/appointments/slots';
    const response = await this.client.get(url);
    return response.data;
  }

  async signup(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/signup', userData);
    return response.data;
  }

  async verifyEmail(email: string, otp: string): Promise<any> {
    const response = await this.client.post('/api/v1/auth/verify-email', { email, otp });
    return response.data;
  }

  async getAppointments(role?: string): Promise<any> {
    const url = role ? `/api/v1/appointments?role=${role}` : '/api/v1/appointments';
    const response = await this.client.get(url);
    return response.data;
  }

  async updateAppointment(appointmentId: string, data: { status?: string; notes?: string }): Promise<any> {
    const response = await this.client.put(`/api/v1/appointments/${appointmentId}`, data);
    return response.data;
  }

  async joinAppointment(appointmentId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/appointments/${appointmentId}/join`);
    return response.data;
  }

  async createPrescription(appointmentId: string, data: { medications: any[]; instructions?: string }): Promise<any> {
    const response = await this.client.post(`/api/v1/appointments/${appointmentId}/prescribe`, data);
    return response.data;
  }

  async getPrescriptions(appointmentId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/appointments/${appointmentId}/prescriptions`);
    return response.data;
  }

  // Library
  async getLibraryResources(params?: { tag?: string; type?: string }): Promise<LibraryResource[]> {
    let url = '/api/v1/library/content';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.tag) queryParams.append('tag', params.tag);
      if (params.type) queryParams.append('type', params.type);
      url += `?${queryParams.toString()}`;
    }
    const response = await this.client.get<LibraryResource[]>(url);
    return response.data;
  }

  async createLibraryResource(data: Omit<LibraryResource, 'id'>) {
    const response = await this.client.post<LibraryResource>('/api/v1/library/content', data);
    return response.data;
  }

  async updateLibraryResource(resourceId: string, data: Partial<LibraryResource>) {
    // Note: Backend might not support PUT for content yet based on routes.py.
    // defaulting to content endpoint if supported, else likely 405.
    // Given routes.py, only GET and POST are defined for /content.
    // I will update the path anyway to match the pattern.
    const response = await this.client.put<LibraryResource>(`/api/v1/library/content/${resourceId}`, data);
    return response.data;
  }

  async deleteLibraryResource(resourceId: string) {
    // Similarly, DELETE is not in routes.py
    const response = await this.client.delete(`/api/v1/library/content/${resourceId}`);
    return response.data;
  }

  async getQuizzes(): Promise<any> {
    const response = await this.client.get('/api/v1/library/quizzes');
    return response.data;
  }

  async submitQuiz(quizId: string, answers: any[]): Promise<any> {
    const response = await this.client.post(`/api/v1/library/quizzes/${quizId}/submit`, { answers });
    return response.data;
  }


  // ===== GROUP CHAT API METHODS =====

  // Groups
  async getGroups(): Promise<any> {
    const response = await this.client.get('/api/v1/groups');
    return response.data;
  }

  async getGroupDetails(groupId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/groups/${groupId}`);
    return response.data;
  }

  async createGroup(data: { name: string; description?: string; member_ids?: string[] }): Promise<any> {
    const response = await this.client.post('/api/v1/groups', data);
    return response.data;
  }

  async updateGroupSettings(groupId: string, settings: any): Promise<any> {
    const response = await this.client.put(`/api/v1/groups/${groupId}/settings`, settings);
    return response.data;
  }

  async deleteGroup(groupId: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/groups/${groupId}`);
    return response.data;
  }

  // Members
  async getGroupMembers(groupId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/groups/${groupId}/members`);
    return response.data;
  }

  async addGroupMember(groupId: string, userId: string): Promise<any> {
    const response = await this.client.post(`/api/v1/groups/${groupId}/members/${userId}`);
    return response.data;
  }

  async removeGroupMember(groupId: string, userId: string, reason: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/groups/${groupId}/members/${userId}?reason=${reason}`);
    return response.data;
  }

  // Moderation
  async banMember(groupId: string, userId: string, data: { reason: string; duration_hours?: number }): Promise<any> {
    const response = await this.client.put(`/api/v1/groups/${groupId}/members/${userId}/ban`, data);
    return response.data;
  }

  async unbanMember(groupId: string, userId: string): Promise<any> {
    const response = await this.client.put(`/api/v1/groups/${groupId}/members/${userId}/unban`);
    return response.data;
  }

  async getModerationLogs(groupId: string, limit: number = 50): Promise<any> {
    const response = await this.client.get(`/api/v1/groups/${groupId}/moderation-logs?limit=${limit}`);
    return response.data;
  }

  // Messages
  async getGroupMessages(groupId: string, page: number = 1, limit: number = 50): Promise<any> {
    const response = await this.client.get(`/api/v1/groups/${groupId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  }

  async sendGroupMessage(groupId: string, data: { content: string; type: string; media_urls?: string[]; reply_to?: string }): Promise<any> {
    const response = await this.client.post(`/api/v1/groups/${groupId}/messages`, data);
    return response.data;
  }

  async deleteGroupMessage(groupId: string, messageId: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/groups/${groupId}/messages/${messageId}`);
    return response.data;
  }

  async editGroupMessage(groupId: string, messageId: string, content: string): Promise<any> {
    const response = await this.client.put(`/api/v1/groups/${groupId}/messages/${messageId}?content=${encodeURIComponent(content)}`);
    return response.data;
  }

  async addReaction(groupId: string, messageId: string, emoji: string): Promise<any> {
    const response = await this.client.post(`/api/v1/groups/${groupId}/messages/${messageId}/react?emoji=${encodeURIComponent(emoji)}`);
    return response.data;
  }

  async removeReaction(groupId: string, messageId: string, emoji: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/groups/${groupId}/messages/${messageId}/react?emoji=${encodeURIComponent(emoji)}`);
    return response.data;
  }

  // Media
  async uploadMedia(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/api/v1/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000
    });
    return response.data;
  }

  async deleteMedia(fileType: string, filename: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/media/${fileType}/${filename}`);
    return response.data;
  }

  async getMediaGallery(groupId: string, mediaType?: string): Promise<any> {
    const url = mediaType
      ? `/api/v1/media/groups/${groupId}/gallery?media_type=${mediaType}`
      : `/api/v1/media/groups/${groupId}/gallery`;
    const response = await this.client.get(url);
    return response.data;
  }

  // Profiles
  async getProfile(userId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/profiles/${userId}`);
    return response.data;
  }

  async updateProfile(data: { bio?: string; status_text?: string; privacy?: any }): Promise<any> {
    const response = await this.client.put('/api/v1/profiles/me', data);
    return response.data;
  }

  async uploadAvatar(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/api/v1/profiles/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async followUser(userId: string): Promise<any> {
    const response = await this.client.post(`/api/v1/profiles/${userId}/follow`);
    return response.data;
  }

  async unfollowUser(userId: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/profiles/${userId}/follow`);
    return response.data;
  }

  async getFollowers(userId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/profiles/${userId}/followers`);
    return response.data;
  }

  async getFollowing(userId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/profiles/${userId}/following`);
    return response.data;
  }

  // Stories
  async getStories(): Promise<any> {
    const response = await this.client.get('/api/v1/stories');
    return response.data;
  }

  async getUserStories(userId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/stories/${userId}`);
    return response.data;
  }

  async createStory(data: { media_url: string; media_type: string; caption?: string }): Promise<any> {
    const response = await this.client.post('/api/v1/stories', data);
    return response.data;
  }

  async viewStory(storyId: string): Promise<any> {
    const response = await this.client.post(`/api/v1/stories/${storyId}/view`);
    return response.data;
  }

  async deleteStory(storyId: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/stories/${storyId}`);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response: AxiosResponse<HealthResponse> = await this.client.get('/health');
      return response.data;
    } catch {
      throw new Error('Health check failed');
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role') as User['role'];

    if (username && role) {
      return { username, role };
    }
    return null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '/auth/login';
  }

  // Stories
  async likeStory(storyId: string): Promise<any> {
    const response = await this.client.post(`/api/v1/stories/${storyId}/like`);
    return response.data;
  }

  // Clinical Features
  async createClinicalNote(data: { patient_id: string; content: string; note_type?: string; is_private?: boolean }): Promise<any> {
    const response = await this.client.post('/api/v1/clinical/notes', data);
    return response.data;
  }

  async getClinicalNotes(patientId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/clinical/notes/${patientId}`);
    return response.data;
  }

  async createRx(data: { patient_id: string; items: any[]; notes?: string }): Promise<any> {
    const response = await this.client.post('/api/v1/clinical/prescriptions', data);
    return response.data;
  }

  async getRx(patientId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/clinical/prescriptions/${patientId}`);
    return response.data;
  }

  async getPatientDetails(patientId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/clinical/patients/${patientId}`);
    return response.data;
  }

  // Admin Methods
  async getAdminUsers(params?: { skip?: number; limit?: number; role?: string; search?: string }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.skip) query.append('skip', params.skip.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.role && params.role !== 'ALL') query.append('role', params.role);
    if (params?.search) query.append('search', params.search);

    const response = await this.client.get(`/api/v1/admin/users?${query.toString()}`);
    return response.data;
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    const response = await this.client.put(`/api/v1/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async deleteUser(userId: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/admin/users/${userId}`);
    return response.data;
  }

  async deleteOrganization(orgId: string): Promise<any> {
    const response = await this.client.delete(`/api/v1/admin/organizations/${orgId}`);
    return response.data;
  }

  async getOrganizationDetails(orgId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/admin/organizations/${orgId}/details`);
    return response.data;
  }

  async getOrganizationMembers(orgId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/admin/organizations/${orgId}/members`);
    return response.data;
  }

  async getAdminDoctorDetails(doctorId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/admin/doctors/${doctorId}`);
    return response.data;
  }

  async getAdminUserDetails(userId: string): Promise<any> {
    const response = await this.client.get(`/api/v1/admin/users/${userId}`);
    return response.data;
  }

  // Delete Request Workflow (Org Admin)
  async getDeleteRequests(): Promise<any> {
    const response = await this.client.get('/api/v1/admin/requests/delete');
    return response.data;
  }

  async approveDeleteRequest(requestId: string): Promise<any> {
    const response = await this.client.post(`/api/v1/admin/requests/delete/${requestId}/approve`);
    return response.data;
  }

  async rejectDeleteRequest(requestId: string): Promise<any> {
    const response = await this.client.post(`/api/v1/admin/requests/delete/${requestId}/reject`);
    return response.data;
  }

  async transferOrgOwnership(orgId: string, newAdminId: string): Promise<any> {
    const response = await this.client.put(`/api/v1/admin/organizations/${orgId}/transfer-ownership`, { new_admin_id: newAdminId });
    return response.data;
  }

  async updateOrganization(data: any): Promise<any> {
    const response = await this.client.put('/api/v1/onboarding/organizations/me', data);
    return response.data;
  }

  async inviteMember(email: string, role: string): Promise<any> {
    const response = await this.client.post('/api/v1/onboarding/org/invite', { email, role });
    return response.data;
  }

  async lookupUser(email: string): Promise<any> {
    const response = await this.client.get(`/api/v1/admin/users/lookup?email=${encodeURIComponent(email)}`);
    return response.data;
  }

  async getSystemLogs(limit: number = 50): Promise<any> {
    // Ensure endpoint matches backend `admin/routes.py`
    const response = await this.client.get(`/api/v1/admin/logs/system?limit=${limit}`);
    return response.data;
  }

  async getMyOrganization(): Promise<any> {
    const response = await this.client.get('/api/v1/onboarding/organizations/me');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
