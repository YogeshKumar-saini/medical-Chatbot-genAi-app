'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
// import { Select } from '@/components/ui/Select';
// import { Textarea } from '@/components/ui/Input';
import { CalendarIcon, ClockIcon, PlusIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TherapistAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [isCreateSlotModalOpen, setIsCreateSlotModalOpen] = useState(false);
    const [slotData, setSlotData] = useState({ start_time: '', end_time: '', is_available: true });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [appointmentsData, slotsData] = await Promise.all([
                apiClient.getAppointments('doctor'),
                apiClient.getAppointmentSlots(),
            ]);
            setAppointments(appointmentsData.appointments || []);
            setSlots(slotsData.slots || []);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSlot = async () => {
        if (!slotData.start_time || !slotData.end_time) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            await apiClient.createAppointmentSlot(slotData);
            toast.success('Slot created successfully!');
            setIsCreateSlotModalOpen(false);
            setSlotData({ start_time: '', end_time: '', is_available: true });
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create slot');
        }
    };

    const handleUpdateAppointment = async (id: string, status: string) => {
        try {
            await apiClient.updateAppointment(id, { status });
            toast.success('Appointment updated!');
            loadData();
        } catch {
            toast.error('Failed to update appointment');
        }
    };

    const handleJoinAppointment = (appointmentId: string) => {
        window.open(`/dashboard/meeting/${appointmentId}`, '_blank');
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
                            Appointments & Scheduling
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your schedule and appointments
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateSlotModalOpen(true)}
                        leftIcon={<PlusIcon className="h-5 w-5" />}
                    >
                        Create Slot
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {appointments.filter(a => a.status === 'SCHEDULED').length === 0 ? (
                                    <p className="text-center py-8 text-gray-600 dark:text-gray-400">
                                        No upcoming appointments
                                    </p>
                                ) : (
                                    appointments.filter(a => a.status === 'SCHEDULED').map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {apt.patient_name || 'Patient'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {apt.reason || 'General consultation'}
                                                    </p>
                                                </div>
                                                <Badge variant="info">{apt.status}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {new Date(apt.start_time).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <ClockIcon className="h-4 w-4" />
                                                    {new Date(apt.start_time).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleJoinAppointment(apt.id)}
                                                    leftIcon={<VideoCameraIcon className="h-4 w-4" />}
                                                >
                                                    Join
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleUpdateAppointment(apt.id, 'COMPLETED')}
                                                >
                                                    Mark Complete
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleUpdateAppointment(apt.id, 'CANCELLED')}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Available Slots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {slots.filter(s => s.is_available).length === 0 ? (
                                    <p className="text-center py-8 text-gray-600 dark:text-gray-400">
                                        No available slots
                                    </p>
                                ) : (
                                    slots.filter(s => s.is_available).map((slot) => (
                                        <div
                                            key={slot.id}
                                            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ClockIcon className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {new Date(slot.start_time).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="success">Available</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Modal
                    isOpen={isCreateSlotModalOpen}
                    onClose={() => setIsCreateSlotModalOpen(false)}
                    title="Create Appointment Slot"
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Time
                            </label>
                            <input
                                type="datetime-local"
                                value={slotData.start_time}
                                onChange={(e) => setSlotData({ ...slotData, start_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Time
                            </label>
                            <input
                                type="datetime-local"
                                value={slotData.end_time}
                                onChange={(e) => setSlotData({ ...slotData, end_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsCreateSlotModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreateSlot}>
                            Create Slot
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
