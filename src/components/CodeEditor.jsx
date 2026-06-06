import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { API_BASE } from '../config/api.js';
import { analyzeCode, isAiOnline } from '../services/aiService';

// ── Icons ─────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const AIIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'python',     label: 'Python',     ext: 'py' },
  { id: 'cpp',        label: 'C++',         ext: 'cpp' },
  { id: 'java',       label: 'Java',        ext: 'java' },
];

const DEFAULT_STARTERS = {
  javascript: '/**\n * @param {...}\n * @return {...}\n */\nvar solution = function(input) {\n    \n};\n\nvar result = solution(input);\nconsole.log(JSON.stringify(result));',
  python:     'class Solution:\n    def solve(self, input_data):\n        pass',
  cpp:        `class Solution {\npublic:\n    void solve() {\n        \n    }\n};`,
  java:       'class Solution {\n    public void solve() {\n        \n    }\n}',
};

const LEETCODE_STUBS = {
  cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* swapPairs(ListNode* head) {
        
    }
};`,
  java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode swapPairs(ListNode head) {
        
    }
}`,
  python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def swapPairs(self, head: Optional[ListNode]) -> Optional[ListNode]:
        
`,
  javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
var swapPairs = function(head) {
    
};
`,
};

// ── Judge pipeline helper ─────────────────────────────────────
async function judgeRun(language, code, testCases) {
  try {
    const res = await fetch(`${API_BASE}/api/judge/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, input: testCases.input, expectedOutput: testCases.expectedOutput })
    });
    return await res.json();
  } catch (err) {
    return { passed: false, status: 'runtime_error', error: err.message, actualOutput: `Error: ${err.message}` };
  }
}

async function judgeSubmit(language, code, testCases, questionId) {
  try {
    const res = await fetch(`${API_BASE}/api/judge/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, testCases, questionId })
    });
    return await res.json();
  } catch (err) {
    return { testResults: testCases.map(() => ({ passed: false, status: 'runtime_error', error: err.message })), passedCount: 0, totalTests: testCases.length, score: 0, status: 'runtime_error' };
  }
}

/**
 * CodeEditor
 * Props:
 *   question — { text, problemStatement, constraints, examples, testCases, starterCode, expectedTimeComplexity }
 *   onSubmit(result) — called with { language, code, testResults, passedCount, totalTests, score, status }
 *   readOnly — show submitted code, no editing
 *   submittedCode, submittedLanguage — for review mode
 */
