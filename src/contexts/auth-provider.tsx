'use client';

import type { User } from '@/lib/types';
import type { ReactNode } from 'react';
import React,
 { createContext, useState, useMemo, useCallback } from 'react';
import { users } from '@/lib/data';

type AuthContextType = {
  user: User | null;
  login: (email: string, role: User['role']) => void;
  logout: () => void;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback((email: string, role: User['role']) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const foundUser = users.find(u => u.role === role);
      setUser(foundUser || null);
      setLoading(false);
    }, 500);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, loading }),
    [user, login, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
