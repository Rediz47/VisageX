import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ChevronDown, X, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { RatioVisualization } from '../facial-ratio/types';
import { LerpLineCanvas } from '../facial-ratio/LerpLineCanvas';

type Category = 'Harmony' | 'Angularity' | 'Dimorphism' | 'Features';

interface InsightItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  score: number;
  isStrength: boolean;
  isDummy?: boolean;
}


interface StrengthsAndWeaknessesProps {
  isDarkMode: boolean;
  isLocked: boolean;
  strengths: string[];
  weaknesses: string[];
  breakdown: Record<string, number>;
  onUnlock: () => void;
  insightDescriptions?: Record<string, string>;
  show?: 'strengths' | 'weaknesses' | 'both';
  imageUrl?: string;
  ratios?: RatioVisualization[];
  ratioPoints?: { x: number; y: number }[] | null;
  cropInfo?: any;
}

const CATEGORIES: Category[] = ['Harmony', 'Angularity', 'Dimorphism', 'Features'];

const getCategory = (str: string): Category => {
  const lc = str.toLowerCase();
  if (lc.includes('jaw') || lc.includes('cheek') || lc.includes('bone') || lc.includes('fwhr')) return 'Angularity';
  if (lc.includes('symmetr') || lc.includes('harmony') || lc.includes('third') || lc.includes('balance') || lc.includes('ratio')) return 'Harmony';
  if (lc.includes('dimorphism') || lc.includes('masculin') || lc.includes('feminin')) return 'Dimorphism';
  return 'Features';
};

const getScore = (str: string, breakdown: Record<string, number>, isStrength: boolean): number => {
  const lc = str.toLowerCase();
  let baseScore = isStrength ? 8.5 : 4.5;
  if (lc.includes('jaw') && breakdown.Jawline) baseScore = breakdown.Jawline;
  else if (lc.includes('symmetr') && breakdown.Symmetry) baseScore = breakdown.Symmetry;
  else if (lc.includes('eye') && breakdown.Eyes) baseScore = breakdown.Eyes;
  else if (lc.includes('skin') && breakdown['Skin Quality']) baseScore = breakdown['Skin Quality'];
  else if (lc.includes('hair') && breakdown.Hair) baseScore = breakdown.Hair;
  else if (lc.includes('dimorphism') && breakdown.Dimorphism) baseScore = breakdown.Dimorphism;
  else if (lc.includes('cheek') && breakdown.Cheekbones) baseScore = breakdown.Cheekbones;
  
  // Clamping for realism
  if (isStrength) return Math.min(10, Math.max(7.5, baseScore));
  return Math.max(1, Math.min(6.5, baseScore));
};

