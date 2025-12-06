'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPrescriptions();
    }, []);

    const loadPrescriptions = async () => {
        try {
            setLoading(true);
            const appointments = await apiClient.getAppointments('patient');
            const allPrescriptions: any[] = [];

            for (const apt of appointments.appointments || []) {
                try {
                    const data = await apiClient.getPrescriptions(apt.id);
                    allPrescriptions.push(...(data.prescriptions || []));
                } catch (error) {
                    // Skip if no prescriptions
                }
            }

            setPrescriptions(allPrescriptions);
        } catch (error) {
            toast.error('Failed to load prescriptions');
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
                        My Prescriptions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View your medication history
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {prescriptions.length === 0 ? (
                        <Card>
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No prescriptions yet
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        prescriptions.map((prescription, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>Prescription #{index + 1}</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Prescribed by Dr. {prescription.doctor_name || 'Unknown'}
                                            </p>
                                        </div>
                                        <Badge variant="info">Active</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <ClockIcon className="h-4 w-4" />
                                            {new Date(prescription.created_at).toLocaleDateString()}
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                Medications:
                                            </h4>
                                            <div className="space-y-2">
                                                {prescription.medications?.map((med: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                    >
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {med.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {med.dosage} - {med.frequency}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Duration: {med.duration}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {prescription.instructions && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                    Instructions:
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {prescription.instructions}
                                                </p>
                                            </div>
                                        )}
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
