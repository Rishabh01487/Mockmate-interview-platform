import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES, DIFFICULTIES, getRandomQuestions, questions } from './data/questions';
import MCQQuestion from './components/MCQQuestion';
import CodeEditor from './components/CodeEditor';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import './components/AnalyticsDashboard.css';
import { generateQuestions, isAiOnline } from './services/aiService';
import { API_BASE } from './config/api.js';

// Difficulty-based point values (must match backend)
const DIFF_POINTS = { easy: 5, medium: 10, hard: 20 };
const getMaxPoints = (d) => DIFF_POINTS[(d || 'medium').toLowerCase()] || DIFF_POINTS.medium;

// ============================================================
// Shared tiny SVG icons
// ============================================================
const Ic = ({ d, vb = '0 0 24 24', size = 16, sw = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {d}
  </svg>
);

const Icons = {
  back: <Ic size={15} d={<><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></>} />,
  check: <Ic size={15} d={<><polyline points="20 6 9 17 4 12"/></>} />,
  next: <Ic size={15} d={<><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></>} />,
  exit: <Ic size={15} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
  star: <Ic size={14} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none"/>} />,
  timer: <Ic size={14} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />,
  logo: <Ic size={16} d={<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>} />,
};

const CategoryIcons = {
  dsa: <Ic size={20} d={<><rect x="9" y="9" width="6" height="6"/><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></>} />,
  os: <Ic size={20} d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>} />,
  dbms: <Ic size={20} d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>} />,
  cn: <Ic size={20} d={<><circle cx="12" cy="12" r="3"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M12 3c-2 3-2 15 0 18M3 12c3-2 15-2 18 0"/></>} />,
  oop: <Ic size={20} d={<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>} />,
  systemdesign: <Ic size={20} d={<><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>} />,
  webdev: <Ic size={20} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>} />,
  corecs: <Ic size={20} d={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>} />,
};

// ============================================================
// Timer Hook
// ============================================================
function useTimer(initialSeconds, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const ref = useRef(null);

  useEffect(() => {
    setSeconds(initialSeconds);
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current); onExpire && onExpire(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [initialSeconds]);

  const pct = Math.round((seconds / initialSeconds) * 100);
  const fmt = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--error)';
  return { seconds, fmt, pct, color };
}

// ============================================================
// Step 1: Category Selector
// ============================================================
const CategorySelector = ({ selected, onSelect, onNext }) => (
  <div className="ip-step animate-fade-in-up">
    <div className="ip-step-header">
      <h2 className="ip-step-title">Choose a Domain</h2>
      <p className="ip-step-sub">Select the CS area you want to practice today</p>
    </div>
    <div className="ip-categories-grid">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          id={`cat-${cat.id}`}
          className={`ip-cat-card${selected === cat.id ? ' ip-cat-card--active' : ''}`}
          onClick={() => onSelect(cat.id)}
          aria-pressed={selected === cat.id}
        >
          <div className="ip-cat-icon">{CategoryIcons[cat.id]}</div>
          <div className="ip-cat-label">{cat.label}</div>
          {selected === cat.id && <div className="ip-cat-check">{Icons.check}</div>}
        </button>
      ))}
    </div>
    <div className="ip-step-footer">
      <button
        className="ip-btn-primary"
        id="cat-next-btn"
        onClick={onNext}
        disabled={!selected}
      >
        Next — Set Difficulty {Icons.next}
      </button>
    </div>
  </div>
);

// ============================================================
// Step 2: Difficulty Selector (with AI toggle)
// ============================================================
const DIFF_DESCRIPTIONS = {
  Easy: 'Foundational concepts and definitions. Good for warm-up.',
  Medium: 'Core interview questions requiring clear explanation and depth.',
  Hard: 'Advanced topics, edge cases, and design questions.',
};

const Q_TYPES = [
  { id: 'all', label: 'All Types', icon: '🎯' },
  { id: 'mcq', label: 'MCQ', icon: '☑️' },
  { id: 'text', label: 'Theory', icon: '📝' },
  { id: 'coding', label: 'Coding', icon: '💻' },
];

