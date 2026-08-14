import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FloatingStats } from './components/FloatingStats';
import { FeaturesSection } from './components/FeaturesSection';
import { WorkflowSection } from './components/WorkflowSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { SecuritySection } from './components/SecuritySection';
import { FAQSection } from './components/FAQSection';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';

import { ResultSlipModal } from './components/ResultSlipModal';
import { QRVerificationModal } from './components/QRVerificationModal';
import { ContactModal } from './components/ContactModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { StudentLoginPage } from './components/StudentLoginPage';
import { StudentDashboardPage } from './components/StudentDashboardPage';

import { StudentResult } from './types';
import { api } from './services/api';

const STUDENT_SESSION_KEY = 'royal_academy_student_session';
const ADMIN_SESSION_KEY = 'royal_academy_admin_session';
const ACTIVE_VIEW_KEY = 'royal_academy_active_view';

export default function App() {
  // Persistent Student session
  const [loggedInStudent, setLoggedInStudent] = useState<StudentResult | null>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persistent Admin session
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persistent View State
  const [currentView, setCurrentView] = useState<'home' | 'student-login' | 'student-dashboard' | 'admin-login' | 'admin-dashboard'>(() => {
    try {
      const savedView = localStorage.getItem(ACTIVE_VIEW_KEY) as any;
      const savedStudent = localStorage.getItem(STUDENT_SESSION_KEY);
      const savedAdmin = localStorage.getItem(ADMIN_SESSION_KEY);

      if (savedView === 'admin-dashboard' && savedAdmin) return 'admin-dashboard';
      if (savedView === 'student-dashboard' && savedStudent) return 'student-dashboard';
      if (savedView === 'admin-login') return savedAdmin ? 'admin-dashboard' : 'admin-login';
      if (savedView === 'student-login') return savedStudent ? 'student-dashboard' : 'student-login';
      if (savedView === 'home') return 'home';

      if (savedStudent) return 'student-dashboard';
      if (savedAdmin) return 'admin-dashboard';

      return 'home';
    } catch {
      return 'home';
    }
  });

  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [qrStudentId, setQrStudentId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Sync active view to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_VIEW_KEY, currentView);
    } catch (e) {
      console.error('Failed to sync active view to localStorage', e);
    }
  }, [currentView]);

  // Sync / refresh student data from backend if student session is present on mount
  useEffect(() => {
    if (loggedInStudent?.studentId) {
      api.getStudentById(loggedInStudent.studentId).then(freshStudent => {
        if (freshStudent) {
          setLoggedInStudent(freshStudent);
          localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(freshStudent));
        }
      }).catch(err => {
        console.warn('Could not refresh student session data from server:', err);
      });
    }
  }, []);

  const handleStudentLoginSuccess = (student: StudentResult) => {
    try {
      localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(student));
      localStorage.setItem(ACTIVE_VIEW_KEY, 'student-dashboard');
    } catch (e) {
      console.error(e);
    }
    setLoggedInStudent(student);
    setCurrentView('student-dashboard');
  };

  const handleStudentLogout = () => {
    try {
      localStorage.removeItem(STUDENT_SESSION_KEY);
      localStorage.setItem(ACTIVE_VIEW_KEY, 'student-login');
    } catch (e) {
      console.error(e);
    }
    setLoggedInStudent(null);
    setCurrentView('student-login');
  };

  const handleAdminLoginSuccess = (user: { name: string; email: string; role: string }) => {
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(ACTIVE_VIEW_KEY, 'admin-dashboard');
    } catch (e) {
      console.error(e);
    }
    setAdminUser(user);
    setCurrentView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.setItem(ACTIVE_VIEW_KEY, 'admin-login');
    } catch (e) {
      console.error(e);
    }
    setAdminUser(null);
    setCurrentView('admin-login');
  };

  const handleStudentPortalClick = () => {
    if (loggedInStudent) {
      setCurrentView('student-dashboard');
    } else {
      setCurrentView('student-login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckResultClick = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('result-search');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('result-search');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAdminPortalClick = () => {
    if (adminUser) {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('admin-login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLearnMoreClick = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenResultSlip = (result: StudentResult) => {
    setSelectedResult(result);
    setIsResultModalOpen(true);
  };

  const handleOpenQRModal = (studentId: string) => {
    setQrStudentId(studentId);
    setIsQrModalOpen(true);
  };

  // Dedicated Full Page: Student Login Page
  if (currentView === 'student-login') {
    return (
      <StudentLoginPage
        onBackToHome={() => setCurrentView('home')}
        onLoginSuccess={handleStudentLoginSuccess}
        onOpenAdminPortal={() => {
          if (adminUser) {
            setCurrentView('admin-dashboard');
          } else {
            setCurrentView('admin-login');
          }
        }}
      />
    );
  }

  // Dedicated Full Page: Student Dashboard Page
  if (currentView === 'student-dashboard' && loggedInStudent) {
    return (
      <StudentDashboardPage
        student={loggedInStudent}
        onLogout={handleStudentLogout}
        onBackToWebsite={() => setCurrentView('home')}
      />
    );
  }

  // Dedicated Full Page: Admin Login Page
  if (currentView === 'admin-login') {
    return (
      <AdminLoginPage
        onBackToHome={() => setCurrentView('home')}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    );
  }

  // Dedicated Full Page: Admin Dashboard Page
  if (currentView === 'admin-dashboard' && adminUser) {
    return (
      <AdminDashboardPage
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        onBackToWebsite={() => setCurrentView('home')}
      />
    );
  }

  // Default View: Main Public Portal Home Page
  return (
    <div className="min-h-screen bg-white text-[#0F172A] font-['Inter',sans-serif] selection:bg-[#60A5FA]/20 selection:text-[#1E3A8A]">
      
      {/* Sticky Navigation */}
      <Navbar
        onCheckResultClick={handleCheckResultClick}
        onStudentPortalClick={handleStudentPortalClick}
        onAdminPortalClick={handleAdminPortalClick}
      />

      {/* Hero Section */}
      <main>
        <HeroSection
          onCheckResultClick={handleCheckResultClick}
          onLearnMoreClick={handleLearnMoreClick}
          onQuickVerifyClick={async (studentId) => {
            const student = await api.getStudentById(studentId);
            if (student) {
              handleOpenResultSlip(student);
            }
          }}
        />

        {/* Floating Statistics Counters */}
        <FloatingStats />

        {/* Features Capabilities */}
        <FeaturesSection />

        {/* Workflow Timeline */}
        <WorkflowSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Security & Reliability */}
        <SecuritySection />

        {/* FAQ Accordion */}
        <FAQSection />

        {/* Call To Action */}
        <CallToAction
          onCheckResultClick={handleCheckResultClick}
          onContactClick={() => setIsContactModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer
        onCheckResultClick={handleCheckResultClick}
        onAdminPortalClick={handleAdminPortalClick}
        onContactClick={() => setIsContactModalOpen(true)}
      />

      {/* Official Student Result Slip Modal (Print-ready) */}
      <ResultSlipModal
        result={selectedResult}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onVerifyQR={() => {
          if (selectedResult) {
            handleOpenQRModal(selectedResult.studentId);
          }
        }}
      />

      {/* Cryptographic QR Verification Modal */}
      <QRVerificationModal
        studentId={qrStudentId}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Support / Discrepancy Inquiry Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Admin Login Email & Password Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

    </div>
  );
}
