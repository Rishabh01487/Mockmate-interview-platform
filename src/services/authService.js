// ════════════════════════════════════════════════════════════
//  Auth Service — Login, Register, Logout
// ════════════════════════════════════════════════════════════
import { API_BASE } from '../config/api.js';

const AUTH_URL = `${API_BASE}/api/auth`;

export async function registerUser({ name, email, password }) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Registration failed');
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Login failed');
  return data;
}

export function saveAuth(token, user) {
  localStorage.setItem('mm_token', token);
  localStorage.setItem('mm_user', JSON.stringify(user));
}

export function getStoredAuth() {
  const token = localStorage.getItem('mm_token');
  const user  = localStorage.getItem('mm_user');
  if (!token || !user) return null;
  try { return { token, user: JSON.parse(user) }; }
  catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem('mm_token');
  localStorage.removeItem('mm_user');
}
