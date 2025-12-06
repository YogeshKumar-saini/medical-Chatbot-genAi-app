'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrgAdminAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAppointments();
            // Map keys if necessary, API returns { id, patient_id, doctor_id, start_time, status ... }
            // We need patient Name and Therapist Name. 
            // The backend returns raw IDs currently in list_appointments?
            // Let's check backend list_appointments. It returns the doc content.
            // Converting to display format might require fetching names or the backend should return them.
            // For now let's map what we have and maybe we need to fetch user details or update backend to join.
            // Backend `list_appointments` currently returns raw mongo docs.
            // We should display what we can. 
            // To properly show names, we might need a backend enhancement or N+1 calls (bad).
            // Let's assume for now we just show IDs or update backend *again*?
            // The user approved the plan which said "Modify list_appointments". I did that.
            // Does it include names? The backend code I wrote returned `{"id": str(doc["_id"]), **doc}`.
            // It does NOT include patient_name/doctor_name.
            // This is a gap. I should probably update the backend to include names to make the UI useful.
            // For now, let's just wire it up and I will handle the Data Presentation issue by updating the backend in the next step if I see IDs are ugly.

            // Actually, the current mock data has 'patient' and 'therapist' as names.
            // The real API has patient_id, doctor_id.
            // I will update the backend to include names, or fetch them here.

            // Let's stick to wiring it up first.

            const formatted = data.map((apt: any) => ({
                id: apt.id,
                patient: apt.patient_name || apt.patient_id || 'Unknown',
                therapist: apt.doctor_name || apt.doctor_id || 'Unknown',
                date: apt.start_time,
                status: apt.status
            }));
            setAppointments(formatted);
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'info';
            case 'COMPLETED': return 'success';
            case 'CANCELLED': return 'danger';
            default: return 'default';
        }
    };

    const filteredAppointments = appointments.filter(apt =>
        apt.patient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.therapist?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Oversight</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor all organization appointments</p>
                </div>

                <Input placeholder="Search appointments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

                <Card>
                    <CardContent padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Therapist</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredAppointments.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{apt.patient}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{apt.therapist}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {new Date(apt.date).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={getStatusVariant(apt.status)}>{apt.status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
