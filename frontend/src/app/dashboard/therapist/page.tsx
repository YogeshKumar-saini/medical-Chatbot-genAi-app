'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    UsersIcon,
    CalendarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ClockIcon,
    CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api';

export default function TherapistDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [onboardingStatus, setOnboardingStatus] = useState<any>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (user?.role !== 'THERAPIST') {
            router.push('/dashboard');
            return;
        }

        loadDashboardData();
    }, [isAuthenticated, user, router]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [appointmentsData, patientsData, statusData] = await Promise.all([
                apiClient.getAppointments('doctor').catch(() => ({ appointments: [] })),
                apiClient.getDoctorLinks().catch(() => ({ links: [] })),
                apiClient.getOnboardingStatus().catch(() => null),
            ]);
            setAppointments(appointmentsData.appointments || []);
            setPatients(patientsData.links || []);
            setOnboardingStatus(statusData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const todayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.start_time);
        const today = new Date();
        return aptDate.toDateString() === today.toDateString();
    });

    const quickActions = [
        {
            name: 'Manage Patients',
            description: 'View and manage patient profiles',
            icon: UsersIcon,
            href: '/dashboard/therapist/patients',
            color: 'from-blue-500 to-blue-600',
        },
        {
            name: 'Appointments',
            description: 'View and schedule appointments',
            icon: CalendarIcon,
            href: '/dashboard/therapist/appointments',
            color: 'from-green-500 to-green-600',
        },
        {
            name: 'Prescriptions',
            description: 'Create and manage prescriptions',
            icon: DocumentTextIcon,
            href: '/dashboard/therapist/prescriptions',
            color: 'from-purple-500 to-purple-600',
        },
        {
            name: 'Analytics',
            description: 'View clinical insights',
            icon: ChartBarIcon,
            href: '/dashboard/therapist/analytics',
            color: 'from-orange-500 to-orange-600',
        },
        {
            name: 'Groups',
            description: 'Manage support groups',
            icon: UserGroupIcon,
            href: '/dashboard/therapist/groups',
            color: 'from-pink-500 to-pink-600',
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
                        Welcome, Dr. {user?.name || 'Therapist'}! 👨‍⚕️
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Here's your practice overview for today
                    </p>
                </div>

                {onboardingStatus?.org_request_status === 'PENDING' && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Your request to join <strong>{onboardingStatus.organization_name}</strong> is currently <strong>Pending Approval</strong>.
                                    You will be able to accept patient requests once approved by the Organization Admin.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {onboardingStatus?.org_request_status === 'REJECTED' && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <UsersIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">
                                    Your request to join <strong>{onboardingStatus.organization_name}</strong> was <strong>Rejected</strong>.
                                    Please contact the organization administrator or select a different organization in your profile settings.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Today's Appointments
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {todayAppointments.length}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Patients
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {patients.length}
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
                                        Pending Reviews
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        0
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Active Groups
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        0
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <UserGroupIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quickActions.map((action) => (
                            <Link key={action.name} href={action.href}>
                                <Card hover variant="default">
                                    <CardContent padding="md">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`h-12 w-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}
                                            >
                                                <action.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
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
                        {/* Document Management Quick Action */}
                        <Link href="/dashboard/therapist/documents">
                            <Card hover variant="default">
                                <CardContent padding="md">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                            <CloudArrowUpIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Document Management
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Upload and manage medical documents
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>

                {/* Today's Appointments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Today's Schedule</CardTitle>
                                <CardDescription>Your appointments for today</CardDescription>
                            </div>
                            <Link href="/dashboard/therapist/appointments">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {todayAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {todayAppointments.map((appointment: any) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {appointment.patient_name || 'Patient'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(appointment.start_time).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="info">{appointment.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    No appointments scheduled for today
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
