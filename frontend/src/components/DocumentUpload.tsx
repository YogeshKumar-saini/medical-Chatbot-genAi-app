'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn, formatFileSize } from '@/utils';
import type { UserRole } from '@/types';

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'doctor', label: 'Doctor', description: 'Medical professionals and specialists' },
  { value: 'nurse', label: 'Nurse', description: 'Nursing staff and healthcare providers' },
  { value: 'patient', label: 'Patient', description: 'Patients and general users' },
  { value: 'admin', label: 'Admin', description: 'System administrators' },
  { value: 'other', label: 'Other', description: 'Other healthcare roles' },
];

interface UploadResult {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

export default function DocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes('pdf')) {
        setError('Please select a PDF file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');

    const result: UploadResult = {
      file: selectedFile,
      status: 'uploading',
      progress: 0,
    };
    setUploadResult(result);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadResult(prev => prev ? {
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        } : null);
      }, 200);

      const uploadResponse = await apiClient.uploadDocument(selectedFile, selectedRole);

      clearInterval(progressInterval);
      setUploadResult({
        file: selectedFile,
        status: 'success',
        progress: 100,
        result: uploadResponse,
      });

      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploadResult(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

    } catch (err: any) {
      setUploadResult({
        file: selectedFile,
        status: 'error',
        progress: 0,
        error: err.message || 'Upload failed',
      });
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Document Upload Hub</h2>
          <p className="text-gray-600 mt-1">
            Upload medical documents for AI-powered analysis and role-based access
          </p>
        </div>

        {/* File Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select PDF Document
          </label>

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your PDF here or click to browse
              </p>
              <p className="text-sm text-gray-600">
                Supports PDF files up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Access Control - Select Target Role
          </label>
          <div className="grid grid-cols-1 gap-3">
            {roles.map((role) => (
              <label
                key={role.value}
                className={cn(
                  "flex items-center p-4 border rounded-lg cursor-pointer transition-colors",
                  selectedRole === role.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{role.label}</div>
                  <div className="text-sm text-gray-600">{role.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Priority Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Document Priority
          </label>
          <div className="flex space-x-3">
            {(['high', 'medium', 'low'] as const).map((p) => (
              <label
                key={p}
                className={cn(
                  "flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors capitalize",
                  priority === p
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="sr-only"
                />
                {p}
              </label>
            ))}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadResult && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {uploadResult.file.name}
                </span>
                <span className="text-sm text-gray-600">
                  {uploadResult.progress}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    uploadResult.status === 'success' ? "bg-green-500" :
                    uploadResult.status === 'error' ? "bg-red-500" : "bg-blue-500"
                  )}
                  style={{ width: `${uploadResult.progress}%` }}
                ></div>
              </div>

              <div className="flex items-center space-x-2">
                {uploadResult.status === 'uploading' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600">Processing document...</span>
                  </>
                )}
                {uploadResult.status === 'success' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Upload successful!</span>
                  </>
                )}
                {uploadResult.status === 'error' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">{uploadResult.error}</span>
                  </>
                )}
              </div>

              {uploadResult.status === 'success' && uploadResult.result && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <div className="text-sm text-green-800">
                    <strong>Document ID:</strong> {uploadResult.result.doc_id}
                  </div>
                  <div className="text-sm text-green-800">
                    <strong>Accessible to:</strong> {uploadResult.result.accessible_to}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !uploadResult?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={cn(
            "w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors",
            !selectedFile || isUploading
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Document
            </>
          )}
        </button>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Upload Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Only PDF files are supported</li>
                <li>Maximum file size: 10MB</li>
                <li>Documents will be processed for AI analysis</li>
                <li>Access is restricted based on selected role</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}