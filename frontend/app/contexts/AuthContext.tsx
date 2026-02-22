'use client';
import { AxiosError } from 'axios';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import axiosClient from '@/app/client/axiosClient';



interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'USER';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await axiosClient.get('/api/auth/me');
        if (response.data.authenticated && response.data.user) {
          setUser(response.data.user);
          setError(null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosClient.post('/api/auth/admin/login', {
        email,
        password,
      });

      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as AxiosError<{ error: string }>)?.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosClient.post('/api/auth/logout');
      setUser(null);
      setError(null);
    } catch (err: unknown) {
      console.error('Logout error:', err);
      // Clear user state even if logout request fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
