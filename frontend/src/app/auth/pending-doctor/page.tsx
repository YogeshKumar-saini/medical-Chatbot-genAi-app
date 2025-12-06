'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PendingDoctorPage() {
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/v1/onboarding/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setStatus(data);
            setLoading(false);

            if (data.doctor_link_status === 'APPROVED') {
                toast.success('Doctor approved! Redirecting to dashboard...');
                router.push('/dashboard');
            } else if (data.doctor_link_status === 'REJECTED') {
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
                    <CardTitle className="text-2xl text-center">Pending Doctor Approval</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        {status?.message || 'Waiting for doctor approval'}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Onboarding Complete</span>
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Organization Approved</span>
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm">Doctor Approval</span>
                            <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>Your doctor will review your request soon.</p>
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
