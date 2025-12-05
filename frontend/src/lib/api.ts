import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface User {
  username: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin' | 'other';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  username: string;
  role: string;
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
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
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
          console.error('API Error:', error.response?.data || error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // Create a separate client instance for login to avoid interceptor interference
      const loginClient = axios.create({
        baseURL: this.baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response: AxiosResponse<AuthResponse> = await loginClient.post(
        '/api/v1/auth/login',
        formData
      );

      // Store token
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('role', response.data.role);
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  }

  async signup(userData: {
    username: string;
    password: string;
    role: string;
  }): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.client.post(
        '/api/v1/auth/signup',
        userData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Signup failed');
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
    } catch (error) {
      return { messages: [] };
    }
  }

  async clearChatHistory(): Promise<{ message: string }> {
    const response = await this.client.delete('/api/v1/chat/history');
    return response.data;
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
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
