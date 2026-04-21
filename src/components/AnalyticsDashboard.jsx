import React, { useMemo } from 'react';

// ════════════════════════════════════════════════════════════
//  Performance Analytics Dashboard
//  Full visual breakdown of interview performance by domain
// ════════════════════════════════════════════════════════════

const DOMAIN_COLORS = {
  dsa: '#6366f1',
  os: '#f59e0b',
  dbms: '#10b981',
  cn: '#3b82f6',
  oop: '#ec4899',
  systemdesign: '#8b5cf6',
  webdev: '#14b8a6',
  corecs: '#f97316',
  'leetcode-live': '#ef4444',
};

const DOMAIN_LABELS = {
  dsa: 'DSA',
  os: 'Operating Systems',
  dbms: 'DBMS',
  cn: 'Networks',
  oop: 'OOP',
  systemdesign: 'System Design',
  webdev: 'Web Dev',
  corecs: 'Core CS',
  'leetcode-live': 'LeetCode',
};

// ── SVG Radar Chart ───────────────────────────────────────
function RadarChart({ data, size = 280 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = data.length;
  if (n < 3) return null;

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, val) => ({
    x: cx + r * (val / 100) * Math.cos(angle(i)),
    y: cy + r * (val / 100) * Math.sin(angle(i)),
  });

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = data.map((d, i) => point(i, d.score));
  const path = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {/* Grid circles */}
      {gridLevels.map(level => (
        <polygon key={level}
          points={Array.from({ length: n }, (_, i) => point(i, level)).map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={point(i, 100).x} y2={point(i, 100).y}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2" />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={data[i].color || '#6366f1'} stroke="#fff" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {data.map((d, i) => {
        const labelP = point(i, 120);
        return (
          <text key={i} x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="500">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────
function BarChart({ data, label = 'Score' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="analytics-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="analytics-bar-row">
          <span className="analytics-bar-label">{d.label}</span>
          <div className="analytics-bar-track">
            <div className="analytics-bar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || '#6366f1' }}>
            </div>
          </div>
          <span className="analytics-bar-value">{d.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────
function DonutChart({ value, size = 120, color = '#6366f1', label = '' }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="analytics-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="analytics-donut-text">
        <span className="analytics-donut-value">{value}%</span>
        <span className="analytics-donut-label">{label}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  Main Analytics Component
// ════════════════════════════════════════════════════════════
export default function AnalyticsDashboard({ domainResults = [], totalTime = 0, candidateName = 'Candidate' }) {
  /*
    domainResults expected format:
    [{
      domain: 'dsa',
      questions: [{ question, answer, score, isCorrect, timeSpent }],
      totalScore: 75,
      totalQuestions: 10,
      correctAnswers: 7,
      timeTaken: 300, // seconds
      timeAllotted: 600
    }]
  */

  const stats = useMemo(() => {
    if (!domainResults.length) return null;

    const totalQuestions = domainResults.reduce((s, d) => s + d.totalQuestions, 0);
    const totalCorrect = domainResults.reduce((s, d) => s + d.correctAnswers, 0);
    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // By difficulty
    const diffBreakdown = { Easy: { total: 0, correct: 0 }, Medium: { total: 0, correct: 0 }, Hard: { total: 0, correct: 0 } };
    domainResults.forEach(d => {
      (d.questions || []).forEach(q => {
        const diff = q.difficulty || 'Medium';
        if (diffBreakdown[diff]) {
          diffBreakdown[diff].total++;
          if (q.isCorrect) diffBreakdown[diff].correct++;
        }
      });
    });

    // Strengths / Weaknesses
    const sorted = [...domainResults].sort((a, b) => b.totalScore - a.totalScore);
    const strengths = sorted.filter(d => d.totalScore >= 70).slice(0, 3);
    const weaknesses = sorted.filter(d => d.totalScore < 50).slice(0, 3);

    return { totalQuestions, totalCorrect, overallScore, diffBreakdown, strengths, weaknesses };
  }, [domainResults]);

  if (!stats) return <div className="analytics-empty">No data available yet.</div>;

  const radarData = domainResults.map(d => ({
    label: DOMAIN_LABELS[d.domain] || d.domain,
    score: d.totalScore,
    color: DOMAIN_COLORS[d.domain] || '#6366f1',
  }));

  const barData = domainResults.map(d => ({
    label: DOMAIN_LABELS[d.domain] || d.domain,
    value: d.totalScore,
    color: DOMAIN_COLORS[d.domain] || '#6366f1',
  }));

  const diffData = Object.entries(stats.diffBreakdown).map(([diff, { total, correct }]) => ({
    label: diff,
    value: total > 0 ? Math.round((correct / total) * 100) : 0,
    color: diff === 'Easy' ? '#22c55e' : diff === 'Medium' ? '#f59e0b' : '#ef4444',
  }));

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2 className="analytics-title">📊 Performance Analytics</h2>
        <p className="analytics-subtitle">{candidateName}'s Interview Performance Report</p>
      </div>

      {/* Top Stats Row */}
      <div className="analytics-stats-row">
        <DonutChart value={stats.overallScore} label="Overall" color={stats.overallScore >= 70 ? '#22c55e' : stats.overallScore >= 40 ? '#f59e0b' : '#ef4444'} />
        <div className="analytics-stat-cards">
          <div className="analytics-stat-card">
            <span className="analytics-stat-number">{stats.totalQuestions}</span>
            <span className="analytics-stat-label">Total Questions</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-number" style={{ color: '#22c55e' }}>{stats.totalCorrect}</span>
            <span className="analytics-stat-label">Correct</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-number" style={{ color: '#ef4444' }}>{stats.totalQuestions - stats.totalCorrect}</span>
            <span className="analytics-stat-label">Incorrect</span>
          </div>
          <div className="analytics-stat-card">
            <span className="analytics-stat-number">{domainResults.length}</span>
            <span className="analytics-stat-label">Domains</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="analytics-charts-row">
        {/* Radar Chart */}
        {radarData.length >= 3 && (
          <div className="analytics-chart-card">
            <h3 className="analytics-chart-title">Domain Coverage Map</h3>
            <div className="analytics-chart-center">
              <RadarChart data={radarData} />
            </div>
          </div>
        )}

        {/* Bar Chart — By Domain */}
        <div className="analytics-chart-card">
          <h3 className="analytics-chart-title">Score by Domain</h3>
          <BarChart data={barData} />
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="analytics-chart-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="analytics-chart-title">Performance by Difficulty</h3>
        <div className="analytics-diff-row">
          {diffData.map((d, i) => (
            <div key={i} className="analytics-diff-item">
              <DonutChart value={d.value} size={90} label={d.label} color={d.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="analytics-charts-row">
        <div className="analytics-chart-card analytics-strengths">
          <h3 className="analytics-chart-title">💪 Strengths</h3>
          {stats.strengths.length === 0 ? <p className="analytics-empty-note">—</p> :
            stats.strengths.map((d, i) => (
              <div key={i} className="analytics-sw-item">
                <span className="analytics-sw-dot" style={{ background: '#22c55e' }}></span>
                <span>{DOMAIN_LABELS[d.domain] || d.domain}</span>
                <span className="analytics-sw-score" style={{ color: '#22c55e' }}>{d.totalScore}%</span>
              </div>
            ))
          }
        </div>
        <div className="analytics-chart-card analytics-weaknesses">
          <h3 className="analytics-chart-title">⚠️ Needs Improvement</h3>
          {stats.weaknesses.length === 0 ? <p className="analytics-empty-note">All domains look strong!</p> :
            stats.weaknesses.map((d, i) => (
              <div key={i} className="analytics-sw-item">
                <span className="analytics-sw-dot" style={{ background: '#ef4444' }}></span>
                <span>{DOMAIN_LABELS[d.domain] || d.domain}</span>
                <span className="analytics-sw-score" style={{ color: '#ef4444' }}>{d.totalScore}%</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Per-Domain Detailed Breakdown */}
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">Detailed Domain Breakdown</h3>
        <div className="analytics-domain-table">
          <div className="analytics-table-header">
            <span>Domain</span><span>Questions</span><span>Correct</span><span>Score</span><span>Time Used</span>
          </div>
          {domainResults.map((d, i) => {
            const pct = d.totalScore;
            const mins = Math.floor((d.timeTaken || 0) / 60);
            const secs = (d.timeTaken || 0) % 60;
            return (
              <div key={i} className="analytics-table-row">
                <span className="analytics-domain-name">
                  <span className="analytics-domain-dot" style={{ background: DOMAIN_COLORS[d.domain] || '#6366f1' }}></span>
                  {DOMAIN_LABELS[d.domain] || d.domain}
                </span>
                <span>{d.totalQuestions}</span>
                <span style={{ color: '#22c55e' }}>{d.correctAnswers}</span>
                <span><span className={`analytics-score-pill ${pct >= 70 ? 'analytics-pill--pass' : pct >= 40 ? 'analytics-pill--warn' : 'analytics-pill--fail'}`}>{pct}%</span></span>
                <span>{mins}m {secs}s</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
