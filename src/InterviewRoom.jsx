import React, { useState, useEffect, useCallback, useRef } from 'react';
import MCQQuestion from './components/MCQQuestion';
import CodeEditor from './components/CodeEditor';
import ProctoringMonitor from './components/ProctoringMonitor';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import './components/AnalyticsDashboard.css';
import { CATEGORIES, questions } from './data/questions';
import { generateQuestions, isOllamaOnline } from './services/ollamaService';

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
function useCountdown(totalSeconds, onExpire, resetKey = 0) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const ref = useRef(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  useEffect(() => {
    clearInterval(ref.current);
    setSeconds(totalSeconds);
    ref.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current); onExpireRef.current?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [totalSeconds, resetKey]);
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  const pct = Math.round((seconds / totalSeconds) * 100);
  const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--error)';
  return { fmt: `${m}:${s}`, pct, color, seconds };
}

// ════════════════════════════════════════════════════════════
//  ACTIVE ROOMS MEMORY STORE
// ════════════════════════════════════════════════════════════
const ACTIVE_ROOMS = {};

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
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');
  const [lcPool, setLcPool] = useState([]);
  const [fetchingLc, setFetchingLc] = useState(false);

  const [lcSearchQuery, setLcSearchQuery] = useState('');

  // AI question generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiError, setAiError] = useState('');

  // Generate questions with Ollama AI
  const handleAIGenerate = async () => {
    if (selectedCat === 'leetcode-live') return;
    setAiGenerating(true);
    setAiError('');
    try {
      const online = await isOllamaOnline();
      if (!online) throw new Error('Ollama is not running. Start it with: ollama serve');
      const newQs = await generateQuestions(selectedCat, 10, null, questionTypeFilter);
      setAiQuestions(prev => [...prev, ...newQs]);
    } catch (err) {
      setAiError(err.message || 'Failed to generate questions');
    }
    setAiGenerating(false);
  };

  useEffect(() => {
    if (selectedCat === 'leetcode-live' && lcPool.length === 0) {
      setFetchingLc(true);
      fetch('https://alfa-leetcode-api.onrender.com/problems?limit=4000')
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
                  titleSlug: q.titleSlug,
                  questionType: 'coding',
                  question: q.title,
                  difficulty: q.difficulty,
                  category: 'LeetCode Central',
                  tags: q.topicTags?.map(t => t.name) || [],
                  timeLimit: 1800,
                  problemStatement: `Implement the solution for: **${q.title}**\n\n*(Full description is usually available on LeetCode. Please instruct the candidate on exact constraints).*`,
                  starterCode: {
                    javascript: `function ${camelCase}() {\n  // Your code here\n}`,
                    python: `import math\nimport collections\n\ndef ${snakeCase}():\n  pass`,
                    java: `import java.util.*;\n\nclass Solution {\n  public void ${camelCase}() {\n  }\n}`,
                    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n  void ${camelCase}() {\n  }\n};`
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
    ? (lcSearchQuery ? lcPool.filter(q => q.question.toLowerCase().includes(lcSearchQuery.toLowerCase())) : lcPool)
    : [
        ...(selectedCat && questions[selectedCat] ? questions[selectedCat] : []),
        ...aiQuestions.filter(q => q.tags?.includes('ai-generated') || q._aiGenerated)
      ];

  const filteredQs = availableQs.filter(q => {
    if (questionTypeFilter === 'all') return true;
    const type = q.questionType || 'text';
    return type === questionTypeFilter;
  });

  const toggle = (q) => {
    // Tag question with its source domain category
    const taggedQ = { ...q, _domain: selectedCat };
    setSelectedQs(prev => prev.find(x => x.id === q.id) ? prev.filter(x => x.id !== q.id) : [...prev, taggedQ]);
  };

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
        // Group questions by domain for multi-domain flow
        domainGroups: (() => {
          const groups = {};
          selectedQs.forEach(q => {
            const dom = q._domain || 'dsa';
            if (!groups[dom]) groups[dom] = [];
            groups[dom].push(q);
          });
          return Object.entries(groups).map(([domain, qs]) => ({
            domain,
            questions: qs,
            timeMinutes: Math.max(5, Math.round(timeLimitMinutes / Object.keys(groups).length))
          }));
        })(),
        status: 'waiting',
        violations: [],
        suspension: { isSuspended: false },
        scores: { overall: 0, mcq: 0, coding: 0, text: 0 },
        candidateAnswers: [],
      };
      ACTIVE_ROOMS[code] = room;
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

          {/* Selected Questions by Domain Summary */}
          {selectedQs.length > 0 && (() => {
            const groups = {};
            selectedQs.forEach(q => {
              const dom = q._domain || 'dsa';
              if (!groups[dom]) groups[dom] = [];
              groups[dom].push(q);
            });
            const domainEntries = Object.entries(groups);
            return (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                <div className="room-section-label" style={{ marginBottom: '0.75rem' }}>
                  📋 Selected Questions ({domainEntries.length} domain{domainEntries.length > 1 ? 's' : ''})
                </div>
                {domainEntries.map(([dom, qs]) => (
                  <div key={dom} style={{ padding: '10px 12px', marginBottom: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-primary)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {CATEGORIES.find(c => c.id === dom)?.label || dom}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{qs.length} question{qs.length !== 1 ? 's' : ''}</span>
                    </div>
                    {qs.map((q, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-dim)', padding: '3px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-dim)' }}>•</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text || q.question}</span>
                        <button onClick={() => setSelectedQs(prev => prev.filter(x => x.id !== q.id))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px' }}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem', padding: '8px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 8 }}>
                  💡 Time will be split equally across {domainEntries.length} domain{domainEntries.length > 1 ? 's' : ''}: ~{Math.round(timeLimitMinutes / domainEntries.length)} min each
                </div>
              </div>
            );
          })()}
        </div>

        {/* Question Picker */}
        <div className="room-create-col">
          <div className="room-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Browse & Add Questions</span>
            <span className="room-section-count">{selectedQs.length} selected</span>
          </div>

          <div className="room-field" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <select className="room-select" value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setLcSearchQuery(''); }} style={{ flex: 2 }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              <option value="leetcode-live">🌐 LeetCode Live Database (All 3,500+)</option>
            </select>
            {selectedCat !== 'leetcode-live' && (
              <select className="room-select" value={questionTypeFilter} onChange={e => setQuestionTypeFilter(e.target.value)} style={{ flex: 1 }}>
                <option value="all">All Types</option>
                <option value="mcq">MCQs Only</option>
                <option value="text">Written Only</option>
                <option value="coding">Coding Only</option>
              </select>
            )}
          </div>

          {selectedCat === 'leetcode-live' && !fetchingLc && (
            <div className="room-field" style={{ marginBottom: '1rem' }}>
              <input type="text" className="room-input" placeholder="Search LeetCode problems (e.g. 'Binary Tree', 'Two Sum')..." 
                value={lcSearchQuery} onChange={e => setLcSearchQuery(e.target.value)} />
            </div>
          )}

          {selectedCat !== 'leetcode-live' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <button
                id="ai-generate-btn"
                className="ip-btn-primary room-ai-gen-btn"
                onClick={handleAIGenerate}
                disabled={aiGenerating}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                {aiGenerating ? 'Generating with AI…' : '⚡ Generate 10 with AI'}
              </button>
              {aiError && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{aiError}</span>}
              {aiQuestions.length > 0 && <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>+{aiQuestions.length} AI questions added</span>}
            </div>
          )}

          <div className="room-q-pool">
            {fetchingLc && <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', padding: '1rem' }}>Downloading 3,500+ LeetCode problems...</div>}
            {!fetchingLc && selectedCat === 'leetcode-live' && availableQs.length === 0 && <div style={{ padding: '1rem', color: 'var(--text-dim)' }}>No problems matched your search.</div>}
            {!fetchingLc && filteredQs.map(q => {
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

          {/* Multi-Domain Breakdown */}
          {room.domainGroups && room.domainGroups.length > 1 && (
            <div className="room-info-card">
              <div className="room-info-label">Domain Breakdown</div>
              {room.domainGroups.map((dg, i) => (
                <div key={i} className="room-info-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '6px 0' }}>
                  <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                    {CATEGORIES.find(c => c.id === dg.domain)?.label || dg.domain}
                  </span>
                  <strong>{dg.questions.length} Qs · {dg.timeMinutes} min</strong>
                </div>
              ))}
            </div>
          )}

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
      const formattedCode = code.toUpperCase();
      const actualRoom = ACTIVE_ROOMS[formattedCode];
      
      if (!actualRoom) {
        setJoining(false);
        setError('Invalid Room Code. Room not found.');
        return;
      }
      
      setJoining(false);
      onJoined(actualRoom);
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
//  LIVE SESSION (Candidate answering — Domain-by-Domain Flow)
// ════════════════════════════════════════════════════════════
const LiveSession = ({ room, onComplete }) => {
  const domainGroups = room.domainGroups || [{ domain: 'general', questions: room.assignedQuestions, timeMinutes: room.settings?.timeLimitMinutes || 60 }];
  const totalDomains = domainGroups.length;

  const [domainIdx, setDomainIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [textAnswer, setTextAnswer] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [violations, setViolations] = useState([]);
  const [warningShown, setWarningShown] = useState(false);
  const [showDomainTransition, setShowDomainTransition] = useState(true);
  const [timerStarted, setTimerStarted] = useState(false);

  const currentDomain = domainGroups[domainIdx];
  const currentQuestions = currentDomain?.questions || [];
  const rawQ = currentQuestions[qIdx] || null;
  const q = rawQ ? { ...rawQ, questionType: ['mcq', 'coding'].includes(rawQ.questionType) ? rawQ.questionType : 'text' } : null;
  const totalQsInDomain = currentQuestions.length;
  const tabLimit = room.settings?.proctoring?.tabSwitchLimit || 1;

  const allQuestions = domainGroups.flatMap(dg => dg.questions);
  const globalQIdx = domainGroups.slice(0, domainIdx).reduce((s, dg) => s + dg.questions.length, 0) + qIdx;
  const totalQuestions = allQuestions.length;
  const domainLabel = CATEGORIES.find(c => c.id === currentDomain?.domain)?.label || currentDomain?.domain || 'General';

  // DEBUG — remove after fixing
  console.log('[LiveSession]', { domainIdx, qIdx, totalDomains, domain: currentDomain?.domain, questionsCount: currentQuestions.length, q: q?.question || q?.text || null, submitted: !!answers[globalQIdx] });

  // Derive submitted from answers — resets automatically when question changes
  const submitted = !!answers[globalQIdx];

  // Use ref for timer expire to avoid stale closure
  const domainFinishRef = useRef(null);
  domainFinishRef.current = () => {
    if (domainIdx < totalDomains - 1) {
      setDomainIdx(d => d + 1);
      setQIdx(0);
      setTextAnswer('');
      setShowDomainTransition(true);
      setTimerStarted(false);
    } else {
      onComplete({ room, answers: Object.values(answers), violations, totalTime: domainGroups.reduce((s, dg) => s + (dg.timeMinutes || 10) * 60, 0) });
    }
  };

  const { fmt, color } = useCountdown(
    timerStarted ? (currentDomain?.timeMinutes || 15) * 60 : 99999,
    () => domainFinishRef.current?.(),
    domainIdx * 1000 + (timerStarted ? 1 : 0)
  );

  const handleViolation = useCallback((type, count) => {
    setViolations(v => [...v, { type, occurredAt: new Date() }]);
    if (count < tabLimit) setWarningShown(true);
  }, [tabLimit]);

  const handleSuspend = useCallback(() => { setIsSuspended(true); setWarningShown(false); }, []);

  const saveAnswer = (ans) => {
    const gIdx = domainGroups.slice(0, domainIdx).reduce((s, dg) => s + dg.questions.length, 0) + qIdx;
    setAnswers(prev => ({ ...prev, [gIdx]: { ...q, ...ans, _domain: currentDomain.domain, answeredAt: new Date() } }));
  };

  const next = () => {
    if (qIdx < totalQsInDomain - 1) {
      setQIdx(i => i + 1);
      setTextAnswer('');
    } else {
      // Last question in domain
      if (domainIdx < totalDomains - 1) {
        setDomainIdx(d => d + 1);
        setQIdx(0);
        setTextAnswer('');
        setShowDomainTransition(true);
        setTimerStarted(false);
      } else {
        // All done
        setAnswers(prev => {
          onComplete({ room, answers: Object.values(prev), violations, totalTime: domainGroups.reduce((s, dg) => s + (dg.timeMinutes || 10) * 60, 0) });
          return prev;
        });
      }
    }
  };

  const pctBar = Math.round(((globalQIdx + (submitted ? 1 : 0)) / totalQuestions) * 100);
  const domainPctBar = Math.round(((qIdx + (submitted ? 1 : 0)) / totalQsInDomain) * 100);

  const reviveRequested = false;

  // Domain transition screen
  if (showDomainTransition) {
    return (
      <div className="room-session" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', maxWidth: 500, padding: '2rem' }} className="animate-fade-in-up">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{domainIdx === 0 ? '🚀' : '✅'}</div>
          {domainIdx > 0 && (
            <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '6px 16px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, display: 'inline-block' }}>
              ✓ {CATEGORIES.find(c => c.id === domainGroups[domainIdx - 1]?.domain)?.label || 'Previous'} complete!
            </div>
          )}
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', margin: '0.5rem 0' }}>
            {domainIdx === 0 ? 'Ready to Begin' : 'Next Section'}
          </h2>
          <div style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.1rem', margin: '0.5rem 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {domainLabel}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: '1rem 0' }}>
            {currentDomain.questions.length} questions · {currentDomain.timeMinutes} minutes
          </p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '1.5rem' }}>
            {domainGroups.map((dg, i) => (
              <div key={i} style={{ width: 40, height: 6, borderRadius: 4, background: i < domainIdx ? '#22c55e' : i === domainIdx ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
                title={CATEGORIES.find(c => c.id === dg.domain)?.label || dg.domain} />
            ))}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Section {domainIdx + 1} of {totalDomains}</p>
          <button className="ip-btn-primary" onClick={() => { setShowDomainTransition(false); setTimerStarted(true); }} style={{ padding: '12px 32px', fontSize: '1rem', marginTop: '1rem' }}>
            {domainIdx === 0 ? '▶ Start Interview' : '▶ Start Section'}
          </button>
        </div>
      </div>
    );
  }

  // Question body — key forces full remount on every question change
  const questionKey = `q-${domainIdx}-${qIdx}`;

  return (
    <div className="room-session">
      <ProctoringMonitor enabled={room.settings?.proctoring?.blockOnTabSwitch !== false} tabSwitchLimit={tabLimit}
        onViolation={handleViolation} onSuspend={handleSuspend} isSuspended={isSuspended}
        onReviveRequest={() => {}} sessionId={room.roomCode} />

      {warningShown && (
        <div className="proctor-warning-toast" role="alert">
          <WarnIcon /> Tab switch detected! Next violation will suspend this session.
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

        {totalDomains > 1 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', margin: '0 0.5rem' }}>
            {domainGroups.map((dg, i) => (
              <div key={i} style={{
                padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600,
                background: i === domainIdx ? '#6366f1' : i < domainIdx ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                color: i === domainIdx ? '#fff' : i < domainIdx ? '#22c55e' : 'var(--text-dim)',
                textTransform: 'uppercase',
              }}>
                {i < domainIdx ? '✓' : ''}{CATEGORIES.find(c => c.id === dg.domain)?.label?.split(' ')[0]?.slice(0, 4) || dg.domain}
              </div>
            ))}
          </div>
        )}

        <div className="room-session-progress-wrap">
          <div className="room-session-progress-bar">
            <div className="room-session-progress-fill" style={{ width: `${pctBar}%` }}></div>
          </div>
          <span className="room-session-progress-label">Q {globalQIdx + 1}/{totalQuestions}</span>
        </div>
        <div className="room-session-timer" style={{ color }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {fmt}
        </div>
        {violations.length > 0 && <div className="room-violation-count"><WarnIcon /> {violations.length}</div>}
      </div>

      {/* Domain progress bar */}
      {totalDomains > 1 && (
        <div style={{ padding: '0 5%', background: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: '0.75rem' }}>
            <span style={{ color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{domainLabel}</span>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
              <div style={{ width: `${domainPctBar}%`, height: '100%', background: '#6366f1', borderRadius: 4, transition: 'width 0.3s' }}></div>
            </div>
            <span style={{ color: 'var(--text-dim)' }}>{qIdx + 1}/{totalQsInDomain}</span>
          </div>
        </div>
      )}

      {/* Question — key on this div forces full remount on every question change */}
      <div className="room-session-body" key={questionKey}>
        {!q ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
            <p style={{color:'#f87171',marginBottom:'0.5rem'}}>⚠ No questions found in this section.</p>
            <pre style={{fontSize:'0.7rem',color:'#666',marginBottom:'1rem',textAlign:'left',background:'#111',padding:'0.5rem',borderRadius:6}}>
              domain={currentDomain?.domain}, questions={currentQuestions.length}, domainIdx={domainIdx}, total={totalDomains}
            </pre>
            <button className="ip-btn-primary" onClick={() => domainFinishRef.current?.()} style={{ marginTop: '0.5rem' }}>
              {domainIdx < totalDomains - 1 ? 'Skip to Next Domain →' : '✓ Finish Session'}
            </button>
          </div>
        ) : (
          <>
            <div className="room-q-header">
              <span className="room-q-num">Q{qIdx + 1}/{totalQsInDomain} — {domainLabel}</span>
              <span className={`ce-type-badge ce-type-${q.questionType}`}>
                {{ mcq: 'Multiple Choice', coding: 'Coding', text: 'Text Answer' }[q.questionType]}
              </span>
              <span className={`ip-diff-badge ip-diff-badge--${(q.difficulty||'').toLowerCase()}`}>{q.difficulty}</span>
            </div>

            {q.questionType === 'mcq' && (
              <div className="room-q-card">
                <h3 className="room-q-text">{q.text || q.question}</h3>
                <MCQQuestion
                  question={q}
                  onSubmit={(idx, isCorrect, score) => saveAnswer({ selectedOption: idx, selectedOptionIndex: idx, isCorrect, score, questionType: 'mcq' })}
                  readOnly={submitted}
                  submittedIndex={submitted ? (answers[globalQIdx]?.selectedOption ?? null) : null}
                />
              </div>
            )}

            {q.questionType === 'coding' && (
              <div className="room-q-coding">
                <CodeEditor
                  question={q}
                  onSubmit={(result) => saveAnswer({ ...result, questionType: 'coding' })}
                  readOnly={submitted}
                />
              </div>
            )}

            {q.questionType === 'text' && (
              <div className="room-q-card">
                <h3 className="room-q-text">{q.text || q.question}</h3>
                {q.keyPoints?.length > 0 && (
                  <div className="room-q-keypoints"><span className="room-q-kp-label">Key areas to cover:</span>
                    <div className="room-q-kps">{q.keyPoints.map((kp, i) => <span key={i} className="room-q-kp">{kp}</span>)}</div>
                  </div>
                )}
                <textarea id="text-answer-input" className="ip-textarea" placeholder="Write your answer here..."
                  value={textAnswer} onChange={e => setTextAnswer(e.target.value)} disabled={submitted} rows={8} />
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

            {/* Next / Finish for MCQ and Text */}
            {submitted && q.questionType !== 'coding' && (
              <div className="room-q-nav">
                <button
                  id={qIdx < totalQsInDomain - 1 ? 'next-question-btn' : domainIdx < totalDomains - 1 ? 'next-domain-btn' : 'finish-session-btn'}
                  className="ip-btn-primary" onClick={next}>
                  {qIdx < totalQsInDomain - 1 ? 'Next Question →' : domainIdx < totalDomains - 1 ? `✓ Finish ${domainLabel} → Next Domain` : '✓ Finish Session'}
                </button>
              </div>
            )}

            {/* Next / Finish floating button for Coding (always visible) */}
            {submitted && q.questionType === 'coding' && (
              <div style={{ position: 'fixed', bottom: '1.5rem', right: '2rem', zIndex: 1000 }}>
                <button
                  id={qIdx < totalQsInDomain - 1 ? 'next-question-btn' : domainIdx < totalDomains - 1 ? 'next-domain-btn' : 'finish-session-btn'}
                  className="ip-btn-primary"
                  onClick={next}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                  {qIdx < totalQsInDomain - 1 ? 'Next Question →' : domainIdx < totalDomains - 1 ? `✓ Finish ${domainLabel} → Next Domain` : '✓ Finish Session'}
                </button>
              </div>
            )}
          </>
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
  const handleSessionComplete = (result) => {
    const domainGroups = result.room?.domainGroups || [];
    const answersArr = Array.isArray(result.answers) ? result.answers : Object.values(result.answers || {});
    const domainResults = domainGroups.map(dg => {
      const domainAnswers = answersArr.filter(a => a && a._domain === dg.domain);
      const totalQuestions = dg.questions.length;
      const correctAnswers = domainAnswers.filter(a => {
        if (a.questionType === 'mcq') return a.isCorrect === true;
        if (a.questionType === 'coding') return (a.score || 0) >= 70;
        return (a.score || 0) >= 50;
      }).length;
      const totalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      return {
        domain: dg.domain,
        questions: domainAnswers.map(a => ({
          question: a.question || a.text,
          answer: a.textAnswer || a.code || '',
          score: a.score || 0,
          isCorrect: a.questionType === 'mcq' ? a.isCorrect === true : (a.score || 0) >= 50,
          difficulty: a.difficulty || 'Medium',
          timeSpent: 0
        })),
        totalScore,
        totalQuestions,
        correctAnswers,
        timeTaken: (dg.timeMinutes || 10) * 60,
        timeAllotted: (dg.timeMinutes || 10) * 60
      };
    });
    setSessionResult({ ...result, domainResults });
    setView('done');
  };

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
            <p className="room-done-sub">Your responses have been recorded. Full analytics report below.</p>
            {sessionResult.violations?.length > 0 && (
              <div className="room-done-violations">
                <WarnIcon /> {sessionResult.violations.length} proctoring violation{sessionResult.violations.length !== 1 ? 's' : ''} were recorded during this session.
              </div>
            )}
            {/* Full Analytics Dashboard */}
            {sessionResult.domainResults && sessionResult.domainResults.length > 0 && (
              <AnalyticsDashboard
                domainResults={sessionResult.domainResults}
                totalTime={sessionResult.totalTime}
                candidateName={sessionResult.room?.candidateEmail || 'Candidate'}
              />
            )}
            <div className="room-done-actions">
              <button className="ip-btn-ghost" onClick={onGoHome}><BackIcon /> Home</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewRoom;
