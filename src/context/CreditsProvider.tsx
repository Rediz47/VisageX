import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthProvider';

type CreditsContextType = {
  credits: number;
  userData: any | null;
};

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      setUserData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCredits(data.credits || 0);
          setUserData(data);
        }
      },
      (error) => {
        console.error('[CreditsProvider] Firestore error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({ credits, userData }), [credits, userData]);

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
