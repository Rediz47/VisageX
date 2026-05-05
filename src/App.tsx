import React, { useState, useEffect, Suspense, lazy } from 'react';
import { usePostHog } from '@posthog/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

// Global State Providers
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { CreditsProvider, useCredits } from './context/CreditsProvider';
import { MotionProvider, useMotionTier } from './context/MotionProvider';

// Routing & Layout
import { ProtectedRoute } from './routes/ProtectedRoute';
import { GlobalHeader } from './components/GlobalHeader';
import { Auth } from './components/Auth';
import { Pricing } from './components/Pricing';
import { Footer } from './components/LandingSections';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnimatePresence, motion } from 'motion/react';
import { ScrollProgress } from './components/motion';
import { easings } from './lib/motion';

// Lazy Loaded Pages
const Landing = lazy(() => import('./pages/Landing'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const CelebrityPage = lazy(() => import('./pages/CelebrityPage'));
const HairPage = lazy(() => import('./pages/HairPage'));
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const RefundPage = lazy(() => import('./pages/RefundPage'));
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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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
  const { user, loading: authLoading } = useAuth();
  const { credits } = useCredits();
  const posthog = usePostHog();
  const { preset, resetBudget } = useMotionTier();
  const routeLocation = useLocation();
  const previousUserRef = React.useRef<string | null | undefined>(undefined);
  const toastTimerRef = React.useRef<number | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [initialReferralCode, setInitialReferralCode] = useState('');
  const [showLoginToast, setShowLoginToast] = useState(false);

  const userLabel = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    if (authLoading) return;
    const previousUser = previousUserRef.current;
    if (previousUser === undefined) {
      previousUserRef.current = user?.uid || null;
      return;
    }
    if (!previousUser && user?.uid) {
      setShowLoginToast(true);
      posthog.capture('login_success_toast_shown');
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => setShowLoginToast(false), 5200);
    }
    previousUserRef.current = user?.uid || null;
  }, [authLoading, user?.uid, posthog]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
    const openPricing = () => {
      setPricingModalOpen(true);
      posthog.capture('pricing_modal_opened');
    };
    window.addEventListener('visagex:open-pricing', openPricing);
    return () => window.removeEventListener('visagex:open-pricing', openPricing);
  }, [posthog]);

  // Premium Lenis smooth scroll. Low tier → skip (native scroll).
  useEffect(() => {
    if (!preset.flags.enableLenis) {
      (window as any).lenis = null;
      return;
    }
    const isMobile = window.innerWidth < 768;
    const isHigh = preset.tier === 'high';
    const lenis = new Lenis({
      // Premium inertia — slightly longer on high-end for that "Apple feel".
      duration: isHigh ? 1.2 : 0.9,
      // easeOutExpo — buttery deceleration.
      easing: (t) => 1 - Math.pow(1 - t, 5),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      // Smooth wheel on desktop for BOTH mid and high. Mobile uses native momentum.
      smoothWheel: !isMobile,
      wheelMultiplier: isHigh ? 1.0 : 0.9,
      touchMultiplier: isMobile ? 1.5 : 2,
      infinite: false,
      autoResize: true
    });
    (window as any).lenis = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, [preset.flags.enableLenis, preset.tier]);

  useEffect(() => {
    if (pricingModalOpen || authModalOpen) {
      (window as any).lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      (window as any).lenis?.start();
      document.body.style.overflow = 'unset';
    }
    // Reset screen budget on modal transitions so animations remain usable.
    resetBudget('modal');
  }, [pricingModalOpen, authModalOpen, resetBudget]);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-700 ${isDarkMode ? 'text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200' : 'bg-[#f8f8fc] text-zinc-900 selection:bg-indigo-500/10 selection:text-indigo-900'} overflow-x-hidden`}
      style={isDarkMode ? { backgroundColor: '#050508' } : undefined}
    >
      {/* Ambient Background Glow — only rendered on high-tier devices. */}
      {preset.flags.enableAmbientGlow && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full will-change-transform"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)'
            }}
          />
          <div
            className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full will-change-transform"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)'
            }}
          />
        </div>
      )}

      <ScrollToTop />
      <ScrollProgress />
      <GlobalHeader
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
          posthog.capture('auth_modal_opened', { mode });
        }}
        onOpenPricing={() => {
          setPricingModalOpen(true);
          posthog.capture('pricing_modal_opened');
        }}
      />

      {/* Main Content — animated route transitions (fade + slight rise/blur). */}
      <main className="relative z-10 pt-20">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div
                className={`min-h-screen pt-24 flex flex-col items-center justify-center gap-6 ${isDarkMode ? 'bg-black' : 'bg-zinc-50'}`}
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}
                  >
                    <svg
                      className={`w-6 h-6 ${isDarkMode ? 'text-white/60' : 'text-zinc-400'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9S16.97 3 12 3zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 rounded-2xl border border-indigo-500/20 animate-ping opacity-40" />
                </div>
                <p
                  className={`text-xs font-bold uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-zinc-400'}`}
                >
                  Initializing VisageX
                </p>
              </div>
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={routeLocation.pathname}
                initial={{
                  opacity: 0,
                  y: preset.tier === 'low' ? 0 : 12,
                  filter: preset.flags.enableBlurAnimations ? 'blur(6px)' : 'none'
                }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{
                  opacity: 0,
                  y: preset.tier === 'low' ? 0 : -8,
                  filter: preset.flags.enableBlurAnimations ? 'blur(4px)' : 'none'
                }}
                transition={{ duration: preset.durations.med, ease: easings.easeOutExpo }}
              >
                <Routes location={routeLocation}>
                  <Route
                    path="/"
                    element={
                      <Landing
                        onOpenPricing={() => setPricingModalOpen(true)}
                        onOpenAuth={() => setAuthModalOpen(true)}
                        setAuthMode={setAuthMode}
                      />
                    }
                  />
                  <Route path="/methodology" element={<MethodologyPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/refund" element={<RefundPage />} />
                  <Route path="/blog/how-to-improve-face-symmetry" element={<BlogSymmetryPage />} />
                  <Route path="/blog/ai-face-analysis-explained" element={<BlogAnalysisPage />} />
                  <Route path="/blog/best-ai-face-analysis-tool" element={<BlogBestToolPage />} />
                  <Route path="/blog" element={<BlogIndexPage />} />
                  <Route path="/blog/what-is-canthal-tilt" element={<BlogCanthalTiltPage />} />
                  <Route
                    path="/blog/how-to-fix-recessed-jawline"
                    element={<BlogRecessedJawPage />}
                  />
                  <Route path="/blog/does-gua-sha-work" element={<BlogGuaShaPage />} />
                  <Route path="/blog/free-ai-face-analysis" element={<BlogFreeAIFacePage />} />
                  <Route path="/blog/complete-mewing-guide" element={<BlogMewingGuidePage />} />
                  <Route
                    path="/blog/looksmaxxing-routine-for-beginners"
                    element={<BlogLooksmaxRoutinePage />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <HistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/celebrity"
                    element={
                      <ProtectedRoute>
                        <CelebrityPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hair"
                    element={
                      <ProtectedRoute>
                        <HairPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer isDarkMode={isDarkMode} onNavigatePrivacy={() => {}} onNavigateTerms={() => {}} />

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
      <AnimatePresence>
        {showLoginToast && user && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: preset.durations.med, ease: easings.easeOutExpo }}
            className={`fixed right-4 top-28 z-[120] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[1.75rem] border shadow-2xl backdrop-blur-2xl ${isDarkMode ? 'border-white/10 bg-zinc-950/85 shadow-indigo-950/30' : 'border-white/70 bg-white/90 shadow-indigo-200/40'}`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500" />
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-lg shadow-indigo-500/25">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M5 12.5l4.2 4L19 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.2"
                    />
                  </svg>
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-zinc-950/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${isDarkMode ? 'text-cyan-300' : 'text-indigo-500'}`}>
                    Signed in
                  </p>
                  <h3 className={`mt-1 truncate text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    Welcome back, {userLabel}
                  </h3>
                  <p className={`mt-1 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Your account is active. You have <span className={isDarkMode ? 'font-bold text-amber-300' : 'font-bold text-amber-600'}>{credits}</span> credits ready.
                  </p>
                </div>
                <button
                  onClick={() => setShowLoginToast(false)}
                  aria-label="Dismiss welcome message"
                  className={`rounded-full p-2 transition-colors ${isDarkMode ? 'text-white/40 hover:bg-white/10 hover:text-white' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Wrapper for Modals requiring deeper Contexts safely
function PricingModalManager({
  pricingModalOpen,
  setPricingModalOpen,
  isDarkMode
}: {
  pricingModalOpen: boolean;
  setPricingModalOpen: (v: boolean) => void;
  isDarkMode: boolean;
}) {
  const { user } = useAuth();
  return (
    <AnimatePresence>
      {pricingModalOpen && (
        <Pricing
          isDarkMode={isDarkMode}
          userId={user?.uid || 'guest'}
          userEmail={user?.email || ''}
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
              <MotionProvider>
                <InnerApp />
              </MotionProvider>
            </BrowserRouter>
          </CreditsProvider>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
