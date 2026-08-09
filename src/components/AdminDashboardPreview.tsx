import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ADMIN_MOCK_STUDENTS } from '../data/mockData';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  GraduationCap,
  BookOpen,
  BarChart3,
  Settings,
  Upload,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const AdminDashboardPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'results' | 'analytics'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState(ADMIN_MOCK_STUDENTS);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const sidebarNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'results', label: 'Results Upload', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const handleTogglePublish = (id: string) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.studentId === id) {
          const nextStatus = s.status === 'Published' ? 'Pending Review' : 'Published';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    triggerToast('Student result publication status updated.');
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="admin-portal" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1E3A8A]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[#60A5FA] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Administrator Control Suite</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Admin Dashboard <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#60A5FA] via-blue-400 to-[#F59E0B] bg-clip-text text-transparent">
              Preview & Management
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400">
            A comprehensive SaaS administration interface enabling school authorities to securely upload, audit, edit, and publish examination scores in bulk.
          </p>
        </div>

        {/* Dashboard Frame Container */}
        <div className="glass-panel-dark rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar */}
            <div className="lg:col-span-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2 py-1 border-b border-slate-800/80 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-[#F59E0B] font-extrabold text-xs">
                    RA
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">ADMIN PORTAL</h4>
                    <p className="text-[10px] text-slate-400 font-mono">v4.8 Enterprise</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {sidebarNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#1E3A8A] text-white shadow-md border border-[#60A5FA]/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Admin Profile Box */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  VP
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">Dr. M. Chen</p>
                  <p className="text-[10px] text-slate-400 truncate">Vice Principal (Exam)</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Header Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Enrolled</span>
                  <span className="text-2xl font-black text-white font-['Plus_Jakarta_Sans'] mt-1 block">1,250</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                    <TrendingUp className="w-3 h-3" /> +4.2% this session
                  </span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Published Results</span>
                  <span className="text-2xl font-black text-emerald-400 font-['Plus_Jakarta_Sans'] mt-1 block">98.4%</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">1,230 / 1,250 Slips</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Average</span>
                  <span className="text-2xl font-black text-[#F59E0B] font-['Plus_Jakarta_Sans'] mt-1 block">84.2%</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">GPA ~3.68 Scale</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Pending Reviews</span>
                  <span className="text-2xl font-black text-amber-400 font-['Plus_Jakarta_Sans'] mt-1 block">20</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Awaiting Approval</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student name, ID, or class..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm border border-blue-400/30 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Upload CSV Batch</span>
                  </button>

                  <button
                    onClick={() => triggerToast('Generating comprehensive performance report PDF...')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>

              {/* Student Records Table */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#60A5FA]" />
                    <span>Student Result Records Management</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Showing {filteredStudents.length} entries</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                        <th className="p-3">Student ID</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">GPA</th>
                        <th className="p-3">Average</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
                      {filteredStudents.map((st) => (
                        <tr key={st.studentId} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 font-mono text-blue-400 font-bold">{st.studentId}</td>
                          <td className="p-3 font-bold text-white">{st.name}</td>
                          <td className="p-3 text-slate-400">{st.className}</td>
                          <td className="p-3 font-bold text-amber-400">{st.gpa.toFixed(2)}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{st.averageScore}%</td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                st.status === 'Published'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleTogglePublish(st.studentId)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                            >
                              {st.status === 'Published' ? 'Unpublish' : 'Publish Result'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Upload Modal Simulation */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-white">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#F59E0B]" />
              <span>Batch Result Upload (CSV / Excel)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Drag and drop examination score sheets in standard Royal Academy CSV template format.
            </p>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-950/50 hover:border-blue-500 transition-colors cursor-pointer space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-blue-400 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Click to browse or drop CSV spreadsheet</p>
              <p className="text-[10px] text-slate-500">Supports .csv, .xlsx, max 25MB per batch</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  triggerToast('Successfully processed 42 student scores from batch file!');
                }}
                className="px-4 py-2 text-xs font-bold bg-[#1E3A8A] text-white rounded-xl"
              >
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}
    </section>
  );
};
