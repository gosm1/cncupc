'use client';

import React, { createContext, useContext, useState } from 'react';

interface User {
  id: number;
  email: string;
  telephone: string;
  nomComplet: string;
  role: string;
  centreRegional?: string;
  actif: boolean;
  adresse?: string;
  contactUrgence?: string;
  telephoneUrgence?: string;
  notificationsActives?: boolean;
  cin?: string; // Base64 string of CIN image
  region?: string;
}

interface AuthContextType {
  user: User | null;
  login: (nomComplet: string, role?: string, region?: string) => void;
  register: (data: RegisterData) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  telephone: string;
  nomComplet: string;
  cin?: string; // Base64 string of CIN image
  region?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false);

  const login = (nomComplet: string, role?: string, region?: string) => {
    // Einfaches State-Management ohne Backend
    const isAdminName = nomComplet.toLowerCase().includes('admin') || role === 'SUPER_ADMIN' || role === 'REGIONAL_ADMIN';
    const finalRole = isAdminName ? 'SUPER_ADMIN' : (role || 'CITIZEN');
    const userData: User = {
      id: Date.now(), // Einfache ID-Generierung
      email: '',
      telephone: '',
      nomComplet: nomComplet,
      role: finalRole,
      centreRegional: finalRole === 'REGIONAL_ADMIN' ? (region || 'Casablanca-Settat') : undefined,
      actif: true,
    };
    setUser(userData);
  };

  const register = (data: RegisterData) => {
    // Einfaches State-Management ohne Backend
    const userData: User = {
      id: Date.now(), // Einfache ID-Generierung
      email: data.email,
      telephone: data.telephone,
      nomComplet: data.nomComplet,
      role: 'CITIZEN', // Standard-Rolle
      actif: true,
      cin: data.cin,
      region: data.region,
    };
    setUser(userData);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        updateUser,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

