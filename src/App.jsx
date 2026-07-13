import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthPage from './AuthPage.jsx';
import HomePage from './HomePage.jsx';
import InterviewPage from './InterviewPage.jsx';
import InterviewRoom from './InterviewRoom.jsx';
import AnalyticsReport from './AnalyticsReport.jsx';
import './App.css';

/**
 * Mockmate Interview Platform — root application shell
 *
 * Wires together the full platform flow:
 *   AuthPage → HomePage → InterviewPage (single-player practice)
 *                       → InterviewRoom (multi-candidate session)
 *                       → AnalyticsReport (past session review)
 *
 * The previous App.jsx was a standalone Two Sum demo with its own in-line
 * editor — it never imported any of the real Mockmate components, so the
 * deployed app showed a hardcoded demo instead of the actual platform.
 *
 * Auth is provided via AuthProvider (wraps the whole app in AuthContext),
 * which talks to the backend at API_BASE (Render in production, Vite proxy
 * in dev). The backend URL is configured in src/config/api.js.
 */

function AppShell() {
  const { user, isLoggedIn, ready, logout } = useAuth();
  // view: 'home' | 'interview' | 'room' | 'report'
  const [view, setView] = useState('home');
  const [reportSession, setReportSession] = useState(null);

  // Wait for AuthContext to finish checking localStorage + verifying token
  if (!ready) {
  return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading Mockmate…</p>
      </div>
    );
  }

  // Not logged in → show auth page (login / signup)
  if (!isLoggedIn) {
    return <AuthPage onBack={() => setView('home')} />;
  }

  // Route to the right view
  switch (view) {
    case 'interview':
      return <InterviewPage onGoHome={() => setView('home')} />;

    case 'room':
      return <InterviewRoom onGoHome={() => setView('home')} />;

    case 'report':
      return (
        <AnalyticsReport
          session={reportSession}
          onBack={() => setView('home')}
        />
      );

    default:
      return (
        <HomePage
          user={user}
          isLoggedIn={isLoggedIn}
          onStartInterview={() => setView('interview')}
          onOpenRoom={() => setView('room')}
          onViewReport={(session) => {
            setReportSession(session);
            setView('report');
          }}
          onLogout={logout}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
