'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BuildingOfficeIcon,
    UsersIcon,
    ChartBarIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/store';

export default function GenAdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'GEN_ADMIN') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, router]);

    const quickActions = [
        {
            name: 'Organizations',
            description: 'View organizations',
            icon: BuildingOfficeIcon,
            href: '/dashboard/gen-admin/organizations',
            color: 'from-blue-500 to-blue-600',
        },
        {
            name: 'Users',
            description: 'Manage users',
            icon: UsersIcon,
            href: '/dashboard/gen-admin/users',
            color: 'from-green-500 to-green-600',
        },
        {
            name: 'Analytics',
            description: 'View analytics',
            icon: ChartBarIcon,
            href: '/dashboard/gen-admin/analytics',
            color: 'from-purple-500 to-purple-600',
        },
        {
            name: 'Documents',
            description: 'Manage documents',
            icon: DocumentTextIcon,
            href: '/dashboard/gen-admin/documents',
            color: 'from-orange-500 to-orange-600',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        General Admin Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage system operations
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </DashboardLayout>
    );
}
