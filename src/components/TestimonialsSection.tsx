import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, Heart, Sparkles } from 'lucide-react';

const TESTIMONIALS_DATA = [
  {
    id: '1',
    name: 'Dr. Elizabeth Sterling',
    role: 'Parent of Senior High Graduate',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    quote: 'Checking my son’s final examination results was ridiculously fast and smooth. The printed report slip looked as official as university transcripts!',
    rating: 5,
    tag: 'Parent'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Vice Principal (Academics)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    quote: 'The admin dashboard cut our result processing time from weeks down to under two hours. The automated QR verification eliminated result tampering completely.',
    rating: 5,
    tag: 'Teacher'
  },
  {
    id: '3',
    name: 'Samantha Vance',
    role: 'Head Girl & SSS 3 Honor Student',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    quote: 'I love that I can check my grades on my smartphone the second they are released without logging into complicated accounts or facing crashed servers.',
    rating: 5,
    tag: 'Student'
  }
];

export const TestimonialsSection: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Parent' | 'Teacher' | 'Student'>('All');

  const filtered = filter === 'All'
    ? TESTIMONIALS_DATA
    : TESTIMONIALS_DATA.filter(t => t.tag === filter);

  return (
    <section className="py-20 lg:py-28 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Community Trust</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
            Why Parents, Students & Teachers <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#60A5FA] bg-clip-text text-transparent">
              Love Our Result Portal
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#64748B]">
            Hear from our school community members about their experience with Royal Academy's modern academic result portal.
          </p>

          {/* Tag Filter Pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {(['All', 'Parent', 'Teacher', 'Student'] as const).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === tag
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tag}s
              </button>
            ))}
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/80 hover:border-[#1E3A8A]/30 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Rating & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                    ))}
                  </div>

                  <Quote className="w-8 h-8 text-slate-200 group-hover:text-[#1E3A8A]/20 transition-colors" />
                </div>

                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                  "{item.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-4">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#1E3A8A]/20 shadow-xs"
                />

                <div className="overflow-hidden">
                  <h4 className="text-sm font-extrabold text-[#0F172A] font-['Plus_Jakarta_Sans'] truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
