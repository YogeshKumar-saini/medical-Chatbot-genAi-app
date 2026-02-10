'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { UserIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
    const [loading, setLoading] = useState(false);

    // Form states (pre-filled with user data where possible)
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-500">Manage your account preferences</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Settings Navigation */}
                    <div className="w-full md:w-64 space-y-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            <UserIcon className="h-5 w-5" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications'
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            <BellIcon className="h-5 w-5" />
                            Notifications
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security'
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                }`}
                        >
                            <ShieldCheckIcon className="h-5 w-5" />
                            Security
                        </button>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1">
                        {activeTab === 'profile' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                                                {user?.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <Button variant="outline" size="sm">
                                                Change Avatar
                                            </Button>
                                        </div>

                                        <Input
                                            label="Full Name"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        />
                                        <Input
                                            label="Email Address"
                                            value={profileForm.email}
                                            disabled
                                            helperText="Contact support to change email"
                                        />

                                        <div className="pt-4">
                                            <Button
                                                variant="primary"
                                                onClick={handleSaveProfile}
                                                isLoading={loading}
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'notifications' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                                <p className="text-sm text-gray-500">Receive emails about your account activity</p>
                                            </div>
                                            <input type="checkbox" defaultChecked className="toggle" />
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                                <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                                            </div>
                                            <input type="checkbox" defaultChecked className="toggle" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'security' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Button variant="outline" className="w-full justify-start text-left">
                                            Change Password
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start text-left">
                                            Two-Factor Authentication
                                        </Button>
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <Button variant="danger" className="w-full">
                                                Delete Account
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
