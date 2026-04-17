import React, { useState, useEffect, useCallback, useRef } from 'react';
import MCQQuestion from './components/MCQQuestion';
import CodeEditor from './components/CodeEditor';
import ProctoringMonitor from './components/ProctoringMonitor';
import { CATEGORIES, questions } from './data/questions';

// ── Icons ───────────────────────────────────────────────────
const Ic = ({ d, size = 16, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {d}
  </svg>
);
const BackIcon  = () => <Ic size={15} d={<><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></>} />;
const CopyIcon  = () => <Ic size={13} d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />;
const PlusIcon  = () => <Ic size={14} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const StartIcon = () => <Ic size={14} d={<polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />} />;
const CheckIcon = () => <Ic size={14} d={<polyline points="20 6 9 17 4 12"/>} />;
const WarnIcon  = () => <Ic size={16} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />;
const LogoIcon  = () => <Ic size={14} d={<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>} />;
const AlertIcon = () => <Ic size={20} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" sw={3}/></>} />;

// Delete SAMPLE_POOL, we use questions from data/questions.js now

// ── Timer Hook ────────────────────────────────────────────────
function useCountdown(totalSeconds, onExpire) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const ref = useRef(null);
  useEffect(() => {
    setSeconds(totalSeconds);
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current); onExpire?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [totalSeconds]);
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  const pct = Math.round((seconds / totalSeconds) * 100);
  const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--error)';
  return { fmt: `${m}:${s}`, pct, color, seconds };
}

