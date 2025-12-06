"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Activity, FileText, Pill, User, Calendar,
    AlertCircle, History, Stethoscope
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import DashboardGuard from '@/components/DashboardGuard';
import ClinicalNotes from '@/components/clinical/ClinicalNotes';
import PrescriptionWriter from '@/components/clinical/PrescriptionWriter';

export default function PatientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params?.id as string;

    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'prescriptions'>('overview');
    const [prescriptions, setPrescriptions] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiClient.getPatientDetails(patientId);
                setPatient(data);

                if (activeTab === 'prescriptions') {
                    const rxData = await apiClient.getRx(patientId);
                    setPrescriptions(rxData);
                }
            } catch (error) {
                console.error("Failed to fetch patient details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (patientId) fetchData();
    }, [patientId, activeTab]);

    return (
        <DashboardGuard allowedRoles={['DOCTOR', 'THERAPIST', 'SUPER_ADMIN', 'GEN_ADMIN']}>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {loading ? 'Loading Patient...' : patient?.name || 'Patient Profile'}
                        </h1>
                        <p className="text-sm text-gray-500">Clinical Dashboard</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : !patient ? (
                    <div className="p-12 text-center bg-red-50 text-red-600 rounded-xl">
                        Patient not found or unauthorized access.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Sidebar / Info Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600 text-2xl font-bold">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-900">{patient.name}</h2>
                                    <span className="text-sm text-gray-500">{patient.email}</span>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>Age: {patient.date_of_birth ? 'N/A' : 'Not set'}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-sm text-gray-600">
                                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                                        <div>
                                            <span className="block font-medium text-gray-900">Allergies</span>
                                            {patient.allergies?.length ? patient.allergies.join(", ") : "None known"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Tabs (Sidebar style on Desktop) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors text-left ${activeTab === 'overview' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Activity className="w-5 h-5" />
                                    <span className="font-medium">Overview & Vitals</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors text-left ${activeTab === 'notes' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">Clinical Notes</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('prescriptions')}
                                    className={`w-full flex items-center gap-3 px-6 py-4 transition-colors text-left ${activeTab === 'prescriptions' ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Pill className="w-5 h-5" />
                                    <span className="font-medium">Prescriptions</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <History className="w-5 h-5 text-blue-500" />
                                            Medical History
                                        </h3>
                                        <p className="text-gray-600 whitespace-pre-wrap">
                                            {patient.medical_history || "No medical history recorded."}
                                        </p>
                                    </div>

                                    {/* Vitals Placeholder - Could be a component later */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-70">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-green-500" />
                                            Recent Vitals
                                        </h3>
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            Vital signs tracking coming soon...
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <ClinicalNotes patientId={patientId} />
                            )}

                            {activeTab === 'prescriptions' && (
                                <div className="space-y-6">
                                    <PrescriptionWriter
                                        patientId={patientId}
                                        onSuccess={() => {
                                            // Refresh logic could go here
                                            if (activeTab === 'prescriptions') {
                                                apiClient.getRx(patientId).then(setPrescriptions);
                                            }
                                        }}
                                    />

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 mt-8">Past Prescriptions</h3>
                                        {prescriptions.length === 0 ? (
                                            <div className="text-gray-500 italic">No prescriptions found.</div>
                                        ) : (
                                            prescriptions.map((rx: any) => (
                                                <div key={rx.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                                    <div className="flex justify-between mb-3 text-sm text-gray-500">
                                                        <span>Issued: {new Date(rx.issued_at).toLocaleDateString()}</span>
                                                        <span>Dr. {rx.doctor_name}</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {rx.items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                                                <div className="font-medium text-gray-900">{item.medication_name}</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {item.dosage} • {item.frequency} for {item.duration}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {rx.notes && (
                                                        <div className="mt-3 text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100">
                                                            Note: {rx.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardGuard>
    );
}
