'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TherapistGroupsPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', category: 'SUPPORT' });

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await apiClient.getGroups();
            setGroups(data.groups || []);
        } catch (error) {
            toast.error('Failed to load groups');
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroup.name) {
            toast.error('Please enter a group name');
            return;
        }

        try {
            await apiClient.createGroup(newGroup);
            toast.success('Group created successfully!');
            setIsCreateModalOpen(false);
            setNewGroup({ name: '', description: '', category: 'SUPPORT' });
            loadGroups();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create group');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Group Management</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage support groups</p>
                    </div>
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusIcon className="h-5 w-5" />}>
                        Create Group
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">No groups yet</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        groups.map((group) => (
                            <Card key={group.id} hover>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle>{group.name}</CardTitle>
                                        <Badge variant="info">{group.category}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{group.member_count || 0} members</span>
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Group" size="md">
                    <div className="space-y-4">
                        <Input label="Group Name" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Enter group name" />
                        <Textarea label="Description" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="Describe the group..." rows={3} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <select value={newGroup.category} onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                <option value="SUPPORT">Support</option>
                                <option value="THERAPY">Therapy</option>
                                <option value="EDUCATION">Education</option>
                            </select>
                        </div>
                    </div>
                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateGroup}>Create Group</Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