// ════════════════════════════════════════════════════════════
//  CREATE ROOM (Interviewer)
const CreateRoom = ({ onRoomCreated, onBack }) => {
  const [title, setTitle] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(1);
  const [selectedQs, setSelectedQs] = useState([]);
  const [creating, setCreating] = useState(false);

  const [selectedCat, setSelectedCat] = useState('dsa');
  const [lcPool, setLcPool] = useState([]);
  const [fetchingLc, setFetchingLc] = useState(false);

  const [lcSearchQuery, setLcSearchQuery] = useState('');

  useEffect(() => {
    if (selectedCat === 'leetcode-live' && lcPool.length === 0) {
      setFetchingLc(true);
      fetch('https://alfa-leetcode-api.onrender.com/problems?limit=3500')
        .then(res => res.json())
        .then(data => {
          if (data && data.problemsetQuestionList) {
            const mapped = data.problemsetQuestionList
              .filter(q => !q.isPaidOnly)
              .map((q, idx) => {
                const words = q.title.match(/[a-zA-Z0-9]+/g) || ['solution'];
                const camelCase = words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                const snakeCase = words.map(w => w.toLowerCase()).join('_');

                return {
                  id: `lc-live-${q.questionFrontendId || idx}`,
                  questionType: 'coding',
                  question: q.title,
                  difficulty: q.difficulty,
                  category: 'LeetCode Central',
                  tags: q.topicTags?.map(t => t.name) || [],
                  timeLimit: 1800,
                  problemStatement: `Implement the solution for: **${q.title}**\n\n*(Full description is usually available on LeetCode. Please instruct the candidate on exact constraints).*`,
                  starterCode: {
                    javascript: `function ${camelCase}() {\n  // Your code here\n}`,
                    python: `def ${snakeCase}():\n  pass`,
                    java: `class Solution {\n  public void ${camelCase}() {\n  }\n}`,
                    cpp: `class Solution {\npublic:\n  void ${camelCase}() {\n  }\n};`
                  }
                };
              });
            setLcPool(mapped);
          }
        })
        .catch(err => console.error('Failed to fetch LC data:', err))
        .finally(() => setFetchingLc(false));
    }
  }, [selectedCat, lcPool.length]);

  const availableQs = selectedCat === 'leetcode-live' 
    ? (lcSearchQuery ? lcPool.filter(q => q.question.toLowerCase().includes(lcSearchQuery.toLowerCase())) : lcPool).slice(0, 50) 
    : (selectedCat && questions[selectedCat] ? questions[selectedCat] : []);

  const toggle = (q) =>
    setSelectedQs(prev => prev.find(x => x.id === q.id) ? prev.filter(x => x.id !== q.id) : [...prev, q]);

  const handleCreate = () => {
    if (!selectedQs.length) return;
    setCreating(true);
    setTimeout(() => {
      const code = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const room = {
        roomCode: code,
        title: title || 'MockMate Interview',
        candidateEmail,
        settings: { timeLimitMinutes, proctoring: { tabSwitchLimit, blockOnTabSwitch: true, requireInterviewerRevive: true } },
        assignedQuestions: selectedQs.map((q, i) => ({ ...q, orderIndex: i })),
        status: 'waiting',
        violations: [],
        suspension: { isSuspended: false },
        scores: { overall: 0, mcq: 0, coding: 0, text: 0 },
        candidateAnswers: [],
      };
      setCreating(false);
      onRoomCreated(room);
    }, 800);
  };

  const qTypeBadge = (t) => ({ mcq: 'MCQ', coding: 'Code', text: 'Text' }[t] || t);

  return (
    <div className="room-step animate-fade-in-up">
      <div className="room-step-header">
        <button className="ip-btn-ghost" onClick={onBack}><BackIcon /> Back</button>
        <div>
          <h2 className="room-step-title">Create Interview Room</h2>
          <p className="room-step-sub">Set up a session for your candidate</p>
        </div>
      </div>

      <div className="room-create-grid">
        {/* Settings */}
        <div className="room-create-col">
          <div className="room-section-label">Session Details</div>

          <div className="room-field">
            <label className="room-field-label" htmlFor="room-title">Session Title</label>
            <input id="room-title" className="room-input" type="text" placeholder="e.g. SDE-1 Technical Round"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="room-field">
            <label className="room-field-label" htmlFor="candidate-email">Candidate Email</label>
            <input id="candidate-email" className="room-input" type="email" placeholder="candidate@email.com"
              value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} />
          </div>

          <div className="room-field-row">
            <div className="room-field">
              <label className="room-field-label" htmlFor="time-limit">Time Limit (minutes)</label>
              <select id="time-limit" className="room-select" value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(Number(e.target.value))}>
                {[30, 45, 60, 90, 120].map(t => <option key={t} value={t}>{t} min</option>)}
              </select>
            </div>
            <div className="room-field">
              <label className="room-field-label" htmlFor="tab-limit">Tab Switch Violations</label>
              <select id="tab-limit" className="room-select" value={tabSwitchLimit} onChange={e => setTabSwitchLimit(Number(e.target.value))}>
                <option value={1}>1 — Immediate suspend</option>
                <option value={2}>2 — Warn then suspend</option>
                <option value={3}>3 — Three strikes</option>
              </select>
            </div>
          </div>

          <div className="room-create-footer">
            <button id="create-room-btn" className="ip-btn-primary room-create-btn"
              onClick={handleCreate} disabled={!selectedQs.length || creating}>
              {creating ? 'Creating…' : <><CheckIcon /> Create Room ({selectedQs.length} question{selectedQs.length !== 1 ? 's' : ''})</>}
            </button>
          </div>
        </div>

        {/* Question Picker */}
        <div className="room-create-col">
          <div className="room-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Assign Questions</span>
            <span className="room-section-count">{selectedQs.length} selected</span>
          </div>

          <div className="room-field" style={{ marginBottom: '1rem' }}>
            <select className="room-select" value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setLcSearchQuery(''); }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value="leetcode-live">🌐 LeetCode Live Database (All 3,500+)</option>
            </select>
          </div>

          {selectedCat === 'leetcode-live' && !fetchingLc && (
            <div className="room-field" style={{ marginBottom: '1rem' }}>
              <input type="text" className="room-input" placeholder="Search LeetCode problems (e.g. 'Binary Tree', 'Two Sum')..." 
                value={lcSearchQuery} onChange={e => setLcSearchQuery(e.target.value)} />
            </div>
          )}

          <div className="room-q-pool">
            {fetchingLc && <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', padding: '1rem' }}>Downloading 3,500+ LeetCode problems...</div>}
            {!fetchingLc && selectedCat === 'leetcode-live' && availableQs.length === 0 && <div style={{ padding: '1rem', color: 'var(--text-dim)' }}>No problems matched your search.</div>}
            {!fetchingLc && availableQs.map(q => {
              const isSelected = selectedQs.find(x => x.id === q.id);
              return (
                <button key={q.id} className={`room-q-item${isSelected ? ' room-q-item--selected' : ''}`}
                  onClick={() => toggle(q)}>
                  <div className="room-q-top">
                    <span className={`ce-type-badge ce-type-${q.questionType}`}>{qTypeBadge(q.questionType)}</span>
                    <span className={`ip-diff-badge ip-diff-badge--${q.difficulty}`}>{q.difficulty}</span>
                    {isSelected && <span className="room-q-check"><CheckIcon /></span>}
                  </div>
                  <div className="room-q-text">{q.text || q.question}</div>
                  <div className="room-q-meta">{selectedCat === 'leetcode-live' ? 'LeetCode API' : CATEGORIES.find(c => c.id === selectedCat)?.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  LOBBY (After room is created — interviewer waiting view)
// ════════════════════════════════════════════════════════════
const InterviewerLobby = ({ room, onStartSession, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [reviveRequests, setReviveRequests] = useState([]);

  const copyCode = () => {
    navigator.clipboard.writeText(room.roomCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  // Poll for revive requests (mock — in production use WebSocket)
  useEffect(() => {
    if (room.status !== 'active') return;
    const id = setInterval(() => {
      if (room.suspension?.reviveRequested && !reviveRequests.length) {
        setReviveRequests([{ requestedAt: new Date(), message: 'Candidate is requesting session revival.' }]);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [room]);

  return (
    <div className="room-lobby animate-fade-in-up">
      <div className="room-step-header">
        <button className="ip-btn-ghost" onClick={onBack}><BackIcon /> Back</button>
        <div>
          <h2 className="room-step-title">{room.title}</h2>
          <p className="room-step-sub">Share the room code with your candidate</p>
        </div>
      </div>

      <div className="room-lobby-grid">
        {/* Code Card */}
        <div className="room-code-card">
          <div className="room-code-label">Room Code</div>
          <div className="room-code-display">{room.roomCode}</div>
          <button id="copy-room-code" className="ip-btn-ghost room-copy-btn" onClick={copyCode}>
            <CopyIcon /> {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <div className="room-code-instructions">
            Candidate enters this code on the <strong>Join Room</strong> page.
            Room expires in <strong>48 hours</strong>.
          </div>
        </div>

        {/* Session Info */}
        <div className="room-info-col">
          <div className="room-info-card">
            <div className="room-info-label">Questions</div>
            {room.assignedQuestions.map((q, i) => (
              <div key={i} className="room-info-q">
                <span className={`ce-type-badge ce-type-${q.questionType || 'text'}`}>{(q.questionType || 'text').toUpperCase()}</span>
                <span className="room-info-q-text">{q.text || q.question}</span>
              </div>
            ))}
          </div>

          <div className="room-info-card">
            <div className="room-info-label">Settings</div>
            <div className="room-info-row"><span>Time Limit</span><strong>{room.settings.timeLimitMinutes} min</strong></div>
            <div className="room-info-row"><span>Proctoring</span><strong>Enabled — {room.settings.proctoring?.tabSwitchLimit} violation(s) = suspend</strong></div>
            {room.candidateEmail && <div className="room-info-row"><span>Candidate</span><strong>{room.candidateEmail}</strong></div>}
          </div>

          {/* Revive Requests */}
          {reviveRequests.length > 0 && (
            <div className="room-revive-card">
              <div className="room-revive-header"><WarnIcon /> Revival Request</div>
              <p>Candidate has been suspended and is requesting revival.</p>
              <div className="room-revive-actions">
                <button id="approve-revival-btn" className="ip-btn-primary" onClick={() => {
                  room.suspension.isSuspended = false;
                  room.suspension.reviveRequested = false;
                  setReviveRequests([]);
                }}>
                  <CheckIcon /> Approve Revival
                </button>
                <button className="ip-btn-ghost">Deny</button>
              </div>
            </div>
          )}

          <button id="start-session-btn" className="ip-btn-primary room-start-btn" onClick={onStartSession}>
            <StartIcon /> Start Session
          </button>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  JOIN ROOM (Candidate)
// ════════════════════════════════════════════════════════════
const JoinRoom = ({ onJoined, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    if (code.trim().length !== 6) { setError('Room code must be 6 characters'); return; }
    setJoining(true);
    setError('');
    setTimeout(() => {
      // Mock: for demo, any 6-char code resolves to a sample room
      const mockRoom = {
        roomCode: code.toUpperCase(),
        title: 'SDE-1 Technical Round',
        settings: { timeLimitMinutes: 60, proctoring: { tabSwitchLimit: 1, blockOnTabSwitch: true, requireInterviewerRevive: true } },
        assignedQuestions: [questions.dsa[0], questions.dsa[15], questions.dsa[17]],
        status: 'active',
        violations: [],
        suspension: { isSuspended: false },
        candidateAnswers: [],
      };
      setJoining(false);
      onJoined(mockRoom);
    }, 900);
  };

  return (
    <div className="room-join animate-fade-in-up">
      <div className="room-step-header">
        <button className="ip-btn-ghost" onClick={onBack}><BackIcon /> Back</button>
        <div>
          <h2 className="room-step-title">Join Interview Room</h2>
          <p className="room-step-sub">Enter the 6-character code provided by your interviewer</p>
        </div>
      </div>

      <div className="room-join-card">
        <label className="room-field-label" htmlFor="room-code-input">Room Code</label>
        <input
          id="room-code-input"
          className={`room-code-input${error ? ' room-code-input--error' : ''}`}
          type="text"
          placeholder="e.g. XK9P2M"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
        />
        {error && <p className="room-error">{error}</p>}

        <div className="room-join-notice">
          <AlertIcon />
          <p>This session is <strong>proctored</strong>. Switching tabs or leaving this window will automatically suspend your interview. Do not refresh the page during the session.</p>
        </div>

        <button id="join-room-btn" className="ip-btn-primary room-join-btn" onClick={handleJoin} disabled={joining || code.length !== 6}>
          {joining ? 'Joining…' : 'Join Room'}
        </button>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  LIVE SESSION (Candidate answering)
// ════════════════════════════════════════════════════════════
const LiveSession = ({ room, onComplete }) => {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [reviveRequested, setReviveRequested] = useState(false);
  const [violations, setViolations] = useState([]);
  const [warningShown, setWarningShown] = useState(false);

  const questions = room.assignedQuestions;
  const q = questions[qIdx];
  const total = questions.length;
  const tabLimit = room.settings?.proctoring?.tabSwitchLimit || 1;

  const { fmt, pct, color } = useCountdown(
    (room.settings?.timeLimitMinutes || 60) * 60,
    () => { /* auto-submit on timer expiry */ handleFinish(); }
  );

  const handleViolation = useCallback((type, count) => {
    setViolations(v => [...v, { type, occurredAt: new Date() }]);
    if (count < tabLimit) setWarningShown(true);
  }, [tabLimit]);

  const handleSuspend = useCallback(() => {
    setIsSuspended(true);
    setWarningShown(false);
  }, []);

  const handleReviveRequest = () => {
    setReviveRequested(true);
    room.suspension = { isSuspended: true, reviveRequested: true, reviveRequestedAt: new Date() };
  };

  const saveAnswer = (ans) => {
    setAnswers(prev => {
      const updated = [...prev];
      updated[qIdx] = { ...q, ...ans, answeredAt: new Date() };
      return updated;
    });
    setSubmitted(true);
  };

  const next = () => {
    if (qIdx < total - 1) {
      setQIdx(i => i + 1);
      setTextAnswer('');
      setSubmitted(false);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const finalAnswers = [...answers];
    onComplete({ room, answers: finalAnswers, violations, totalTime: (room.settings?.timeLimitMinutes || 60) * 60 });
  };

  const pctBar = Math.round(((qIdx + (submitted ? 1 : 0)) / total) * 100);

  return (
    <div className="room-session">
      {/* Proctoring */}
      <ProctoringMonitor
        enabled={room.settings?.proctoring?.blockOnTabSwitch !== false}
        tabSwitchLimit={tabLimit}
        onViolation={handleViolation}
        onSuspend={handleSuspend}
        isSuspended={isSuspended}
        onReviveRequest={handleReviveRequest}
        sessionId={room.roomCode}
      />

      {/* Warning toast (before hard suspend) */}
      {warningShown && (
        <div className="proctor-warning-toast" role="alert">
          <WarnIcon />
          Tab switch detected! Next violation will suspend this session.
          <button onClick={() => setWarningShown(false)}>✕</button>
        </div>
      )}

      {/* Topbar */}
      <div className="room-session-topbar">
        <div className="room-session-brand">
          <div className="room-brand-icon"><LogoIcon /></div>
          <span>{room.title}</span>
          <span className="room-code-pill">{room.roomCode}</span>
        </div>
        <div className="room-session-progress-wrap">
          <div className="room-session-progress-bar">
            <div className="room-session-progress-fill" style={{ width: `${pctBar}%` }}></div>
          </div>
          <span className="room-session-progress-label">Q {qIdx + 1}/{total}</span>
        </div>
        <div className="room-session-timer" style={{ color }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {fmt}
        </div>
        {violations.length > 0 && (
          <div className="room-violation-count">
            <WarnIcon /> {violations.length} violation{violations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="room-session-body">
        <div className="room-q-header">
          <span className="room-q-num">Question {qIdx + 1} of {total}</span>
          <span className={`ce-type-badge ce-type-${q.questionType}`}>
            {{ mcq: 'Multiple Choice', coding: 'Coding', text: 'Text Answer' }[q.questionType]}
          </span>
          <span className={`ip-diff-badge ip-diff-badge--${q.difficulty}`}>{q.difficulty}</span>
        </div>

        {/* MCQ */}
        {q.questionType === 'mcq' && (
          <div className="room-q-card">
            <h3 className="room-q-text">{q.text}</h3>
            <MCQQuestion
              question={q}
              onSubmit={(idx, isCorrect, score) => saveAnswer({ selectedOption: idx, isCorrect, score, questionType: 'mcq' })}
              readOnly={submitted}
              submittedIndex={submitted ? (answers[qIdx]?.selectedOption ?? null) : null}
            />
          </div>
        )}

        {/* Coding */}
        {q.questionType === 'coding' && (
          <div className="room-q-coding">
            <CodeEditor
              question={q}
              onSubmit={(result) => saveAnswer({ ...result, questionType: 'coding' })}
              readOnly={submitted}
            />
          </div>
        )}

        {/* Text */}
        {q.questionType === 'text' && (
          <div className="room-q-card">
            <h3 className="room-q-text">{q.text}</h3>
            {q.keyPoints?.length > 0 && (
              <div className="room-q-keypoints">
                <span className="room-q-kp-label">Key areas to cover:</span>
                <div className="room-q-kps">
                  {q.keyPoints.map((kp, i) => <span key={i} className="room-q-kp">{kp}</span>)}
                </div>
              </div>
            )}
            <textarea
              id="text-answer-input"
              className="ip-textarea"
              placeholder="Write your answer here..."
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              disabled={submitted}
              rows={8}
            />
            <div className="ip-answer-footer">
              <span className="ip-word-count">{textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0} words</span>
              {!submitted && (
                <button id="submit-text-btn" className="ip-btn-primary"
                  onClick={() => saveAnswer({ textAnswer, score: Math.min(100, Math.round((textAnswer.split(' ').length / 80) * 100)), questionType: 'text' })}
                  disabled={!textAnswer.trim()}>
                  <CheckIcon /> Submit Answer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Next / Finish */}
        {submitted && (
          <div className="room-q-nav">
            <button id={qIdx < total - 1 ? 'next-question-btn' : 'finish-session-btn'}
              className="ip-btn-primary" onClick={next}>
              {qIdx < total - 1 ? 'Next Question →' : '✓ Finish Session'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  InterviewRoom Page (main export)
// ════════════════════════════════════════════════════════════
const InterviewRoom = ({ onGoHome, initialMode = null }) => {
  const [view, setView] = useState(initialMode || 'select'); // select | create | lobby | join | live | done
  const [room, setRoom] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);

  const handleRoomCreated = (newRoom) => { setRoom(newRoom); setView('lobby'); };
  const handleJoined = (joinedRoom) => { setRoom(joinedRoom); setView('live'); };
  const handleSessionComplete = (result) => { setSessionResult(result); setView('done'); };

  return (
    <div className="room-page">
      {/* Top nav */}
      {view !== 'live' && (
        <div className="ip-page-topbar">
          <div className="ip-page-brand">
            <div className="ip-page-brand-icon"><LogoIcon /></div>
            <span>MockMate</span>
          </div>
          <button className="ip-btn-ghost ip-btn-home" id="room-home-btn" onClick={onGoHome}>
            <BackIcon /> Home
          </button>
        </div>
      )}

      <div className={view === 'live' ? '' : 'ip-page-inner'}>
        {view === 'select' && (
          <div className="room-select-view animate-fade-in-up">
            <div className="room-step-header">
              <h2 className="room-step-title">Interview Room</h2>
              <p className="room-step-sub">Host a session as an interviewer or join one as a candidate</p>
            </div>
            <div className="room-select-cards">
              <button id="create-room-card" className="room-select-card" onClick={() => setView('create')}>
                <div className="room-select-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <div className="room-select-card-title">Create Room</div>
                <div className="room-select-card-desc">I'm the interviewer. I'll set up questions and invite a candidate.</div>
              </button>
              <button id="join-room-card" className="room-select-card" onClick={() => setView('join')}>
                <div className="room-select-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
                <div className="room-select-card-title">Join Room</div>
                <div className="room-select-card-desc">I'm a candidate. I have a room code from my interviewer.</div>
              </button>
            </div>
          </div>
        )}

        {view === 'create' && <CreateRoom onRoomCreated={handleRoomCreated} onBack={() => setView('select')} />}
        {view === 'lobby'  && room && <InterviewerLobby room={room} onStartSession={() => setView('live')} onBack={() => setView('create')} />}
        {view === 'join'   && <JoinRoom onJoined={handleJoined} onBack={() => setView('select')} />}
        {view === 'live'   && room && <LiveSession room={room} onComplete={handleSessionComplete} />}

        {view === 'done' && sessionResult && (
          <div className="room-done animate-fade-in-up">
            <div className="room-done-icon"><CheckIcon /></div>
            <h2 className="room-done-title">Session Complete!</h2>
            <p className="room-done-sub">Your responses have been recorded. View your full analytics report below.</p>
            {sessionResult.violations?.length > 0 && (
              <div className="room-done-violations">
                <WarnIcon /> {sessionResult.violations.length} proctoring violation{sessionResult.violations.length !== 1 ? 's' : ''} were recorded during this session.
              </div>
            )}
            <div className="room-done-actions">
              <button id="view-report-btn" className="ip-btn-primary" onClick={onGoHome}>View Analytics Report</button>
              <button className="ip-btn-ghost" onClick={onGoHome}><BackIcon /> Home</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;
