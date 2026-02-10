'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    DocumentTextIcon,
    CloudArrowUpIcon,
    DocumentIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import DocumentUpload from '@/components/DocumentUpload';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api';

interface UploadedDocument {
  id: string;
  filename: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  chunks?: number;
  size?: string;
  pages?: number;
}

export default function DocumentsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (user?.role !== 'THERAPIST') {
            router.push('/dashboard');
            return;
        }

        loadDocuments();
    }, [isAuthenticated, user, router]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            // In a real implementation, you'd have an API to fetch user's uploaded documents
            // For now, we'll simulate some sample documents
            const sampleDocuments: UploadedDocument[] = [
                {
                    id: '1',
                    filename: 'diabetes_management_guide.pdf',
                    uploadedAt: new Date(Date.now() - 86400000).toLocaleString(),
                    status: 'completed',
                    chunks: 45,
                    size: '2.3 MB',
                    pages: 24
                },
                {
                    id: '2',
                    filename: 'hypertension_protocols.pdf',
                    uploadedAt: new Date(Date.now() - 172800000).toLocaleString(),
                    status: 'completed',
                    chunks: 67,
                    size: '3.8 MB',
                    pages: 35
                },
                {
                    id: '3',
                    filename: 'mental_health_guidelines.pdf',
                    uploadedAt: new Date(Date.now() - 3600000).toLocaleString(),
                    status: 'processing',
                    chunks: 0,
                    size: '1.2 MB',
                    pages: 15
                }
            ];

            setDocuments(sampleDocuments);
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <DocumentIcon className="h-4 w-4" />;
            case 'processing':
                return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
            case 'failed':
                return <TrashIcon className="h-4 w-4" />;
            default:
                return <DocumentTextIcon className="h-4 w-4" />;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex h-full">
                {/* Professional Medical Sidebar */}
                <div className="w-80 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white flex flex-col shadow-xl">
                    {/* Header */}
                    <div className="p-6 border-b border-blue-500/30">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <DocumentTextIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Medical Documents</h2>
                                <p className="text-sm text-blue-100">Knowledge Base Management</p>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20">
                                <div className="text-lg font-bold text-white">{documents.length}</div>
                                <div className="text-xs text-blue-100">Total</div>
                            </div>
                            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-3 text-center border border-green-400/30">
                                <div className="text-lg font-bold text-green-300">
                                    {documents.filter(d => d.status === 'completed').length}
                                </div>
                                <div className="text-xs text-green-200">Processed</div>
                            </div>
                            <div className="bg-blue-400/20 backdrop-blur-sm rounded-lg p-3 text-center border border-blue-300/30">
                                <div className="text-lg font-bold text-blue-200">
                                    {documents.filter(d => d.status === 'processing').length}
                                </div>
                                <div className="text-xs text-blue-200">Processing</div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        <Link
                            href="/dashboard/therapist"
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                            </svg>
                            <span className="font-medium">Dashboard</span>
                        </Link>

                        <div className="border-t border-blue-500/30 my-4"></div>

                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all backdrop-blur-sm border ${
                                activeTab === 'upload'
                                    ? 'bg-white/20 text-white border-white/40 shadow-lg'
                                    : 'text-blue-100 hover:bg-white/10 hover:text-white border-transparent'
                            }`}
                        >
                            <CloudArrowUpIcon className="h-5 w-5" />
                            <span className="font-medium">Upload Documents</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('library')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all backdrop-blur-sm border ${
                                activeTab === 'library'
                                    ? 'bg-white/20 text-white border-white/40 shadow-lg'
                                    : 'text-blue-100 hover:bg-white/10 hover:text-white border-transparent'
                            }`}
                        >
                            <FolderIcon className="h-5 w-5" />
                            <span className="font-medium">Document Library</span>
                            <span className="ml-auto bg-blue-500/50 text-blue-100 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                                {documents.length}
                            </span>
                        </button>

                        <div className="border-t border-blue-500/30 my-4"></div>

                        {/* Additional Navigation Links */}
                        <Link
                            href="/dashboard/therapist/patients"
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium">Patient Management</span>
                        </Link>

                        <Link
                            href="/dashboard/therapist/appointments"
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Appointments</span>
                        </Link>

                        <Link
                            href="/dashboard/therapist/analytics"
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium">Analytics</span>
                        </Link>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-blue-500/30">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                            <div className="flex items-center space-x-2">
                                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-white font-medium">AI-Powered RAG System</span>
                            </div>
                            <p className="text-xs text-blue-100 mt-1">
                                Enhanced medical knowledge base
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'upload' && (
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Upload Medical Documents</h1>
                                <p className="text-gray-600 mt-2">
                                    Upload PDF documents to enhance your AI assistant's medical knowledge base
                                </p>
                            </div>

                            <DocumentUpload onUploadComplete={() => {
                                loadDocuments(); // Refresh the document list
                            }} />
                        </div>
                    )}

                    {activeTab === 'library' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Document Library</h1>
                                    <p className="text-gray-600 mt-2">
                                        View and manage your uploaded medical documents
                                    </p>
                                </div>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex-1 relative">
                                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="relative">
                                    <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="processing">Processing</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Documents List */}
                            <div className="space-y-4">
                                {filteredDocuments.length > 0 ? (
                                    filteredDocuments.map((doc) => (
                                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                            <CardContent padding="md">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="p-2 bg-blue-50 rounded-lg">
                                                            {getStatusIcon(doc.status)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-900 truncate max-w-xs">
                                                                {doc.filename}
                                                            </h3>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                                                <span>{doc.uploadedAt}</span>
                                                                {doc.size && <span>{doc.size}</span>}
                                                                {doc.pages && <span>{doc.pages} pages</span>}
                                                                {doc.chunks && <span>{doc.chunks} chunks</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                                                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                        </span>

                                                        <div className="flex space-x-2">
                                                            {doc.status === 'completed' && (
                                                                <>
                                                                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                                        <EyeIcon className="h-4 w-4" />
                                                                    </button>
                                                                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                                                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                                        <p className="text-gray-600 mb-4">
                                            {searchQuery || filterStatus !== 'all'
                                                ? 'Try adjusting your search or filter criteria.'
                                                : 'Upload your first medical document to get started.'
                                            }
                                        </p>
                                        {!searchQuery && filterStatus === 'all' && (
                                            <button
                                                onClick={() => setActiveTab('upload')}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Upload Document
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
