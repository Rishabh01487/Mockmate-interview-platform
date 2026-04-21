import React, { useState, useRef, useEffect } from 'react';
import { chatCompletion, isOllamaOnline } from './services/ollamaService';

// ============================================================
// Verge1.o — Local Offline AI Assistant (Ollama LLaMa-3)
// ============================================================

const SYSTEM_PROMPT = `You are Verge1.o, an elite CS interview coach and technical assistant built into the MockMate platform. You are powered by a local LLaMa-3 neural network running on the user's own hardware.

Your personality:
- Precise, authoritative, and technically brilliant
- You give structured, actionable answers
- You use bullet points, code examples, and analogies when helpful
- You NEVER say "I'm just an AI" or apologize unnecessarily
- Keep answers focused — typically 3-8 paragraphs max unless the topic demands more

Your expertise covers:
- Data Structures & Algorithms (arrays, trees, graphs, DP, greedy, etc.)
- Operating Systems (scheduling, memory, concurrency, deadlocks)
- DBMS (SQL, normalization, indexing, transactions, CAP theorem)
- Computer Networks (TCP/IP, OSI, HTTP, DNS, TLS, WebSockets)
- Object-Oriented Programming (SOLID, design patterns, polymorphism)
- System Design (microservices, load balancing, caching, message queues)
- Web Development (React, Node.js, REST, auth, security)
- Core CS Theory (complexity, automata, compilers, computability)

When asked to generate practice questions, create real interview-caliber questions.
When asked to review code, analyze it like a senior engineer doing a code review.
When asked to explain concepts, teach like a world-class professor.`;

const INITIAL_MESSAGE = {
  id: 'init',
  from: 'bot',
  text: "Verge1.o online. Neural systems initialized.\n\nI am your local AI interview coach — powered by LLaMa-3 running directly on your hardware. Zero cloud dependency. Full privacy.\n\nI can help you with:\n• Deep CS concept explanations\n• Mock interview question generation\n• Code review & debugging\n• System design walkthroughs\n• Algorithm optimization strategies\n\nWhat would you like to work on?",
  ts: new Date(),
};

const SUGGESTED = [
  'Generate 5 hard DSA questions',
  'Explain deadlocks with examples',
  'Review my Two Sum solution',
  'Design a URL shortener',
  'ACID vs BASE properties',
  'What is the CAP theorem?',
];

// Fallback KB for when Ollama is offline
const OFFLINE_KB = [
  { pattern: /big.?o|time complexity|space complexity/i, answer: "Common Big-O complexities (best → worst):\n\n• O(1) — Constant: hash lookup, array access\n• O(log n) — Logarithmic: binary search\n• O(n) — Linear: linear search, traversal\n• O(n log n) — Merge sort, heap sort\n• O(n²) — Bubble/insertion sort (worst)\n• O(2ⁿ) — Exponential: naive recursion\n\n[Verge1.o Offline Mode — start Ollama for full AI responses]" },
  { pattern: /deadlock/i, answer: "Deadlock — 4 Necessary Conditions:\n\n1. Mutual Exclusion\n2. Hold & Wait\n3. No Preemption\n4. Circular Wait\n\nPrevention: break any one condition.\nAvoidance: Banker's Algorithm.\n\n[Verge1.o Offline Mode — start Ollama for full AI responses]" },
  { pattern: /acid/i, answer: "ACID Properties:\n\n• Atomicity: all-or-nothing\n• Consistency: valid state transitions\n• Isolation: concurrent txns don't interfere\n• Durability: committed data survives crashes\n\n[Verge1.o Offline Mode — start Ollama for full AI responses]" },
  { pattern: /tcp.*udp|udp.*tcp/i, answer: "TCP: Connection-oriented, reliable, ordered. Used for HTTP, email.\nUDP: Connectionless, fast, no guarantees. Used for DNS, gaming, streaming.\n\n[Verge1.o Offline Mode — start Ollama for full AI responses]" },
  { pattern: /solid/i, answer: "SOLID Principles:\n\n• S — Single Responsibility\n• O — Open/Closed\n• L — Liskov Substitution\n• I — Interface Segregation\n• D — Dependency Inversion\n\n[Verge1.o Offline Mode — start Ollama for full AI responses]" },
  { pattern: /cap theorem|cap\b/i, answer: "CAP Theorem: In a distributed system, pick 2 of 3:\n\n• Consistency — every read = latest write\n• Availability — every request gets a response\n• Partition Tolerance — survives network splits\n\nCP: MongoDB. AP: Cassandra. CA: Traditional RDBMS.\n\n[Verge1.o Offline Mode — start Ollama for full AI responses]" },
];

