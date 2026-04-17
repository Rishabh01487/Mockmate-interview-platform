import React, { useState } from 'react';
import HomePage from './HomePage';
import InterviewPage from './InterviewPage';
import InterviewRoom from './InterviewRoom';
import AnalyticsReport from './AnalyticsReport';
import ChatBot from './ChatBot';
import './App.css';
import './HomePage.css';
import './InterviewPage.css';
import './ChatBot.css';
import './components/components.css';

// Page IDs
// 'home' | 'interview' | 'room' | 'report'

function App() {
  const [page, setPage] = useState('home');
  const [reportSession, setReportSession] = useState(null);

  const goHome    = () => setPage('home');
  const goReport  = (session) => { setReportSession(session); setPage('report'); };

  return (
    <div id="app-root">
      {page === 'home' && (
        <HomePage
          onStartInterview={() => setPage('interview')}
          onOpenRoom={() => setPage('room')}
        />
      )}

      {page === 'interview' && (
        <InterviewPage onGoHome={goHome} />
      )}

      {page === 'room' && (
        <InterviewRoom onGoHome={goHome} />
      )}

      {page === 'report' && (
        <AnalyticsReport session={reportSession} onBack={goHome} />
      )}

      {/* CS chatbot — always visible on home + interview pages */}
      {(page === 'home' || page === 'interview') && <ChatBot />}
    </div>
  );
}

export default App;
