import React, { useState } from 'react';
import HomePage from './HomePage';
import InterviewPage from './InterviewPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div className="App">
      {currentPage === 'home' ? (
        <HomePage onStartInterview={() => setCurrentPage('interview')} />
      ) : (
        <>
          <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 1000 }}>
            <button
              onClick={() => setCurrentPage('home')}
              style={{
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                padding: '0.6rem 1.2rem',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#667eea10'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              ← Home
            </button>
          </div>
          <InterviewPage />
        </>
      )}
    </div>
  );
}

export default App;
