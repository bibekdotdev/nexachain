import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexachain_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('nexachain_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: u, token } = res.data.data;
    localStorage.setItem('nexachain_token', token);
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    const { user: u, token } = res.data.data;
    localStorage.setItem('nexachain_token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('nexachain_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
