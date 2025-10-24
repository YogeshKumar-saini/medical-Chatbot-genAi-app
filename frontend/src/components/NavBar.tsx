'use client';

import { useRouter } from 'next/navigation';
import { Stethoscope } from 'lucide-react';

export default function NavBar() {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MediAI Pro</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#upcoming" className="text-gray-600 hover:text-gray-900 transition-colors">Upcoming</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            <a href="#stats" className="text-gray-600 hover:text-gray-900 transition-colors">Stats</a>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Sign In
            </button>
          </div>
          <button
            onClick={() => router.push('/auth/login')}
            className="md:hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
