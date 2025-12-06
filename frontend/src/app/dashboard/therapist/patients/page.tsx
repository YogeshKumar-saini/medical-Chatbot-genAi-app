"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, ChevronRight, User } from 'lucide-react';
import { apiClient } from '@/lib/api';
import DashboardGuard from '@/components/DashboardGuard';
import { Badge } from '@/components/ui/Badge';

export default function PatientsListPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await apiClient.getDoctorLinks();
                // Filter only active/approved patients
                const activePatients = (data.links || []).filter((link: any) =>
                    ['APPROVED', 'ACTIVE'].includes(link.status)
                );
                setPatients(activePatients);
            } catch (error) {
                console.error("Failed to fetch patients:", error);
            } finally {
                setLoading(false);
            }
        };
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
