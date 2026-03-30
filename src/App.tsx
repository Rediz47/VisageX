import React, { useState, useEffect, Suspense, lazy } from 'react';
import { usePostHog } from '@posthog/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'));
const BlogCanthalTiltPage = lazy(() => import('./pages/BlogCanthalTiltPage'));
const BlogRecessedJawPage = lazy(() => import('./pages/BlogRecessedJawPage'));
const BlogGuaShaPage = lazy(() => import('./pages/BlogGuaShaPage'));
const BlogFreeAIFacePage = lazy(() => import('./pages/BlogFreeAIFacePage'));
const BlogMewingGuidePage = lazy(() => import('./pages/BlogMewingGuidePage'));
const BlogLooksmaxRoutinePage = lazy(() => import('./pages/BlogLooksmaxRoutinePage'));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Small delay to let React finish rendering before scrolling
    requestAnimationFrame(() => {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { duration: 0.6 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, [pathname]);

  return null;
}

// A small inner app component to access contexts for Modals and internal features
function InnerApp() {
  const { isDarkMode } = useTheme();
  const posthog = usePostHog();

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
      duration: isMobile ? 0.6 : 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !isMobile,
      wheelMultiplier: 1,
      touchMultiplier: isMobile ? 1.2 : 2,
      infinite: false,
      autoResize: true,
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
      {/* Ambient Background Glow — uses opacity+radial-gradient instead of blur for perf */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full will-change-transform transition-colors duration-1000 ${isDarkMode ? 'bg-zinc-800/5' : 'bg-zinc-400/[0.03]'}`} style={{ background: isDarkMode ? 'radial-gradient(circle, rgba(39,39,42,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(161,161,170,0.04) 0%, transparent 70%)' }} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full will-change-transform transition-colors duration-1000 ${isDarkMode ? 'bg-zinc-900/5' : 'bg-zinc-300/[0.03]'}`} style={{ background: isDarkMode ? 'radial-gradient(circle, rgba(24,24,27,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(212,212,216,0.04) 0%, transparent 70%)' }} />
      </div>

      <ScrollToTop />
      <GlobalHeader 
        onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); posthog.capture('auth_modal_opened', { mode }); }}
        onOpenPricing={() => { setPricingModalOpen(true); posthog.capture('pricing_modal_opened'); }}
      />

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        <Suspense fallback={
          <div className={`min-h-screen pt-24 flex flex-col items-center justify-center gap-6 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}>
            <div className="relative">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <svg className={`w-6 h-6 ${isDarkMode ? 'text-white/60' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9S16.97 3 12 3zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>
              </div>
              <div className="absolute -inset-1 rounded-2xl border border-indigo-500/20 animate-ping opacity-40" />
            </div>
            <p className={`text-xs font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-zinc-400'}`}>Initializing VisageX</p>
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
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/what-is-canthal-tilt" element={<BlogCanthalTiltPage />} />
            <Route path="/blog/how-to-fix-recessed-jawline" element={<BlogRecessedJawPage />} />
            <Route path="/blog/does-gua-sha-work" element={<BlogGuaShaPage />} />
            <Route path="/blog/free-ai-face-analysis" element={<BlogFreeAIFacePage />} />
            <Route path="/blog/complete-mewing-guide" element={<BlogMewingGuidePage />} />
            <Route path="/blog/looksmaxxing-routine-for-beginners" element={<BlogLooksmaxRoutinePage />} />
            
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
