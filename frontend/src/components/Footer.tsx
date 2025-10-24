import { Stethoscope, Linkedin, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-blue-100 py-24 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>

      <footer className="relative max-w-7xl mx-auto text-gray-700">
        {/* === Top Grid === */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-md shadow-blue-400/30">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                MediAI Pro
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Empowering healthcare professionals and patients with next-gen AI-driven
              medical insights and assistance.
            </p>

            <div className="flex space-x-4 mt-5">
              <a
                href="https://linkedin.com"
                target="_blank"
                className="p-2 rounded-lg bg-white/60 hover:bg-gradient-to-r from-blue-500 to-indigo-500 hover:text-white transition-all duration-300 shadow-sm"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                className="p-2 rounded-lg bg-white/60 hover:bg-gradient-to-r from-blue-500 to-indigo-500 hover:text-white transition-all duration-300 shadow-sm"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                className="p-2 rounded-lg bg-white/60 hover:bg-gradient-to-r from-blue-500 to-indigo-500 hover:text-white transition-all duration-300 shadow-sm"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-5 text-lg">Product</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#features" className="hover:text-blue-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-blue-600 transition-colors">
                  Testimonials
                </a>
              </li>
              <li>
                <a href="#stats" className="hover:text-blue-600 transition-colors">
                  Statistics
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-5 text-lg">Company</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-5 text-lg">Support</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  API Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* === Divider === */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* === Bottom Section === */}
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold text-blue-700">MediAI Pro</span>. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0">
            Built with <span className="text-red-500">❤️</span> for healthcare professionals.
          </p>
        </div>
      </footer>
    </section>
  );
}
