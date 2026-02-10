'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { UserPlusIcon } from '@heroicons/react/24/outline';

export default function PatientDoctorsPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    // const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [myOrg, setMyOrg] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Get Onboarding Status to find my Org
            const status = await apiClient.getOnboardingStatus();
            const orgId = status.organization_id;

            if (!orgId) {
                // User not in an org
                setLoading(false);
                return;
            }

            setMyOrg({ id: orgId, name: status.organization_name });

            // 2. Get Doctors in my Org
            const docs = await apiClient.getOrgDoctors(orgId);
            setDoctors(docs); // [{ id, name, specialization }, ...]

            // 3. Get My Links (We don't have a direct "getMyLinks" for patient in API yet? 
            // Wait, api.getDoctorLinks is for doctors. 
            // The Patient might need to know which doctors they effectively have a link with.
            // Currently backend doesn't seem to expose "My Linked Doctors" explicitly for Patient?
            // But we can inferred it from successful appointments or maybe we need a new endpoint?
            // Actually, we can assume we don't know the status unless we try to link?
            // Or maybe we should rely on "My Appointments" to see doctors.
            // But for "Request Link", we need to know if pending.

            // For now, let's just list doctors and offer "Connect".
            // If backend rejects "Link already exists", handle it.

        } catch (error) {
            console.error("Failed to load data", error);
            toast.error('Failed to load doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (doctorId: string) => {
        if (!myOrg) return;
        try {
            await apiClient.requestDoctorPatientLink({
                doctor_id: doctorId,
                organization_id: myOrg.id
            });
            toast.success('Link request sent!');
            // Optimistically update UI could be complex without know status id.
        } catch (error: any) {
            toast.error(error.message || 'Failed to request link');
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

    if (!myOrg) {
        return (
            <DashboardLayout>
                <Card>
                    <CardContent padding="lg">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
                            <p className="text-gray-600 mb-4">You need to join an organization to find doctors.</p>
                            <Link href="/dashboard/patient/profile" className="inline-block">
                                <Button variant="primary">
                                    Go to Profile
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Doctors in {myOrg.name || 'Your Organization'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Connect with doctors to share records and book appointments.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No doctors found in this organization.
                        </div>
                    ) : (
                        doctors.map((doc) => (
                            <Card key={doc.id} hover>
                                <CardContent padding="md">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                {doc.name || 'Unknown Doctor'}
                                            </h3>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                                {doc.specialization || 'General Practice'}
                                            </p>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <UserPlusIcon className="h-6 w-6 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleConnect(doc.id)}
                                        >
                                            Request Connection
                                        </Button>
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
