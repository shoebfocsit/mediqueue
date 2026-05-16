import React, { createContext, useContext, useEffect, useState } from 'react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  phone: string;
  avatar_url?: string;
  created_at?: any;
}

interface AuthContextType {
  profile: Profile | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  updateProfile: (updatedUser: Profile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('mq_user');
    if (savedUser) {
      try {
        setProfile(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('mq_user');
      }
    }
    setLoading(false);
  }, []);

  const updateProfile = (updatedUser: Profile) => {
    setProfile(updatedUser);
    localStorage.setItem('mq_user', JSON.stringify(updatedUser));
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const userData = await response.json();
      updateProfile(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setProfile(null);
    localStorage.removeItem('mq_user');
  };

  return (
    <AuthContext.Provider value={{ profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
