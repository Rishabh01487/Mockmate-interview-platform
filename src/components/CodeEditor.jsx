import React, { useState, useEffect, useRef } from 'react';

const Editor = () => {
  const [logs, setLogs] = useState([]);
  const consoleRef = useRef(null);
  const inputRef = useRef(null);

  // --- 1. Styles (LeetCode Aesthetic) ---
  const css = `
    :root {
      --leetcode-bg: #1e1e1e;
      --leetcode-panel: #252526;
      --leetcode-border: #3e3e42;
      --leetcode-text: #d4d4d4;
      --leetcode-accent: #007acc;
      --leetcode-success: #4caf50;
      --leetcode-error: #f44336;
      --keyword: #569cd6;
      --string: #ce9178;
      --number: #b5cea8;
      --comment: #6a9955;
      --function: #dcdcaa;
    }

    .editor-wrapper { 
      height: 100%; 
      background-color: var(--leetcode-bg); 
      color: var(--leetcode-text); 
      font-family: 'Consolas', 'Monaco', monospace; 
      font-size: 14px; 
      display: flex; 
      flex-direction: column; 
    }

    .code-area { 
      flex: 1; 
      position: relative; 
      display: flex; 
      overflow: hidden; 
    }

    .line-numbers { 
      width: 50px; 
      background-color: var(--leetcode-panel); 
      color: #858585; 
      text-align: right; 
      padding: 10px 5px; 
      border-right: 1px solid var(--leetcode-border); 
      user-select: none; 
      line-height: 1.5; 
    }

    .highlight-overlay { 
      position: absolute; 
      top: 0; 
      left: 0; 
      padding: 10px; 
      margin: 0; 
      white-space: pre; 
      color: transparent; 
      pointer-events: none; 
      z-index: 2; 
      width: 100%; 
      height: 100%; 
      overflow: auto; 
    }

    .code-input { 
      position: absolute; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%; 
      padding: 10px; 
      margin: 0; 
      border: none; 
      background: transparent; 
      color: var(--leetcode-text); 
      resize: none; 
      outline: none; 
      z-index: 1; 
      white-space: pre; 
      overflow: auto; 
      tab-size: 4; 
    }

    /* Syntax Colors */
    .token-keyword { color: var(--keyword); font-weight: bold; }
    .token-string { color: var(--string); }
    .token-number { color: var(--number); }
    .token-comment { color: var(--comment); font-style: italic; }
    .token-function { color: var(--function); }
  `;

  // --- 2. Syntax Highlighting Logic ---
  const highlightCode = (code) => {
    if (!code) return '';
    let html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

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

  // --- 3. Effects & Listeners ---
  useEffect(() => {
    const input = inputRef.current;
    const highlight = input.nextElementSibling;
    const lineNumbers = input.parentElement.previousElementSibling;

    if (!input || !highlight) return;

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

    // Tab Key Support
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

  // --- 4. Runner Logic (Simulated Debug) ---
  const runCode = () => {
    if (!consoleRef.current) return;
    consoleRef.current.innerHTML = '';
    setLogs([]);

    const code = inputRef.current.value;
    const originalLog = console.log;
    const logs = [];
    
    // Intercept console.log from the user code
    console.log = (...args) => {
      logs.push({ type: 'info', msg: args.join(' ') });
      originalLog.apply(console, args);
    };

    try {
      // Execute User Code safely
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

  return (
    <>
      <style>{css}</style>
      
      <div className="editor-wrapper">
        {/* --- Editor --- */}
        <div className="code-area">
          <div className="line-numbers" id="line-numbers">1</div>
          <pre className="highlight-overlay" id="code-highlight"></pre>
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

        {/* --- Console --- */}
        <div style={{ height: 200, backgroundColor: '#252526', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 20px', background: '#1e1e1e', fontSize: '13px', color: '#858585', fontWeight: 'bold' }}>
            Console
          </div>
          <div 
            style={{ flex: 1, padding: '10px 20px', fontSize: '13px', fontFamily: 'monospace', overflowY: 'auto', color: '#d4d4d4' }}
            ref={consoleRef}
          >
            <div className="log-entry log-info">// Output will appear here...</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Editor;
