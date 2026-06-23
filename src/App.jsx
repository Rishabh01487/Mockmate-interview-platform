import React, { useState, useEffect, useRef } from 'react';

function App() {
  // --- 1. Styling (Complete Dark Mode) ---
  const styles = `
    :root {
      --bg-dark: #1e1e1e;
      --bg-panel: #252526;
      --border: #3e3e42;
      --text-main: #d4d4d4;
      --text-muted: #858585;
      --accent: #007acc;
      --success: #4caf50;
      --error: #f44336;
      --keyword: #569cd6;
      --string: #ce9178;
      --number: #b5cea8;
      --comment: #6a9955;
      --function: #dcdcaa;
    }

    body { margin: 0; background-color: var(--bg-dark); font-family: 'Segoe UI', sans-serif; height: 100vh; overflow: hidden; }

    .layout { display: flex; height: 100%; }

    /* --- Sidebar --- */
    .sidebar { width: 400px; background: var(--bg-panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
    .sidebar-header { padding: 20px; border-bottom: 1px solid var(--border); }
    .sidebar-content { padding: 20px; overflow-y: auto; flex: 1; color: var(--text-main); font-size: 14px; line-height: 1.6; }
    .code-snippet { background: #111; padding: 10px; border-radius: 4px; font-family: monospace; color: var(--text-muted); margin: 10px 0; }
    
    .btn { padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600; color: white; }
    .btn-run { background: #333; border: 1px solid #555; margin-right: 10px; }
    .btn-submit { background: var(--accent); }
    .btn:hover { opacity: 0.9; }

    /* --- Editor --- */
    .editor-area { flex: 1; display: flex; flex-direction: column; background: var(--bg-dark); min-width: 0; }
    .tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-panel); }
    .tab { padding: 10px 20px; cursor: pointer; color: var(--text-muted); border-right: 1px solid var(--border); }
    .tab.active { background: var(--bg-dark); color: var(--text-main); }

    .code-wrapper { flex: 1; position: relative; display: flex; overflow: hidden; font-family: 'Consolas', monospace; font-size: 14px; }
    
    .line-numbers { width: 50px; background: var(--bg-panel); color: var(--text-muted); text-align: right; padding: 10px 5px; border-right: 1px solid var(--border); user-select: none; }
    
    .highlight-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 10px; margin: 0; white-space: pre; color: transparent; pointer-events: none; z-index: 2; overflow: auto; }
    
    /* CRITICAL: Make textarea visible */
    .code-input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 10px; margin: 0; border: none; background: transparent; color: var(--text-main); resize: none; outline: none; z-index: 1; white-space: pre; overflow: auto; tab-size: 4; }

    .token-keyword { color: var(--keyword); font-weight: bold; }
    .token-string { color: var(--string); }
    .token-number { color: var(--number); }
    .token-comment { color: var(--comment); font-style: italic; }
    .token-function { color: var(--function); }

    /* --- Console --- */
    .console-panel { height: 200px; background: var(--bg-panel); border-top: 1px solid var(--border); display: flex; flex-direction: column; }
    .console-header { padding: 8px 20px; font-size: 13px; font-weight: bold; color: var(--text-muted); background: var(--bg-dark); }
    .console-content { flex: 1; padding: 10px 20px; font-family: monospace; font-size: 13px; overflow-y: auto; color: var(--text-main); }
    .log-entry { margin-bottom: 4px; border-bottom: 1px solid #333; }
    .log-info { color: var(--text-main); }
    .log-success { color: var(--success); }
    .log-error { color: var(--error); }
  `;

  // --- 2. State & Refs ---
  const [logs, setLogs] = useState([]);
  const consoleRef = useRef(null);
  const inputRef = useRef(null);

  // --- 3. Syntax Highlighter ---
  const highlightCode = (code) => {
    if (!code) return '';
    let html = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Comments
    html = html.replace(/(\/\/.*)/g, '<span class="token-comment">$1</span>');
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token-comment">$1</span>');

    // Strings
    html = html.replace(/(&quot;.*?&quot;|&#x27;.*?&#x27;)/g, '<span class="token-string">$1</span>');

    // Numbers
    html = html.replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');

    // Keywords
    const keywords = ['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'try', 'catch', 'throw', 'break', 'continue'];
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g');
      html = html.replace(regex, '<span class="token-keyword">$1</span>');
    });

    // Functions
    html = html.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '<span class="token-function">$1</span>(');

    return html;
  };

  // --- 4. Effects (Line Numbers & Sync) ---
  useEffect(() => {
    const input = inputRef.current;
    const highlight = input.nextElementSibling;
    const lineNumbers = input.parentElement.previousElementSibling;

    if (!input || !highlight || !lineNumbers) return;

    const updateHighlight = () => {
      highlight.innerHTML = highlightCode(input.value);
      const lines = input.value.split('\n').length;
      lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
    };

    const handleScroll = () => {
      highlight.scrollTop = input.scrollTop;
      highlight.scrollLeft = input.scrollLeft;
      lineNumbers.scrollTop = input.scrollTop;
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + "\t" + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + 1;
        updateHighlight();
      }
    });

    input.addEventListener('input', updateHighlight);
    input.addEventListener('scroll', handleScroll);
    updateHighlight();

    return () => {
      input.removeEventListener('input', updateHighlight);
      input.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // --- 5. Runner Logic ---
  const runCode = () => {
    if (!consoleRef.current) return;
    consoleRef.current.innerHTML = '';
    setLogs([]);

    const code = inputRef.current.value;
    const originalLog = console.log;
    const logs = [];
    
    console.log = (...args) => {
      logs.push({ type: 'info', msg: args.join(' ') });
      originalLog.apply(console, args);
    };

    try {
      new Function(code)();
      console.log = originalLog;

      logs.forEach(log => {
        const div = document.createElement('div');
        div.className = `log-entry log-${log.type}`;
        div.textContent = log.msg;
        consoleRef.current.appendChild(div);
      });

      if (logs.length === 0) {
         const div = document.createElement('div');
         div.className = "log-entry log-info";
         div.textContent = "Program executed with no output.";
         consoleRef.current.appendChild(div);
      }

    } catch (err) {
      console.log = originalLog;
      const div = document.createElement('div');
      div.className = 'log-entry log-error';
      div.textContent = `Error: ${err.message}`;
      consoleRef.current.appendChild(div);
    }
  };

  const submitCode = () => {
    runCode();
    const div = document.createElement('div');
    div.className = 'log-entry log-success';
    div.textContent = 'Submission Successful!';
    consoleRef.current.appendChild(div);
  };

  // --- 6. Render ---
  return (
    <>
      <style>{styles}</style>

      <div className="layout">
        {/* LEFT SIDEBAR: The Question */}
        <div className="sidebar">
          <div className="sidebar-header">
            <span style={{ background: '#4caf50', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', color: 'white' }}>Easy</span>
            <h2 style={{ marginTop: 10 }}>1. Two Sum</h2>
            <p style={{ color: '#d4d4d4', fontSize: 14 }}>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
            
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-run" onClick={runCode}>Run Code</button>
              <button className="btn btn-submit" onClick={submitCode}>Submit</button>
            </div>
          </div>
          <div className="sidebar-content">
            <p><strong>Example 1:</strong></p>
            <div className="code-snippet">
              Input: nums = [2,7,11,15], target = 9<br/>
              Output: [0,1]<br/>
              Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
            </div>
            <p><strong>Constraints:</strong></p>
            <div className="code-snippet">
              2 <= nums.length <= 10^4<br/>
              -10^9 <= nums[i] <= 10^9<br/>
              Only one valid answer exists.
            </div>
          </div>
        </div>

        {/* RIGHT: Editor & Console */}
        <div className="editor-area">
          <div className="tabs">
            <div className="tab active">Code</div>
            <div className="tab">Test Cases</div>
          </div>

          <div className="code-wrapper">
            <div className="line-numbers" id="line-numbers">1</div>
            <pre className="highlight-overlay" id="code-highlight"><code></code></pre>
            <textarea 
              ref={inputRef}
              className="code-input" 
              defaultValue={`var twoSum = function(nums, target) {
    // Write your solution here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
};`}
            ></textarea>
          </div>

          <div className="console-panel">
            <div className="console-header">Console</div>
            <div className="console-content" ref={consoleRef}>
              <div className="log-entry log-info">// Output will appear here...</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
