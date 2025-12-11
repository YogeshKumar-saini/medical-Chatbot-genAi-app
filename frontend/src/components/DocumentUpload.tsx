'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/utils';

interface UploadedDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  chunks?: number;
  error?: string;
}

interface DocumentUploadProps {
  className?: string;
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ className, onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    stage: 'uploading' | 'processing' | 'embedding' | 'completed' | 'error';
    message: string;
    progress: number;
  } | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    await uploadDocument(file);
  };

  const uploadDocument = async (file: File) => {
    setIsUploading(true);
    setUploadProgress({
      stage: 'uploading',
      message: 'Uploading document...',
      progress: 0
    });

    try {
      // Create upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return prev;
          const newProgress = Math.min(prev.progress + 10, 90);
          return { ...prev, progress: newProgress };
        });
      }, 200);

      // Upload the document
      setUploadProgress(prev => prev ? { ...prev, message: 'Uploading to server...', progress: 20 } : null);

      const response = await apiClient.uploadDocument(file, 'DOCTOR');

      clearInterval(progressInterval);

      // Processing stages
      setUploadProgress({
        stage: 'processing',
        message: 'Processing PDF content...',
        progress: 40
      });

      // Simulate processing delay (in real app, this would be server-sent events)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadProgress({
        stage: 'embedding',
        message: 'Generating embeddings...',
        progress: 70
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadProgress({
        stage: 'completed',
        message: 'Document processed successfully!',
        progress: 100
      });

      // Add to uploaded documents list
      const newDoc: UploadedDocument = {
        id: response.doc_id,
        filename: file.name,
        uploadedAt: new Date().toLocaleString(),
        status: 'completed',
        chunks: 0 // Would come from server in real implementation
      };

      setUploadedDocuments(prev => [newDoc, ...prev]);

      // Clear progress after 3 seconds
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 3000);

      onUploadComplete?.();

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadProgress({
        stage: 'error',
        message: error.message || 'Upload failed',
        progress: 0
      });

      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 5000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Medical Documents
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Upload PDF documents to enhance your AI assistant's medical knowledge base.
            Supported formats: PDF (max 50MB)
          </p>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-all",
              isUploading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            )}
          >
            {isUploading ? 'Uploading...' : 'Choose PDF File'}
          </button>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {uploadProgress.message}
                </span>
                <span className="text-sm text-gray-500">
                  {uploadProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    uploadProgress.stage === 'error'
                      ? "bg-red-500"
                      : uploadProgress.stage === 'completed'
                      ? "bg-green-500"
                      : "bg-blue-500"
                  )}
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Uploads
          </h4>
          <div className="space-y-3">
            {uploadedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">
                      {doc.filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {doc.uploadedAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(doc.status)
                  )}>
                    {getStatusIcon(doc.status)}
                    <span className="ml-1 capitalize">{doc.status}</span>
                  </span>
                  {doc.chunks && (
                    <span className="text-xs text-gray-500">
                      {doc.chunks} chunks
                    </span>
                  )}
                  <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h5 className="font-semibold text-blue-900 mb-2">📋 Upload Guidelines</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload medical documents, research papers, or clinical guidelines</li>
          <li>• PDF format only, maximum 50MB file size</li>
          <li>• Documents are processed and embedded for AI reference</li>
          <li>• Processing may take 1-2 minutes for large documents</li>
          <li>• Uploaded documents enhance AI responses for better medical accuracy</li>
        </ul>
      </div>
    </div>
  );
}
