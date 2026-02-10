'use client';

import { Brain, Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Intelligence',
    description:
      'Advanced medical AI with real-time responses and contextual understanding',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description:
      'Secure authentication with tailored experiences for patients, doctors, and nurses',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description:
      'Comprehensive medical document library with intelligent search and retrieval',
    gradient: 'from-purple-500 to-violet-600',
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-t from-blue-50 via-white to-blue-100 py-24 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Powerful Features for Healthcare
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need in a modern medical AI assistant, designed for healthcare professionals and patients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl border border-gray-100 transition-transform duration-500 hover:-translate-y-2"
            >
              <div
                className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-r ${feature.gradient} shadow-lg`}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
