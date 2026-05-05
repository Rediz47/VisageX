import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { FaceAnalyzer } from '../components/FaceAnalyzer/FaceAnalyzer';
import { Hero, Features, ExampleResult, Testimonials, FAQ } from '../components/LandingSections';
import { ResultDashboard } from '../components/ResultDashboard';
import { ViralShareOverlay } from '../components/ViralShareOverlay';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
import { useMotionTier } from '../context/MotionProvider';
import { easings } from '../lib/motion';
import { Reveal } from '../components/motion';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';

export default function Landing({
  onOpenPricing,
  onOpenAuth,
  setAuthMode
}: {
  onOpenPricing: () => void;
  onOpenAuth: () => void;
  setAuthMode: (mode: 'signin' | 'signup') => void;
}) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const { credits, userData } = useCredits();
  const { preset } = useMotionTier();
  const posthog = usePostHog();
  const navigate = useNavigate();

  const location = useLocation();

  // Rehydrate from sessionStorage so navigating to /celebrity, /hair, etc. and
  // pressing back returns the user to their dashboard instead of dumping them
  // on the landing hero.
  const readPersisted = () => {
    try {
      const raw = sessionStorage.getItem('visagex:lastAnalysis');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const persisted = readPersisted();

  const [analysisResult, setAnalysisResult] = useState<any>(
    location.state?.analysisResult || persisted?.result || null
  );
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(
    location.state?.analyzedImageUrl || persisted?.imageUrl || null
  );
  const [isLocked, setIsLocked] = useState<boolean>(persisted?.isLocked ?? false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Keep sessionStorage in sync with current analysis state
  useEffect(() => {
    if (analysisResult && analyzedImageUrl) {
      try {
        sessionStorage.setItem(
          'visagex:lastAnalysis',
          JSON.stringify({
            result: analysisResult,
            imageUrl: analyzedImageUrl,
            isLocked
          })
        );
      } catch {
        /* quota / private mode */
      }
    }
  }, [analysisResult, analyzedImageUrl, isLocked]);

  const handleAnalysisComplete = (result: any, imageUrl: string, locked: boolean) => {
    setAnalysisResult(result);
    setAnalyzedImageUrl(imageUrl);
    setIsLocked(locked);
    posthog.capture('analysis_completed', {
      score: result?.overallScore,
      is_locked: locked,
      has_gemini: !!result?.visionAnalysis
    });
    // Scroll to top after the loader→dashboard layout swap commits.
    // A single scrollTo before the swap was racing the AnimatePresence
    // unmount, leaving the user halfway down the page on the new view.
    // Belt-and-suspenders: instant scroll now + smooth scroll after layout.
    window.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalyzedImageUrl(null);
    setIsLocked(false);
    setShowShareOverlay(false);
    try {
      sessionStorage.removeItem('visagex:lastAnalysis');
    } catch {
      /* noop */
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnlock = () => {
    if (user) {
      if (credits > 0) {
        posthog.capture('locked_preview_rescan_prompted', { credits });
        handleReset();
        requestAnimationFrame(() => {
          const element = document.getElementById('analyzer-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      } else {
        onOpenPricing();
      }
    } else {
      setAuthMode('signup');
      onOpenAuth();
    }
  };

  return (
    <>
      <SEO
        title="VisageX — Free AI Face Analysis & Symmetry Score"
        description="Free AI face analysis tool for facial symmetry, jawline, face shape, skin texture, hair guidance, and a practical glow-up plan. Upload a photo and get instant visual insights."
        canonical="https://visagex.online"
        type="website"
        keywords="AI face analysis, face symmetry test, free face analysis, facial aesthetics, jawline analysis, face shape detector, glow up plan, looksmaxxing AI"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'VisageX',
            url: 'https://visagex.online',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://visagex.online/blog?search={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'VisageX',
            url: 'https://visagex.online',
            logo: 'https://visagex.online/og-default.png'
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What does VisageX analyze?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'VisageX analyzes visible facial landmarks, facial symmetry, proportions, face shape, jawline, skin texture, hair guidance, and practical self-improvement suggestions from a photo.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is VisageX free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'VisageX offers free AI face analysis features with optional paid credits for additional scans and premium tools.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is AI face analysis medical advice?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'No. VisageX provides visual and educational appearance insights. It is not a medical diagnosis or treatment tool.'
                }
              }
            ]
          }
        ]}
      />
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'VisageX',
          operatingSystem: 'Web',
          applicationCategory: 'HealthApplication',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          },
          description: 'Professional AI-powered facial analysis and symmetry scoring platform.'
        }}
      />
      <AnimatePresence mode="wait">
        {!analysisResult || !analyzedImageUrl ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: preset.durations.slow, ease: easings.easeOutExpo }}
          >
            <Hero isDarkMode={isDarkMode} onNavigateMethodology={() => navigate('/methodology')} />
            <Reveal
              priority="secondary"
              y={20}
              as="section"
              id="analyzer-section"
              className="py-16"
            >
              <FaceAnalyzer
                onAnalysisComplete={handleAnalysisComplete}
                isDarkMode={isDarkMode}
                userCredits={credits}
                user={user}
                onOpenAuth={() => {
                  setAuthMode('signup');
                  onOpenAuth();
                }}
              />
            </Reveal>
            <ExampleResult isDarkMode={isDarkMode} />
            <Features isDarkMode={isDarkMode} />
            <Testimonials isDarkMode={isDarkMode} />
            <FAQ isDarkMode={isDarkMode} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: preset.durations.slow, ease: easings.easeOutExpo }}
            className="pt-12 pb-20 px-6 lg:px-8 max-w-[1600px] mx-auto min-h-screen"
          >
            <ResultDashboard
              result={analysisResult}
              imageUrl={analyzedImageUrl}
              onReset={handleReset}
              isDarkMode={isDarkMode}
              userCredits={credits}
              user={user}
              userData={userData}
              onOpenAuth={(mode) => {
                setAuthMode(mode);
                onOpenAuth();
              }}
              onOpenPricing={onOpenPricing}
              onUnlock={handleUnlock}
              isLocked={isLocked}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
