'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChatBubbleLeftRightIcon,
    CalendarIcon,
    DocumentTextIcon,
    BookOpenIcon,
    UserGroupIcon,
    HeartIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api';

export default function PatientDashboard() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        if (user?.role !== 'PATIENT') {
            // Redirect to appropriate dashboard based on role
            const roleRoutes: Record<string, string> = {
                SUPER_ADMIN: '/dashboard/super-admin',
                GEN_ADMIN: '/dashboard/gen-admin',
                ORG_ADMIN: '/dashboard/org-admin',
                THERAPIST: '/dashboard/therapist',
            };
            router.push(roleRoutes[user?.role || ''] || '/dashboard');
            return;
        }

        loadDashboardData();
    }, [isAuthenticated, user, router]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            // Load appointments
            const appointmentsData = await apiClient.getAppointments('patient');
            setAppointments(appointmentsData.appointments || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        {
            name: 'Chat with AI',
            description: 'Get instant medical assistance',
            icon: ChatBubbleLeftRightIcon,
            href: '/dashboard/patient/chat',
            color: 'from-blue-500 to-blue-600',
        },
        {
            name: 'Book Appointment',
            description: 'Schedule a consultation',
            icon: CalendarIcon,
            href: '/dashboard/patient/appointments',
            color: 'from-green-500 to-green-600',
        },
        {
            name: 'View Prescriptions',
            description: 'Access your medications',
            icon: DocumentTextIcon,
            href: '/dashboard/patient/prescriptions',
            color: 'from-purple-500 to-purple-600',
        },
        {
            name: 'Health Library',
            description: 'Learn about health topics',
            icon: BookOpenIcon,
            href: '/dashboard/patient/library',
            color: 'from-orange-500 to-orange-600',
        },
        {
            name: 'Community',
            description: 'Connect with support groups',
            icon: UserGroupIcon,
            href: '/dashboard/patient/community',
            color: 'from-pink-500 to-pink-600',
        },
        {
            name: 'Wellness',
            description: 'Track mood & journal',
            icon: HeartIcon,
            href: '/dashboard/patient/wellness',
            color: 'from-teal-500 to-teal-600',
        },
    ];

    const upcomingAppointments = appointments
        .filter((apt) => apt.status === 'SCHEDULED')
        .slice(0, 3);

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
                        Welcome back, {user?.name || 'Patient'}! 👋
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Here's your health overview for today
                    </p>
                </div>

                {/* Health Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Upcoming Appointments
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {upcomingAppointments.length}
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
                                        Active Prescriptions
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        0
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Health Score
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        Good
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <HeartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Upcoming Appointments</CardTitle>
                                <CardDescription>Your scheduled consultations</CardDescription>
                            </div>
                            <Link href="/dashboard/patient/appointments">
                                <Button variant="outline" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingAppointments.map((appointment: any) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    Dr. {appointment.doctor_name || 'Unknown'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(appointment.start_time).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="info">Scheduled</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    No upcoming appointments
                                </p>
                                <Link href="/dashboard/patient/appointments">
                                    <Button variant="primary" size="sm" className="mt-4">
                                        Book Appointment
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Health Tips */}
                <Card variant="glass">
                    <CardHeader>
                        <CardTitle>Daily Health Tip</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    Stay Hydrated
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Drink at least 8 glasses of water throughout the day to maintain optimal health and energy levels.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
