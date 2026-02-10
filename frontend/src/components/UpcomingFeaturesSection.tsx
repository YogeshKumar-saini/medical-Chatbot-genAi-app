'use client';

import { motion } from 'framer-motion';
import { Brain, Shield, Zap, MessageSquare, TrendingUp, Users, FileText } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Advanced Diagnostic AI',
    description:
      'AI-powered diagnostic assistance with image analysis and predictive insights for faster, more accurate diagnoses.',
    gradient: 'from-cyan-500 to-blue-600',
    timeline: 'Q1 2025',
  },
  {
    icon: Shield,
    title: 'Blockchain Health Records',
    description:
      'Secure, decentralized health record management with immutable audit trails and patient-controlled data sharing.',
    gradient: 'from-emerald-500 to-teal-600',
    timeline: 'Q2 2025',
  },
  {
    icon: MessageSquare,
    title: 'Multilingual Support',
    description:
      'Break language barriers with comprehensive multilingual AI support for global healthcare accessibility.',
    gradient: 'from-rose-500 to-pink-600',
    timeline: 'Q3 2025',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description:
      'Advanced analytics dashboard with predictive insights for patient outcomes and resource optimization.',
    gradient: 'from-amber-500 to-orange-600',
    timeline: 'Q4 2025',
  },
  {
    icon: Users,
    title: 'Telemedicine Integration',
    description:
      'Seamless integration with telemedicine platforms for comprehensive virtual care management.',
    gradient: 'from-violet-500 to-purple-600',
    timeline: 'Q1 2026',
  },
  {
    icon: FileText,
    title: 'Voice Commands',
    description:
      'Hands-free operation with advanced voice recognition for medical professionals in high-pressure environments.',
    gradient: 'from-indigo-500 to-blue-600',
    timeline: 'Q2 2026',
  },
];

export default function UpcomingFeaturesSection() {
  return (
  <section className="relative overflow-hidden bg-gradient-to-t from-blue-50 via-white to-blue-100 py-24 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>      {/* Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 opacity-20 blur-3xl rounded-full animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-300 opacity-20 blur-3xl rounded-full animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full text-sm font-medium mb-6 shadow-sm">
            <Zap className="h-4 w-4 mr-2" />
            Coming Soon
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Exciting Features on the Horizon
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            We’re continuously innovating to bring the most advanced AI capabilities to healthcare.
            Here’s what’s next for <span className="font-semibold text-indigo-600">MediAI Pro</span>.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="relative group bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
            >
              <div
                className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
              >
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                {feature.description}
              </p>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-pulse" />
                {feature.timeline}
              </div>
              {/* Hover Shine */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-3xl"></div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-6">
            Want to be the first to experience these innovations?
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
            Join Waitlist
          </button>
        </motion.div>
      </div>
    </section>
  );
}
