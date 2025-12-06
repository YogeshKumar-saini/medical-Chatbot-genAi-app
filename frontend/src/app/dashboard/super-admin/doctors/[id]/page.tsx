'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    UserIcon,
    ArrowLeftIcon,
    AcademicCapIcon,
    BriefcaseIcon,
    ClockIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import DashboardGuard from '@/components/DashboardGuard';

export default function AdminDoctorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const doctorId = params.id as string;

    const [doctor, setDoctor] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (doctorId) {
            loadDoctor();
        }
    }, [doctorId]);

    const loadDoctor = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAdminDoctorDetails(doctorId);
            setDoctor(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load doctor profile');
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

    if (!doctor) return (
        <DashboardLayout>
            <div className="p-8 text-center text-gray-500">Doctor not found.</div>
        </DashboardLayout>
    );

    return (
        <DashboardGuard allowedRoles={['SUPER_ADMIN', 'GEN_ADMIN']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
                            Back
                        </Button>
                    </div>

                    <Card>
                        <CardContent padding="lg">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-3xl font-bold">
                                    {doctor.name?.[0] || 'D'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{doctor.name}</h1>
                                            <p className="text-gray-500">{doctor.email}</p>
                                        </div>
                                        <Badge variant={doctor.verification_status === 'APPROVED' ? 'success' : 'warning'}>
                                            {doctor.verification_status}
                                        </Badge>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                                            <span className="font-medium">Specialization:</span> {doctor.specialization || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                                            <span className="font-medium">Education:</span> {doctor.education || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <ClockIcon className="h-5 w-5 text-gray-400" />
                                            <span className="font-medium">Experience:</span> {doctor.experience_years ? `${doctor.experience_years} years` : 'N/A'}
                                        </div>
                                    </div>

                                    {doctor.bio && (
                                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Bio</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{doctor.bio}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </DashboardGuard>
    );
}
