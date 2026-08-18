import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '@/src/api/client';
import type { UserSession, UserRole } from '@/src/theme';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ ok: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: UserSession | null }>('/api/auth/me');
    if (data?.user) {
      setUser(data.user);
    } else {
      setUser(null);
      await SecureStore.deleteItemAsync('gurukul_token');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await api.post<{ token?: string; user?: UserSession }>('/api/auth/login', { email, password });
      if (error || !data?.token || !data?.user) {
        return { ok: false, error: error || 'Login failed' };
      }
      await SecureStore.setItemAsync('gurukul_token', data.token);
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Login failed' };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('gurukul_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
