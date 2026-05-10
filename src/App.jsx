import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthPage     from './AuthPage';
import HomePage     from './HomePage';
import InterviewPage from './InterviewPage';
import InterviewRoom from './InterviewRoom';
import AnalyticsReport from './AnalyticsReport';
import ChatBot      from './ChatBot';
import './App.css';
import './HomePage.css';
import './InterviewPage.css';
import './ChatBot.css';
import './components/components.css';

// ── Inner app — rendered only when logged in ──────────────────
function AppInner() {
  const { isLoggedIn, ready, user, logout } = useAuth();
  const [page, setPage]               = useState('home');
  const [reportSession, setReportSession] = useState(null);

  // Wait until auth state is loaded from localStorage
  if (!ready) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#050508' }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    </div>
  );

  // Not logged in → show auth page
  if (!isLoggedIn) return <AuthPage />;

  const goHome   = () => setPage('home');
  const goReport = (session) => { setReportSession(session); setPage('report'); };

  return (
    <div id="app-root">
      {/* User info bar */}
      <div style={{
        position: 'fixed', top: 12, right: 16, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '0.4rem 0.75rem',
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
          👤 {user?.name || user?.email}
        </span>
        <button
          onClick={logout}
          style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5', borderRadius: 6, padding: '0.25rem 0.6rem',
            fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>

      {page === 'home' && (
        <HomePage
          onStartInterview={() => setPage('interview')}
          onOpenRoom={() => setPage('room')}
        />
      )}
      {page === 'interview' && <InterviewPage onGoHome={goHome} />}
      {page === 'room'      && <InterviewRoom onGoHome={goHome} />}
      {page === 'report'    && <AnalyticsReport session={reportSession} onBack={goHome} />}

      {(page === 'home' || page === 'interview') && <ChatBot />}
    </div>
  );
}

// ── Root — wraps everything in AuthProvider ───────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
