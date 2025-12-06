'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import DashboardGuard from '@/components/DashboardGuard';

interface deleteRequest {
    id: string;
    target_user_id: string;
    target_user_name?: string;
    target_user_email: string;
    target_user_role: string;
    org_id: string;
    requested_by: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

export default function OrgAdminRequestsPage() {
    const [requests, setRequests] = useState<deleteRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getDeleteRequests();
            setRequests(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (requestId: string) => {
        if (!confirm('Approve deletion? The user will be permanently deleted.')) return;
        setProcessingId(requestId);
        try {
            await apiClient.approveDeleteRequest(requestId);
            toast.success('Request Approved. User Deleted.');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve request');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!confirm('Reject deletion? The user will REMAIN in the organization.')) return;
        setProcessingId(requestId);
        try {
            await apiClient.rejectDeleteRequest(requestId);
            toast.success('Request Rejected.');
            fetchRequests();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject request');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardGuard allowedRoles={['ORG_ADMIN', 'SUPER_ADMIN']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrashIcon className="h-8 w-8 text-red-600" />
                            Deletion Requests
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Review requests from Super Admin to delete users from your organization.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto" />
                            </div>
                        ) : requests.length === 0 ? (
                            <Card>
                                <CardContent padding="md" className="text-center text-gray-500 py-12">
                                    No pending deletion requests.
                                </CardContent>
                            </Card>
                        ) : (
                            requests.map((req) => (
                                <Card key={req.id} variant={req.status === 'PENDING' ? 'default' : 'glass'}>
                                    <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                    Delete {req.target_user_role}: {req.target_user_name || req.target_user_email}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                                    ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Email: {req.target_user_email}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <ClockIcon className="h-3 w-3" />
                                                Requested on {new Date(req.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {req.status === 'PENDING' && (
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleApprove(req.id)}
                                                    disabled={processingId === req.id}
                                                >
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                    Approve (Delete)
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={processingId === req.id}
                                                >
                                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                                    Reject (Keep)
                                                </Button>
                                            </div>
                                        )}
                                        {req.status !== 'PENDING' && (
                                            <div className="text-sm text-gray-500 italic">
                                                Processed
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </DashboardGuard>
    );
}
