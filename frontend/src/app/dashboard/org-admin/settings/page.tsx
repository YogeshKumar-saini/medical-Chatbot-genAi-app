'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function OrgAdminSettingsPage() {
    const [settings, setSettings] = useState({
        name: 'My Organization',
        slug: 'my-org',
        description: '',
        website: '',
        email: '',
        phone: '',
        is_verified: false,
    });
    const [loading, setLoading] = useState(false);
    const [myOrgId, setMyOrgId] = useState<string | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    React.useEffect(() => {
        const fetchMyOrg = async () => {
            try {
                const org = await apiClient.getMyOrganization();
                if (org) {
                    setMyOrgId(org.id);
                    setSettings(prev => ({ ...prev, id: org.id, name: org.name, slug: org.slug, description: org.description || '', is_verified: org.is_verified, website: org.website || '', email: org.email || '', phone: org.phone || '' }));
                }
            } catch (err) {
                console.error("Failed to fetch my org", err);
            }
        };
        fetchMyOrg();
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);
            const { name, description, website, phone, email } = settings;
            await apiClient.updateOrganization({ name, description, website, phone, email });
            toast.success('Settings updated successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!newAdminEmail) {
            toast.error('Please enter the email of the new admin');
            return;
        }

        setTransferLoading(true);
        try {
            // 1. Lookup user by email
            const user = await apiClient.lookupUser(newAdminEmail);

            if (user.role !== 'ORG_ADMIN') {
                toast.error('The user must have the ORG_ADMIN role');
                return;
            }

            if (!confirm(`Are you sure you want to transfer ownership to ${user.name || user.email}? This action cannot be undone.`)) {
                return;
            }

            // 2. Transfer
            // myOrgId is set in useEffect
            if (!myOrgId) {
                toast.error("Organization ID not found");
                return;
            }

            await apiClient.transferOrgOwnership(myOrgId, user.id);
            toast.success('Ownership transferred successfully');

            // Optional: Redirect to login or dashboard
            window.location.href = '/dashboard';
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to transfer ownership');
        } finally {
            setTransferLoading(false);
            setIsTransferModalOpen(false);
            setNewAdminEmail('');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Organization Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your organization details
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input
                                label="Organization Name"
                                value={settings.name}
                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                placeholder="Enter organization name"
                            />

                            <Input
                                label="Slug"
                                value={settings.slug}
                                onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
                                placeholder="organization-slug"
                                helperText="Used in URLs and identifiers"
                                disabled={true}
                            />

                            <Textarea
                                label="Description"
                                value={settings.description}
                                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                placeholder="Describe your organization..."
                                rows={3}
                            />

                            <Input
                                label="Website"
                                type="url"
                                value={settings.website}
                                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                placeholder="https://example.com"
                            />

                            <Input
                                label="Email"
                                type="email"
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                placeholder="contact@example.com"
                            />

                            <Input
                                label="Phone"
                                type="tel"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />

                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={handleSave}
                                isLoading={loading}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                    <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                        <CardContent padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Transfer Ownership</h4>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        Transfer this organization to another administrator. You will lose your admin privileges.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => setIsTransferModalOpen(true)}
                                >
                                    Transfer Ownership
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    {/* Background backdrop */}
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                        Transfer Ownership
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Enter the email of the new Organization Admin. Warning: You will lose access to this dashboard immediately after transfer.
                                        </p>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700">New Admin Email</label>
                                            <input
                                                type="email"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                value={newAdminEmail}
                                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                                placeholder="new.admin@example.com"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                        onClick={handleTransferOwnership}
                                        disabled={transferLoading}
                                    >
                                        {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setIsTransferModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
