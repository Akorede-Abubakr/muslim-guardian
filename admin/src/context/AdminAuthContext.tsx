import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../types';
import { adminApi } from '../api/admin.api';

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminUser = async () => {
    try {
      const res = await adminApi.getMe();
      if (res.data.success && res.data.user && res.data.user.role === 'admin') {
        setAdmin(res.data.user);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
      localStorage.removeItem('brightmind_admin_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('brightmind_admin_token');
    if (token) {
      fetchAdminUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: any) => {
    const res = await adminApi.login(data);
    if (res.data.success && res.data.user) {
      if (res.data.user.role !== 'admin') {
        throw new Error('Access denied: Admin privileges required.');
      }
      localStorage.setItem('brightmind_admin_token', res.data.token);
      setAdmin(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {}
    localStorage.removeItem('brightmind_admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
