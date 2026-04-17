import React, { useRef } from 'react';

// ── Icons ───────────────────────────────────────────────────
const Ic = ({ d, size = 16, fill = 'none', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {d}
  </svg>
);
const DownloadIcon = () => <Ic size={15} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />;
const BackIcon     = () => <Ic size={15} d={<><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></>} />;
const CheckIcon    = () => <Ic size={13} d={<polyline points="20 6 9 17 4 12"/>} />;
const WarnIcon     = () => <Ic size={13} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />;
const StarIcon     = () => <Ic size={13} d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" stroke="none"/>} />;
const CodeIcon     = () => <Ic size={13} d={<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>} />;

// ── Score colour ─────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return 'var(--success)';
  if (s >= 55) return 'var(--warning)';
  return 'var(--error)';
}
function scoreLabel(s) {
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Average';
  if (s >= 30) return 'Needs Work';
  return 'Poor';
}
const DIFF_MAP = { easy: 0, medium: 1, hard: 2 };

// ── Donut SVG ────────────────────────────────────────────────
const Donut = ({ score, size = 100 }) => {
  const r = 36, c = 113.1;
  const offset = c - (score / 100) * c;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-primary)" strokeWidth="10"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50" y="54" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)" fontFamily="Inter,sans-serif">{score}%</text>
    </svg>
  );
};

// ── Mini bar ─────────────────────────────────────────────────
const MiniBar = ({ value, max = 100, color }) => (
  <div className="ar-mini-bar-wrap">
    <div className="ar-mini-bar-track">
      <div className="ar-mini-bar-fill" style={{ width: `${Math.round((value / max) * 100)}%`, background: color || 'var(--text-primary)' }}></div>
    </div>
    <span className="ar-mini-bar-val">{value}</span>
  </div>
);

/**
 * AnalyticsReport
 * Props:
 *  session: {
 *    id, category, difficulty, type, startedAt, completedAt,
 *    questions: [{ questionType, text, userAnswer, selectedOption, aiFeedback, score, timeTaken, timedOut, passed }]
 *    overallScore, violations: [], candidateName, interviewerName, roomCode
 *  }
 *  onBack()
 */
