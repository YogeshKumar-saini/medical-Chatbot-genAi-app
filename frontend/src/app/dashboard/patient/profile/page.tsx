'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientProfilePage() {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                phone: '',
                bio: '',
            });
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            await apiClient.updateProfile(profile);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await apiClient.uploadAvatar(file);
            toast.success('Avatar updated!');
        } catch (error) {
            toast.error('Failed to upload avatar');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Profile
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your personal information
                    </p>
                </div>

                <Card>
                    <CardContent padding="lg">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <Avatar
                                    src={user?.avatarUrl}
                                    fallback={user?.name || user?.email || '?'}
                                    size="xl"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                                >
                                    <CameraIcon className="h-4 w-4 text-white" />
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                {user?.name || user?.email}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {user?.role}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Enter your name"
                            />

                            <Input
                                label="Email"
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="your@email.com"
                                disabled
                            />

                            <Input
                                label="Phone Number"
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    rows={4}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={handleUpdateProfile}
                                isLoading={loading}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