const Q_COUNTS = [10, 20, 40, 50, 100, 150];

const DifficultySelector = ({ selected, onSelect, onBack, onStart, useAI, onToggleAI, aiLoading, questionType, onTypeSelect, questionCount, onCountSelect }) => (
  <div className="ip-step animate-fade-in-up">
    <div className="ip-step-header">
      <h2 className="ip-step-title">Select Difficulty & Type</h2>
      <p className="ip-step-sub">Choose difficulty level and question format</p>
    </div>
    <div className="ip-diff-list">
      {DIFFICULTIES.map(diff => (
        <button
          key={diff}
          id={`diff-${diff.toLowerCase()}`}
          className={`ip-diff-card${selected === diff ? ' ip-diff-card--active' : ''}`}
          onClick={() => onSelect(diff)}
          aria-pressed={selected === diff}
        >
          <div className="ip-diff-top">
            <span className={`ip-diff-badge ip-diff-badge--${diff.toLowerCase()}`}>{diff}</span>
            {selected === diff && <span className="ip-diff-check">{Icons.check}</span>}
          </div>
          <p className="ip-diff-desc">{DIFF_DESCRIPTIONS[diff]}</p>
        </button>
      ))}
    </div>

    {/* Question Type Selector */}
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Question Format</div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Q_TYPES.map(t => (
          <button
            key={t.id}
            id={`qtype-${t.id}`}
            onClick={() => onTypeSelect(t.id)}
            style={{
              padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-md)',
              border: `1px solid ${questionType === t.id ? 'var(--text-primary)' : 'var(--border-primary)'}`,
              background: questionType === t.id ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              color: questionType === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* Question Count Selector */}
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Number of Questions</div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Q_COUNTS.map(n => (
          <button
            key={n}
            id={`qcount-${n}`}
            onClick={() => onCountSelect(n)}
            style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
              border: `1px solid ${questionCount === n ? 'var(--text-primary)' : 'var(--border-primary)'}`,
              background: questionCount === n ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              color: questionCount === n ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              minWidth: 50, textAlign: 'center',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>

    {/* AI Question Generation Toggle */}
    <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>⚡ AI-Generated Questions</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verge1.o generates unique questions using AI</div>
        </div>
      </div>
      <button
        id="ai-toggle-btn"
        onClick={onToggleAI}
        style={{
          padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', border: 'none',
          background: useAI ? '#6366f1' : 'var(--bg-elevated)', color: useAI ? '#fff' : 'var(--text-muted)',
          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        {useAI ? '✓ AI Enabled' : 'Enable AI'}
      </button>
    </div>

    <div className="ip-step-footer ip-step-footer--split">
      <button className="ip-btn-ghost" id="diff-back-btn" onClick={onBack}>{Icons.back} Back</button>
      <button className="ip-btn-primary" id="diff-start-btn" onClick={onStart} disabled={!selected || aiLoading}>
        {aiLoading ? 'Generating Questions…' : <>Begin Session {Icons.next}</>}
      </button>
    </div>
  </div>
);

// ============================================================
// Session Screen
// ============================================================
const SessionScreen = ({ questions, category, difficulty, onFinish, onExit }) => {
  const [qIdx, setQIdx]       = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [responses, setResponses]   = useState([]);
  const [loading, setLoading]       = useState(false);

  const rawQ = questions[qIdx] || null;
  const q = rawQ ? { ...rawQ, questionType: ['mcq', 'coding'].includes(rawQ.questionType) ? rawQ.questionType : 'text' } : null;
  const total = questions.length;
  const qType = q ? q.questionType : 'text';

  const { fmt, pct, color } = useTimer(
    q?.timeLimit || 120,
    () => { if (!submitted) saveResponse({ timedOut: true, score: 0, answer: '[Time expired]' }); }
  );

  const saveResponse = useCallback((fields) => {
    if (!q) return;
    const newResp = {
      question:       q.question || q.text || q.problemStatement || '',
      questionType:   qType,
      answer:         fields.answer || '',
      expectedPoints: q.expectedPoints || q.keyPoints || [],
      score:          fields.score ?? 0,
      tags:           q.tags || [],
      difficulty:     q.difficulty || difficulty,
      timedOut:       fields.timedOut || false,
      // MCQ-specific
      selectedOption: fields.selectedOption ?? null,
      isCorrect:      fields.isCorrect ?? null,
      options:        q.options || [],
      explanation:    q.explanation || '',
      // Coding-specific
      passedCount:   fields.passedCount ?? null,
      totalTests:    fields.totalTests ?? null,
      status:        fields.status || null,
      code:          fields.code || '',
      language:      fields.language || '',
    };
    setResponses(prev => [...prev, newResp]);
    setSubmitted(true);
    setLoading(false);
  }, [q, qType, difficulty]);

  // Text-answer submission
  const handleTextSubmit = useCallback((timedOut = false) => {
    if (!textAnswer.trim() && !timedOut) return;
    setLoading(true);
    const maxPts = getMaxPoints(q?.difficulty);
    setTimeout(() => {
      const words = textAnswer.trim().split(/\s+/).length;
      const pct = timedOut ? 0 : Math.min(100, Math.round((words / 80) * 100));
      const score = Math.round((pct / 100) * maxPts);
      saveResponse({ answer: textAnswer.trim() || '[No answer — time expired]', score, maxPoints: maxPts, timedOut });
    }, 500);
  }, [textAnswer, saveResponse, q]);

  // MCQ submission (auto-scored)
  const handleMCQSubmit = useCallback((selectedIndex, isCorrect, score100) => {
    const maxPts = getMaxPoints(q?.difficulty);
    saveResponse({
      answer:         q.options?.[selectedIndex]?.text || '',
      selectedOption: selectedIndex,
      isCorrect,
      score:          isCorrect ? maxPts : 0,
      maxPoints:      maxPts,
    });
  }, [q, saveResponse]);

  // Coding submission
  const handleCodingSubmit = useCallback((result) => {
    const maxPts = getMaxPoints(q?.difficulty);
    const pct = result.score || 0;
    const score = Math.round((pct / 100) * maxPts);
    saveResponse({
      answer:      result.code,
      code:        result.code,
      language:    result.language,
      passedCount: result.passedCount,
      totalTests:  result.totalTests,
      status:      result.status,
      score,
      maxPoints:   maxPts,
    });
  }, [saveResponse, q]);

  const handleNext = () => {
    if (qIdx < total - 1) {
      setQIdx(i => i + 1);
      setTextAnswer('');
      setSubmitted(false);
      setLoading(false);
    } else {
      onFinish([...responses]);
    }
  };

  const catLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  const lastResp = responses[responses.length - 1];

  return (
    <div className={`ip-session animate-fade-in${qType === 'coding' ? ' ip-session--coding' : ''}`}>
      {/* Topbar */}
      <div className="ip-session-topbar">
        <div className="ip-session-meta">
          <span className="ip-meta-cat">{catLabel}</span>
          <span className={`ip-diff-badge ip-diff-badge--${difficulty.toLowerCase()}`}>{difficulty}</span>
          <span className={`ce-type-badge ce-type-${qType}`}>
            {{ text: 'Theory', mcq: 'MCQ', coding: 'Coding' }[qType]}
          </span>
        </div>
        <div className="ip-session-progress-wrap">
          <div className="ip-session-progress-bar">
            <div className="ip-session-progress-fill" style={{ width: `${((qIdx + (submitted ? 1 : 0)) / total) * 100}%` }}></div>
          </div>
          <span className="ip-session-progress-label">Q {qIdx + 1} / {total}</span>
        </div>
        <div className="ip-timer" style={{ color }}>{Icons.timer} {fmt}</div>
        <button className="ip-btn-exit" id="session-exit-btn" onClick={onExit}>{Icons.exit} Exit</button>
      </div>

      {/* Timer bar */}
      <div className="ip-timer-track">
        <div className="ip-timer-fill" style={{ width: `${pct}%`, background: color }}></div>
      </div>

      {/* ── Coding layout (full split view) ── */}
      {qType === 'coding' && (
        <div className="ip-coding-wrap">
          {!submitted
            ? <CodeEditor question={q} onSubmit={handleCodingSubmit} />
            : (
              <div className="ip-feedback animate-fade-in-up" style={{ maxWidth: 700, margin: '2rem auto', padding: '1.5rem 5%' }}>
                <div className="ip-feedback-header">
                  <div className="ip-feedback-score-wrap">
                    <span className="ip-feedback-score-label">Score</span>
                    <span className="ip-feedback-score" style={{ color: lastResp?.score >= 7 ? 'var(--success)' : lastResp?.score >= 4 ? 'var(--warning)' : 'var(--error)' }}>
                      {lastResp?.score ?? 0}<span className="ip-feedback-score-max">/{lastResp?.maxPoints || 10}</span>
                    </span>
                  </div>
                  <span className={`ar-verdict-badge ${lastResp?.status === 'accepted' ? 'ar-verdict--pass' : 'ar-verdict--fail'}`}>
                    {(lastResp?.status || '').replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="ip-feedback-block">
                  <div className="ip-feedback-block-label">{lastResp?.passedCount}/{lastResp?.totalTests} test cases passed</div>
                </div>
                <div className="ip-feedback-actions">
                  <button className="ip-btn-ghost" id="exit-feedback-btn" onClick={onExit}>{Icons.exit} End Session</button>
                  <button className="ip-btn-primary" id="next-question-btn" onClick={handleNext}>
                    {qIdx < total - 1 ? <>{Icons.next} Next Question</> : <>{Icons.check} View Summary</>}
                  </button>
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── MCQ layout ── */}
      {qType === 'mcq' && (
        <div className="ip-session-body">
          <div className="ip-question-card">
            <div className="ip-question-tags">
              {(q.tags || []).slice(0, 3).map(t => <span key={t} className="ip-tag">{t}</span>)}
            </div>
            <h3 className="ip-question-text">{q.text || q.question}</h3>
          </div>
          {!submitted
            ? <MCQQuestion question={q} onSubmit={handleMCQSubmit} />
            : (
              <div className="ip-feedback animate-fade-in-up">
                <div className="ip-feedback-header">
                  <div className="ip-feedback-score-wrap">
                    <span className="ip-feedback-score-label">Score</span>
                    <span className="ip-feedback-score" style={{ color: lastResp?.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                      {lastResp?.score ?? 0}<span className="ip-feedback-score-max">/{lastResp?.maxPoints || 10}</span>
                    </span>
                  </div>
                </div>
                <MCQQuestion question={q} readOnly submittedIndex={lastResp?.selectedOption} />
                <div className="ip-feedback-actions">
                  <button className="ip-btn-ghost" id="exit-feedback-btn" onClick={onExit}>{Icons.exit} End Session</button>
                  <button className="ip-btn-primary" id="next-question-btn" onClick={handleNext}>
                    {qIdx < total - 1 ? <>{Icons.next} Next Question</> : <>{Icons.check} View Summary</>}
                  </button>
                </div>
              </div>
            )
          }
        </div>
      )}

      {/* ── Text/Theory layout ── */}
      {qType === 'text' && (
        <div className="ip-session-body">
          <div className="ip-question-card">
            <div className="ip-question-meta">
              <div className="ip-question-tags">
                {(q.tags || []).slice(0, 3).map(t => <span key={t} className="ip-tag">{t}</span>)}
              </div>
            </div>
            <h3 className="ip-question-text">{q.question || q.text}</h3>
          </div>
          {!submitted ? (
            <div className="ip-answer-area">
              <label className="ip-answer-label" htmlFor="answer-input">Your Answer</label>
              <textarea
                id="answer-input"
                className="ip-textarea"
                placeholder="Type your answer here. Focus on key concepts, definitions, and examples..."
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                disabled={loading}
                rows={7}
              />
              <div className="ip-answer-footer">
                <span className="ip-word-count">{textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0} words</span>
                <button
                  className="ip-btn-primary"
                  id="submit-answer-btn"
                  onClick={() => handleTextSubmit(false)}
                  disabled={loading || !textAnswer.trim()}
                >
                  {loading ? 'Evaluating...' : <>{Icons.check} Submit Answer</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="ip-feedback animate-fade-in-up">
              <div className="ip-feedback-header">
                <div className="ip-feedback-score-wrap">
                  <span className="ip-feedback-score-label">Score</span>
                  <span className="ip-feedback-score">{lastResp?.score ?? 0}<span className="ip-feedback-score-max">/{lastResp?.maxPoints || 10}</span></span>
                </div>
                <div className="ip-feedback-status">
                  {lastResp?.timedOut && <span className="ip-feedback-timeout-tag">Time expired</span>}
                </div>
              </div>
              {textAnswer.trim() && (
                <div className="ip-feedback-block ip-feedback-answer-block">
                  <div className="ip-feedback-block-label">Your Answer</div>
                  <p className="ip-feedback-answer-text">{textAnswer}</p>
                </div>
              )}
              {(q.expectedPoints || q.keyPoints || []).length > 0 && (
                <div className="ip-feedback-block">
                  <div className="ip-feedback-block-label">Key Points to Cover</div>
                  <ul className="ip-feedback-points">
                    {(q.expectedPoints || q.keyPoints || []).map((pt, i) => (
                      <li key={i} className="ip-feedback-point">
                        <span className="ip-point-bullet">{Icons.check}</span>{pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="ip-feedback-actions">
                <button className="ip-btn-ghost" id="exit-feedback-btn" onClick={onExit}>{Icons.exit} End Session</button>
                <button className="ip-btn-primary" id="next-question-btn" onClick={handleNext}>
                  {qIdx < total - 1 ? <>{Icons.next} Next Question</> : <>{Icons.check} View Summary</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Summary Screen (with full Analytics Dashboard)
// ============================================================
const SummaryScreen = ({ responses, category, difficulty, onRestart, onHome }) => {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  const total = responses.length;
  const totalPoints = responses.reduce((s, r) => s + (r.score || 0), 0);
  const maxPoints = responses.reduce((s, r) => s + (r.maxPoints || getMaxPoints(r.difficulty)), 0);

  // Build domainResults for AnalyticsDashboard
  const correctAnswers = responses.filter(r => {
    if (r.questionType === 'mcq') return r.isCorrect === true;
    if (r.questionType === 'coding') return (r.score || 0) >= 7;
    return (r.score || 0) >= 5;
  }).length;

  const domainResults = [{
    domain: category,
    questions: responses.map(r => ({
      question: r.question,
      answer: r.answer || r.code || '',
      score: (r.score || 0) * 10,
      isCorrect: r.questionType === 'mcq' ? r.isCorrect === true : (r.score || 0) >= 5,
      difficulty: r.difficulty || difficulty,
      timeSpent: 0
    })),
    totalScore: total > 0 ? Math.round((correctAnswers / total) * 100) : 0,
    totalQuestions: total,
    correctAnswers,
    timeTaken: 0,
    timeAllotted: 0
  }];

  return (
    <div className="ip-summary animate-fade-in-up">
      <div className="ip-summary-header">
        <div className="ip-summary-badge">Session Complete</div>
        <h2 className="ip-summary-title">{catLabel} · {difficulty}</h2>
      </div>

      {/* Points Summary */}
      {maxPoints > 0 && (
        <div style={{ textAlign: 'center', margin: '1rem 0', padding: '1rem', background: 'rgba(99,102,241,0.08)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6366f1' }}>{totalPoints}<span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 400, marginLeft: 4 }}>/{maxPoints}</span></div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>points earned · {maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0}%</div>
        </div>
      )}

      {/* Full Analytics Dashboard */}
      <AnalyticsDashboard
        domainResults={domainResults}
        totalTime={0}
        candidateName="Your"
      />

      {/* Per-Question Breakdown */}
      <div className="ip-summary-responses" style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question-by-Question Review</div>
        {responses.map((r, i) => (
          <div key={i} className="ip-summary-item">
            <div className="ip-summary-item-header">
              <span className="ip-summary-item-num">Q{i + 1}</span>
              <span className={`ip-diff-badge ip-diff-badge--${(r.difficulty || difficulty).toLowerCase()}`}>{r.difficulty || difficulty}</span>
              <span className={`ce-type-badge ce-type-${r.questionType || 'text'}`} style={{ fontSize: '0.65rem' }}>
                {{ text: 'Theory', mcq: 'MCQ', coding: 'Code' }[r.questionType] || 'Theory'}
              </span>
              <div className="ip-summary-item-score-bar">
                <div className="ip-summary-item-score-fill" style={{ width: `${((r.score || 0) / (r.maxPoints || 10)) * 100}%` }}></div>
              </div>
              <span className="ip-summary-item-score">{r.score}/{r.maxPoints || 10}</span>
            </div>
            <p className="ip-summary-item-q">{r.question}</p>
            {r.answer && r.answer !== '[No answer — time expired]' && r.answer !== '[Time expired]' && (
              <p className="ip-summary-item-a"><strong>You:</strong> {r.answer.slice(0, 200)}{r.answer.length > 200 ? '…' : ''}</p>
            )}
          </div>
        ))}
      </div>

      <div className="ip-summary-footer">
        <button className="ip-btn-ghost" id="summary-home-btn" onClick={onHome}>{Icons.back} Home</button>
        <button className="ip-btn-primary" id="summary-retry-btn" onClick={onRestart}>Practice Again {Icons.next}</button>
      </div>
    </div>
  );
};

// ============================================================
// InterviewPage (main)
// ============================================================
const InterviewPage = ({ onGoHome }) => {
  const [step, setStep] = useState('category'); // category | difficulty | session | summary
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [useAI, setUseAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [questionType, setQuestionType] = useState('all');
  const [questionCount, setQuestionCount] = useState(20);

  const startSession = async () => {
    setAiLoading(true);

    // Map local questionType 'voice' → 'text' for filtering purposes
    // Local bank has: 'voice' (theory) and 'coding' — NO 'mcq' questions
    const typeMap = { voice: 'text', text: 'text', mcq: 'mcq', coding: 'coding' };

    // Step 1: Check local question pool from selected domain
    const rawPool = (questions[category] || []).sort(() => Math.random() - 0.5);
    let localQs = rawPool.map(q => ({ ...q, questionType: typeMap[q.questionType] || 'text' }));
    if (questionType !== 'all') {
      localQs = localQs.filter(q => q.questionType === questionType);
    }
    if (difficulty) {
      localQs = localQs.filter(q => q.difficulty === difficulty);
    }

    // Step 2: If local is enough and AI not toggled, use local
    if (localQs.length >= questionCount && !useAI) {
      setSessionQuestions(localQs.slice(0, questionCount));
      setStep('session');
      setAiLoading(false);
      return;
    }

    // Step 3: Need AI for more questions (MCQ has ZERO local questions)
    const needed = Math.max(0, questionCount - localQs.length);
    if (needed > 0 || useAI) {
      try {
        const online = await isAiOnline();
        if (!online) throw new Error('AI backend is offline');
        const generateCount = useAI ? questionCount : needed;
        const batchSize = 10;
        const batches = Math.ceil(generateCount / batchSize);
        let aiQs = [];
        for (let i = 0; i < batches; i++) {
          const remaining = generateCount - aiQs.length;
          const count = Math.min(batchSize, remaining);
          const generated = await generateQuestions(category, count, difficulty, questionType);
          aiQs = [...aiQs, ...generated];
          if (aiQs.length >= generateCount) break;
        }
        if (useAI) {
          // AI-only mode: use only AI questions
          localQs = aiQs;
        } else {
          // Supplement local with AI
          localQs = [...localQs, ...aiQs];
        }
      } catch (err) {
        console.warn('[Practice] AI generation error:', err.message);
        // If MCQ was selected and AI failed, there are no local MCQs
        if (questionType === 'mcq' && localQs.length === 0) {
          alert('MCQ questions require AI generation. Please make sure the AI backend is reachable and try again.');
          setAiLoading(false);
          return;
        }
      }
    }

    // Step 4: Start session with available questions
    const finalQs = localQs.slice(0, questionCount);
    if (!finalQs.length) {
      alert('No questions available. Please try a different combination or enable AI.');
      setAiLoading(false);
      return;
    }
    setSessionQuestions(finalQs);
    setStep('session');
    setAiLoading(false);
  };

  const handleFinish = (resp) => {
    setResponses(resp);
    setStep('summary');

    // Log candidate answers for AI training (non-blocking)
    const totalScore = resp.reduce((s, r) => s + (r.score || 0), 0);
    const maxScore = resp.length * 10;
    fetch(`${API_BASE}/api/training/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: category,
        difficulty,
        overallScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        answers: resp.map(r => ({
          question: r.question,
          answer: r.answer || r.code || '',
          score: r.score,
          isCorrect: r.isCorrect ?? (r.score >= 5),
          questionType: r.questionType,
          difficulty: r.difficulty
        }))
      })
    }).catch(() => {});

    // Persist to MongoDB (Interview + Analytics) — works with or without auth
    const token = localStorage.getItem('mm_token');
    fetch(`${API_BASE}/api/interviews/quick-save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        category,
        difficulty,
        totalTimeTaken: resp.reduce((s, r) => s + (r.timeTaken || 0), 0),
        responses: resp.map(r => ({
          question: r.question,
          answer: r.answer || r.code || '',
          code: r.code || '',
          score: r.score,
          isCorrect: r.isCorrect,
          questionType: r.questionType,
          difficulty: r.difficulty || difficulty,
          timeTaken: r.timeTaken || 0,
        })),
      }),
    }).catch(() => {});
  };

  const handleRestart = () => {
    setStep('category');
    setCategory('');
    setDifficulty('');
    setResponses([]);
    setSessionQuestions([]);
    setUseAI(false);
    setQuestionType('all');
    setQuestionCount(20);
  };

  return (
    <div className="ip-page">
      {/* Topbar for non-session steps */}
      {step !== 'session' && (
        <div className="ip-page-topbar">
          <div className="ip-page-brand">
            <div className="ip-page-brand-icon">{Icons.logo}</div>
            <span>MockMate</span>
          </div>
          {step !== 'category' && step !== 'summary' && (
            <button className="ip-btn-ghost" id="page-back-btn" onClick={() => setStep('category')}>
              {Icons.back} Back
            </button>
          )}
          <button className="ip-btn-ghost ip-btn-home" id="home-btn" onClick={onGoHome}>{Icons.back} Home</button>
        </div>
      )}

      <div className="ip-page-inner">
        {step === 'category' && (
          <CategorySelector
            selected={category}
            onSelect={setCategory}
            onNext={() => setStep('difficulty')}
          />
        )}
        {step === 'difficulty' && (
          <DifficultySelector
            selected={difficulty}
            onSelect={setDifficulty}
            onBack={() => setStep('category')}
            onStart={startSession}
            useAI={useAI}
            onToggleAI={() => setUseAI(v => !v)}
            aiLoading={aiLoading}
            questionType={questionType}
            onTypeSelect={setQuestionType}
            questionCount={questionCount}
            onCountSelect={setQuestionCount}
          />
        )}
        {step === 'session' && sessionQuestions.length > 0 && (
          <SessionScreen
            questions={sessionQuestions}
            category={category}
            difficulty={difficulty}
            onFinish={handleFinish}
            onExit={handleRestart}
          />
        )}
        {step === 'summary' && (
          <SummaryScreen
            responses={responses}
            category={category}
            difficulty={difficulty}
            onRestart={handleRestart}
            onHome={onGoHome}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewPage;
