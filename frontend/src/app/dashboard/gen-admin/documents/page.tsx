'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DocumentTextIcon, PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function GenAdminDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([
        { id: '1', name: 'Medical Guidelines.pdf', type: 'PDF', size: '2.4 MB', uploaded: '2024-01-15' },
        { id: '2', name: 'Treatment Protocols.docx', type: 'DOCX', size: '1.8 MB', uploaded: '2024-01-10' },
    ]);

    const handleUpload = () => {
        toast.success('Document upload feature coming soon!');
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system documents and files</p>
                    </div>
                    <Button variant="primary" onClick={handleUpload} leftIcon={<ArrowUpTrayIcon className="h-5 w-5" />}>
                        Upload Document
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <Card key={doc.id} hover>
                            <CardContent padding="md">
                                <div className="flex items-start gap-3">
                                    <DocumentTextIcon className="h-10 w-10 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{doc.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{doc.type} • {doc.size}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Uploaded: {doc.uploaded}</p>
                                        <div className="flex gap-2 mt-3">
                                            <Button variant="outline" size="sm">Download</Button>
                                            <Button variant="danger" size="sm">Delete</Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
