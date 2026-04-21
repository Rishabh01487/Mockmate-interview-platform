import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORIES, DIFFICULTIES, getRandomQuestions } from './data/questions';
import MCQQuestion from './components/MCQQuestion';
import CodeEditor from './components/CodeEditor';

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
// Step 2: Difficulty Selector
// ============================================================
const DIFF_DESCRIPTIONS = {
  Easy: 'Foundational concepts and definitions. Good for warm-up.',
  Medium: 'Core interview questions requiring clear explanation and depth.',
  Hard: 'Advanced topics, edge cases, and design questions.',
};

const DifficultySelector = ({ selected, onSelect, onBack, onStart }) => (
  <div className="ip-step animate-fade-in-up">
    <div className="ip-step-header">
      <h2 className="ip-step-title">Select Difficulty</h2>
      <p className="ip-step-sub">Choose a level that matches your preparation</p>
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
    <div className="ip-step-footer ip-step-footer--split">
      <button className="ip-btn-ghost" id="diff-back-btn" onClick={onBack}>{Icons.back} Back</button>
      <button className="ip-btn-primary" id="diff-start-btn" onClick={onStart} disabled={!selected}>
        Begin Session {Icons.next}
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
    setTimeout(() => {
      const words = textAnswer.trim().split(/\s+/).length;
      const score = timedOut ? 0 : Math.min(10, Math.max(1, Math.round((words / 40) * 10)));
      saveResponse({ answer: textAnswer.trim() || '[No answer — time expired]', score, timedOut });
    }, 500);
  }, [textAnswer, saveResponse]);

  // MCQ submission (auto-scored)
  const handleMCQSubmit = useCallback((selectedIndex, isCorrect, score100) => {
    saveResponse({
      answer:         q.options?.[selectedIndex]?.text || '',
      selectedOption: selectedIndex,
      isCorrect,
      score:          isCorrect ? 10 : 0,
    });
  }, [q, saveResponse]);

  // Coding submission
  const handleCodingSubmit = useCallback((result) => {
    const score = Math.round((result.score || 0) / 10); // convert 0-100 → 0-10
    saveResponse({
      answer:      result.code,
      code:        result.code,
      language:    result.language,
      passedCount: result.passedCount,
      totalTests:  result.totalTests,
      status:      result.status,
      score,
    });
  }, [saveResponse]);

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
                      {lastResp?.score ?? 0}<span className="ip-feedback-score-max">/10</span>
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
                      {lastResp?.score ?? 0}<span className="ip-feedback-score-max">/10</span>
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
                  <span className="ip-feedback-score">{lastResp?.score ?? 0}<span className="ip-feedback-score-max">/10</span></span>
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
// Summary Screen
// ============================================================
const SummaryScreen = ({ responses, category, difficulty, onRestart, onHome }) => {
  const catLabel = CATEGORIES.find(c => c.id === category)?.label || category;
  const total = responses.length;
  const totalScore = responses.reduce((s, r) => s + (r.score || 0), 0);
  const maxScore = total * 10;
  const pct = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="ip-summary animate-fade-in-up">
      <div className="ip-summary-header">
        <div className="ip-summary-badge">Session Complete</div>
        <h2 className="ip-summary-title">{catLabel} · {difficulty}</h2>
        <div className="ip-summary-score-ring">
          <span className="ip-summary-score-val">{pct}%</span>
          <span className="ip-summary-score-sub">Overall Score</span>
        </div>
        <div className="ip-summary-stats">
          <div className="ip-summary-stat">
            <span className="ip-ss-val">{total}</span>
            <span className="ip-ss-label">Questions</span>
          </div>
          <div className="ip-summary-stat">
            <span className="ip-ss-val">{totalScore}</span>
            <span className="ip-ss-label">Points Earned</span>
          </div>
          <div className="ip-summary-stat">
            <span className="ip-ss-val">{maxScore}</span>
            <span className="ip-ss-label">Max Points</span>
          </div>
        </div>
      </div>

      <div className="ip-summary-responses">
        {responses.map((r, i) => (
          <div key={i} className="ip-summary-item">
            <div className="ip-summary-item-header">
              <span className="ip-summary-item-num">Q{i + 1}</span>
              <span className={`ip-diff-badge ip-diff-badge--${r.difficulty.toLowerCase()}`}>{r.difficulty}</span>
              <div className="ip-summary-item-score-bar">
                <div className="ip-summary-item-score-fill" style={{ width: `${(r.score / 10) * 100}%` }}></div>
              </div>
              <span className="ip-summary-item-score">{r.score}/10</span>
            </div>
            <p className="ip-summary-item-q">{r.question}</p>
            {r.answer && r.answer !== '[No answer — time expired]' && (
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

  const startSession = () => {
    const qs = getRandomQuestions(category, 5, difficulty);
    if (!qs.length) return;
    setSessionQuestions(qs);
    setStep('session');
  };

  const handleFinish = (resp) => {
    setResponses(resp);
    setStep('summary');
  };

  const handleRestart = () => {
    setStep('category');
    setCategory('');
    setDifficulty('');
    setResponses([]);
    setSessionQuestions([]);
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
