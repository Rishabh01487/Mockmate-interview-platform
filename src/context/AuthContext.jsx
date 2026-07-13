import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredAuth, saveAuth, clearAuth } from '../services/authService.js';
import { API_BASE } from '../config/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false); // true once we've checked localStorage

  useEffect(() => {
  const stored = getStoredAuth();
  if (stored) {
    // Verify token with backend; if invalid, clear auth.
    // If the network itself fails (CORS, sleeping server, offline),
    // keep the stored session so the user can still use the app.
    fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${stored.token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setToken(stored.token);
          setUser(data.user);
        } else {
          clearAuth();
        }
      })
      .catch(() => {
        // Network error — keep the stored session as a fallback so the
        // user isn't logged out just because the backend is unreachable.
        setToken(stored.token);
        setUser(stored.user);
      });
  }
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