const CodeEditor = ({ question, onSubmit, readOnly = false, submittedCode = '', submittedLanguage = 'javascript' }) => {
  const [language, setLanguage] = useState(submittedLanguage);
  const [code, setCode] = useState(
    submittedCode ||
    question?.starterCode?.[submittedLanguage] ||
    DEFAULT_STARTERS[submittedLanguage]
  );
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(readOnly);
  const [runResults, setRunResults] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'testcases' | 'results'
  const [aiAnalysis, setAiAnalysis] = useState(null); // AI debug result
  const [aiLoading, setAiLoading] = useState(false);
  const [derivedTestCases, setDerivedTestCases] = useState([]);
  const [fetchedDescription, setFetchedDescription] = useState('');
  const [vergeLight, setVergeLight] = useState(false);
  const defaultCodeRef = useRef(false);

  // Set LeetCode skeleton once per problem
  useEffect(() => {
    if (!readOnly && !submitted) {
      defaultCodeRef.current = false;
      const stub = LEETCODE_STUBS[language] || DEFAULT_STARTERS[language];
      setCode(stub);
      defaultCodeRef.current = true;
      setRunResults(null);
      setSubmitResults(null);
      setActiveTab('problem');
    }
  }, [question?.id, question?.titleSlug]);

  // Fetch LeetCode example test cases when no explicit test cases exist
  useEffect(() => {
    if (!readOnly && !submitted && question?.titleSlug && (!question?.testCases || question.testCases.length === 0)) {
      const query = `query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { exampleTestcases } }`;
      fetch(`${API_BASE}/api/leetcode-graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { titleSlug: question.titleSlug } })
      })
        .then(res => res.json())
        .then(data => {
          const exampleStr = data?.data?.question?.exampleTestcases;
          if (exampleStr) {
            const lines = exampleStr.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
              const groupSize = lines.length % 2 === 0 ? 2 : 1;
              const cases = [];
              for (let i = 0; i < lines.length; i += groupSize) {
                cases.push({ input: lines.slice(i, i + groupSize).join('\n'), expectedOutput: '', isHidden: false });
              }
              setDerivedTestCases(cases);
            }
          }
        })
        .catch(() => {});
    }
  }, [question?.id, question?.titleSlug]);

  // Register test suites with judge backend
  useEffect(() => {
    const allCases = (question?.testCases?.length ? question.testCases : derivedTestCases);
    if (allCases.length > 0 && question?.id) {
      fetch(`${API_BASE}/api/judge/test-suites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, testCases: allCases })
      }).catch(() => {});
    }
  }, [question?.id, question?.testCases, derivedTestCases]);

  // Fetch full LeetCode question description
  useEffect(() => {
    if (!readOnly && !submitted && question?.titleSlug && !fetchedDescription) {
      const query = `query questionContent($titleSlug: String!) { question(titleSlug: $titleSlug) { content } }`;
      fetch(`${API_BASE}/api/leetcode-graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { titleSlug: question.titleSlug } })
      })
        .then(res => res.json())
        .then(data => {
          const html = data?.data?.question?.content || '';
          if (html) {
            const md = html
              .replace(/<pre>\s*<code>/g, '```\n')
              .replace(/<\/code>\s*<\/pre>/g, '\n```')
              .replace(/<code>(.*?)<\/code>/g, '`$1`')
              .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
              .replace(/<em>(.*?)<\/em>/g, '*$1*')
              .replace(/<p>/g, '\n\n').replace(/<\/p>/g, '')
              .replace(/<br\s*\/?>/g, '\n')
              .replace(/<li>/g, '• ').replace(/<\/li>/g, '')
              .replace(/<ul>/g, '').replace(/<\/ul>/g, '')
              .replace(/<ol>/g, '').replace(/<\/ol>/g, '')
              .replace(/<h3>(.*?)<\/h3>/g, '**$1**')
              .replace(/<h[1-6]>.*?<\/h[1-6]>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
              .replace(/\n{3,}/g, '\n\n').trim();
            setFetchedDescription(md);
          }
        })
        .catch(() => {});
    }
  }, [question?.id, question?.titleSlug]);

  // Switch language → load starter code
  const switchLanguage = (lang) => {
    if (submitted) return;
    setLanguage(lang);
    setCode(LEETCODE_STUBS[lang] || question?.starterCode?.[lang] || DEFAULT_STARTERS[lang]);
    setRunResults(null);
  };

  // AI Debug — full intelligent code review
  const handleAIDebug = useCallback(async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    setActiveTab('results');
    try {
      const problemText = question?.problemStatement || question?.question || question?.text || 'Solve the given problem';
      const testCasesForAI = (question?.testCases?.length ? question.testCases : derivedTestCases).slice(0, 3);
      // If no test cases, create a placeholder so AI still reviews the code
      if (testCasesForAI.length === 0 && question?.examples?.length > 0) {
        question.examples.slice(0, 2).forEach(ex => {
          testCasesForAI.push({ input: ex.input || '', expectedOutput: ex.output || ex.expectedOutput || '' });
        });
      }
      const analysis = await analyzeCode(code, language, problemText, testCasesForAI);
      setAiAnalysis(analysis);
    } catch (err) {
      setAiAnalysis({ error: err.message, compiles: false, bugs: ['Failed to connect to AI engine — make sure backend is running on port 5000'], suggestions: [], overallVerdict: 'error', score: 0 });
    }
    setAiLoading(false);
  }, [code, language, question, derivedTestCases]);

  // Run against visible test cases only
  const handleRun = useCallback(async () => {
    setRunning(true);
    setActiveTab('results');
    const allTestCases = (question?.testCases?.length ? question.testCases : derivedTestCases);
    const visibleCases = allTestCases.filter(tc => !tc.isHidden).slice(0, 3);
    if (!visibleCases.length) {
      setRunResults([{ passed: false, input: '', expectedOutput: '', actualOutput: 'No test cases available for this problem.', executionTime: 0, error: 'No test cases' }]);
      setRunning(false);
      return;
    }
    const results = [];
    for (const tc of visibleCases) {
      const r = await judgeRun(language, code, tc);
      results.push({
        passed: r.passed,
        status: r.status,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: r.actualOutput || r.error || '(no output)',
        executionTime: r.executionTime || 0,
        error: r.error || '',
      });
    }
    setRunResults(results);
    setRunning(false);
  }, [code, language, question, derivedTestCases]);

  // Submit — runs against ALL test cases
  const handleSubmit = useCallback(async () => {
    setRunning(true);
    const allCases = (question?.testCases?.length ? question.testCases : derivedTestCases);
    if (!allCases.length) {
      const errResult = { language, code, testResults: [{ passed: false, input: '', expectedOutput: '', actualOutput: 'No test cases available for this problem.', executionTime: 0, error: 'No test cases' }], passedCount: 0, totalTests: 0, score: 0, status: 'runtime_error' };
      setSubmitResults(errResult);
      setSubmitted(true);
      setActiveTab('results');
      setRunning(false);
      onSubmit && onSubmit(errResult);
      return;
    }
    const result = await judgeSubmit(language, code, allCases, question?.id);
    setSubmitResults(result);
    setSubmitted(true);
    setActiveTab('results');
    setRunning(false);
    onSubmit && onSubmit(result);
  }, [code, language, question, derivedTestCases, onSubmit]);

  const testCases = (question?.testCases?.length ? question.testCases : derivedTestCases).filter(tc => !tc.isHidden);
  const examples  = question?.examples || [];

  return (
    <div className="ce-root">
      {/* ── Left: Problem Panel ── */}
      <div className="ce-left">
        <div className="ce-panel-tabs">
          {['problem', 'testcases', 'results'].map(tab => (
            <button key={tab} className={`ce-panel-tab${activeTab === tab ? ' ce-panel-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab === 'problem' ? 'Problem' : tab === 'testcases' ? 'Test Cases' : 'Results'}
              {tab === 'results' && submitResults && (
                <span className={`ce-result-badge ${submitResults.status === 'accepted' ? 'ce-badge--pass' : 'ce-badge--fail'}`}>
                  {submitResults.passedCount}/{submitResults.totalTests}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ce-panel-body">
          {activeTab === 'problem' && (
            <div className="ce-problem">
              <h3 className="ce-problem-title">{question?.text || 'Coding Problem'}</h3>
              {question?.difficulty && (
                <span className={`ip-diff-badge ip-diff-badge--${question.difficulty}`}>{question.difficulty}</span>
              )}
              <div className="ce-problem-statement">
                {fetchedDescription || question?.problemStatement || question?.text}
              </div>
              {question?.constraints?.length > 0 && (
                <div className="ce-section">
                  <div className="ce-section-label">Constraints</div>
                  <ul className="ce-constraints">
                    {question.constraints.map((c, i) => <li key={i}><code>{c}</code></li>)}
                  </ul>
                </div>
              )}
              {examples.length > 0 && (
                <div className="ce-section">
                  <div className="ce-section-label">Examples</div>
                  {examples.map((ex, i) => (
                    <div className="ce-example" key={i}>
                      <div className="ce-example-row"><span>Input:</span><code>{ex.input}</code></div>
                      <div className="ce-example-row"><span>Output:</span><code>{ex.output}</code></div>
                      {ex.explanation && <div className="ce-example-explanation">{ex.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}
              {question?.expectedTimeComplexity && (
                <div className="ce-complexity">
                  Expected: <code>{question.expectedTimeComplexity}</code>
                </div>
              )}
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="ce-testcases">
              {testCases.length === 0 ? (
                <p className="ce-empty">No visible test cases for this problem.</p>
              ) : testCases.map((tc, i) => (
                <div className="ce-tc-item" key={i}>
                  <div className="ce-tc-label">Case {i + 1}</div>
                  <div className="ce-tc-row"><span>Input:</span><code>{tc.input}</code></div>
                  <div className="ce-tc-row"><span>Expected:</span><code>{tc.expectedOutput}</code></div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="ce-results">
              {!runResults && !submitResults && !aiAnalysis && (
                <p className="ce-empty">Run your code or use AI Debug to see results here.</p>
              )}

              {/* AI Debug Analysis Panel */}
              {aiAnalysis && (
                <div className={`ce-ai-analysis${vergeLight ? ' ce-ai-analysis--light' : ''}`}>
                  <div className="ce-ai-header">
                    <AIIcon /> <strong>Verge1.o Code Analysis</strong>
                    <button className="ce-ai-light-toggle" onClick={() => setVergeLight(v => !v)} title="Toggle light mode"
                      style={{ background: 'none', border: '1px solid currentColor', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', color: 'inherit', opacity: 0.6 }}>
                      {vergeLight ? '🌙' : '☀️'}
                    </button>
                    <span className={`ce-ai-verdict ${aiAnalysis.overallVerdict === 'accepted' ? 'ce-badge--pass' : 'ce-badge--fail'}`}>
                      {aiAnalysis.overallVerdict?.toUpperCase() || 'UNKNOWN'} — {aiAnalysis.score ?? 0}%
                    </span>
                  </div>
                  {aiAnalysis.compiles === false && (
                    <div className="ce-ai-section ce-ai-error">
                      <strong>Compilation Errors:</strong>
                      {(aiAnalysis.syntaxErrors || []).map((e, i) => <div key={i}>• {e}</div>)}
                    </div>
                  )}
                  {aiAnalysis.bugs?.length > 0 && (
                    <div className="ce-ai-section ce-ai-bugs">
                      <strong>Bugs Detected:</strong>
                      {aiAnalysis.bugs.map((b, i) => <div key={i}>• {b}</div>)}
                    </div>
                  )}
                  {aiAnalysis.suggestions?.length > 0 && (
                    <div className="ce-ai-section ce-ai-suggestions">
                      <strong>Optimization Suggestions:</strong>
                      {aiAnalysis.suggestions.map((s, i) => <div key={i}>• {s}</div>)}
                    </div>
                  )}
                  {aiAnalysis.error && (
                    <div className="ce-ai-section ce-ai-error">
                      <strong>AI Error:</strong> {aiAnalysis.error}
                    </div>
                  )}
                </div>
              )}

              {(submitResults || runResults) && (() => {
                const res = submitResults || runResults;
                const passed = res.filter ? res.filter(r => r.passed).length : res.passedCount;
                const total  = res.filter ? res.length : res.totalTests;
                const results = res.testResults || res;
                return (
                  <>
                    {submitResults && (
                      <div className={`ce-verdict ${submitResults.status === 'accepted' ? 'ce-verdict--pass' : 'ce-verdict--fail'}`}>
                        {submitResults.status === 'accepted' ? <><CheckIcon /> Accepted</> : `${submitResults.status.replace(/_/g, ' ').toUpperCase()}`}
                        <span className="ce-verdict-score">{passed}/{total} passed · {submitResults.score}%</span>
                      </div>
                    )}
                    <div className="ce-result-list">
                      {results.map((r, i) => (
                        <div key={i} className={`ce-result-item ${r.passed ? 'ce-result-item--pass' : 'ce-result-item--fail'}`}>
                          <div className="ce-result-item-header">
                            <span>{r.passed ? <CheckIcon /> : '✕'} Case {i + 1}</span>
                            <span className="ce-result-time">{r.executionTime}ms</span>
                          </div>
                          {!r.passed && (
                            <>
                              <div className="ce-result-row"><span>Input:</span><code>{r.input}</code></div>
                              <div className="ce-result-row"><span>Expected:</span><code>{r.expectedOutput}</code></div>
                              <div className="ce-result-row"><span>Got:</span><code className="ce-wrong">{r.actualOutput}</code></div>
                            </>
                          )}
                          {r.error && <div className="ce-result-error">{r.error}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Editor Panel ── */}
      <div className="ce-right">
        {/* Toolbar */}
        <div className="ce-toolbar">
          <div className="ce-lang-selector">
            {LANGUAGES.map(lang => (
              <button key={lang.id}
                id={`lang-${lang.id}`}
                className={`ce-lang-btn${language === lang.id ? ' ce-lang-btn--active' : ''}`}
                onClick={() => switchLanguage(lang.id)}
                disabled={submitted || readOnly}>
                {lang.label}
              </button>
            ))}
          </div>
          <div className="ce-toolbar-actions">
            {!submitted && !readOnly && (
              <button className="ce-reset-btn" onClick={() => setCode(question?.starterCode?.[language] || DEFAULT_STARTERS[language])} title="Reset to starter code">
                <ResetIcon /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Code Area */}
        <div className="ce-editor-wrap" style={{ position: 'relative' }}>
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'javascript' ? 'javascript' : language === 'python' ? 'python' : language === 'java' ? 'java' : 'cpp'}
            theme="vs"
            value={code}
            onChange={val => !readOnly && !submitted && setCode(val || '')}
            options={{
              fontSize: 14,
              fontFamily: "'Courier New', monospace",
              minimap: { enabled: false },
              lineNumbers: 'on',
              readOnly: readOnly || submitted,
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              automaticLayout: true,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoClosingDelete: 'auto',
              autoClosingOvertype: 'auto',
              tabSize: 4,
              renderWhitespace: 'selection',
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Bottom Actions */}
        {!readOnly && (
          <div className="ce-actions">
            <button
              id="run-code-btn"
              className="ce-run-btn ip-btn-ghost"
              onClick={handleRun}
              disabled={running || submitted}>
              <PlayIcon /> {running && !submitted ? 'Running…' : 'Run Code'}
            </button>
            <button
              id="ai-debug-btn"
              className="ce-ai-btn"
              onClick={handleAIDebug}
              disabled={aiLoading || submitted}
              title="Analyze code with Verge1.o AI"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600 }}>
              <AIIcon /> {aiLoading ? 'Analyzing…' : 'AI Debug'}
            </button>
            <button
              id="submit-code-btn"
              className="ce-submit-btn ip-btn-primary"
              onClick={handleSubmit}
              disabled={running || submitted}>
              <SendIcon /> {running && !submitted ? 'Submitting…' : submitted ? 'Submitted' : 'Submit'}
            </button>
          </div>
        )}

        {/* Submitted overlay */}
        {submitted && !readOnly && submitResults && (
          <div className={`ce-submitted-banner ${submitResults.status === 'accepted' ? 'ce-banner--pass' : 'ce-banner--fail'}`}>
            <CheckIcon />
            {submitResults.status === 'accepted'
              ? `All ${submitResults.totalTests} tests passed!`
              : `${submitResults.passedCount}/${submitResults.totalTests} tests passed`}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
