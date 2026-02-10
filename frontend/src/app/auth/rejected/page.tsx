'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function RejectedPage() {
    const router = useRouter();

    const handleReRequest = () => {
        toast.success('Redirecting to request a different organization or doctor...');
        router.push('/auth/link-request');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                            <XCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Request Not Approved</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Your request was not approved at this time
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Don't worry! You can request a different organization or doctor,
                            or contact support for assistance.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleReRequest}
                        >
                            Request Different Organization/Doctor
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => window.location.href = 'mailto:support@example.com'}
                        >
                            Contact Support
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => router.push('/auth/login')}
                        >
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
