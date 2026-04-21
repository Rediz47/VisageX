import { useState, useMemo } from 'react';
import { generateImprovements } from '../../components/AreaOfImprovement';

export function useDashboardController(result: any) {
  const { overallScore, breakdown, metrics, analysis, detailedSymmetry } = result;

  // State
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [pricingOfferTimeLeft, setPricingOfferTimeLeft] = useState<string>('');
  
  // Celebrity logic state
  const [isAnalyzingCelebrity, setIsAnalyzingCelebrity] = useState(false);
  const [celebScanStep, setCelebScanStep] = useState<string>("");
  const [celebScanHistory, setCelebScanHistory] = useState<string[]>([]);
  const [celebrityResults, setCelebrityResults] = useState<any[]>(result.visionAnalysis?.celebritySimilarity || []);
  const [celebError, setCelebError] = useState<string | null>(null);

  // Card generation state
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Memoized Engine Data
  const improvementData = useMemo(
    () => generateImprovements(analysis, breakdown, result.visionAnalysis),
    [analysis, breakdown, result.visionAnalysis]
  );

  const potentialScore = result.visionAnalysis?.potentialScore || Math.min(10, Math.max(9.2, overallScore + 1.2));
  const potentialPercentile = Math.max(1, Math.round(100 - (potentialScore * 10)));

  return {
    // Props
    result,
    overallScore,
    breakdown,
    metrics,
    analysis,
    detailedSymmetry,
    
    // Computed Data
    improvementData,
    potentialScore,
    potentialPercentile,

    // Promo State
    promoState: {
      promoCode,
      setPromoCode,
      isApplying,
      setIsApplying,
      promoError,
      setPromoError,
      promoSuccess,
      setPromoSuccess,
    },

    // UI/Action State
    uiState: {
      copied,
      setCopied,
      leaderboard,
      setLeaderboard,
      pricingOfferTimeLeft,
      setPricingOfferTimeLeft,
      isGeneratingCard,
      setIsGeneratingCard
    },

    // Celebrity State
    celebState: {
      isAnalyzingCelebrity,
      setIsAnalyzingCelebrity,
      celebScanStep,
      setCelebScanStep,
      celebScanHistory,
      setCelebScanHistory,
      celebrityResults,
      setCelebrityResults,
      celebError,
      setCelebError,
    }
  };
}
