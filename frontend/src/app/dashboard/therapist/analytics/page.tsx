'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ChartBarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TherapistAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const [linksData, appointmentsData] = await Promise.all([
                apiClient.getDoctorLinks(),
                apiClient.getAppointments('doctor'),
            ]);

            setPatients(linksData.links?.filter((l: any) => l.status === 'ACCEPTED') || []);

            const appointments = appointmentsData.appointments || [];
            setStats({
                total_patients: linksData.links?.filter((l: any) => l.status === 'ACCEPTED').length || 0,
                total_appointments: appointments.length,
                completed_appointments: appointments.filter((a: any) => a.status === 'COMPLETED').length,
                upcoming_appointments: appointments.filter((a: any) => a.status === 'SCHEDULED').length,
            });
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
                        Practice Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View your practice performance
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Patients
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.total_patients || 0}
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
                                        Total Appointments
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.total_appointments || 0}
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
                                        Completed
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.completed_appointments || 0}
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
                                        Upcoming
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stats?.upcoming_appointments || 0}
                                    </p>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Patient List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {patients.length === 0 ? (
                                <p className="text-center py-8 text-gray-600 dark:text-gray-400">
                                    No patients yet
                                </p>
                            ) : (
                                patients.map((patient) => (
                                    <div
                                        key={patient.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {patient.patient_name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {patient.patient_email}
                                            </p>
                                        </div>
                                        <Badge variant="success">Active</Badge>
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
