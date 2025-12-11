"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, ChevronRight, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import DashboardGuard from '@/components/DashboardGuard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function PatientsListPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPatients = async () => {
        try {
            const data = await apiClient.getDoctorLinks();
            const allLinks = data || [];

            // Separate pending and active patients
            const pending = allLinks.filter((link: any) => link.status === 'PENDING');
            const active = allLinks.filter((link: any) =>
                ['APPROVED', 'ACTIVE'].includes(link.status)
            );

            setPendingRequests(pending);
            setPatients(active);
        } catch (error) {
            console.error("Failed to fetch patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkStatus = async (linkId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await apiClient.updateLinkStatus(linkId, status);
            toast.success(`Patient request ${status.toLowerCase()}`);
            fetchPatients(); // Reload the list
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p =>
        p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardGuard allowedRoles={['DOCTOR', 'THERAPIST']}>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-8 h-8 text-blue-600" />
                            My Patients
                        </h1>
                        <p className="text-gray-500">Manage your patient list and clinical records</p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        />
                    </div>
                </div>

                {/* Pending Patient Requests */}
                {!loading && pendingRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-600" />
                                Pending Patient Requests ({pendingRequests.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pendingRequests.map((request: any) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-lg">
                                                {request.patient_name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {request.patient_name || 'Unknown Patient'}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Requested on {new Date(request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleLinkStatus(request.id, 'APPROVED')}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleLinkStatus(request.id, 'REJECTED')}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-gray-900 font-medium">No patients found</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            {searchTerm ? 'Try adjusting your search terms' : 'You have no confirmed patients yet'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPatients.map((patient) => (
                            <Link
                                key={patient.patient_id}
                                href={`/dashboard/therapist/patients/${patient.patient_id}`}
                                className="block group"
                            >
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {patient.patient_name?.charAt(0) || 'P'}
                                        </div>
                                        <Badge variant="success">Active</Badge>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {patient.patient_name || 'Unknown Patient'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">Patient ID: {patient.patient_id.slice(-6)}</p>

                                    <div className="flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        View Clinical Profile <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardGuard>
    );
}
