'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Stethoscope } from 'lucide-react';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import StatsSection from '@/components/StatsSection';
import UpcomingFeaturesSection from '@/components/UpcomingFeaturesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (apiClient.isAuthenticated()) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">Welcome to MediAI Pro</p>
          <p className="mt-2 text-sm text-gray-600">Loading your medical AI workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <UpcomingFeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
