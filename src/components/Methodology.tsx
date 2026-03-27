import React from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  Fingerprint, 
  Scan, 
  Database, 
  ShieldCheck, 
  Layers, 
  Activity,
  ArrowLeft,
  Binary,
  Network,
  Sparkles,
  Droplets,
  Dna,
  Sun,
  Maximize2,
  Scissors,
  Eye,
  Lock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoutinePlanner } from './RoutinePlanner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MethodologyProps {
  onBack: () => void;
  isDarkMode: boolean;
  result?: any;
  imageUrl?: string;
}

export function Methodology({ onBack, isDarkMode, result, imageUrl }: MethodologyProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-400';
    if (score >= 6) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const breakdown = result?.breakdown || {};
  const isLocked = false; // Assuming it's unlocked if they are viewing the roadmap

  return (
    <div className={`min-h-screen pt-32 pb-20 px-6 lg:px-8 max-w-7xl mx-auto relative z-10`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-24"
      >
        <button 
          onClick={onBack}
          className={`group flex items-center gap-2 mb-12 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-black'}`}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Results
        </button>
        
        <h1 className={`text-7xl md:text-[120px] font-display italic leading-[0.85] tracking-tight mb-8 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
          Personalized <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 not-italic font-sans font-normal">Roadmap.</span>
        </h1>
        <p className={`text-xl max-w-xl font-light leading-relaxed ${isDarkMode ? 'text-white/50' : 'text-[#86868b]'}`}>
          An algorithmic, multi-phasic optimization protocol engineered to refine your structural morphology and elevate your baseline aesthetic percentile.
        </p>
      </motion.div>

      {!result && (
        <>
          {/* Visual Flow */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20">
            {[
              { step: 1, label: "Upload Photo" },
              { step: 2, label: "AI scans 468 landmarks" },
              { step: 3, label: "Facial geometry analysis" },
              { step: 4, label: "Skin texture evaluation" },
              { step: 5, label: "Personalized roadmap" }
            ].map((item, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${isDarkMode ? 'bg-white/5 text-white' : 'bg-zinc-100 text-zinc-900'}`}>{item.step}</div>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>{item.label}</p>
                </div>
                {i < 4 && <ArrowLeft className="hidden md:block rotate-180 opacity-20" />}
              </React.Fragment>
            ))}
          </div>

          {/* Technology Section */}
          <div className="mb-20">
            <h3 className={`text-3xl font-display italic mb-8 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Technology powering Visage AI</h3>
            <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-white/50' : 'text-[#86868b]'}`}>Our neural engine uses advanced computer vision models inspired by state-of-the-art facial landmark detection systems. We leverage facial landmark detection, computer vision, and machine learning to provide you with data-driven aesthetic insights.</p>
          </div>
        </>
      )}

      {/* Personalized Insights Section */}
      {result && (
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className={`mb-16 p-10 rounded-[2.5rem] border relative overflow-hidden ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-black/5 shadow-sm'}`}
        >
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/3">
              <div className={`relative aspect-square rounded-3xl overflow-hidden border ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                <img src={imageUrl} alt="Your Scan" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Current Score</p>
                    <p className="text-5xl font-display">{result.overallScore}<span className="text-xl opacity-40">/10</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-2/3">
              <h3 className={`text-3xl font-display italic mb-8 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Targeted Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>Main Area to Improve</p>
                  <p className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {result.analysis.weaknesses[0] || "Structural Symmetry"}
                  </p>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-[#86868b]'}`}>
                    This has the biggest potential to improve your score (+{( (result.visionAnalysis?.potentialScore || 0) - (result.overallScore || 0) ).toFixed(1)} pts).
                  </p>
                </div>
                <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Your Strongest Feature</p>
                  <p className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
                    {result.analysis.strengths[0] || "Facial Proportions"}
                  </p>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-white/40' : 'text-[#86868b]'}`}>
                    This is already above average — keep it like this.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actionable Improvements from AI */}
      {result?.visionAnalysis?.improvements && (
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className={`text-3xl font-display italic mb-2 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Top Improvements</h2>
              <p className={`text-sm font-light ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Simple actions to increase your score.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {result.visionAnalysis.improvements.map((imp: any, i: number) => (
              <div key={i} className={`p-8 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between ${isDarkMode ? 'bg-black border-white/5 hover:border-white/10' : 'bg-white border-black/5 shadow-sm hover:shadow-lg'}`}>
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-widest ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                      +{imp.scoreBump} pts
                    </div>
                  </div>
                  <h4 className={`text-xl font-bold mb-3 leading-tight ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>{imp.action}</h4>
                </div>
                <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                  <p className={`text-xs leading-relaxed font-mono uppercase tracking-wide ${isDarkMode ? 'text-white/30' : 'text-[#86868b]'}`}>
                    {i % 2 === 0 
                      ? 'Action: Skin & Texture' 
                      : 'Action: Structure & Grooming'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actionable Glow-up Tips */}
      {result && (
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className={cn(
            "mb-20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border relative overflow-hidden",
            isDarkMode ? "bg-black border-white/10" : "bg-white border-zinc-200 shadow-sm"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
          
          <h3 className={cn("text-3xl md:text-4xl font-display italic mb-10 flex items-center", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
            <Sparkles className={cn("w-8 h-8 mr-4", isDarkMode ? "text-indigo-400" : "text-indigo-600")} />
            Actionable Glow-up Tips
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                metric: 'Skin Health',
                score: breakdown['Skin Quality'] || 5,
                icon: <Sun className="w-6 h-6 text-amber-400" />,
                tips: [
                  "Hydration Focus: Increase water intake to 3L/day and use a hyaluronic acid serum to improve skin elasticity and glow.",
                  "Texture Refinement: Incorporate a gentle chemical exfoliant (AHA/BHA) 2-3 times a week to clear pores and smooth surface texture."
                ]
              },
              {
                metric: 'Symmetry',
                score: breakdown.Symmetry || 5,
                icon: <Maximize2 className="w-6 h-6 text-indigo-400" />,
                tips: [
                  "Strategic Styling: Consider a side-parted hairstyle or asymmetrical cut to naturally balance facial proportions.",
                  "Sleep Habits: Try sleeping on your back to prevent one-sided facial compression, which can contribute to asymmetry over time."
                ]
              },
              {
                metric: 'Jawline',
                score: breakdown.Jawline || 5,
                icon: <Activity className="w-6 h-6 text-emerald-400" />,
                tips: [
                  "Definition Exercises: Incorporate 'mewing' (proper tongue posture) to strengthen jaw muscles. Focus on reducing overall body fat percentage to reveal underlying bone structure.",
                  "Lymphatic Drainage: Use a Gua Sha tool or manual massage techniques to reduce puffiness and define the mandibular line."
                ]
              },
              {
                metric: 'Hair',
                score: breakdown.Hair || 7.5,
                icon: <Scissors className="w-6 h-6 text-rose-400" />,
                tips: [
                  "Texture Optimization: Switch to sulfate-free products and incorporate a weekly deep-conditioning mask to enhance natural volume and shine.",
                  "Scalp Health: Use a scalp massager during washing to stimulate blood flow, promoting thicker and healthier hair growth."
                ]
              },
              {
                metric: 'Eyes',
                score: breakdown.Eyes || 5,
                icon: <Eye className="w-6 h-6 text-cyan-400" />,
                tips: [
                  "Brightness Routine: Use a caffeine-infused eye cream to reduce puffiness and ensure 7-9 hours of quality sleep to minimize dark circles.",
                  "Contrast Enhancement: Groom eyebrows to frame the eyes better, creating a more alert and symmetrical appearance."
                ]
              }
            ].map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-6 md:p-8 rounded-3xl border relative group overflow-hidden",
                  isDarkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-zinc-200"
                )}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", isDarkMode ? "bg-white/5" : "bg-white shadow-sm")}>
                      {tip.icon}
                    </div>
                    <h4 className={cn("font-display italic text-2xl", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>{tip.metric}</h4>
                  </div>
                  <div className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest", getScoreBg(tip.score), "text-white")}>
                    {isLocked ? "??" : tip.score.toFixed(1)}
                  </div>
                </div>

                <div className="space-y-4">
                  {isLocked ? (
                    <div className="flex items-start gap-3 opacity-40 italic text-sm">
                      <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Unlock to see personalized advice for your {tip.metric.toLowerCase()}.
                    </div>
                  ) : (
                    tip.tips.map((t, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <p className={cn("text-sm md:text-base leading-relaxed", isDarkMode ? "text-white/70" : "text-zinc-600")}>{t}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Visual Progress Tracking & Gamification */}
      {result && (
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Progress Bar */}
          <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className={`text-2xl font-display italic mb-6 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Your Potential Glow-Up</h3>
            <div className="flex justify-between mb-2">
              <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>Current: {result.overallScore}</span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Potential: {result.visionAnalysis?.potentialScore?.toFixed(1) || '9.7'}</span>
            </div>
            <div className={`w-full h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-zinc-100'}`}>
              <motion.div 
                initial={{ width: `${(result.overallScore || 0) * 10}%` }}
                animate={{ width: `${(result.visionAnalysis?.potentialScore || 0) * 10}%` }}
                transition={{ duration: 2, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-rose-500"
              />
            </div>
            <p className={`mt-4 text-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Potential Gain: +{( (result.visionAnalysis?.potentialScore || 0) - (result.overallScore || 0) ).toFixed(1)} pts</p>
          </div>

          {/* Timeline */}
          <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-between ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
            <div>
              <h3 className={`text-2xl font-display italic mb-6 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Your Progress Timeline</h3>
              <div className="space-y-4">
                {[
                  { week: 'Week 2', multiplier: 0.25 },
                  { week: 'Week 4', multiplier: 0.6 },
                  { week: 'Week 6', multiplier: 1.0 },
                ].map((item, i) => {
                  const totalGain = (result.visionAnalysis?.potentialScore || 0) - (result.overallScore || 0);
                  const bump = (totalGain * item.multiplier).toFixed(1);
                  return (
                    <div key={i} className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>{item.week}</span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>+{bump} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-zinc-700'}`}>
                Follow this plan to reach your full potential.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommended Products & Track Progress CTA */}
      {result && (
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Recommended Products */}
          <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className={`text-2xl font-display italic mb-6 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Recommended Products</h3>
            <ul className="space-y-4">
              {['Vitamin C Serum', 'Hydrating Cleanser', 'SPF 50 Sunscreen'].map((product, i) => (
                <li key={i} className={`flex items-center gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-zinc-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                    <Droplets className="w-5 h-5" />
                  </div>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{product}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Track Progress CTA */}
          <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-center items-center text-center ${isDarkMode ? 'bg-black border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
            <h3 className={`text-2xl font-display italic mb-4 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>Track Your Progress</h3>
            <p className={`mb-8 text-sm ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>Take a new scan in 30 days to see your improvement and update your routine.</p>
            <button className={`px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs transition-all ${isDarkMode ? 'bg-white text-black hover:bg-indigo-400 hover:text-white' : 'bg-zinc-900 text-white hover:bg-black'}`}>
              Set Reminder
            </button>
          </div>
        </motion.div>
      )}

      {/* Routine Planner */}
      {result ? (
        <div className="mb-20">
          <RoutinePlanner result={result} isDarkMode={isDarkMode} />
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          {[
            {
              icon: <Scan className="w-6 h-6" />,
              title: "Neural Mapping",
              desc: "Our engine identifies 468 3D landmarks to create a high-fidelity map of your facial structure."
            },
            {
              icon: <Binary className="w-6 h-6" />,
              title: "Facial Geometry",
              desc: "Our AI evaluates facial symmetry, proportions, and golden-ratio balance."
            },
            {
              icon: <Network className="w-6 h-6" />,
              title: "Skin Health Evaluation",
              desc: "Advanced computer vision models analyze skin texture, clarity, and health markers."
            },
            {
              icon: <Database className="w-6 h-6" />,
              title: "Aesthetic Benchmarking",
              desc: "Your data is compared against aesthetic harmony standards to provide objective insights."
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "Privacy First",
              desc: "All processing happens locally on your device. Your biometric data never touches our servers."
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: "Personalized Roadmap",
              desc: "We provide a roadmap of targeted interventions to maximize your unique natural features."
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              variants={itemVariants}
              className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
                {feature.icon}
              </div>
              <h4 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>{feature.title}</h4>
              <p className={`text-sm leading-relaxed font-light ${isDarkMode ? 'text-white/40' : 'text-[#86868b]'}`}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-20"
        >
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-white/40' : 'text-zinc-500'}`}>
            Ready to see your personalized roadmap?
          </p>
          <button 
            onClick={() => {
              onBack();
              setTimeout(() => {
                const element = document.getElementById('analyzer-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className={`px-12 py-6 rounded-full font-bold uppercase tracking-widest text-xs transition-all duration-500 ${
              isDarkMode 
                ? 'bg-white text-black hover:bg-indigo-400 hover:text-white' 
                : 'bg-zinc-900 text-white hover:bg-black'
            }`}
          >
            Start Your Free Neural Scan
          </button>
        </motion.div>
      )}

    </div>
  );
}
