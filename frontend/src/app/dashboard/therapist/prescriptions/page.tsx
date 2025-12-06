'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TherapistPrescriptionsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
    const [instructions, setInstructions] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAppointments('doctor');
            setAppointments(data.appointments?.filter((a: any) => a.status === 'COMPLETED') || []);
        } catch (error) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
    };

    const handleRemoveMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const handleCreatePrescription = async () => {
        if (!selectedAppointment) {
            toast.error('Please select an appointment');
            return;
        }

        const validMeds = medications.filter(m => m.name && m.dosage);
        if (validMeds.length === 0) {
            toast.error('Please add at least one medication');
            return;
        }

        try {
            await apiClient.createPrescription(selectedAppointment, {
                medications: validMeds,
                instructions,
            });
            toast.success('Prescription created successfully!');
            setIsCreateModalOpen(false);
            setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
            setInstructions('');
            setSelectedAppointment('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create prescription');
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
                            e-Prescriptions
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Create and manage prescriptions
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        leftIcon={<PlusIcon className="h-5 w-5" />}
                    >
                        Create Prescription
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {appointments.length === 0 ? (
                            <div className="text-center py-12">
                                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    No completed appointments
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {apt.patient_name || 'Patient'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(apt.start_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedAppointment(apt.id);
                                                setIsCreateModalOpen(true);
                                            }}
                                        >
                                            Create Prescription
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create Prescription"
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white">Medications</h4>
                                <Button variant="outline" size="sm" onClick={handleAddMedication}>
                                    Add Medication
                                </Button>
                            </div>

                            {medications.map((med, index) => (
                                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Medication Name"
                                            value={med.name}
                                            onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                                            placeholder="e.g., Aspirin"
                                        />
                                        <Input
                                            label="Dosage"
                                            value={med.dosage}
                                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                            placeholder="e.g., 500mg"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Frequency"
                                            value={med.frequency}
                                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                            placeholder="e.g., Twice daily"
                                        />
                                        <Input
                                            label="Duration"
                                            value={med.duration}
                                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                            placeholder="e.g., 7 days"
                                        />
                                    </div>
                                    {medications.length > 1 && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleRemoveMedication(index)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Textarea
                            label="Instructions"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Additional instructions for the patient..."
                            rows={3}
                        />
                    </div>

                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreatePrescription}>
                            Create Prescription
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
