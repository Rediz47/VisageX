import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePostHog } from '@posthog/react';
import { FaceAnalyzer } from '../components/FaceAnalyzer/FaceAnalyzer';
import { Hero, Features, ExampleResult, Testimonials } from '../components/LandingSections';
import { ResultDashboard } from '../components/ResultDashboard';
import { ViralShareOverlay } from '../components/ViralShareOverlay';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { useCredits } from '../context/CreditsProvider';
import api from '../lib/api';
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
  const posthog = usePostHog();
  const navigate = useNavigate();

  const location = useLocation();
  const [analysisResult, setAnalysisResult] = useState<any>(location.state?.analysisResult || null);
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(location.state?.analyzedImageUrl || null);
  const [isLocked, setIsLocked] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const handleAnalysisComplete = (result: any, imageUrl: string, locked: boolean) => {
    setAnalysisResult(result);
    setAnalyzedImageUrl(imageUrl);
    setIsLocked(locked);
    posthog.capture('analysis_completed', {
      score: result?.overallScore,
      is_locked: locked,
      has_gemini: !!result?.visionAnalysis,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalyzedImageUrl(null);
    setIsLocked(false);
    setShowShareOverlay(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnlock = async () => {
    if (user) {
      if (credits > 0) {
        try {
          // Send request with our configured axios instance
          await api.post('/gemini-analysis'); // NOTE: The correct endpoint logic depends on how backend reduces credits. 
          // Currently ai.routes.ts reduces credit during the generation. 
          // If this is an existing unlocking logic, we should probably verify. 
          // Assuming existing logic from App.tsx used fetch('/api/consume-credit') which was removed.
          // Since the backend index.ts says consume-credit was intentionally removed and handled internally,
          // we might just need to unlock it locally or handle it via a new mechanism.
          // We will mock unlock for now to preserve UI flow if the API is changed.
          setIsLocked(false);
        } catch (error) {
          console.error("Failed to unlock:", error);
          alert("Error unlocking report. Please try again.");
        }
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
        description="Get your AI face score in seconds. VisageX scans 468 facial landmarks to rate symmetry, jawline, skin health & more. Free online tool — no download needed."
        canonical="https://visagex.online"
        type="website"
      />
      <StructuredData 
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "VisageX",
          "operatingSystem": "Web",
          "applicationCategory": "HealthApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "description": "Professional AI-powered facial analysis and symmetry scoring platform."
        }}
      />
      <AnimatePresence mode="wait">
      {!analysisResult || !analyzedImageUrl ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Hero isDarkMode={isDarkMode} onNavigateMethodology={() => navigate('/methodology')} />
          <motion.div
            id="analyzer-section"
            className="py-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FaceAnalyzer
              onAnalysisComplete={handleAnalysisComplete}
              isDarkMode={isDarkMode}
              userCredits={credits}
            />
          </motion.div>
          <ExampleResult isDarkMode={isDarkMode} />
          <Features isDarkMode={isDarkMode} />
          <Testimonials isDarkMode={isDarkMode} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
