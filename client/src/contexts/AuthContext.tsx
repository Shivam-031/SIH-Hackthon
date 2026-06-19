import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await apiService.getProfile();
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiService.login(email, password);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    setLoading(true);
    try {
      const res = await apiService.register({
        name: userData.name!,
        email: userData.email!,
        password: userData.password,
        phone: userData.phone,
        role: userData.role || 'citizen',
      });
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const res = await apiService.googleLogin(credential);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
