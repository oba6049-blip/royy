import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, Sparkles, Search } from 'lucide-react';

const FAQ_DATA = [
  {
    id: 'faq-1',
    question: 'How do students check their examination results?',
    answer: 'Students simply navigate to the Result Checking demo section on this portal, input their unique 7-digit Registration Number (e.g., 2025104), select their session, term, and class, and click "Check Result". Your result slip will load instantly.',
    category: 'Results'
  },
  {
    id: 'faq-2',
    question: 'Do students or parents need a user account or password?',
    answer: 'No password is required! The portal is designed for maximum convenience while maintaining security. By validating unique 7-digit Student Registration IDs and session details, results are fetched securely without password friction.',
    category: 'General'
  },
  {
    id: 'faq-3',
    question: 'Can result slips be printed or downloaded as PDF?',
    answer: 'Yes! Every result slip includes a dedicated "Print Result Slip" and "Download PDF" button. It renders in a high-resolution, print-ready format with school crest, official signatures, and QR verification stamp.',
    category: 'Results'
  },
  {
    id: 'faq-4',
    question: 'How secure is the result verification system?',
    answer: 'Extremely secure. Every generated report includes a unique cryptographic SHA-256 hash and a dynamic QR code. Anyone scanning the QR code can immediately verify the result against Faith Academy’s master database to confirm authenticity.',
    category: 'Security'
  },
  {
    id: 'faq-5',
    question: 'Can we access results from previous academic sessions?',
    answer: 'Yes, the portal archives all academic records. Simply select the past Academic Session (e.g., 2023/2024) and Term from the search parameters.',
    category: 'Results'
  },
  {
    id: 'faq-6',
    question: 'Who uploads and manages the student results?',
    answer: 'Authorized school administrators and exam officers manage results through the secure Admin Portal. Results undergo double verification before being published to the public portal.',
    category: 'Technical'
  }
];

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Results', 'General', 'Security', 'Technical'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
            Got Questions? <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#60A5FA] bg-clip-text text-transparent">
              We Have Answers
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#64748B]">
            Find quick answers regarding student result checking, security verification, and administrative features.
          </p>

          {/* Search Bar & Category Filters */}
          <div className="pt-4 max-w-xl mx-auto space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQ topics..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] shadow-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'border-[#1E3A8A] shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    {faq.question}
                  </span>

                  <div className={`p-1.5 rounded-xl bg-slate-100 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-blue-50 text-[#1E3A8A]' : 'text-slate-500'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
