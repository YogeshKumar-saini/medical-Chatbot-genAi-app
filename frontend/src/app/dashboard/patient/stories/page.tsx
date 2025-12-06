'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientStoriesPage() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStories();
    }, []);

    const loadStories = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getStories();
            setStories(data.stories || []);
        } catch (error) {
            toast.error('Failed to load stories');
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (storyId: string) => {
        try {
            await apiClient.likeStory(storyId);
            loadStories();
        } catch (error) {
            toast.error('Failed to like story');
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Community Stories
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Share and explore health journeys
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stories.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No stories yet
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        stories.map((story) => (
                            <Card key={story.id} hover>
                                <CardContent padding="none">
                                    {story.media_url && (
                                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden">
                                            <img
                                                src={story.media_url}
                                                alt={story.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {story.title || 'Untitled Story'}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                {story.content}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {story.tags?.map((tag: string, i: number) => (
                                                <Badge key={i} variant="info" size="sm">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={() => handleLike(story.id)}
                                                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                {story.is_liked ? (
                                                    <HeartSolidIcon className="h-5 w-5 text-red-600" />
                                                ) : (
                                                    <HeartIcon className="h-5 w-5" />
                                                )}
                                                <span>{story.likes_count || 0}</span>
                                            </button>

                                            <button className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
                                                <ChatBubbleLeftIcon className="h-5 w-5" />
                                                <span>{story.comments_count || 0}</span>
                                            </button>
                                        </div>
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
