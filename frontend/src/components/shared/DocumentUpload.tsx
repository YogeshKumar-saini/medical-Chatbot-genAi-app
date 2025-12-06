'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
    onUpload?: (files: File[]) => void;
    acceptedTypes?: string[];
    maxSize?: number;
}

export function DocumentUpload({ onUpload, acceptedTypes = ['.pdf', '.doc', '.docx'], maxSize = 10485760 }: DocumentUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxSize,
    });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        setUploading(true);
        try {
            if (onUpload) {
                await onUpload(files);
            }
            toast.success('Files uploaded successfully!');
            setFiles([]);
        } catch (error) {
            toast.error('Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-600'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        {isDragActive ? (
                            <p className="text-blue-600 dark:text-blue-400">Drop files here...</p>
                        ) : (
                            <div>
                                <p className="text-gray-900 dark:text-white font-medium">Drag & drop files here</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or click to browse</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    Accepted: {acceptedTypes.join(', ')} • Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
                                </p>
                            </div>
                        )}
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">Selected Files ({files.length})</h4>
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="ml-3 text-red-600 hover:text-red-700"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleUpload}
                        isLoading={uploading}
                        disabled={files.length === 0}
                    >
                        Upload {files.length > 0 && `(${files.length})`}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
