'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function GenAdminAnalyticsPage() {
    const [stats, setStats] = useState({
        total_users: 0,
        total_organizations: 0,
        active_sessions: 0,
        total_appointments: 0,
    });

    useEffect(() => {
        // TODO: Load from API
        setStats({
            total_users: 1250,
            total_organizations: 45,
            active_sessions: 89,
            total_appointments: 3420,
        });
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        System Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor system-wide performance
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
                                        {stats.total_users}
                                    </p>
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
                                        Organizations
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats.total_organizations}
                                    </p>
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
                                        Active Sessions
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats.active_sessions}
                                    </p>
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
                                        Total Appointments
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats.total_appointments}
                                    </p>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            Chart placeholder - Integrate with charting library
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
