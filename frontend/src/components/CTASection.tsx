'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  const router = useRouter();

  return (
 <section className="relative overflow-hidden bg-gradient-to-t  from-blue-50 via-white to-blue-100 py-12 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>

      {/* Background glow accents */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-blue-400/30 blur-3xl rounded-full opacity-20" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-400/30 blur-3xl rounded-full opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 bg-white/10 text-gray-700  px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-yellow-300"  />
              <span>AI-Powered Healthcare Revolution</span>
            </div>
          </div>

          <h2 className="text-5xl font-extrabold  text-gray-800 mb-6 leading-tight">
            Ready to Transform Your Medical Experience?
          </h2>
          <p className=" text-gray-700 text-xl  max-w-2xl  mx-auto mb-10">
            Join thousands of healthcare professionals and patients using{' '}
            <span className=" text-gray-800 font-semibold">MediAI Pro</span> for
            smarter, faster, and more reliable medical assistance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/auth/signup')}
              className="bg-white  text-blue-700 hover:text-blue-800 hover:shadow-[0_8px_24px_rgba(255,255,255,0.4)] px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/auth/login')}
              className="border-2 text-blue-900 border-white hover:bg-white hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
            >
              Sign In to Account
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
