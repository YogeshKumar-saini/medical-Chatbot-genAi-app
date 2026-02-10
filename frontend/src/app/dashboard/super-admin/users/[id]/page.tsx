'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    UserIcon,
    ArrowLeftIcon,
    BuildingOfficeIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import DashboardGuard from '@/components/DashboardGuard';

import { Modal, ModalFooter } from '@/components/ui/Modal';
import { PencilIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';

export default function SuperAdminUserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', is_verified: false });

    useEffect(() => {
        if (userId) {
            loadUser();
        }
    }, [userId]);

    const loadUser = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAdminUserDetails(userId);
            setUser(data);
            setEditForm({ name: data.name || '', is_verified: data.is_verified || false });
        } catch (error: any) {
            toast.error(error.message || 'Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        try {
            await apiClient.updateAdminUserDetails(userId, editForm);
            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            loadUser();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update user');
        }
    };

    // ... existing handleDelete logic if any, currently mostly strict layout

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!user) return (
        <DashboardLayout>
            <div className="p-8 text-center text-gray-500">User not found.</div>
        </DashboardLayout>
    );

    return (
        <DashboardGuard allowedRoles={['SUPER_ADMIN']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
                            Back to Users
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Profile Card */}
                        <div className="md:col-span-1">
                            <Card>
                                <CardContent padding="lg">
                                    <div className="flex flex-col items-center">
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                        </div>
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">{user.name || 'Unnamed User'}</h1>
                                        <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                                        <Badge variant="info" className="mb-2">
                                            {user.role}
                                        </Badge>

                                        {user.is_verified ? (
                                            <Badge variant="success" size="sm" className="flex items-center gap-1">
                                                <ShieldCheckIcon className="h-3 w-3" /> Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="warning" size="sm">Unverified</Badge>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4"
                                            onClick={() => setIsEditModalOpen(true)}
                                            leftIcon={<PencilIcon className="h-4 w-4" />}
                                        >
                                            Edit Profile
                                        </Button>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <EnvelopeIcon className="h-5 w-5" />
                                            <span>{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                            <CalendarIcon className="h-5 w-5" />
                                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Role Specific Details */}
                        <div className="md:col-span-2 space-y-6">
                            {user.role === 'ORG_ADMIN' && user.extra_info?.organization && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Organization Administration</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                            <BuildingOfficeIcon className="h-10 w-10 text-blue-600" />
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {user.extra_info.organization.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">@{user.extra_info.organization.slug}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="ml-auto"
                                                onClick={() => router.push(`/dashboard/super-admin/organizations/${user.extra_info.organization.id}`)}
                                            >
                                                View Org
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {(user.role === 'DOCTOR' || user.role === 'THERAPIST') && user.extra_info?.profile && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Professional Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Specialization</p>
                                                <p className="font-medium">{user.extra_info.profile.specialization || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Verification Status</p>
                                                <Badge variant={user.extra_info.profile.verification_status === 'APPROVED' ? 'success' : 'warning'}>
                                                    {user.extra_info.profile.verification_status || 'PENDING'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push(`/dashboard/super-admin/doctors/${user.id}`)}
                                            >
                                                View Full Clinical Profile
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Generic Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Advanced Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4">
                                        <Button variant="danger">Delete Account</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Modal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        title="Edit User Profile"
                        size="md"
                    >
                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_verified"
                                    checked={editForm.is_verified}
                                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_verified" className="text-sm text-gray-700 dark:text-gray-300">
                                    Verified User
                                </label>
                            </div>
                        </div>
                        <ModalFooter>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleUpdateUser}>
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </DashboardLayout>
        </DashboardGuard>
    );
}
