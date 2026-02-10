'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { BookOpenIcon, VideoCameraIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientLibraryPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadResources();
    }, [selectedCategory]);

    const loadResources = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getLibraryResources({
                type: selectedCategory !== 'all' ? selectedCategory : undefined,
            });
            setResources(data || []);
        } catch (error) {
            toast.error('Failed to load library resources');
        } finally {
            setLoading(false);
        }
    };

    const filteredResources = resources.filter((resource) =>
        resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = ['all', 'video', 'article', 'quiz'];

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
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Health Library
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Learn about health topics and conditions
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <Input
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                    />

                    <div className="flex gap-2">
                        {categories.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No resources found
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredResources.map((resource) => (
                            <Card key={resource.id} hover>
                                <CardContent padding="md">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {resource.type === 'video' && (
                                                        <VideoCameraIcon className="h-5 w-5 text-blue-600" />
                                                    )}
                                                    {resource.type === 'article' && (
                                                        <BookOpenIcon className="h-5 w-5 text-green-600" />
                                                    )}
                                                    {resource.type === 'quiz' && (
                                                        <AcademicCapIcon className="h-5 w-5 text-purple-600" />
                                                    )}
                                                    <Badge variant="info" size="sm">
                                                        {resource.type}
                                                    </Badge>
                                                </div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {resource.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {resource.description}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                if (resource.url) {
                                                    window.open(resource.url, '_blank');
                                                }
                                            }}
                                        >
                                            {resource.type === 'quiz' ? 'Take Quiz' : 'View Resource'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
