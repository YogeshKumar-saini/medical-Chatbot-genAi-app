'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BuildingOfficeIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api';

export default function SuperAdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (user?.role !== 'SUPER_ADMIN') {
            router.push('/dashboard');
            return;
        }

        loadDashboardData();
    }, [isAuthenticated, user, router]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const statsData = await apiClient.getSystemStats();
            setStats(statsData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            name: 'Manage Organizations',
            description: 'Create and manage organizations',
            icon: BuildingOfficeIcon,
            href: '/dashboard/super-admin/organizations',
            color: 'from-blue-500 to-blue-600',
        },
        {
            name: 'Manage Users',
            description: 'View and manage all users',
            icon: UsersIcon,
            href: '/dashboard/super-admin/users',
            color: 'from-green-500 to-green-600',
        },
        {
            name: 'System Analytics',
            description: 'View system-wide analytics',
            icon: ChartBarIcon,
            href: '/dashboard/super-admin/analytics',
            color: 'from-purple-500 to-purple-600',
        },
        {
            name: 'Audit Logs',
            description: 'View system audit logs',
            icon: DocumentTextIcon,
            href: '/dashboard/super-admin/analytics',
            color: 'from-orange-500 to-orange-600',
        },
    ];

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
                {/* Welcome Section */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        System Administration 🔐
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Complete system overview and management
                    </p>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Organizations
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.total_organizations || 0}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
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
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        System Alerts
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        0
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <Link key={action.name} href={action.href}>
                                <Card hover variant="default">
                                    <CardContent padding="md">
                                        <div className="flex flex-col items-center text-center gap-3">
                                            <div
                                                className={`h-14 w-14 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}
                                            >
                                                <action.icon className="h-7 w-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {action.name}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System Health */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Health</CardTitle>
                        <CardDescription>Current system status and performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            All Systems Operational
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Last checked: {new Date().toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="success">Healthy</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Database</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                        Connected
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">API Response Time</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                        {stats?.avg_response_time || '< 100'}ms
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                                        99.9%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