const getDescription = (str: string, isStrength: boolean): string => {
  const lc = str.toLowerCase();

  // Symmetry
  if (lc.includes('symmetr')) return isStrength
    ? "Bilateral landmark mapping places you in the top percentile of structural harmony. High symmetry is the single strongest predictor of perceived attractiveness across all cultures."
    : "Asymmetric landmark deviation detected across horizontal facial midline. Minor asymmetry is common, but correcting posture, sleep position, and jaw habits can reduce its impact over time.";

  // Jaw / Mandible
  if (lc.includes('jaw')) return isStrength
    ? "Mandibular width and gonial angle fall within the ideal masculine/feminine distribution. A well-defined jawline is one of the most dominant visual attractiveness signals."
    : "Gonial angle and mandibular width fall below optimal distribution curves. Mewing, chewing hard foods, and targeted jaw exercises can gradually improve definition over 12–24 months.";

  // Canthal tilt
  if (lc.includes('canthal')) return isStrength
    ? "Positive canthal tilt creates a naturally hunter-like, sharp orbital appearance — consistently rated as highly attractive in peer-reviewed aesthetics research."
    : "Neutral or negative canthal tilt gives a softer, less sharp orbital appearance. Ortho-k contact lenses or strategic makeup can create the visual illusion of a lifted outer canthus.";

  // Eyes (general)
  if (lc.includes('eye')) return isStrength
    ? "Intercanthal width and pupillary distance align with ideal facial thirds, framing the face with natural balance and depth."
    : "Orbital spacing or eyelid morphology deviates from the ideal one-eye-width intercanthal ratio, slightly disrupting facial thirds balance.";

  // Eyebrows
  if (lc.includes('eyebrow') || lc.includes('brow')) return isStrength
    ? "Well-arched brows with ideal arch placement and density frame the periorbital region and amplify eye depth — a high-leverage aesthetic feature."
    : "Brow shape, arch position, or density reduces periorbital framing. Professional grooming, microblading, or minoxidil application can significantly improve this area.";

  // Midface
  if (lc.includes('midface')) return isStrength
    ? "Compact midface ratio supports high feature density — a hallmark of neotenous, youthful attractiveness associated with lower perceived age."
    : "An elongated midface increases the visual distance between the eyes and mouth. Forward head posture correction and mewing may help compress this ratio over time.";

  // fWHR / facial width
  if (lc.includes('fwhr') || lc.includes('narrow') || lc.includes('wide face')) return isStrength
    ? "High facial width-to-height ratio (fWHR) is associated with perceived dominance, testosterone expression, and strong first impressions."
    : "Low fWHR reduces perceived facial dominance and structural presence. Hairstyles with volume at the sides can visually compensate for a narrower bizygomatic width.";

  // Cheekbones
  if (lc.includes('cheek')) return isStrength
    ? "High, laterally prominent cheekbones create strong midface structure and catch light in a way that signals youth and vitality."
    : "Underdeveloped cheekbone projection reduces midface definition. Gua sha, facial exercises, and low body fat can subtly enhance cheekbone visibility.";

  // Skin / complexion
  if (lc.includes('skin') || lc.includes('complexion') || lc.includes('acne') || lc.includes('texture')) return isStrength
    ? "Clear, smooth skin texture with consistent tone and low pore visibility — a primary subconscious health signal that strongly influences attractiveness ratings."
    : "Skin texture irregularities, uneven tone, or visible pores were detected. A consistent routine with retinol, niacinamide, and SPF 50+ can produce measurable improvement within 8–12 weeks.";

  // Nose
  if (lc.includes('nose') || lc.includes('nasal')) return isStrength
    ? "Nasal bridge width and tip projection align well with facial thirds — contributing to balanced central facial proportion."
    : "Nasal width or projection slightly disrupts central facial balance. Contouring techniques and strategic hairstyling can redirect visual attention effectively.";

  // Lips / mouth
  if (lc.includes('lip') || lc.includes('mouth')) return isStrength
    ? "Lip volume, Cupid's bow definition, and vermilion border shape contribute positively to lower-face aesthetics and youthful appearance."
    : "Lip volume or definition falls below ideal ratios. Hyaluronic acid fillers or over-the-counter lip plumpers can enhance projection without surgical intervention.";

  // Chin / profile
  if (lc.includes('chin') || lc.includes('profile')) return isStrength
    ? "Chin projection and vertical height create a strong lower-third structure, contributing to a well-balanced lateral and frontal facial profile."
    : "Chin projection or vertical height disrupts lower-third balance. Mewing and forward tongue posture are the primary non-surgical interventions studied for chin development.";

  // Forehead / upper third
  if (lc.includes('forehead') || lc.includes('upper third')) return isStrength
    ? "Forehead height and width sit within the ideal upper-third proportion, establishing strong structural framing for the entire face."
    : "Forehead proportion slightly disrupts the ideal facial thirds ratio. Hairline styling and targeted haircuts can effectively correct the visual imbalance.";

  // Hair
  if (lc.includes('hair')) return isStrength
    ? "Hair density, texture, and styling complement your face shape and frame the upper third effectively — a high-visibility aesthetic asset."
    : "Current hair texture or density reduces upper-third framing impact. Minoxidil, biotin supplementation, and a face-shape-appropriate cut are the highest-leverage interventions.";

  // Grooming
  if (lc.includes('grooming') || lc.includes('facial hair') || lc.includes('beard')) return isStrength
    ? "Well-maintained facial hair or grooming enhances jawline definition and sexual dimorphism — consistent with higher attractiveness ratings in studies."
    : "Suboptimal grooming or facial hair maintenance reduces jawline definition. A structured grooming routine tailored to your face shape can yield immediate improvements.";

  // Dimorphism / masculinity / femininity
  if (lc.includes('dimorphism') || lc.includes('masculin') || lc.includes('feminin')) return isStrength
    ? "Strong sexual dimorphism signals elevate perceived attractiveness by clearly communicating hormonal health and genetic fitness to observers."
    : "Weak sexual dimorphism reduces the strength of biological attractiveness signals. Resistance training, optimising testosterone/estrogen levels, and reducing body fat can amplify dimorphic traits.";

  // Color / season
  if (lc.includes('color') || lc.includes('colour') || lc.includes('season') || lc.includes('tone')) return isStrength
    ? "Your natural color palette — skin undertone, hair, and eye contrast — creates strong visual harmony that enhances overall perceived attractiveness."
    : "Suboptimal color contrast between skin, hair, and eyes reduces visual impact. Wearing colors matched to your season palette can dramatically improve overall appearance.";

  // Generic fallbacks
  return isStrength
    ? "AI landmark analysis marks this as a statistically significant positive feature — placing it above the population mean in structural attractiveness metrics."
    : "AI geometric analysis flags this as a primary area for aesthetic improvement. Targeted interventions in this region would yield the highest return on overall attractiveness.";
};

