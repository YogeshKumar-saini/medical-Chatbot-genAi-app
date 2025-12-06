'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { BuildingOfficeIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SuperAdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            // Fetch ALL organizations (including unverified)
            const response = await apiClient['client'].get('/api/v1/onboarding/organizations?verified_only=false');
            setOrganizations(response.data || []);
        } catch (error) {
            toast.error('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (orgId: string, verify: boolean) => {
        try {
            await apiClient.verifyOrganization(orgId, verify);
            toast.success(verify ? 'Organization verified' : 'Organization unverified');
            loadOrganizations();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.slug) {
            toast.error('Name and slug are required');
            return;
        }

        try {
            await apiClient.createOrganization(formData);
            toast.success('Organization created successfully!');
            setIsCreateModalOpen(false);
            setFormData({ name: '', slug: '', description: '' });
            loadOrganizations();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create organization');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Organizations
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage all organizations in the system
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        leftIcon={<PlusIcon className="h-5 w-5" />}
                    >
                        Create Organization
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations.map((org) => (
                        <Card key={org.id} hover>
                            <CardContent padding="md">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {org.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                @{org.slug}
                                            </p>
                                            {org.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                    {org.description}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={org.is_verified ? 'success' : 'warning'}>
                                            {org.is_verified ? 'Verified' : 'Unverified'}
                                        </Badge>
                                    </div>

                                    <div className="flex gap-2">
                                        {!org.is_verified ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50"
                                                onClick={() => handleVerify(org.id, true)}
                                            >
                                                Verify
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                                                onClick={() => handleVerify(org.id, false)}
                                            >
                                                Unverify
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => window.location.href = `/dashboard/super-admin/organizations/${org.id}`}
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="flex-1"
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this organization?')) {
                                                    try {
                                                        await apiClient.deleteOrganization(org.id);
                                                        toast.success('Organization deleted');
                                                        loadOrganizations();
                                                    } catch (e: any) {
                                                        toast.error(e.message || 'Failed to delete');
                                                    }
                                                }
                                            }}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create Organization"
                    size="md"
                >
                    <div className="space-y-4">
                        <Input
                            label="Organization Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter organization name"
                        />

                        <Input
                            label="Slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="organization-slug"
                        />

                        <Textarea
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter description (optional)"
                            rows={3}
                        />
                    </div>

                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreate}>
                            Create
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
