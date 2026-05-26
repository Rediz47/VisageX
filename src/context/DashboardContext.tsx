import React, { createContext, useContext, RefObject } from 'react';

export type RevealStage = 'IDLE' | 'PRIMARY' | 'SECONDARY' | 'TERTIARY' | 'COMPLETE';

const revealStageOrder: RevealStage[] = ['IDLE', 'PRIMARY', 'SECONDARY', 'TERTIARY', 'COMPLETE'];

export function stageReached(current: RevealStage, target: RevealStage) {
  return revealStageOrder.indexOf(current) >= revealStageOrder.indexOf(target);
}

interface DashboardContextType {
  isDarkMode: boolean;
  isLocked: boolean;
  revealStage?: RevealStage;
  scrollToPricing: () => void;
  onOpenPricing?: () => void;
  pricingRef: RefObject<HTMLDivElement>;
  // We can add other global dashboard actions here like share actions
  handleShareClick?: () => void;
  isGeneratingCard?: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value: DashboardContextType;
}) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return { revealStage: 'IDLE' as RevealStage, ...context };
}
