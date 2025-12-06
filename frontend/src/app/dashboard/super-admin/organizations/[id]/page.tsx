'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
    BuildingOfficeIcon,
    UserIcon,
    ArrowLeftIcon,
    AcademicCapIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import DashboardGuard from '@/components/DashboardGuard';

export default function OrganizationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [details, setDetails] = useState<any>(null);
    const [members, setMembers] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'doctors' | 'patients'>('doctors');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            loadData();
        }
    }, [orgId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [detailsData, membersData] = await Promise.all([
                apiClient.getOrganizationDetails(orgId),
                apiClient.getOrganizationMembers(orgId)
            ]);
            setDetails(detailsData);
            setMembers(membersData);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load organization data');
        } finally {
            setLoading(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!newAdminEmail) {
            toast.error('Please enter the email of the new admin');
            return;
        }

        try {
            setTransferLoading(true);
            // First find the user by email (we need their ID)
            // We can re-use getAdminUsers for this search
            const users = await apiClient.getAdminUsers({ search: newAdminEmail, role: 'ORG_ADMIN', limit: 1 });

            if (!users || users.length === 0) {
                toast.error('No Organization Admin found with this email');
                return;
            }

            const newAdmin = users[0];

            // Confirm they match exactly (search is regex usually, but limit 1 helps)
            if (newAdmin.email.toLowerCase() !== newAdminEmail.toLowerCase()) {
                if (!confirm(`Did you mean to transfer to ${newAdmin.email}?`)) {
                    return;
                }
            }

            await apiClient.transferOrgOwnership(orgId, newAdmin.id);
            toast.success(`Ownership transferred to ${newAdmin.name || newAdmin.email}`);
            setIsTransferModalOpen(false);
            setNewAdminEmail('');
            loadData(); // Reload to see changes
        } catch (error: any) {
            toast.error(error.message || 'Transfer failed');
        } finally {
            setTransferLoading(false);
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

    if (!details) return null;

    return (
        <DashboardGuard allowedRoles={['SUPER_ADMIN']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
                            Back to Organizations
                        </Button>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                                <BuildingOfficeIcon className="h-10 w-10 text-blue-600 p-2 bg-blue-100 rounded-lg" />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {details.org.name}
                                    </h1>
                                    <p className="text-gray-500 text-sm">@{details.org.slug}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <Badge variant={details.org.is_verified ? 'success' : 'warning'}>
                                    {details.org.is_verified ? 'Verified' : 'Unverified'}
                                </Badge>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsTransferModalOpen(true)}
                                >
                                    Transfer Ownership
                                </Button>
                            </div>
                        </div>
                        {details.org.description && (
                            <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl">
                                {details.org.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Admin Info Card */}
                        <Card>
                            <CardContent padding="md">
                                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Organization Admin</h3>
                                {details.admin ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {details.admin.name?.[0] || 'A'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{details.admin.name}</p>
                                            <p className="text-sm text-gray-500">{details.admin.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No admin assigned</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stats Cards */}
                        <Card>
                            <CardContent padding="md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase">Doctors</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{details.stats.doctors_count}</p>
                                    </div>
                                    <AcademicCapIcon className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent padding="md">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase">Patients</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{details.stats.patients_count}</p>
                                    </div>
                                    <UserGroupIcon className="h-8 w-8 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Members Tabs */}
                    <div className="mt-8">
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('doctors')}
                                    className={`
                              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                              ${activeTab === 'doctors'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                          `}
                                >
                                    Doctors ({members?.doctors.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('patients')}
                                    className={`
                              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                              ${activeTab === 'patients'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                          `}
                                >
                                    Patients ({members?.patients.length || 0})
                                </button>
                            </nav>
                        </div>

                        <Card>
                            <CardContent padding="none">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                                {activeTab === 'doctors' && (
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Specialization</th>
                                                )}
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {(activeTab === 'doctors' ? members?.doctors : members?.patients)?.map((member: any) => (
                                                <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                        {member.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500">
                                                        {member.email}
                                                    </td>
                                                    {activeTab === 'doctors' && (
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {member.specialization}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                const url = activeTab === 'doctors'
                                                                    ? `/dashboard/super-admin/doctors/${member.id}`
                                                                    : `/dashboard/therapist/patients/${member.id}`;
                                                                router.push(url);
                                                            }}
                                                        >
                                                            View Profile
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!members || (activeTab === 'doctors' ? members.doctors.length === 0 : members.patients.length === 0)) && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                        No {activeTab} found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    {/* Modal Layer */}
                    {isTransferModalOpen && (
                        <div className="pointer-events-auto fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">

                                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                                </div>

                                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                                <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                                <UserIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                                            </div>
                                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                                    Transfer Ownership
                                                </h3>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-500">
                                                        Enter the email address of the new Organization Admin. This user MUST already exist and have the 'ORG_ADMIN' role.
                                                    </p>
                                                    <div className="mt-4">
                                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">New Admin Email</label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            id="email"
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                            placeholder="admin@example.com"
                                                            value={newAdminEmail}
                                                            onChange={(e) => setNewAdminEmail(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                            onClick={handleTransferOwnership}
                                            disabled={transferLoading}
                                        >
                                            {transferLoading ? 'Transferring...' : 'Transfer Ownership'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                            onClick={() => setIsTransferModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </DashboardGuard>
    );
}
