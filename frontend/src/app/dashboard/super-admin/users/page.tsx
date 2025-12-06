'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    UsersIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import DashboardGuard from '@/components/DashboardGuard';

interface AdminUser {
    id: string;
    email: string;
    role: string;
    name?: string;
    is_verified: boolean;
    created_at: string;
}

import { Modal, ModalFooter } from '@/components/ui/Modal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'ORG_ADMIN' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getAdminUsers({
                role: roleFilter,
                search: search
            });
            setUsers(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, roleFilter]);

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setUpdatingId(userId);
        try {
            const response = await apiClient.deleteUser(userId);
            if (response.status === 'PENDING') {
                toast.success('Delete Request Sent to Organization Admin');
            } else {
                toast.success('User deleted');
            }
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await apiClient.createAdminUser({
                ...newUser,
                is_verified: true
            });
            toast.success('User created successfully');
            setIsCreateModalOpen(false);
            setNewUser({ name: '', email: '', password: '', role: 'ORG_ADMIN' });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user');
        }
    };

    const roleColors: Record<string, string> = {
        'SUPER_ADMIN': 'bg-purple-100 text-purple-800',
        'ORG_ADMIN': 'bg-blue-100 text-blue-800',
        'GEN_ADMIN': 'bg-indigo-100 text-indigo-800',
        'THERAPIST': 'bg-green-100 text-green-800',
        'DOCTOR': 'bg-green-100 text-green-800',
        'PATIENT': 'bg-gray-100 text-gray-800',
    };

    return (
        <DashboardGuard allowedRoles={['SUPER_ADMIN']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <UsersIcon className="h-8 w-8 text-blue-600" />
                                User Management
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Manage system users and view their details.
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => setIsCreateModalOpen(true)}
                            leftIcon={<PlusIcon className="h-5 w-5" />}
                        >
                            Create User
                        </Button>
                    </div>

                    <Card variant="glass">
                        <CardContent padding="md">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Roles</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                        <option value="ORG_ADMIN">Org Admin</option>
                                        <option value="THERAPIST">Therapist/Doctor</option>
                                        <option value="PATIENT">Patient</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent padding="none">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Registered</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                    No users found matches your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                {user.name || 'Unnamed User'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {user.is_verified ? (
                                                            <span className="flex items-center text-green-600 text-xs font-medium">
                                                                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                                                                Verified
                                                            </span>
                                                        ) : (
                                                            <span className="text-yellow-600 text-xs font-medium">
                                                                Unverified
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mr-2"
                                                            onClick={() => window.location.href = `/dashboard/super-admin/users/${user.id}`}
                                                        >
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(user.id)}
                                                            disabled={updatingId === user.id}
                                                            title="Delete User"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Modal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        title="Create New User"
                        size="md"
                    >
                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="John Doe"
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                            <Input
                                label="Password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="******"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Role
                                </label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="ORG_ADMIN">Organization Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                    <option value="GEN_ADMIN">General Admin</option>
                                    <option value="DOCTOR">Doctor</option>
                                    <option value="PATIENT">Patient</option>
                                </select>
                            </div>
                        </div>
                        <ModalFooter>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleCreateUser}>
                                Create User
                            </Button>
                        </ModalFooter>
                    </Modal>

                </div>
            </DashboardLayout>
        </DashboardGuard>
    );
}
