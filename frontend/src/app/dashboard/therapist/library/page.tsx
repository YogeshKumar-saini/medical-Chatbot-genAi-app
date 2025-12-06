'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { PlusIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TherapistLibraryPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newResource, setNewResource] = useState({ title: '', description: '', type: 'ARTICLE', url: '', category: 'MENTAL_HEALTH' });

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        try {
            const data = await apiClient.getLibraryResources();
            setResources(data || []);
        } catch {
            toast.error('Failed to load resources');
        }
    };

    const handleCreateResource = async () => {
        if (!newResource.title || !newResource.url) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            await apiClient.createLibraryResource({
                ...newResource,
                condition_tags: [newResource.category],
                type: newResource.type as any
            });
            toast.success('Resource created successfully!');
            setIsCreateModalOpen(false);
            setNewResource({ title: '', description: '', type: 'ARTICLE', url: '', category: 'MENTAL_HEALTH' });
            loadResources();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create resource');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage educational resources</p>
                    </div>
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="h-5 w-5" />}>
                        Add Resource
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                        <Card key={resource.id} hover>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                                    <Badge variant="info">{resource.type}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{resource.description}</p>
                                <Badge variant="default" size="sm">{resource.category}</Badge>
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" size="sm" onClick={() => window.open(resource.url, '_blank')}>View</Button>
                                    <Button variant="danger" size="sm">Delete</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Resource" size="md">
                    <div className="space-y-4">
                        <Input label="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="Resource title" />
                        <Textarea label="Description" value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} placeholder="Describe the resource..." rows={3} />
                        <Input label="URL" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} placeholder="https://..." />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                                <select value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    <option value="ARTICLE">Article</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="QUIZ">Quiz</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <select value={newResource.category} onChange={(e) => setNewResource({ ...newResource, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    <option value="MENTAL_HEALTH">Mental Health</option>
                                    <option value="NUTRITION">Nutrition</option>
                                    <option value="EXERCISE">Exercise</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateResource}>Add Resource</Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
