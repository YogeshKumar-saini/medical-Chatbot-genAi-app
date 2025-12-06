'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DoctorOnboardingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        specialization: '',
        license_number: '',
        years_of_experience: '',
        bio: '',
        clinic_name: '',
        clinic_address: '',
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

    // Role guard: ensure only therapists/doctors can access this page
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role && role !== 'THERAPIST') {
            toast.error(`This page is for doctors/therapists only. Your role is: ${role}`);

            // Redirect to appropriate page based on role
            if (role === 'PATIENT') {
                router.push('/auth/onboarding/patient');
            } else {
                router.push('/dashboard');
            }
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            await apiClient.createDoctorProfile({
                ...formData,
                years_of_experience: parseInt(formData.years_of_experience) || 0,
            });

            toast.success('Profile created successfully! Waiting for organization approval.');
            router.push('/dashboard');
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
                    <CardTitle className="text-2xl text-center">Complete Your Professional Profile</CardTitle>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                        Help patients learn more about you
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
                                        {org.name} {org.is_verified ? '✅' : '(Unverified)'}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">You will need approval from the organization admin to be listed.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Specialization"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                placeholder="e.g., Psychiatry, Psychology"
                                required
                            />

                            <Input
                                label="License Number"
                                value={formData.license_number}
                                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                placeholder="Your medical license number"
                                required
                            />
                        </div>

                        <Input
                            label="Years of Experience"
                            type="number"
                            value={formData.years_of_experience}
                            onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                            placeholder="0"
                            min="0"
                            required
                        />

                        <Textarea
                            label="Professional Bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell patients about your experience and approach..."
                            rows={4}
                            required
                        />

                        <Input
                            label="Clinic/Practice Name"
                            value={formData.clinic_name}
                            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                            placeholder="Your clinic or practice name"
                        />

                        <Textarea
                            label="Clinic Address"
                            value={formData.clinic_address}
                            onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                            placeholder="Full address of your clinic"
                            rows={2}
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