const AnalyticsReport = ({ session, onBack }) => {
  const reportRef = useRef(null);

  // Build rich session data from props or use demo data
  const s = session || DEMO_SESSION;

  const qs = s.questions || [];
  const mcqs    = qs.filter(q => q.questionType === 'mcq');
  const codings = qs.filter(q => q.questionType === 'coding');
  const texts   = qs.filter(q => q.questionType === 'text');

  const mcqScore    = mcqs.length    ? Math.round(mcqs.reduce((a, q) => a + (q.score || 0), 0) / mcqs.length) : null;
  const codingScore = codings.length ? Math.round(codings.reduce((a, q) => a + (q.score || 0), 0) / codings.length) : null;
  const textScore   = texts.length   ? Math.round(texts.reduce((a, q) => a + (q.score || 0), 0) / texts.length) : null;

  const overall      = s.overallScore || Math.round(qs.reduce((a, q) => a + (q.score || 0), 0) / (qs.length || 1));
  const totalTime    = s.totalTimeTaken || qs.reduce((a, q) => a + (q.timeTaken || 0), 0);
  const avgTime      = qs.length ? Math.round(totalTime / qs.length) : 0;
  const violations   = s.violations || [];
  const durationMin  = s.startedAt && s.completedAt
    ? Math.round((new Date(s.completedAt) - new Date(s.startedAt)) / 60000) : Math.round(totalTime / 60);

  // Print-based PDF export
  const handleDownload = () => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body > *:not(#report-printable) { display: none !important; }
        #report-printable { display: block !important; position: static !important; }
        .ar-no-print { display: none !important; }
        .ar-root { background: white !important; color: black !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const fmt = (sec) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

  return (
    <div className="ar-root" id="report-printable" ref={reportRef}>
      {/* ── Top bar ── */}
      <div className="ar-topbar ar-no-print">
        <button className="ip-btn-ghost" onClick={onBack}><BackIcon /> Back</button>
        <div className="ar-topbar-brand">MockMate Analytics Report</div>
        <button id="download-report-btn" className="ip-btn-primary" onClick={handleDownload}>
          <DownloadIcon /> Download PDF
        </button>
      </div>

      <div className="ar-body">
        {/* ── Header ── */}
        <div className="ar-header">
          <div className="ar-header-left">
            <div className="ar-badge">Interview Report</div>
            <h1 className="ar-title">{s.candidateName || 'Candidate'} — {s.category || 'CS Interview'}</h1>
            <div className="ar-meta-row">
              {s.roomCode && <span className="ar-meta-item">Room: <strong>{s.roomCode}</strong></span>}
              {s.interviewerName && <span className="ar-meta-item">Interviewer: <strong>{s.interviewerName}</strong></span>}
              {s.difficulty && <span className={`ip-diff-badge ip-diff-badge--${s.difficulty}`}>{s.difficulty}</span>}
              <span className="ar-meta-item">Duration: <strong>{durationMin} min</strong></span>
              <span className="ar-meta-item">{qs.length} Questions</span>
            </div>
            {violations.length > 0 && (
              <div className="ar-violation-banner">
                <WarnIcon /> {violations.length} proctoring violation{violations.length !== 1 ? 's' : ''} recorded
              </div>
            )}
          </div>
          <div className="ar-header-right">
            <Donut score={overall} size={110} />
            <div className="ar-overall-label">{scoreLabel(overall)}</div>
          </div>
        </div>

        {/* ── Score Cards ── */}
        <div className="ar-score-grid">
          <div className="ar-score-card">
            <div className="ar-score-card-label">Overall Score</div>
            <div className="ar-score-card-val" style={{ color: scoreColor(overall) }}>{overall}%</div>
            <div className="ar-score-card-tag">{scoreLabel(overall)}</div>
          </div>
          {mcqScore !== null && (
            <div className="ar-score-card">
              <div className="ar-score-card-label">MCQ Score</div>
              <div className="ar-score-card-val" style={{ color: scoreColor(mcqScore) }}>{mcqScore}%</div>
              <div className="ar-score-card-tag">{mcqs.length} questions</div>
            </div>
          )}
          {codingScore !== null && (
            <div className="ar-score-card">
              <div className="ar-score-card-label">Coding Score</div>
              <div className="ar-score-card-val" style={{ color: scoreColor(codingScore) }}>{codingScore}%</div>
              <div className="ar-score-card-tag">{codings.length} problems</div>
            </div>
          )}
          {textScore !== null && (
            <div className="ar-score-card">
              <div className="ar-score-card-label">Theory Score</div>
              <div className="ar-score-card-val" style={{ color: scoreColor(textScore) }}>{textScore}%</div>
              <div className="ar-score-card-tag">{texts.length} questions</div>
            </div>
          )}
          <div className="ar-score-card">
            <div className="ar-score-card-label">Avg Time / Q</div>
            <div className="ar-score-card-val ar-score-card-val--sm">{fmt(avgTime)}</div>
            <div className="ar-score-card-tag">Total: {fmt(totalTime)}</div>
          </div>
        </div>

        {/* ── Question Breakdown ── */}
        <div className="ar-section">
          <h2 className="ar-section-title">Question-by-Question Breakdown</h2>
          <div className="ar-q-list">
            {qs.map((q, i) => (
              <div key={i} className="ar-q-item">
                <div className="ar-q-item-header">
                  <div className="ar-q-item-left">
                    <span className="ar-q-num">Q{i + 1}</span>
                    <span className={`ce-type-badge ce-type-${q.questionType}`}>
                      {{ mcq: 'MCQ', coding: 'Code', text: 'Text' }[q.questionType]}
                    </span>
                    {q.difficulty && <span className={`ip-diff-badge ip-diff-badge--${q.difficulty}`}>{q.difficulty}</span>}
                  </div>
                  <div className="ar-q-item-right">
                    {q.timedOut && <span className="ar-timeout-tag">Timed out</span>}
                    <span className="ar-q-score" style={{ color: scoreColor(q.score || 0) }}>{q.score || 0}%</span>
                    <MiniBar value={q.score || 0} color={scoreColor(q.score || 0)} />
                  </div>
                </div>
                <p className="ar-q-text">{q.text}</p>

                {/* MCQ details */}
                {q.questionType === 'mcq' && q.options && (
                  <div className="ar-q-detail">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`ar-mcq-opt ${opt.isCorrect ? 'ar-mcq-opt--correct' : ''} ${oi === q.selectedOption && !opt.isCorrect ? 'ar-mcq-opt--wrong' : ''}`}>
                        {opt.isCorrect ? <CheckIcon /> : oi === q.selectedOption ? '✕' : <span className="ar-mcq-bullet"></span>}
                        {opt.text}
                      </div>
                    ))}
                    {q.explanation && <p className="ar-q-explanation"><strong>Explanation:</strong> {q.explanation}</p>}
                  </div>
                )}

                {/* Coding details */}
                {q.questionType === 'coding' && (
                  <div className="ar-q-detail">
                    <div className="ar-coding-result">
                      <div className="ar-coding-result-stat">
                        <CodeIcon /> {q.passedCount ?? '?'}/{q.totalTests ?? '?'} tests passed
                      </div>
                      <span className={`ar-verdict-badge ${q.status === 'accepted' ? 'ar-verdict--pass' : 'ar-verdict--fail'}`}>
                        {(q.status || 'pending').replace(/_/g, ' ')}
                      </span>
                    </div>
                    {q.code && (
                      <pre className="ar-code-preview"><code>{q.code.slice(0, 400)}{q.code.length > 400 ? '\n// … (truncated)' : ''}</code></pre>
                    )}
                  </div>
                )}

                {/* Text details */}
                {q.questionType === 'text' && (
                  <div className="ar-q-detail">
                    {q.userAnswer && (
                      <div className="ar-text-answer">
                        <div className="ar-text-answer-label">Your Answer</div>
                        <p>{q.userAnswer.slice(0, 300)}{q.userAnswer.length > 300 ? '…' : ''}</p>
                      </div>
                    )}
                    {q.keyPoints?.length > 0 && (
                      <div className="ar-keypoints">
                        <div className="ar-text-answer-label">Key Points to Cover</div>
                        <ul>
                          {q.keyPoints.map((kp, ki) => <li key={ki}><CheckIcon /> {kp}</li>)}
                        </ul>
                      </div>
                    )}
                    {q.aiFeedback?.improvements?.length > 0 && (
                      <div className="ar-improvements">
                        <div className="ar-text-answer-label">Suggestions</div>
                        <ul>
                          {q.aiFeedback.improvements.map((imp, ii) => <li key={ii}>{imp}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Time */}
                <div className="ar-q-time">{fmt(q.timeTaken || 0)} spent on this question</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Proctoring Log ── */}
        {violations.length > 0 && (
          <div className="ar-section">
            <h2 className="ar-section-title ar-section-title--warn"><WarnIcon /> Proctoring Log</h2>
            <div className="ar-violations-list">
              {violations.map((v, i) => (
                <div key={i} className="ar-violation-item">
                  <span className="ar-violation-type">{v.type?.replace(/_/g, ' ') || 'violation'}</span>
                  <span className="ar-violation-time">{v.occurredAt ? new Date(v.occurredAt).toLocaleTimeString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="ar-footer">
          <div className="ar-footer-logo">MockMate</div>
          <p className="ar-footer-note">Generated by MockMate • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <button id="download-report-btn-2" className="ip-btn-primary ar-no-print" onClick={handleDownload}>
            <DownloadIcon /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Demo session for standalone preview ──────────────────────
const DEMO_SESSION = {
  id: 'demo-001',
  candidateName: 'Demo Candidate',
  interviewerName: 'HR Team',
  roomCode: 'DEMO01',
  category: 'Data Structures & Algorithms',
  difficulty: 'medium',
  overallScore: 72,
  totalTimeTaken: 1740,
  startedAt: new Date(Date.now() - 1800000),
  completedAt: new Date(),
  violations: [{ type: 'tab_switch', occurredAt: new Date(Date.now() - 900000) }],
  questions: [
    {
      questionType: 'mcq', text: 'What is the time complexity of binary search?',
      options: [{ text: 'O(1)', isCorrect: false }, { text: 'O(log n)', isCorrect: true }, { text: 'O(n)', isCorrect: false }, { text: 'O(n²)', isCorrect: false }],
      selectedOption: 1, isCorrect: true, score: 100, timeTaken: 42, difficulty: 'easy',
      explanation: 'Binary search halves the array each step → O(log n).',
    },
    {
      questionType: 'coding', text: 'Two Sum',
      code: 'function twoSum(nums, target) {\n  const map = {};\n  for (let i=0;i<nums.length;i++) {\n    const comp = target - nums[i];\n    if (map[comp] !== undefined) return [map[comp], i];\n    map[nums[i]] = i;\n  }\n}',
      language: 'javascript', passedCount: 2, totalTests: 3, status: 'wrong_answer', score: 67, timeTaken: 840, difficulty: 'medium',
    },
    {
      questionType: 'text', text: 'Explain SOLID principles with examples.',
      userAnswer: 'SOLID is an acronym for five design principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion...',
      keyPoints: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
      score: 50, timeTaken: 858, difficulty: 'medium',
      aiFeedback: { improvements: ['Provide a concrete code example for each principle', 'Explain how violations of SOLID lead to bugs'] },
    },
  ],
};

export default AnalyticsReport;
