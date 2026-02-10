'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function GenAdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', role: 'PATIENT', organization: '' });

    useEffect(() => {
        // TODO: Load from API
        setUsers([
            { id: '1', name: 'John Doe', email: 'john@example.com', role: 'PATIENT', organization: 'Org A', status: 'active' },
            { id: '2', name: 'Dr. Smith', email: 'smith@example.com', role: 'THERAPIST', organization: 'Org B', status: 'active' },
        ]);
    }, []);

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'danger';
            case 'GEN_ADMIN':
            case 'ORG_ADMIN': return 'warning';
            case 'THERAPIST': return 'info';
            case 'PATIENT': return 'success';
            default: return 'default';
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            User Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage all users across organizations
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

                <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Card>
                    <CardContent padding="none">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {user.organization}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="success">Active</Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create User" size="md">
                    <div className="space-y-4">
                        <Input label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option value="PATIENT">Patient</option>
                                <option value="THERAPIST">Therapist</option>
                                <option value="ORG_ADMIN">Organization Admin</option>
                            </select>
                        </div>
                    </div>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={() => { toast.success('User created!'); setIsCreateModalOpen(false); }}>Create</Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