/** Find matching ratio for an insight title — conservative: returns null when uncertain */
function findMatchingRatio(title: string, ratios: RatioVisualization[]): RatioVisualization | null {
  const lc = title.toLowerCase();

  // 1. Exact ratio name / shortName match (highest confidence)
  for (const r of ratios) {
    if (lc.includes(r.name.toLowerCase()) || lc.includes(r.shortName.toLowerCase())) return r;
  }

  // 2. Fingerprint phrases unique to each ratio's generated labels
  const fingerprints: Array<{ phrases: string[]; shortName: string }> = [
    { phrases: ['fwhr', 'jaw-to-cheekbone', 'cheek-to-jaw', 'facial width-to-height'], shortName: 'fWHR' },
    { phrases: ['φ', 'phi', 'golden ratio', 'golden proportion'], shortName: 'φ Ratio' },
    { phrases: ['bilateral symmetry', 'asymmetr', 'symmetrical'], shortName: 'Symmetry' },
    { phrases: ['canthal tilt', 'canthus', 'outer canthus'], shortName: 'Canthal Tilt' },
    { phrases: ['gonial angle', 'jaw angle', 'mandibular angle'], shortName: 'Jaw Angle' },
    { phrases: ['palpebral fissure', 'eye opening height', 'palpebral length'], shortName: 'Palpebral' },
    { phrases: ['facial thirds', 'upper third', 'middle third', 'lower third', 'three facial thirds'], shortName: 'Thirds' },
    { phrases: ['interocular', 'intercanthal', 'eye spacing ratio'], shortName: 'Eye Spacing' },
    { phrases: ['eye width', 'eye-to-face width'], shortName: 'Eye/Face W' },
    { phrases: ['jaw width', 'jaw-cheekbone ratio', 'cheekbone width ratio'], shortName: 'Jaw/Cheek' },
    { phrases: ['nose width', 'nasal width', 'nose-to-mouth'], shortName: 'Nose/Mouth' },
    { phrases: ['mouth width', 'lip width', 'mouth-to-face'], shortName: 'Mouth/Face' },
    { phrases: ['philtrum', 'philtral'], shortName: 'Philtrum' },
    { phrases: ['lip thickness', 'lip fullness', 'lip volume'], shortName: 'Lip Ratio' },
    { phrases: ['lower face ratio', 'lower facial third'], shortName: 'Lower Face' },
    { phrases: ['midface ratio', 'midface height'], shortName: 'Midface' },
    { phrases: ['intercanthal distance', 'inner canthal'], shortName: 'Intercanthal' },
    { phrases: ['nasal index', 'nasal ala', 'alar width'], shortName: 'Nasal Index' },
    { phrases: ['chin height', 'chin projection'], shortName: 'Chin Height' },
    { phrases: ['forehead proportion', 'forehead height'], shortName: 'Forehead' },
    { phrases: ['bigonial', 'jaw height ratio', 'jaw-to-face height'], shortName: 'Jaw/Height' },
    { phrases: ['brow angle', 'lateral brow', 'brow tilt'], shortName: 'Brow Angle' },
    { phrases: ['facial index', 'face width-to-height', 'mesoprosopic', 'euryprosopic'], shortName: 'Face Index' },
    { phrases: ['palpebral height ratio', 'eye open ratio', 'hunter eye', 'hooded eye'], shortName: 'Eye Open' },
    { phrases: ['brow elevation', 'brow lift', 'brow ptosis', 'brow arch'], shortName: 'Brow Lift' },
    { phrases: ['nose bridge width', 'bridge-to-alar', 'bridge width ratio'], shortName: 'Bridge/Alar' },
    { phrases: ['nose-to-eye width', 'nasal-to-orbital'], shortName: 'Nose/Eye W' },
  ];

  for (const fp of fingerprints) {
    if (fp.phrases.some(p => lc.includes(p))) {
      const r = ratios.find(r => r.shortName === fp.shortName);
      if (r) return r;
    }
  }

  // 3. No confident match — return null (no lines is better than wrong lines)
  return null;
}

