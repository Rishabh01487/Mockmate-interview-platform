import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredAuth, saveAuth, clearAuth } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false); // true once we've checked localStorage

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) { setToken(stored.token); setUser(stored.user); }
    setReady(true);
  }, []);

  const login = (token, user) => {
    saveAuth(token, user);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
