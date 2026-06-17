import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role:'citizen' | 'official';
  phone?: string;
  civicScore?: number;
  avatar?: string;
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and validate with server
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with server
      apiService.getProfile()
        .then((response) => {
          setUser(response.user);
        })
        .catch((error) => {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiService.login(email, password);
      
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    setLoading(true);
    try {
      const response = await apiService.register({
        name: userData.name!,
        email: userData.email!,
        password: userData.password,
        phone: userData.phone,
        role: userData.role || 'citizen'
      });
      
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};