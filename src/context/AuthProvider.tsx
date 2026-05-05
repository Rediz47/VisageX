import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../lib/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedUidRef = useRef<string | null>(null);

  useEffect(() => {
    const INIT_KEY = 'vx_init_uid';
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Per-tab cache (useRef) + cross-session cache (localStorage). The backend
        // /auth/init-user reads Firestore on every call; with the free-tier 50k-read
        // cap we must not re-invoke it for users we've already initialised.
        const persistedUid = (() => {
          try {
            return localStorage.getItem(INIT_KEY);
          } catch {
            return null;
          }
        })();
        if (initializedUidRef.current === currentUser.uid || persistedUid === currentUser.uid) {
          initializedUidRef.current = currentUser.uid;
          setLoading(false);
          return;
        }

        // Securely initialize user on backend if they don't exist
        try {
          await api.post('/auth/init-user');
          initializedUidRef.current = currentUser.uid;
          try {
            localStorage.setItem(INIT_KEY, currentUser.uid);
          } catch {
            /* ignore */
          }
        } catch (error) {
          console.error('Failed to initialize user on backend:', error);
        }
      } else {
        initializedUidRef.current = null;
        try {
          localStorage.removeItem(INIT_KEY);
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
