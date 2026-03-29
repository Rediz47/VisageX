import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';

// Global State Providers
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { CreditsProvider } from './context/CreditsProvider';

// Routing & Layout
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GlobalHeader } from './components/GlobalHeader';
import { Auth } from './components/Auth';
import { Pricing } from './components/Pricing';
import { Footer } from './components/LandingSections';
import { AnimatePresence } from 'motion/react';

// Lazy Loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const BlogSymmetryPage = lazy(() => import('./pages/BlogSymmetryPage'));
const BlogAnalysisPage = lazy(() => import('./pages/BlogAnalysisPage'));
const BlogBestToolPage = lazy(() => import('./pages/BlogBestToolPage'));

// A small inner app component to access contexts for Modals and internal features
function InnerApp() {
  const { isDarkMode } = useTheme();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [initialReferralCode, setInitialReferralCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setInitialReferralCode(ref.toUpperCase());
      setAuthMode('signup');
      setAuthModalOpen(true);
    }
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const lenis = new Lenis({
      duration: isMobile ? 0.8 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: isMobile ? 1.5 : 2,
      infinite: false,
    });
    (window as any).lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);

  useEffect(() => {
    if (pricingModalOpen || authModalOpen) {
      (window as any).lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      (window as any).lenis?.start();
      document.body.style.overflow = 'unset';
    }
  }, [pricingModalOpen, authModalOpen]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${isDarkMode ? 'bg-black text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200' : 'bg-zinc-50 text-zinc-900 selection:bg-indigo-500/10 selection:text-indigo-900'} overflow-x-hidden`}>
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[80px] will-change-transform transition-colors duration-1000 ${isDarkMode ? 'bg-zinc-800/10' : 'bg-zinc-500/5'}`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[80px] will-change-transform transition-colors duration-1000 ${isDarkMode ? 'bg-zinc-900/10' : 'bg-zinc-400/5'}`} />
      </div>

      <GlobalHeader 
        onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
        onOpenPricing={() => setPricingModalOpen(true)}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        <Suspense fallback={
          <div className="min-h-screen pt-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={
              <Landing 
                onOpenPricing={() => setPricingModalOpen(true)}
                onOpenAuth={() => setAuthModalOpen(true)}
                setAuthMode={setAuthMode}
              />
            } />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/blog/how-to-improve-face-symmetry" element={<BlogSymmetryPage />} />
            <Route path="/blog/ai-face-analysis-explained" element={<BlogAnalysisPage />} />
            <Route path="/blog/best-ai-face-analysis-tool" element={<BlogBestToolPage />} />
            
            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>

      <Footer 
        isDarkMode={isDarkMode} 
        onNavigatePrivacy={() => {}} 
        onNavigateTerms={() => {}} 
      />

      <Auth
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        isDarkMode={isDarkMode}
        initialMode={authMode}
        initialReferralCode={initialReferralCode}
      />
      <PricingModalManager 
        pricingModalOpen={pricingModalOpen}
        setPricingModalOpen={setPricingModalOpen}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

// Wrapper for Modals requiring deeper Contexts safely
function PricingModalManager({ pricingModalOpen, setPricingModalOpen, isDarkMode }: any) {
  const { user } = useAuth();
  return (
    <AnimatePresence>
      {pricingModalOpen && user && (
        <Pricing
          isDarkMode={isDarkMode}
          userId={user.uid}
          userEmail={user.email || ''}
          overallScore={undefined}
          onClose={() => setPricingModalOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}

import { HelmetProvider } from 'react-helmet-async';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <CreditsProvider>
            <BrowserRouter>
              <InnerApp />
            </BrowserRouter>
          </CreditsProvider>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
