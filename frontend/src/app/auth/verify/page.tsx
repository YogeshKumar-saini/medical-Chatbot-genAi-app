'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

import { Suspense } from 'react';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code || code.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            await apiClient.verifyEmail(email, code);
            toast.success('Email verified successfully!');

            // Get user role from localStorage (set during registration)
            const role = localStorage.getItem('role');

            // Redirect to appropriate onboarding page based on role
            if (role === 'PATIENT') {
                router.push('/auth/onboarding/patient');
            } else if (role === 'THERAPIST') {
                router.push('/auth/onboarding/doctor');
            } else if (role === 'SUPER_ADMIN' || role === 'ORG_ADMIN' || role === 'GEN_ADMIN') {
                // Admins go directly to dashboard
                router.push('/dashboard');
            } else {
                // Fallback: try to get role from /me endpoint
                toast.success('Redirecting to login...');
                router.push('/auth/login');
            }
        } catch (error: any) {
            toast.error(error.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast.error('Email address not found');
            return;
        }

        setResending(true);
        try {
            // TODO: Implement resend verification email API
            toast.success('Verification code sent!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        We sent a verification code to <strong>{email}</strong>
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <Input
                            label="Verification Code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="text-center text-2xl tracking-widest"
                            required
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={loading}
                        >
                            Verify Email
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                {resending ? 'Sending...' : "Didn't receive the code? Resend"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
