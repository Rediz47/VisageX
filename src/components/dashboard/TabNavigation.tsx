import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ScanLine, Zap, Users, Scissors, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMotionTier } from '../../context/MotionProvider';
import { easings, springSoft } from '../../lib/motion';

interface TabNavigationProps {
  activeTab: 'overview' | 'analysis' | 'plan';
  onTabChange: (tab: 'overview' | 'analysis' | 'plan') => void;
  isDarkMode: boolean;
  imageUrl?: string;
  isLocked?: boolean;
  celebrityResults?: any[];
}

export function TabNavigation({
  activeTab,
  onTabChange,
  isDarkMode,
  imageUrl,
  isLocked,
  celebrityResults
}: TabNavigationProps) {
  const navigate = useNavigate();
  const { preset } = useMotionTier();
  const pillTransition = preset.flags.enableTabLayoutSpring
    ? springSoft
    : { duration: preset.durations.med, ease: easings.easeOutExpo };
  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: LayoutDashboard,
      desc: 'Score & breakdown'
    },
    { id: 'analysis' as const, label: 'Analysis', icon: ScanLine, desc: 'Deep ratios & metrics' },
    { id: 'plan' as const, label: 'Plan', icon: Zap, desc: 'Methodology & tips', badge: 'NEW' }
  ];

  return (
    <div
      className={cn(
        'sticky top-16 z-30 mb-8 md:mb-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-4 pb-4 transition-colors duration-300 backdrop-blur-xl border-b',
        isDarkMode ? 'border-white/[0.04] bg-[#050508]/80' : 'border-zinc-200/50 bg-white/80'
      )}
    >
      <nav className="flex items-center justify-between max-w-[1400px] mx-auto gap-4">
        {/* Apple-style segmented control container */}
        <div
          className={cn(
            'flex items-center p-1.5 rounded-2xl border transition-colors',
            isDarkMode ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-zinc-50 border-zinc-200/80'
          )}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 outline-none',
                  isActive
                    ? isDarkMode
                      ? 'text-white'
                      : 'text-zinc-900'
                    : isDarkMode
                      ? 'text-zinc-500 hover:text-zinc-300'
                      : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                {/* Active slider background */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className={cn(
                      'absolute inset-0 rounded-xl',
                      isDarkMode
                        ? 'bg-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.5)]'
                        : 'bg-white shadow-sm border border-zinc-200/50'
                    )}
                    transition={pillTransition}
                  />
                )}

                <span className="relative flex items-center gap-2 z-10">
                  <tab.icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? (isDarkMode ? 'text-white' : 'text-zinc-900') : ''
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="hidden sm:block">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.substring(0, 3)}</span>

                  {tab.badge && !isActive && (
                    <span
                      className={cn(
                        'text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none',
                        isDarkMode ? 'bg-white/10 text-white/70' : 'bg-zinc-200 text-zinc-500'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {tab.badge && isActive && (
                    <span
                      className={cn(
                        'text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none',
                        isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-500 text-white'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side: Celebrity + Hair nav pills */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              navigate('/celebrity', { state: { imageUrl, isLocked, celebrityResults } })
            }
            className={cn(
              'group relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border overflow-hidden',
              isDarkMode
                ? 'bg-cyan-500/[.06] border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/[.12] hover:border-cyan-500/40'
                : 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
            )}
            title="Celebrity Lookalike"
          >
            <Users className="w-4 h-4" strokeWidth={2.2} />
            <span className="hidden lg:block">Celebrity</span>
            <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/hair', { state: { imageUrl } })}
            className={cn(
              'group relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border overflow-hidden',
              isDarkMode
                ? 'bg-purple-500/[.06] border-purple-500/20 text-purple-300 hover:bg-purple-500/[.12] hover:border-purple-500/40'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300'
            )}
            title="Hair Analysis"
          >
            <Scissors className="w-4 h-4" strokeWidth={2.2} />
            <span className="hidden lg:block">Hair</span>
            <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </div>
      </nav>
    </div>
  );
}
