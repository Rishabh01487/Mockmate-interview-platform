import React, { useState, useEffect } from 'react';
import { API_BASE } from './config/api.js';

// ════════════════════════════════════════════════════════════
//  AI Training Dashboard
//  Shows data collection progress, export controls, and stats
// ════════════════════════════════════════════════════════════

const TrainingDashboard = ({ onGoHome }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/training/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.warn('Failed to fetch training stats:', err.message);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/training/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'F:\\\\MockMate-AI-Training' })
      });
      const data = await res.json();
      setExportResult(data);
      fetchStats();
    } catch (err) {
      setExportResult({ error: err.message });
    }
    setExporting(false);
  };

  const totalSamples = stats?.totalSamples || 0;
  const target = 500;
  const progress = Math.min(100, Math.round((totalSamples / target) * 100));
  const domainEntries = Object.entries(stats?.byDomain || {});
  const sourceEntries = Object.entries(stats?.bySource || {});

  // Training phases
  const phase = totalSamples === 0 ? 'collecting' :
                totalSamples < 100 ? 'early' :
                totalSamples < 500 ? 'growing' :
                totalSamples < 1000 ? 'ready' : 'mature';

  const phaseInfo = {
    collecting: { label: 'Just Started', color: '#ef4444', desc: 'Start using the platform to collect training data' },
    early:      { label: 'Early Collection', color: '#f59e0b', desc: 'Keep practicing! Need more data for training' },
    growing:    { label: 'Growing Dataset', color: '#3b82f6', desc: 'Good progress! Dataset is building up nicely' },
    ready:      { label: 'Ready to Train', color: '#22c55e', desc: '🎉 You have enough data to fine-tune a model!' },
    mature:     { label: 'Rich Dataset', color: '#8b5cf6', desc: '🚀 Excellent! Large dataset for high-quality fine-tuning' },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base, #0a0a0f)', color: '#e2e8f0', padding: '2rem' }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🧠 AI Training Dashboard
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '0.3rem', fontSize: '0.9rem' }}>
              Monitor data collection for your custom MockMate AI model
            </p>
          </div>
          <button onClick={onGoHome} style={{
            padding: '0.5rem 1.2rem', borderRadius: 12, border: '1px solid #334155',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem'
          }}>← Home</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading training stats...</div>
        ) : (
          <>
            {/* Phase Banner */}
            <div style={{
              padding: '1.2rem 1.5rem', borderRadius: 16, marginBottom: '1.5rem',
              background: `linear-gradient(135deg, ${phaseInfo[phase].color}15, ${phaseInfo[phase].color}08)`,
              border: `1px solid ${phaseInfo[phase].color}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                  background: phaseInfo[phase].color, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>{phaseInfo[phase].label}</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{phaseInfo[phase].desc}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              padding: '1.5rem', borderRadius: 16, marginBottom: '1.5rem',
              background: '#111827', border: '1px solid #1e293b'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Training Data Progress</span>
                <span style={{ color: '#6366f1', fontWeight: 700 }}>{totalSamples} / {target} samples</span>
              </div>
              <div style={{ height: 12, borderRadius: 6, background: '#1e293b', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6, transition: 'width 1s ease',
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, #6366f1, ${progress >= 100 ? '#22c55e' : '#8b5cf6'})`
                }} />
              </div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {progress >= 100 ? '✅ Ready for fine-tuning!' : `${target - totalSamples} more samples needed for fine-tuning`}
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <StatCard label="Total Samples" value={totalSamples} color="#6366f1" />
              <StatCard label="Unexported" value={stats?.unexported || 0} color="#f59e0b" />
              <StatCard label="Domains" value={domainEntries.length} color="#3b82f6" />
              <StatCard label="Status" value={stats?.estimatedFinetuneReady || 'Collecting'} color="#22c55e" isText />
            </div>

            {/* Domain Breakdown */}
            {domainEntries.length > 0 && (
              <div style={{ padding: '1.5rem', borderRadius: 16, marginBottom: '1.5rem', background: '#111827', border: '1px solid #1e293b' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>📊 Samples by Domain</h3>
                {domainEntries.map(([domain, count]) => (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <span style={{ width: 100, fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>{domain}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#1e293b' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, background: '#6366f1',
                        width: `${(count / Math.max(...domainEntries.map(d => d[1]))) * 100}%`,
                        transition: 'width 0.5s'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: 30 }}>{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Source Breakdown */}
            {sourceEntries.length > 0 && (
              <div style={{ padding: '1.5rem', borderRadius: 16, marginBottom: '1.5rem', background: '#111827', border: '1px solid #1e293b' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>📁 Samples by Source</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {sourceEntries.map(([source, count]) => (
                    <div key={source} style={{
                      padding: '0.6rem 1rem', borderRadius: 10, background: '#1e293b',
                      display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{source}</span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Section */}
            <div style={{ padding: '1.5rem', borderRadius: 16, marginBottom: '1.5rem', background: '#111827', border: '1px solid #1e293b' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>💾 Export to F: Drive</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Export collected training data as JSONL files to <code style={{ color: '#6366f1' }}>F:\MockMate-AI-Training</code>
              </p>
              <button onClick={handleExport} disabled={exporting || totalSamples === 0} style={{
                padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none',
                background: exporting ? '#334155' : '#6366f1', color: '#fff',
                fontWeight: 700, fontSize: '0.85rem', cursor: totalSamples === 0 ? 'not-allowed' : 'pointer'
              }}>
                {exporting ? 'Exporting...' : `Export ${stats?.unexported || 0} New Samples`}
              </button>
              {exportResult && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: 8, background: exportResult.error ? '#7f1d1d' : '#14532d', fontSize: '0.8rem' }}>
                  {exportResult.error ? `❌ ${exportResult.error}` : `✅ Exported ${exportResult.exported} samples → ${exportResult.path}`}
                </div>
              )}
            </div>

            {/* Fine-tuning Guide */}
            <div style={{ padding: '1.5rem', borderRadius: 16, background: '#111827', border: '1px solid #1e293b' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>🔮 Fine-Tuning Roadmap</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <RoadmapStep num={1} title="Collect Data" desc="Use MockMate to practice & generate questions" done={totalSamples > 0} />
                <RoadmapStep num={2} title="Reach 500+ Samples" desc={`${totalSamples}/500 samples collected`} done={totalSamples >= 500} />
                <RoadmapStep num={3} title="Export to F: Drive" desc="Export JSONL training files" done={totalSamples > 0 && (stats?.unexported === 0)} />
                <RoadmapStep num={4} title="Fine-Tune Model" desc="Run training script on exported data" done={false} />
                <RoadmapStep num={5} title="Deploy Custom AI" desc="Switch MockMate to your own model" done={false} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Small stat card component
const StatCard = ({ label, value, color, isText }) => (
  <div style={{
    padding: '1.2rem', borderRadius: 14, background: '#111827', border: '1px solid #1e293b',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: isText ? '0.85rem' : '1.8rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

// Roadmap step component
const RoadmapStep = ({ num, title, desc, done }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <div style={{
      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? '#22c55e' : '#1e293b', color: done ? '#fff' : '#64748b',
      fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
    }}>{done ? '✓' : num}</div>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: done ? '#22c55e' : '#e2e8f0' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{desc}</div>
    </div>
  </div>
);

export default TrainingDashboard;
