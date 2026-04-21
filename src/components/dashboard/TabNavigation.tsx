import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ScanLine, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TabNavigationProps {
  activeTab: 'overview' | 'analysis' | 'plan';
  onTabChange: (tab: 'overview' | 'analysis' | 'plan') => void;
  isDarkMode: boolean;
}

export function TabNavigation({ activeTab, onTabChange, isDarkMode }: TabNavigationProps) {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard, desc: 'Score & breakdown' },
    { id: 'analysis' as const, label: 'Analysis', icon: ScanLine, desc: 'Deep ratios & metrics' },
    { id: 'plan' as const, label: 'Plan', icon: Zap, desc: 'Methodology & tips', badge: 'NEW' },
  ];

  return (
    <div className={cn(
      "sticky top-16 z-30 mb-8 md:mb-10 -mx-4 md:-mx-6 px-4 md:px-6 pt-4 pb-4 transition-colors duration-300 backdrop-blur-xl border-b",
      isDarkMode
        ? "border-white/[0.04] bg-[#050508]/80"
        : "border-zinc-200/50 bg-white/80"
    )}>
      <nav className="flex items-center justify-between max-w-[1400px] mx-auto gap-4">
        
        {/* Apple-style segmented control container */}
        <div className={cn(
          "flex items-center p-1.5 rounded-2xl border transition-colors",
          isDarkMode ? "bg-white/[0.02] border-white/[0.05]" : "bg-zinc-50 border-zinc-200/80"
        )}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-300 outline-none",
                  isActive
                    ? (isDarkMode ? "text-white" : "text-zinc-900")
                    : (isDarkMode ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-700")
                )}
              >
                {/* Active slider background */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-pill"
                    className={cn(
                      "absolute inset-0 rounded-xl",
                      isDarkMode ? "bg-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.5)]" : "bg-white shadow-sm border border-zinc-200/50"
                    )}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <span className="relative flex items-center gap-2 z-10">
                  <tab.icon className={cn('w-4 h-4', isActive ? (isDarkMode ? 'text-white' : 'text-zinc-900') : '')} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden sm:block">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.substring(0, 3)}</span>

                  {tab.badge && !isActive && (
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none",
                      isDarkMode ? "bg-white/10 text-white/70" : "bg-zinc-200 text-zinc-500"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.badge && isActive && (
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none",
                      isDarkMode ? "bg-indigo-500 text-white" : "bg-indigo-500 text-white"
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side: minimal active tab description */}
        <div className="hidden md:flex flex-col items-end pl-6">
          {tabs.map(tab => (
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-end"
              >
                 <span className={cn('text-[10px] font-bold tracking-widest uppercase mb-1', isDarkMode ? 'text-white/20' : 'text-zinc-400')}>
                  {tab.label} VIEW
                 </span>
                 <p className={cn('text-xs font-medium', isDarkMode ? 'text-white/60' : 'text-zinc-600')}>
                  {tab.desc}
                 </p>
              </motion.div>
            )
          ))}
        </div>

      </nav>
    </div>
  );
}
