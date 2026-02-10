// User types
export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin' | 'other';

export interface User {
  username: string;
  role: UserRole;
}

// Chat types
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  sources?: string[];
  timestamp: Date;
  answer_type?: 'document_based' | 'general_knowledge';
  isLoading?: boolean;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  type: string;
}

// Document types
export interface DocumentUpload {
  file: File;
  role: UserRole;
  priority?: 'high' | 'medium' | 'low';
}

export interface DocumentUploadResponse {
  message: string;
  doc_id: string;
  accessible_to: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Statistics types
export interface DocumentStats {
  totalDocuments: number;
  chunkCount: number;
  lastUploadDate?: Date;
  roleDistribution: Record<UserRole, number>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface SignupForm {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: any;
  current?: boolean;
  adminOnly?: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}