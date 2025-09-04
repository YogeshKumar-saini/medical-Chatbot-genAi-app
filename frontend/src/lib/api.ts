import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface User {
  username: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin' | 'other';
}

export interface AuthResponse {
  message: string;
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
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://medical-chatbot-genai-app.onrender.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth headers
    this.client.interceptors.request.use(
      (config) => {
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');

        if (username && password && config.url?.includes('/api/v1/')) {
          config.auth = {
            username,
            password,
          };
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
          localStorage.removeItem('username');
          localStorage.removeItem('password');
          localStorage.removeItem('role');
          window.location.href = '/auth/login';
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
          'Content-Type': 'application/json',
        },
      });

      const response: AxiosResponse<AuthResponse> = await loginClient.post(
        '/api/v1/auth/login',
        {},
        {
          auth: {
            username,
            password,
          },
        }
      );
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
    return !!(
      localStorage.getItem('username') &&
      localStorage.getItem('password') &&
      localStorage.getItem('role')
    );
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
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('role');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;