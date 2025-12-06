'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LinkRequestPage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [orgName, setOrgName] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const status = await apiClient.getOnboardingStatus();
                if (status.organization_id) {
                    setOrgId(status.organization_id);
                    setOrgName(status.organization_name);
                    const docs = await apiClient.getOrgDoctors(status.organization_id);
                    setDoctors(docs);
                }
            } catch (err) {
                console.error("Failed to load doctors", err);
                toast.error("Failed to load available doctors");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleConnect = async (doctorId: string) => {
        if (!orgId) return;

        try {
            await apiClient.requestDoctorPatientLink({
                doctor_id: doctorId,
                organization_id: orgId
            });
            toast.success('Link request sent! Your doctor will review it shortly.');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send link request');
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <UserPlusIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Connect with a Doctor</CardTitle>
                    {orgName && <p className="text-center text-sm text-gray-500">at {orgName}</p>}
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Select a doctor to link your account
                    </p>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading doctors...</div>
                    ) : doctors.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No doctors found in this organization yet.
                            <Button variant="outline" onClick={handleSkip} className="mt-4 w-full">
                                Continue to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {doctors.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <div>
                                        <h3 className="font-medium text-lg">{doc.name}</h3>
                                        <p className="text-sm text-gray-500">{doc.specialization}</p>
                                    </div>
                                    <Button onClick={() => handleConnect(doc.id)} size="sm">
                                        Connect
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full mt-4"
                                onClick={handleSkip}
                            >
                                Skip for Now
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
