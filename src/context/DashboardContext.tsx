import React, { createContext, useContext, RefObject } from 'react';

interface DashboardContextType {
  isDarkMode: boolean;
  isLocked: boolean;
  scrollToPricing: () => void;
  pricingRef: RefObject<HTMLDivElement>;
  // We can add other global dashboard actions here like share actions
  handleShareClick?: () => void;
  isGeneratingCard?: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DashboardContextType;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
