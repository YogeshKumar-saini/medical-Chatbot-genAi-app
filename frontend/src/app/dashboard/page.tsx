'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/lib/store';
import DashboardGuard from '@/components/DashboardGuard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Redirect to role-specific dashboard
    const roleRoutes: Record<UserRole, string> = {
      SUPER_ADMIN: '/dashboard/super-admin',
      GEN_ADMIN: '/dashboard/gen-admin',
      ORG_ADMIN: '/dashboard/org-admin',
      THERAPIST: '/dashboard/therapist',
      PATIENT: '/dashboard/patient',
    };

    if (user?.role) {
      router.push(roleRoutes[user.role]);
    }
  }, [isAuthenticated, user, router]);

  return (
    <DashboardGuard>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    </DashboardGuard>
  );
}