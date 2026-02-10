'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function GenAdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getOrganizations();
            setOrganizations(data.organizations || []);
        } catch (error) {
            toast.error('Failed to load organizations');
        } finally {
            setLoading(false);
        }
    };

    const filteredOrgs = organizations.filter(org =>
        org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.slug?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Organizations
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View and manage all organizations
                    </p>
                </div>

                <Input
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrgs.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No organizations found
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredOrgs.map((org) => (
                            <Card key={org.id} hover>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle>{org.name}</CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                @{org.slug}
                                            </p>
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {org.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {org.description}
                                        </p>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Members</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {org.member_count || 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Created</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {new Date(org.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
