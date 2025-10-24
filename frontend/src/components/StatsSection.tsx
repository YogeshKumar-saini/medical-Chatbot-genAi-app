'use client';

import { Users, MessageSquare, FileText, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { icon: Users, value: '10,000+', label: 'Active Users' },
  { icon: MessageSquare, value: '2.5M+', label: 'AI Responses' },
  { icon: FileText, value: '50K+', label: 'Documents' },
  { icon: TrendingUp, value: '99.8%', label: 'Success Rate' },
];

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-blue-100 py-24 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl text-gray-800 font-extrabold mb-4">
            Trusted by Healthcare Professionals
          </h2>
          <p className="text-lg lg:text-xl text-gray-600">
            Join thousands of users already benefiting from MediAI Pro
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="text-center rounded-2xl p-8 bg-white/20 backdrop-blur-sm border border-white/10 hover:scale-105 transition-transform duration-500"
            >
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-white/30 rounded-xl shadow-lg">
                <stat.icon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-3xl lg:text-4xl font-extrabold text-gray-500 mb-2">{stat.value}</div>
              <div className="text-gray-600  font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
