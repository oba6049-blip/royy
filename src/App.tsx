import React, { useState } from 'react';
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

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'student-login' | 'student-dashboard' | 'admin-login' | 'admin-dashboard'>('home');

  const [loggedInStudent, setLoggedInStudent] = useState<StudentResult | null>(null);

  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [qrStudentId, setQrStudentId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>({
    name: 'Adewale (System Admin)',
    email: 'fariat@gmail.com',
    role: 'System Super Administrator'
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

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
        onLoginSuccess={(student) => {
          setLoggedInStudent(student);
          setCurrentView('student-dashboard');
        }}
        onOpenAdminPortal={() => setCurrentView('admin-login')}
      />
    );
  }

  // Dedicated Full Page: Student Dashboard Page
  if (currentView === 'student-dashboard' && loggedInStudent) {
    return (
      <StudentDashboardPage
        student={loggedInStudent}
        onLogout={() => {
          setLoggedInStudent(null);
          setCurrentView('student-login');
        }}
        onBackToWebsite={() => setCurrentView('home')}
      />
    );
  }

  // Dedicated Full Page: Admin Login Page
  if (currentView === 'admin-login') {
    return (
      <AdminLoginPage
        onBackToHome={() => setCurrentView('home')}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setCurrentView('admin-dashboard');
        }}
      />
    );
  }

  // Dedicated Full Page: Admin Dashboard Page
  if (currentView === 'admin-dashboard' && adminUser) {
    return (
      <AdminDashboardPage
        adminUser={adminUser}
        onLogout={() => {
          setAdminUser(null);
          setCurrentView('admin-login');
        }}
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
          onQuickVerifyClick={handleOpenQRModal}
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
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setCurrentView('admin-dashboard');
        }}
      />

    </div>
  );
}
