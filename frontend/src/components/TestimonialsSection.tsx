import { Star } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Cardiologist',
      text: 'MediAI Pro has revolutionized how I access medical information. The AI responses are incredibly accurate and fast.',
      initials: 'S',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      name: 'Michael Chen',
      role: 'Patient',
      text: 'As a patient, I feel more empowered understanding my health conditions through the AI assistant.',
      initials: 'M',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      name: 'Nurse Emily Rodriguez',
      role: 'Registered Nurse',
      text: 'The role-based access and document management features have streamlined our workflow significantly.',
      initials: 'E',
      gradient: 'from-purple-500 to-violet-600',
    },
  ];

  return (
  <section className="relative overflow-hidden bg-gradient-to-b  from-blue-50 via-white to-blue-100 py-24 px-6 lg:px-12">
      {/* ==== Background Elements ==== */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-50px] left-[-50px] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/70 via-white/90 to-transparent"></div>
      </div>
      {/* Background glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 mb-4">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real experiences from healthcare professionals and patients who trust MediAI Pro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="group relative bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-gray-100 hover:border-transparent transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-2"
            >
              {/* Gradient ring effect on hover */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${t.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`} />

              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                  />
                ))}
              </div>

              <p className="text-gray-700 mb-8 italic text-lg leading-relaxed relative z-10">
                “{t.text}”
              </p>

              <div className="flex items-center relative z-10">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${t.gradient} rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg transform transition-transform duration-500 group-hover:scale-110`}
                >
                  {t.initials}
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900 text-lg">{t.name}</div>
                  <div className="text-sm text-gray-600">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
