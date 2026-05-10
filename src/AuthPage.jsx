import React, { useState } from 'react';
import { registerUser, loginUser } from './services/authService.js';
import { useAuth } from './context/AuthContext.jsx';
import './AuthPage.css';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode,    setMode]    = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await loginUser({ email: form.email, password: form.password });
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        data = await registerUser({ name: form.name, email: form.email, password: form.password });
      }
      login(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
    setForm({ name: '', email: '', password: '' });
  };

  return (
    <div className="auth-root">
      {/* Background particles */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">M</div>
          <span className="auth-logo-text">MockMate</span>
        </div>

        {/* Headline */}
        <h1 className="auth-title">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to continue your interview prep journey'
            : 'Start practicing for your dream tech job today'}
        </p>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Rishabh Singh"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              mode === 'login' ? 'Sign In →' : 'Create Account →'
            )}
          </button>
        </form>

        {/* Switch mode */}
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="auth-switch-btn" onClick={switchMode} type="button">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        {/* Features */}
        <div className="auth-features">
          <div className="auth-feature">🧠 AI-Powered Questions</div>
          <div className="auth-feature">📊 Progress Analytics</div>
          <div className="auth-feature">🔴 Live Interview Rooms</div>
        </div>
      </div>
    </div>
  );
}
