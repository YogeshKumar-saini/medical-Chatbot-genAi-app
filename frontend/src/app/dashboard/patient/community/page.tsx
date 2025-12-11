'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PatientCommunityPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getGroups();
            setGroups(data.groups || []);
        } catch (error) {
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
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
                        Community Groups
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Connect with support groups and communities
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No groups available yet
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        groups.map((group) => (
                            <Card key={group.id} hover>
                                <CardContent padding="md">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {group.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {group.description || 'No description'}
                                                </p>
                                            </div>
                                            <Badge variant="info" size="sm">
                                                {group.type}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <UserGroupIcon className="h-4 w-4" />
                                            {group.member_count || 0} members
                                        </div>

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => router.push(`/dashboard/patient/community/${group.id}`)}
                                            leftIcon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
                                        >
                                            Open Chat
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
