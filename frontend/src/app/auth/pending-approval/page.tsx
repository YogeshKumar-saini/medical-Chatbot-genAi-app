'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PendingApprovalPage() {
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
        // Poll every 10 seconds
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const data = await apiClient.getOnboardingStatus();
            setStatus(data);
            setLoading(false);

            // Redirect if approved
            if (data.org_approval_status === 'APPROVED') {
                if (data.doctor_link_status === 'APPROVED') {
                    toast.success('All approvals complete!');
                    router.push('/dashboard');
                } else if (data.doctor_link_status === 'PENDING') {
                    router.push('/auth/pending-doctor');
                } else {
                    router.push('/auth/link-request');
                }
            } else if (data.org_approval_status === 'REJECTED') {
                router.push('/auth/rejected');
            }
        } catch (error) {
            console.error('Failed to check status:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                            <ClockIcon className="h-10 w-10 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Pending Organization Approval</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        {status?.message || 'Waiting for organization approval'}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status?.organization_name && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
                            <p className="font-medium text-gray-900 dark:text-white">{status.organization_name}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Onboarding Complete</span>
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Organization Approval</span>
                            <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>We'll notify you once your request is reviewed.</p>
                        <p className="mt-2">This page will automatically update.</p>
                    </div>

                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => router.push('/auth/login')}
                    >
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
