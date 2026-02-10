'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { CalendarIcon, ClockIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [reason, setReason] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getAppointments('patient');
            setAppointments(data.appointments || []);
        } catch (error) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (doctorId: string) => {
        try {
            const data = await apiClient.getAppointmentSlots(doctorId);
            setSlots(data.slots || []);
        } catch (error) {
            toast.error('Failed to load slots');
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }

        try {
            await apiClient.bookAppointment({
                slot_id: selectedSlot,
                reason,
                notes: '',
            });
            toast.success('Appointment booked successfully!');
            setIsBookingModalOpen(false);
            setSelectedSlot('');
            setReason('');
            loadAppointments();
        } catch (error: any) {
            toast.error(error.message || 'Failed to book appointment');
        }
    };

    const handleJoinAppointment = (appointmentId: string) => {
        // Redirect to our internal meeting page
        const url = `/dashboard/meeting/${appointmentId}`;
        window.open(url, '_blank');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
                return 'info';
            case 'COMPLETED':
                return 'success';
            case 'CANCELLED':
                return 'danger';
            default:
                return 'default';
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
                            My Appointments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            View and manage your appointments
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsBookingModalOpen(true)}
                        leftIcon={<CalendarIcon className="h-5 w-5" />}
                    >
                        Book Appointment
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {appointments.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent padding="lg">
                                <div className="text-center py-12">
                                    <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No appointments yet
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => setIsBookingModalOpen(true)}
                                    >
                                        Book Your First Appointment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        appointments.map((appointment) => (
                            <Card key={appointment.id} hover>
                                <CardContent padding="md">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    Dr. {appointment.doctor_name || 'Unknown'}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {appointment.reason || 'General Consultation'}
                                                </p>
                                            </div>
                                            <Badge variant={getStatusColor(appointment.status)}>
                                                {appointment.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <CalendarIcon className="h-4 w-4" />
                                                {new Date(appointment.start_time).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <ClockIcon className="h-4 w-4" />
                                                {new Date(appointment.start_time).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>

                                        {appointment.status === 'SCHEDULED' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleJoinAppointment(appointment.id)}
                                                leftIcon={<VideoCameraIcon className="h-4 w-4" />}
                                            >
                                                Join Appointment
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Modal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    title="Book Appointment"
                    size="md"
                >
                    <div className="space-y-4">
                        <Select
                            label="Select Doctor"
                            value={selectedDoctor}
                            onChange={(value) => {
                                setSelectedDoctor(value);
                                loadSlots(value);
                            }}
                            options={[
                                { value: '', label: 'Choose a doctor' },
                                // TODO: Load from API
                            ]}
                        />

                        {slots.length > 0 && (
                            <Select
                                label="Select Time Slot"
                                value={selectedSlot}
                                onChange={setSelectedSlot}
                                options={[
                                    { value: '', label: 'Choose a time slot' },
                                    ...slots.map((slot) => ({
                                        value: slot.id,
                                        label: `${new Date(slot.start_time).toLocaleString()}`,
                                    })),
                                ]}
                            />
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Reason for Visit
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                rows={3}
                                placeholder="Describe your symptoms or reason for visit..."
                            />
                        </div>
                    </div>

                    <ModalFooter>
                        <Button variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleBookAppointment}>
                            Book Appointment
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </DashboardLayout>
    );
}
