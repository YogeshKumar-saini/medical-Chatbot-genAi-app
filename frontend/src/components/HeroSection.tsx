'use client';

import { useRouter } from 'next/navigation';
import { Brain, Shield, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-blue-100 py-24 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6"
          >
            <Zap className="h-4 w-4 mr-2" />
            Powered by Advanced AI Technology
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Medical AI Assistant
            </span>
            <br />
            for Modern Healthcare
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
          >
            Experience the future of medical assistance with our AI-powered platform.
            Get instant, accurate medical information tailored to your role and needs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => router.push('/auth/signup')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition-all duration-300 text-lg font-semibold flex items-center justify-center transform hover:-translate-y-1"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-gray-400 hover:bg-gray-100 transition-all duration-300 text-lg font-semibold"
            >
              Sign In
            </button>
          </motion.div>
        </div>

        {/* Hero Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            { icon: Brain, title: 'Smart AI', desc: 'Contextual medical intelligence', gradient: 'from-blue-600 to-indigo-600' },
            { icon: Shield, title: 'Secure', desc: 'HIPAA compliant protection', gradient: 'from-green-600 to-emerald-600' },
            { icon: Zap, title: 'Fast', desc: 'Instant responses 24/7', gradient: 'from-orange-600 to-red-600' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              className="bg-white p-8 rounded-2xl shadow-xl text-center hover:scale-105 transition-transform duration-500"
              whileHover={{ scale: 1.08 }}
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-r ${feature.gradient} shadow-lg`}
              >
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{feature.title}</h3>
              <p className="text-gray-500 mt-2">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
