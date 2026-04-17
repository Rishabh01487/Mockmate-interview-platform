import React, { useState, useRef, useCallback, useEffect } from 'react';

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

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'python',     label: 'Python',     ext: 'py' },
  { id: 'cpp',        label: 'C++',         ext: 'cpp' },
  { id: 'java',       label: 'Java',        ext: 'java' },
];

const DEFAULT_STARTERS = {
  javascript: '// Write your solution here\nfunction solution(input) {\n  \n}\n\nconsole.log(solution(""));',
  python:     '# Write your solution here\ndef solution(input_data):\n    pass\n\nprint(solution(""))',
  cpp:        '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}',
  java:       'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}',
};

// ── Simple JS sandbox (for JavaScript only) ───────────────────
function runJavaScript(code, input) {
  const logs = [];
  const sandbox = {
    console: { log: (...a) => logs.push(a.map(String).join(' ')), error: (...a) => logs.push('[ERR] ' + a.join(' ')) },
    input,
  };
  try {
    const fn = new Function(...Object.keys(sandbox), code);
    fn(...Object.values(sandbox));
    return { output: logs.join('\n') || '(no output)', error: null };
  } catch (e) {
    return { output: '', error: e.message };
  }
}

// Mock runner for non-JS languages
function mockRun(language, testCases) {
  return testCases.map((tc) => ({
    passed: Math.random() > 0.4,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    actualOutput: tc.expectedOutput, // mock: pretend correct
    executionTime: Math.floor(Math.random() * 80) + 20,
    error: '',
  }));
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
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!readOnly && !submitted) {
      // Force the code to update to the specific function signature for this question
      setCode(question?.starterCode?.[language] || DEFAULT_STARTERS[language]);
      setRunResults(null);
      setSubmitResults(null);
      setActiveTab('problem');
    }
  }, [question, language, readOnly, submitted]);

  // Switch language → load starter code
  const switchLanguage = (lang) => {
    if (submitted) return;
    setLanguage(lang);
    setCode(question?.starterCode?.[lang] || DEFAULT_STARTERS[lang]);
    setRunResults(null);
  };

  // Tab key inserts spaces
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  // Run against visible test cases only
  const handleRun = useCallback(() => {
    setRunning(true);
    setActiveTab('results');
    setTimeout(() => {
      const visibleCases = (question?.testCases || []).filter(tc => !tc.isHidden).slice(0, 3);
      if (!visibleCases.length) {
        visibleCases.push({ input: 'sample input', expectedOutput: 'sample output', isHidden: false });
      }
      let results;
      if (language === 'javascript') {
        results = visibleCases.map(tc => runJavaScript(code, tc.input)).map((r, i) => ({
          passed: !r.error && r.output.trim() === visibleCases[i].expectedOutput.trim(),
          input: visibleCases[i].input,
          expectedOutput: visibleCases[i].expectedOutput,
          actualOutput: r.error ? `Error: ${r.error}` : r.output,
          executionTime: Math.floor(Math.random() * 50) + 10,
          error: r.error || '',
        }));
      } else {
        results = mockRun(language, visibleCases);
      }
      setRunResults(results);
      setRunning(false);
    }, 800);
  }, [code, language, question]);

  // Submit — runs against ALL test cases
  const handleSubmit = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const allCases = question?.testCases || [];
      const cases = allCases.length ? allCases : [{ input: 'test', expectedOutput: 'output', isHidden: false }];
      let results;
      if (language === 'javascript') {
        results = cases.map(tc => {
          const r = runJavaScript(code, tc.input);
          return {
            passed: !r.error && r.output.trim() === (tc.expectedOutput || '').trim(),
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: r.error ? `Error: ${r.error}` : r.output,
            executionTime: Math.floor(Math.random() * 60) + 5,
            error: r.error || '',
          };
        });
      } else {
        results = mockRun(language, cases);
      }
      const passedCount = results.filter(r => r.passed).length;
      const totalTests  = results.length;
      const score = Math.round((passedCount / totalTests) * 100);
      const status = passedCount === totalTests ? 'accepted'
        : results.some(r => r.error) ? 'runtime_error' : 'wrong_answer';

      const result = { language, code, testResults: results, passedCount, totalTests, score, status };
      setSubmitResults(result);
      setSubmitted(true);
      setActiveTab('results');
      setRunning(false);
      onSubmit && onSubmit(result);
    }, 1200);
  }, [code, language, question, onSubmit]);

  const testCases = (question?.testCases || []).filter(tc => !tc.isHidden);
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
                {question?.problemStatement || question?.text}
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
              {!runResults && !submitResults && (
                <p className="ce-empty">Run your code to see results here.</p>
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
        <div className="ce-editor-wrap">
          <div className="ce-line-numbers" aria-hidden="true">
            {code.split('\n').map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            id="code-editor-textarea"
            className="ce-textarea"
            value={code}
            onChange={e => !readOnly && !submitted && setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            readOnly={readOnly || submitted}
            aria-label="Code editor"
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
