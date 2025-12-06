'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BuildingOfficeIcon,
    UsersIcon,
    ChartBarIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api';

export default function OrgAdminDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [orgStatus, setOrgStatus] = useState<any>(null);
    const [pendingRequests, setPendingRequests] = useState(0);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ORG_ADMIN') {
            router.push('/dashboard');
        } else {
            loadOrgData();
        }
    }, [isAuthenticated, user, router]);

    const loadOrgData = async () => {
        try {
            // Fetch onboarding status to get org details if available, or fetch specific endpoints
            // Assuming getOnboardingStatus gives us the org details for the admin
            const status = await apiClient.getOnboardingStatus();
            setOrgStatus(status);

            const requests = await apiClient.getOrgDoctorRequests();
            setPendingRequests(requests.length);
        } catch (error) {
            console.error('Failed to load org data', error);
        }
    };

    const quickActions = [
        {
            name: 'Organization Settings',
            description: 'Manage organization',
            icon: BuildingOfficeIcon,
            href: '/dashboard/org-admin/settings',
            color: 'from-blue-500 to-blue-600',
        },
        {
            name: 'Members',
            description: `${pendingRequests} Pending Requests`,
            icon: UsersIcon,
            href: '/dashboard/org-admin/members',
            color: 'from-green-500 to-green-600',
        },
        {
            name: 'Analytics',
            description: 'View analytics',
            icon: ChartBarIcon,
            href: '/dashboard/org-admin/analytics',
            color: 'from-purple-500 to-purple-600',
        },
        {
            name: 'Appointments',
            description: 'Oversee appointments',
            icon: CalendarIcon,
            href: '/dashboard/org-admin/appointments',
            color: 'from-orange-500 to-orange-600',
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Organization Admin Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Manage your organization
                    </p>
                </div>

                {orgStatus?.is_verified === false && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <BuildingOfficeIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Your organization is currently <strong>Unverified</strong>.
                                    It will not be visible to patients until verified by a Super Admin.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