function ScoreRing({ score, isStrength }: { score: number; isStrength: boolean }) {
  const r = 28, circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(10, score)) / 10;
  const color = isStrength ? '#22c55e' : score < 4 ? '#ef4444' : '#f97316';
  return (
    <svg width={72} height={72} className="shrink-0">
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px' }}
      />
      <text x={36} y={36} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={13} fontWeight={700} fontFamily="inherit">
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

function InsightModal({
  item, isStrength, isDarkMode, imageUrl, ratios, ratioPoints, cropInfo, onClose,
}: {
  item: InsightItem;
  isStrength: boolean;
  isDarkMode: boolean;
  imageUrl?: string;
  ratios?: RatioVisualization[];
  ratioPoints?: { x: number; y: number }[] | null;
  cropInfo?: any;
  onClose: () => void;
}) {
  const matchedRatio = ratios ? findMatchingRatio(item.title, ratios) : null;
  const viewW = 1000;
  const viewH = cropInfo ? Math.round((cropInfo.cropH / cropInfo.cropW) * 1000) : 1200;
  const accentColor = isStrength ? '#22c55e' : item.score < 4 ? '#ef4444' : '#f97316';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const modal = (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl",
            isDarkMode ? 'bg-[#111114] border border-white/8' : 'bg-white border border-zinc-200'
          )}
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isDarkMode ? 'bg-white/8 hover:bg-white/14 text-white/70' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
            )}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col md:flex-row md:items-start">
            {/* ── Left: Face image with animated lines ── */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{ width: 260 }}
            >
              {/* Padding trick: container matches crop aspect ratio so no clipping */}
              <div
                className="relative w-full"
                style={{ paddingBottom: `${(viewH / viewW) * 100}%` }}
              >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Face"
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'fill' }}
                  />
                  <div className="absolute inset-0" style={{
                    background: 'linear-gradient(to right, transparent 60%, ' + (isDarkMode ? '#111114' : '#ffffff') + ' 100%)',
                  }} />
                  {matchedRatio && ratioPoints && (
                    <LerpLineCanvas
                      display={matchedRatio}
                      points={ratioPoints}
                      viewW={viewW}
                      viewH={viewH}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-64 bg-zinc-900 flex items-center justify-center">
                  <span className="text-zinc-600 text-xs">No image</span>
                </div>
              )}
              </div>{/* end padding wrapper */}
            </div>{/* end left panel */}

            {/* ── Right: Info ── */}
            <div className={cn(
              "flex-1 flex flex-col gap-5 p-6 min-w-0 overflow-y-auto",
              isDarkMode ? '' : ''
            )}
              style={{ maxHeight: `${Math.min(560, Math.round(260 * viewH / viewW))}px` }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 pr-8">
                <ScoreRing score={item.score} isStrength={isStrength} />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border w-fit",
                    isStrength
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                      : 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                  )}>
                    {isStrength ? 'KEY STRENGTH' : item.score < 4 ? 'HIGH PRIORITY' : 'NEEDS WORK'}
                  </div>
                  <h3 className={cn("text-base font-bold leading-snug", isDarkMode ? 'text-white' : 'text-zinc-900')}>
                    {item.title}
                  </h3>
                  <span className={cn("text-[11px] font-medium", isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}>
                    {item.category} · Score {item.score.toFixed(1)} / 10
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className={cn("h-px", isDarkMode ? 'bg-white/6' : 'bg-zinc-100')} />

              {/* Description */}
              <div>
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-widest mb-2",
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                )}>Analysis</p>
                <p className={cn("text-sm leading-relaxed", isDarkMode ? 'text-zinc-300' : 'text-zinc-600')}>
                  {item.description}
                </p>
              </div>

              {/* Contributing ratio */}
              {matchedRatio && (
                <div>
                  <p className={cn(
                    "text-[9px] font-bold uppercase tracking-widest mb-3",
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  )}>Contributing Ratio</p>
                  <div className={cn(
                    "rounded-2xl border p-4 flex flex-col gap-3",
                    isDarkMode ? 'bg-white/[0.03] border-white/6' : 'bg-zinc-50 border-zinc-200'
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-semibold", isDarkMode ? 'text-zinc-200' : 'text-zinc-700')}>
                        {matchedRatio.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {typeof matchedRatio.value === 'number' ? matchedRatio.value.toFixed(2) : matchedRatio.value}
                        {matchedRatio.unit && <span className="text-xs font-normal ml-0.5">{matchedRatio.unit}</span>}
                      </span>
                    </div>
                    {/* Range bar */}
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] w-10 text-right shrink-0", isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}>
                        {matchedRatio.idealRange[0]}
                      </span>
                      <div className={cn("relative flex-1 h-2 rounded-full overflow-visible", isDarkMode ? 'bg-white/8' : 'bg-zinc-200')}>
                        {/* Ideal zone */}
                        {(() => {
                          const min = matchedRatio.idealRange[0];
                          const max = matchedRatio.idealRange[1];
                          const span = max - min;
                          const zoneMin = Math.max(0, (min - span * 0.5));
                          const zoneMax = zoneMin + span * 3;
                          const leftPct = ((min - zoneMin) / (zoneMax - zoneMin)) * 100;
                          const widthPct = ((max - min) / (zoneMax - zoneMin)) * 100;
                          const val = typeof matchedRatio.value === 'number' ? matchedRatio.value : parseFloat(String(matchedRatio.value));
                          const markerPct = Math.max(2, Math.min(98, ((val - zoneMin) / (zoneMax - zoneMin)) * 100));
                          return (
                            <>
                              <div className="absolute top-0 h-full rounded-full opacity-30"
                                style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: accentColor }} />
                              <motion.div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md"
                                style={{ left: `${markerPct}%`, background: accentColor, marginLeft: -6 }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                              />
                            </>
                          );
                        })()}
                      </div>
                      <span className={cn("text-[10px] w-10 shrink-0", isDarkMode ? 'text-zinc-500' : 'text-zinc-400')}>
                        {matchedRatio.idealRange[1]}
                      </span>
                    </div>
                    <p className={cn("text-[11px] leading-relaxed", isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}>
                      {matchedRatio.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}

function InsightList({ 
  items, 
  isDarkMode, 
  isLocked, 
  isStrength, 
  onUnlock,
  totalCount,
  imageUrl,
  ratios,
  ratioPoints,
  cropInfo,
}: { 
  items: InsightItem[], 
  isDarkMode: boolean, 
  isLocked: boolean, 
  isStrength: boolean,
  onUnlock: () => void,
  totalCount: number,
  imageUrl?: string,
  ratios?: RatioVisualization[],
  ratioPoints?: { x: number; y: number }[] | null,
  cropInfo?: any,
}) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded || !listRef.current) return;
    const el = listRef.current;
    const handler = (e: WheelEvent) => {
      if (el.scrollHeight <= el.clientHeight) return;
      const atTop = el.scrollTop === 0 && e.deltaY < 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
      if (!atTop && !atBottom) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollTop += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [isExpanded]);

  const filtered = useMemo(() => {
    let res = activeCategory === 'All' ? items : items.filter(u => u.category === activeCategory);
    if (!isLocked) return res;
    return res.slice(0, 5);
  }, [items, activeCategory, isLocked]);

  const INITIAL_COUNT = 3;
  const displayed = isExpanded ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hiddenCount = filtered.length - INITIAL_COUNT;

  return (
    <div className={cn(
      "w-full rounded-2xl md:rounded-3xl border transition-all duration-300",
      isDarkMode ? 'bg-[#0f0f13] border-white/5' : 'bg-white border-zinc-100 shadow-sm'
    )}>
      {/* Header section */}
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 pb-4 border-b",
        isDarkMode ? 'border-white/5' : 'border-zinc-100'
      )}>
        <h2 className={cn("text-xl md:text-2xl font-display font-medium tracking-tight mb-4 md:mb-0", isDarkMode ? 'text-white' : 'text-zinc-900')}>
          {isStrength ? 'Key Strengths' : 'Areas of Improvement'}
        </h2>
        
        {isLocked && (
          <button 
            onClick={onUnlock}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2024] hover:bg-[#2a2c32] text-white rounded-lg transition-colors text-xs font-bold shadow-md"
          >
            <Lock className="w-3.5 h-3.5" />
            See your {totalCount} {isStrength ? 'best features' : 'areas to improve'}
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="px-5 md:px-6 pt-4 pb-2">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2">
          {isLocked ? (
             // Static tabs when locked for visual replication
             <button className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-[#1e2024] text-white")}>Harmony</button>
          ) : (
             <button
               onClick={() => setActiveCategory('All')}
               className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all", activeCategory === 'All' ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-[#1e2024] text-white') : (isDarkMode ? 'text-white/40 hover:text-white/70' : 'text-zinc-400 hover:text-zinc-700'))}
             >
               All
             </button>
          )}
          {CATEGORIES.map(cat => {
            if (isLocked) {
              return <button key={cat} className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all", isDarkMode ? 'text-white/40' : 'text-zinc-400')}>{cat}</button>
            }
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  isActive ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-[#1e2024] text-white') : (isDarkMode ? 'text-white/40 hover:text-white/70' : 'text-zinc-400 hover:text-zinc-700')
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Portal modal — rendered outside scroll div */}
      {activeId && (() => {
        const activeItem = displayed.find(i => i.id === activeId);
        if (!activeItem) return null;
        return (
          <InsightModal
            item={activeItem}
            isStrength={isStrength}
            isDarkMode={isDarkMode}
            imageUrl={imageUrl}
            ratios={ratios}
            ratioPoints={ratioPoints}
            cropInfo={cropInfo}
            onClose={() => setActiveId(null)}
          />
        );
      })()}

      {/* List */}
      <div
        ref={listRef}
        className="divide-y divide-zinc-100 dark:divide-white/5"
        style={isExpanded ? {
            maxHeight: '480px',
            overflowY: 'scroll',
            overscrollBehavior: 'contain',
            isolation: 'isolate',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(156,163,175,0.35) transparent',
          } : {}}
      >

        <AnimatePresence mode="popLayout">
          {displayed.map((item, idx) => {
            const isBlurred = isLocked && (idx > 0 || item.isDummy);
            const isActive = activeId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => !isBlurred && setActiveId(item.id)}
                className={cn(
                  "px-4 md:px-6 py-3.5 flex items-center justify-between transition-colors cursor-pointer select-none",
                  isDarkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-zinc-50',
                  isActive && (isDarkMode ? 'bg-white/[0.04]' : 'bg-zinc-50')
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0",
                    isStrength
                      ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                  )}>
                    {isStrength ? 'IDEAL' : (item.score < 4 ? 'EXTREME' : 'HIGH')}
                  </div>
                  <span className={cn(
                    "text-xs md:text-sm font-medium truncate",
                    isDarkMode ? 'text-zinc-200' : 'text-zinc-700',
                    isBlurred && "blur-[6px] opacity-60 select-none"
                  )}>
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  {isBlurred ? (
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-zinc-400" />
                      <span className={cn(
                        "text-xs font-bold tabular-nums",
                        isStrength ? "text-emerald-400/50" : "text-rose-400/50"
                      )}>
                        {item.score.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      isStrength ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                    )}>
                      {isStrength ? '' : '−'}{Math.abs(item.score).toFixed(1)}
                    </span>
                  )}
                  <ArrowUpRight className={cn(
                    "w-3.5 h-3.5 opacity-20 transition-opacity group-hover:opacity-60",
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  )} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More / Collapse Footer */}
      {(hiddenCount > 0 || isExpanded || (isLocked && totalCount > displayed.length)) && (
        <div className={cn("p-2 border-t", isDarkMode ? 'border-white/5' : 'border-zinc-100')}>
          <button
            onClick={() => isLocked ? onUnlock() : setIsExpanded(prev => !prev)}
            className={cn(
              "w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-medium transition-colors",
              isStrength
                ? (isDarkMode ? 'bg-emerald-950/20 text-emerald-500 hover:bg-emerald-900/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100')
                : (isDarkMode ? 'bg-rose-950/20 text-rose-500 hover:bg-rose-900/30' : 'bg-rose-50 text-rose-700 hover:bg-rose-100')
            )}
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronDown className="w-3.5 h-3.5 rotate-180" />
              </>
            ) : (
              <>
                Show {isLocked ? (totalCount - displayed.length) : hiddenCount} More
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function StrengthsAndWeaknesses({ isDarkMode, isLocked, strengths, weaknesses, breakdown, onUnlock, insightDescriptions = {}, show = 'both', imageUrl, ratios, ratioPoints, cropInfo }: StrengthsAndWeaknessesProps) {
  const strengthItems = useMemo(() => {
    let items: InsightItem[] = strengths.map((s, i) => ({
      id: `s-${i}`,
      title: s,
      description: insightDescriptions[s] || getDescription(s, true),
      category: getCategory(s),
      score: getScore(s, breakdown, true),
      isStrength: true,
    }));
    
    // Always pad array to min 7 items regardless of lock state so the UI never looks empty
    const dummyTitles = [
      "Balanced eyebrow tilt", 
      "Ideal bizygomatic width", 
      "Optimal chin projection", 
      "Symmetrical vermilion border", 
      "Excellent interocular distance"
    ];
    let dummyIndex = 0;
    while (items.length < (isLocked ? 10 : 6)) {
      const dt = dummyTitles[dummyIndex % dummyTitles.length];
      items.push({
        id: `sd-${items.length}`,
        title: dt,
        description: getDescription(dt, true),
        category: 'Harmony',
        score: 9.0 + (Math.random() * 0.9),
        isStrength: true,
        isDummy: isLocked // only blur if locked
      });
      dummyIndex++;
    }
    return items.sort((a,b) => b.score - a.score);
  }, [strengths, breakdown, isLocked]);

  const weaknessItems = useMemo(() => {
    let items: InsightItem[] = weaknesses.map((w, i) => ({
      id: `w-${i}`,
      title: w,
      description: insightDescriptions[w] || getDescription(w, false),
      category: getCategory(w),
      score: getScore(w, breakdown, false),
      isStrength: false,
    }));

    // Pad array so the UI is always data-dense
    const dummyPool: { title: string; category: Category; score: number }[] = [
      { title: 'Long midface — elongated middle facial third', category: 'Harmony', score: 2.8 },
      { title: 'Lateral canthal tilt below ideal (-1.2°)', category: 'Features', score: 3.1 },
      { title: 'Jaw asymmetry — lateral landmark deviation', category: 'Angularity', score: 3.4 },
      { title: 'Narrow face structure (Low fWHR)', category: 'Angularity', score: 2.5 },
      { title: 'Suboptimal skin texture variance', category: 'Features', score: 3.8 },
      { title: 'Wide nasal base — alar width above ideal', category: 'Features', score: 3.2 },
      { title: 'Close-set eyes — below-ideal interocular distance', category: 'Harmony', score: 2.9 },
      { title: 'Recessed chin — reduced lower-face projection', category: 'Angularity', score: 2.6 },
      { title: 'Unbalanced facial thirds — lower face dominates', category: 'Harmony', score: 3.0 },
      { title: 'Weak sexual dimorphism signals', category: 'Dimorphism', score: 3.5 },
      { title: 'Dark circles reduce periorbital contrast', category: 'Features', score: 3.7 },
      { title: 'Forehead width disrupts upper-third proportion', category: 'Harmony', score: 3.3 },
      { title: 'Cheekbone projection below ideal', category: 'Angularity', score: 2.7 },
      { title: 'Skin oiliness disrupts texture uniformity', category: 'Features', score: 3.9 },
      { title: 'Eyebrow arch below optimal placement', category: 'Features', score: 3.6 },
      { title: 'Lip volume below ideal lower-face ratios', category: 'Features', score: 3.2 },
      { title: 'Nose bridge width disrupts facial thirds', category: 'Features', score: 3.4 },
      { title: 'Eye-level asymmetry — orbital height imbalance', category: 'Harmony', score: 2.8 },
    ];
    const existingTitlesLower = new Set(items.map(i => i.title.toLowerCase()));
    const availableDummies = dummyPool.filter(d => !existingTitlesLower.has(d.title.toLowerCase()));
    let dummyIndex = 0;
    while (items.length < (isLocked ? 33 : 14)) {
      const d = availableDummies[dummyIndex % availableDummies.length];
      items.push({
        id: `wd-${items.length}`,
        title: d.title,
        description: getDescription(d.title, false),
        category: d.category,
        score: d.score + (Math.random() * 0.4 - 0.2),
        isStrength: false,
        isDummy: isLocked
      });
      dummyIndex++;
    }
    return items.sort((a,b) => a.score - b.score);
  }, [weaknesses, breakdown, isLocked]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-8 h-full"
    >
      {(show === 'strengths' || show === 'both') && (
        <InsightList 
          items={strengthItems} 
          isDarkMode={isDarkMode} 
          isLocked={isLocked} 
          isStrength={true} 
          onUnlock={onUnlock}
          totalCount={strengthItems.length}
          imageUrl={imageUrl}
          ratios={ratios}
          ratioPoints={ratioPoints}
          cropInfo={cropInfo}
        />
      )}
      {(show === 'weaknesses' || show === 'both') && (
        <InsightList 
          items={weaknessItems} 
          isDarkMode={isDarkMode} 
          isLocked={isLocked} 
          isStrength={false}
          onUnlock={onUnlock} 
          totalCount={weaknessItems.length}
          imageUrl={imageUrl}
          ratios={ratios}
          ratioPoints={ratioPoints}
          cropInfo={cropInfo}
        />
      )}
    </motion.div>
  );
}
