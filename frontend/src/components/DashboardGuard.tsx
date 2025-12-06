'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
    const router = useRouter();

    useEffect(() => {
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            // Check Role
            if (allowedRoles && allowedRoles.length > 0) {
                const role = localStorage.getItem('role');
                if (!role || !allowedRoles.includes(role)) {
                    toast.error('Unauthorized access');
                    router.push('/dashboard');
                    return;
                }
            }

            const status = await apiClient.getOnboardingStatus();

            // Check if user can access dashboard
            if (!status.is_onboarded) {
                const role = localStorage.getItem('role');
                toast.error('Please complete your onboarding first');

                if (role === 'PATIENT') {
                    router.push('/auth/onboarding/patient');
                } else if (role === 'THERAPIST') {
                    router.push('/auth/onboarding/doctor');
                } else {
                    router.push('/auth/login');
                }
            } else if (status.org_approval_status === 'PENDING') {
                toast.error('Waiting for organization approval');
                router.push('/auth/pending-approval');
            } else if (status.org_approval_status === 'REJECTED') {
                toast.error('Your organization request was rejected');
                router.push('/auth/rejected');
            } else if (status.doctor_link_status === 'PENDING') {
                toast.error('Waiting for doctor approval');
                router.push('/auth/pending-doctor');
            } else if (status.doctor_link_status === 'REJECTED') {
                toast.error('Your doctor link request was rejected');
                router.push('/auth/rejected');
            } else if (status.doctor_link_status === 'NOT_STARTED' && localStorage.getItem('role') === 'PATIENT') {
                toast.error('Please request a doctor link first');
                router.push('/auth/link-request');
            }
            // If all checks pass, allow access (children will render)
        } catch (error) {
            console.error('Failed to check access:', error);
            // On error, allow access (fail open for better UX)
        }
    };

    return <>{children}</>;
}