function getOfflineResponse(input) {
  for (const entry of OFFLINE_KB) {
    if (entry.pattern.test(input)) return entry.answer;
  }
  return "⚡ Verge1.o is in offline mode. I can only answer basic CS questions right now.\n\nTo unlock full AI capabilities:\n1. Open a terminal\n2. Navigate to your Ollama folder on F:\n3. Run: ollama serve\n4. In another terminal: ollama run llama3\n\nOnce Ollama is running, I'll connect automatically.";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [ollamaStatus, setOllamaStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Check Ollama connectivity on mount and periodically
  useEffect(() => {
    const check = async () => {
      const online = await isOllamaOnline();
      setOllamaStatus(online ? 'online' : 'offline');
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');

    const userMsg = { id: Date.now(), from: 'user', text: q, ts: new Date() };
    const history = [...messages, userMsg];
    setMessages(history);
    setTyping(true);

    try {
      if (ollamaStatus !== 'online') {
        // Try one more time in case it just came online
        const online = await isOllamaOnline();
        if (online) {
          setOllamaStatus('online');
        } else {
          throw new Error('offline');
        }
      }

      // Build conversation history for Ollama
      const ollamaMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
          .filter(m => m.id !== 'init')
          .map(m => ({
            role: m.from === 'bot' ? 'assistant' : 'user',
            content: m.text
          }))
      ];

      const answer = await chatCompletion(ollamaMessages, { temperature: 0.7 });
      const botMsg = { id: Date.now() + 1, from: 'bot', text: answer || 'No response generated.', ts: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      // Fallback to offline KB
      const fallback = getOfflineResponse(q);
      const botMsg = { id: Date.now() + 1, from: 'bot', text: fallback, ts: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setOllamaStatus('offline');
    }

    setTyping(false);
    if (!open) setUnread(u => u + 1);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatText = (text) =>
    text.split('\n').map((line, i) => <span key={i}>{line}<br /></span>);

  const statusColor = ollamaStatus === 'online' ? '#22c55e' : ollamaStatus === 'checking' ? '#eab308' : '#ef4444';
  const statusLabel = ollamaStatus === 'online' ? 'LLaMa-3 Online' : ollamaStatus === 'checking' ? 'Connecting...' : 'Offline Mode';

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chatbot-toggle"
        className="cb-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Verge1.o' : 'Open Verge1.o'}
        aria-expanded={open}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!open && unread > 0 && <span className="cb-unread">{unread}</span>}
        {!open && <span className="cb-toggle-label">Verge1.o</span>}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="cb-window" role="dialog" aria-label="Verge1.o AI Assistant">
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-info">
              <div className="cb-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="cb-header-name">Verge1.o</div>
                <div className="cb-header-status">
                  <span className="cb-status-dot" style={{ background: statusColor }}></span>
                  {statusLabel}
                </div>
              </div>
            </div>
            <button className="cb-close" id="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="cb-messages" role="log" aria-live="polite">
            {messages.map(msg => (
              <div key={msg.id} className={`cb-msg cb-msg--${msg.from}`}>
                {msg.from === 'bot' && (
                  <div className="cb-msg-avatar">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    </svg>
                  </div>
                )}
                <div className="cb-msg-bubble">
                  <div className="cb-msg-text">{formatText(msg.text)}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="cb-msg cb-msg--bot">
                <div className="cb-msg-avatar">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  </svg>
                </div>
                <div className="cb-msg-bubble cb-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && !typing && (
            <div className="cb-suggestions">
              {SUGGESTED.map((s, i) => (
                <button key={i} className="cb-suggestion" id={`cb-suggest-${i}`} onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="cb-input-area">
            <textarea
              ref={inputRef}
              id="chatbot-input"
              className="cb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={ollamaStatus === 'online' ? "Ask Verge1.o anything..." : "Verge1.o (offline mode)..."}
              rows={1}
              aria-label="Type your question"
            />
            <button
              id="chatbot-send"
              className="cb-send"
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              aria-label="Send message"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
