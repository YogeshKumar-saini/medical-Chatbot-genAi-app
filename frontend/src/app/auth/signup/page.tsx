'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'PATIENT',
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.signup({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                role: formData.role,
            });

            // Show OTP in toast for development (remove in production)
            if (response.otp) {
                toast.success(`OTP sent to your email: ${response.otp}`, {
                    duration: 10000,
                    icon: '🔑',
                });
            } else {
                toast.success('Registration successful! Please check your email to verify your account.');
            }
            router.push('/auth/verify?email=' + encodeURIComponent(formData.email));
        } catch (error: any) {
            toast.error(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Create Account</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Join our healthcare community
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />

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
                            helperText="At least 8 characters"
                            required
                        />

                        <PasswordInput
                            label="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                I am registering as
                            </label>
                            <div className="space-y-3">
                                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.role === 'PATIENT'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="PATIENT"
                                        checked={formData.role === 'PATIENT'}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="mt-1 mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Patient</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            I'm seeking medical information and healthcare support
                                        </div>
                                    </div>
                                </label>

                                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.role === 'THERAPIST'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="THERAPIST"
                                        checked={formData.role === 'THERAPIST'}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="mt-1 mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">Healthcare Professional</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            I'm a doctor, therapist, or healthcare provider
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={loading}
                        >
                            Create Account
                        </Button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
