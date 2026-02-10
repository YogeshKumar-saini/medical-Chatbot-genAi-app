'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.login(formData.email, formData.password);

            if (response.user) {
                // Use the new user object from response
                setAuth(
                    {
                        id: response.user.id,
                        email: response.user.email,
                        name: response.user.name || '',
                        role: response.user.role as any,
                    },
                    response.access_token
                );

                toast.success('Login successful!');

                // Check onboarding status and route accordingly
                try {
                    const status = await apiClient.getOnboardingStatus();

                    // Route based on onboarding status
                    if (!status.is_onboarded) {
                        // Not onboarded yet - redirect to onboarding
                        if (response.user.role === 'PATIENT') {
                            router.push('/auth/onboarding/patient');
                        } else if (response.user.role === 'THERAPIST') {
                            router.push('/auth/onboarding/doctor');
                        } else {
                            router.push('/dashboard');
                        }
                    } else if (status.org_approval_status === 'PENDING') {
                        // Waiting for org approval
                        router.push('/auth/pending-approval');
                    } else if (status.org_approval_status === 'REJECTED') {
                        // Org rejected
                        router.push('/auth/rejected');
                    } else if (status.doctor_link_status === 'PENDING') {
                        // Waiting for doctor approval
                        router.push('/auth/pending-doctor');
                    } else if (status.doctor_link_status === 'REJECTED') {
                        // Doctor rejected
                        router.push('/auth/rejected');
                    } else if (status.doctor_link_status === 'NOT_STARTED' && response.user.role === 'PATIENT') {
                        // Need to request doctor link
                        router.push('/auth/link-request');
                    } else {
                        // All good - go to dashboard
                        router.push('/dashboard');
                    }
                } catch (statusError) {
                    console.error('Failed to check onboarding status:', statusError);
                    // Fallback to dashboard
                    router.push('/dashboard');
                }
            } else {
                toast.error('Invalid response from server');
            }
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Sign in to your account
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            required
                        />

                        <PasswordInput
                            label="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            required
                        />

                        <div className="flex items-center justify-between text-sm">
                            <Link
                                href="/auth/forgot-password"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={loading}
                        >
                            Sign In
                        </Button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                                Create one
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
