import React, { useState } from 'react';
import { Mail, Phone, MapPin, X, CheckCircle2, Send, Sparkles } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    enquiryType: 'Result Discrepancy',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div id="contact" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-[10px] font-bold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Royal Academy IT & Help Desk</span>
          </div>
          <h3 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
            Contact Portal Support
          </h3>
          <p className="text-xs text-slate-500">
            Have a question about result checking or need grade verification support?
          </p>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-3 bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-emerald-900">Enquiry Submitted Successfully!</h4>
            <p className="text-xs text-emerald-700">
              Our academic support desk has received your ticket and will contact you via email within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Robert Okon"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="parent@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Student Reg ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. 2025104"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Category
              </label>
              <select
                value={formData.enquiryType}
                onChange={(e) => setFormData({ ...formData, enquiryType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              >
                <option value="Result Discrepancy">Result Discrepancy Query</option>
                <option value="Verification Request">Official Transcript Verification</option>
                <option value="Technical Support">Portal Technical Issue</option>
                <option value="General Admission">General Admission / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Message / Details *
              </label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your inquiry..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#F59E0B]" />
              <span>Submit Message to Support</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
