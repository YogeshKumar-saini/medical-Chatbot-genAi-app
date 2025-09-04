'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication status and redirect accordingly
    const checkAuth = () => {
      if (apiClient.isAuthenticated()) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  // Loading state while checking authentication
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading MediAI Pro...</p>
      </div>
    </div>
  );
}
