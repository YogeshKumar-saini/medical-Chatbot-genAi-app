'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SuperAdminAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [statsData, logsData] = await Promise.all([
                apiClient.getSystemStats(),
                apiClient.getAnalyticsLogs(20),
            ]);
            setStats(statsData);
            setLogs(logsData.logs || []);
        } catch (error) {
            toast.error('Failed to load analytics');
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
                        System Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor system performance and usage
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Users
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.total_users || 0}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                                        <ArrowTrendingUpIcon className="h-4 w-4" />
                                        <span>+12% this month</span>
                                    </div>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Active Sessions
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.active_sessions || 0}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                                        <ArrowTrendingUpIcon className="h-4 w-4" />
                                        <span>+5% today</span>
                                    </div>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        API Calls Today
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.api_calls_today || 0}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
                                        <ArrowTrendingDownIcon className="h-4 w-4" />
                                        <span>-3% vs yesterday</span>
                                    </div>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Avg Response Time
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.avg_response_time || 0}ms
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                                        <ArrowTrendingDownIcon className="h-4 w-4" />
                                        <span>-15ms faster</span>
                                    </div>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <p className="text-center py-8 text-gray-600 dark:text-gray-400">
                                    No logs available
                                </p>
                            ) : (
                                logs.map((log, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {log.action || 'Unknown Action'}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {log.user || 'System'} • {new Date(log.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
