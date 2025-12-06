'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientOnboardingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        date_of_birth: '',
        gender: 'OTHER',
        phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_history: '',
        organization_id: '',
    });
    const [loading, setLoading] = useState(false);

    const [organizations, setOrganizations] = useState<any[]>([]);

    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const orgs = await apiClient.getOrganizations();
                setOrganizations(orgs);
            } catch (err) {
                console.error("Failed to load organizations", err);
            }
        };
        fetchOrgs();
    }, []);

    // Role guard: ensure only patients can access this page
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role && role !== 'PATIENT') {
            toast.error(`This page is for patients only. Your role is: ${role}`);

            // Redirect to appropriate page based on role
            if (role === 'THERAPIST') {
                router.push('/auth/onboarding/doctor');
            } else {
                router.push('/dashboard');
            }
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            await apiClient.createPatientProfile(formData);
            toast.success('Profile created successfully!');

            // Check status to determine where to route
            const status = await apiClient.getOnboardingStatus();

            if (status.org_approval_status === 'PENDING') {
                // Organization approval required
                router.push('/auth/pending-approval');
            } else {
                // Should go to selecting a doctor in the organization
                // Or "Link Request" page, but better if we show "Doctors in your Organization"
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to create profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Help us provide better care
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Hospital / Organization</label>
                            <select
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                                value={formData.organization_id}
                                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                                required
                            >
                                <option value="">Select an Organization</option>
                                {organizations.map((org: any) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Gender
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Phone Number"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            required
                        />

                        <Textarea
                            label="Address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Your full address"
                            rows={2}
                        />

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Contact Name"
                                    value={formData.emergency_contact_name}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                    placeholder="Full name"
                                    required
                                />

                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    value={formData.emergency_contact_phone}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                    required
                                />
                            </div>
                        </div>

                        <Textarea
                            label="Medical History (Optional)"
                            value={formData.medical_history}
                            onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                            placeholder="Any relevant medical history, allergies, or conditions..."
                            rows={3}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={loading}
                        >
                            Complete Profile
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
