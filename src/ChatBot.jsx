import React, { useState, useRef, useEffect } from 'react';

// ============================================================
// CS Engineering Chatbot — knowledge base
// ============================================================
const KB = [
  // Greetings
  { pattern: /^(hi|hello|hey|hiya|sup|yo)/i, answer: "Hey! I'm MockMate's CS assistant. Ask me anything about DSA, Operating Systems, DBMS, Computer Networks, OOP, System Design, or any other CS topic." },
  { pattern: /how are you/i, answer: "I'm an AI assistant, so I'm always ready to help you crack that CS interview! What topic do you want to discuss?" },
  { pattern: /what can you do|help/i, answer: "I can answer questions on:\n\n• Data Structures & Algorithms\n• Operating Systems\n• DBMS & SQL\n• Computer Networks\n• Object-Oriented Programming\n• System Design\n• Web Development concepts\n• Core CS Theory\n\nJust ask me anything!" },

  // DSA
  { pattern: /time complexity.*hash|hash.*time complexity/i, answer: "Hash table operations:\n\n• Insert: O(1) average, O(n) worst\n• Search: O(1) average, O(n) worst\n• Delete: O(1) average, O(n) worst\n\nWorst case happens when all keys hash to the same bucket (poor hash function or high load factor)." },
  { pattern: /big.?o|time complexity|space complexity/i, answer: "Common Big-O complexities (best to worst):\n\n• O(1) — Constant: hash lookup, array access\n• O(log n) — Logarithmic: binary search, BST ops\n• O(n) — Linear: linear search, traversal\n• O(n log n) — Merge sort, heap sort\n• O(n²) — Bubble/insertion sort (worst)\n• O(2ⁿ) — Exponential: naive recursion" },
  { pattern: /binary search/i, answer: "Binary Search:\n\n• Works on sorted arrays\n• Compare target with mid, eliminate half\n• Time: O(log n), Space: O(1) iterative\n• Prerequisite: array must be sorted\n\nCode logic:\n1. lo=0, hi=n-1\n2. mid=(lo+hi)/2\n3. If arr[mid]==target → found\n4. If arr[mid]<target → lo=mid+1\n5. Else → hi=mid-1" },
  { pattern: /linked.?list/i, answer: "Linked List vs Array:\n\n• LL: O(1) insert/delete at head, O(n) access by index\n• Array: O(1) random access, O(n) insert/delete\n\nTypes:\n• Singly linked: each node → next\n• Doubly linked: each node ↔ prev & next\n• Circular: last node → head\n\nUse LL when you need frequent insertions/deletions and don't need random access." },
  { pattern: /dynamic programming|dp\b/i, answer: "Dynamic Programming:\n\n• Solves problems with overlapping subproblems + optimal substructure\n• Two approaches:\n  1. Memoization (top-down): Recursion + cache\n  2. Tabulation (bottom-up): Fill table iteratively\n\nClassic examples:\n• Fibonacci: dp[n] = dp[n-1] + dp[n-2]\n• Knapsack, LCS, Edit Distance\n\nKey: identify the subproblem and recurrence relation." },
  { pattern: /quicksort|quick sort/i, answer: "Quick Sort:\n\n• Divide & conquer, pick a pivot, partition\n• Average: O(n log n), Worst: O(n²) (sorted array with bad pivot)\n• In-place (O(log n) stack space), not stable\n• Fastest in practice due to cache efficiency\n\nTo avoid worst case: random pivot or median-of-three strategy." },
  { pattern: /merge.?sort/i, answer: "Merge Sort:\n\n• Divide array in half, sort each half, merge\n• Time: O(n log n) always (best, avg, worst)\n• Space: O(n) extra — not in-place\n• Stable sort\n• Preferred for linked lists, external sorting, when stability matters" },
  { pattern: /tree|bst|binary search tree/i, answer: "Binary Search Tree:\n\n• Left child < parent < right child\n• Average: O(log n) for search/insert/delete\n• Worst case (skewed): O(n)\n\nSelf-balancing BSTs:\n• AVL Tree: strict balance, O(log n) guaranteed\n• Red-Black Tree: relaxed balance (used in std::map)\n• Splay Tree: recently accessed nodes at root" },
  { pattern: /graph|bfs|dfs/i, answer: "Graph Traversals:\n\nBFS (Breadth-First Search):\n• Uses a queue, level-by-level\n• Shortest path in unweighted graph\n• Time: O(V+E)\n\nDFS (Depth-First Search):\n• Uses stack/recursion\n• Cycle detection, topological sort\n• Time: O(V+E)\n\nDijkstra for shortest path in weighted graphs (no negative edges)." },
  { pattern: /heap|priority queue/i, answer: "Heap / Priority Queue:\n\n• Min-heap: parent ≤ children (min at root)\n• Max-heap: parent ≥ children (max at root)\n• Operations: O(log n) insert, O(log n) delete, O(1) peek\n• Built from array: heapify in O(n)\n• Used in: Dijkstra, Heap Sort, event simulation, Top-K elements" },

  // OS
  { pattern: /deadlock/i, answer: "Deadlock — 4 Necessary Conditions:\n\n1. Mutual Exclusion: resource held by ≤1 process\n2. Hold & Wait: holding resource while waiting for another\n3. No Preemption: resources can't be forcibly taken\n4. Circular Wait: P1 waits for P2, P2 waits for P1...\n\nPrevention: break any one condition\nAvoidance: Banker's Algorithm\nDetection: resource allocation graph + recovery" },
  { pattern: /virtual memory|paging|page fault/i, answer: "Virtual Memory:\n\n• Lets processes use more memory than physical RAM\n• Pages swapped between RAM and disk as needed\n• Page fault: page not in RAM → OS loads from disk\n\nPaging:\n• Fixed-size pages (typically 4KB)\n• Page Table maps virtual → physical addresses\n• TLB (Translation Lookaside Buffer) caches recent translations\n\nAdvantages: memory isolation, protection, run programs larger than RAM" },
  { pattern: /process.*thread|thread.*process/i, answer: "Process vs Thread:\n\nProcess:\n• Independent program with own memory space\n• PCB stores state (registers, PC, memory maps)\n• Heavyweight — fork() is expensive\n• IPC needed for communication\n\nThread:\n• Lightweight unit within a process\n• Shares heap, code, globals with other threads\n• Own stack and registers\n• Faster creation, communicate via shared memory\n• Risk: race conditions, need synchronization" },
  { pattern: /semaphore|mutex/i, answer: "Semaphore vs Mutex:\n\nMutex:\n• Binary lock (locked/unlocked)\n• Only the owner thread can unlock it\n• Used for mutual exclusion\n\nSemaphore:\n• Integer counter\n• wait(P): decrement, block if negative\n• signal(V): increment, wake blocked process\n• Binary semaphore ≈ mutex but any thread can signal\n• Counting semaphore: controls access to N resources\n\nKey difference: mutex has ownership; semaphore is a signaling mechanism" },
  { pattern: /schedulin|fcfs|sjf|round.?robin/i, answer: "CPU Scheduling Algorithms:\n\n• FCFS: Simple, FIFO, causes convoy effect\n• SJF: Optimal avg wait, needs burst time, starvation possible\n• Round Robin: Time quantum per process, fair, good for time-sharing\n• Priority: Higher priority first, starvation — fix with aging\n• MLFQ: Multiple queues with different priorities\n\nMetrics: Throughput, Turnaround Time, Waiting Time, Response Time" },

  // DBMS
  { pattern: /acid/i, answer: "ACID Properties:\n\n• Atomicity: all-or-nothing (rollback on failure)\n• Consistency: DB moves between valid states\n• Isolation: concurrent transactions don't interfere\n• Durability: committed data survives crashes (WAL, journaling)\n\nRelaxing isolation gives levels:\nRead Uncommitted < Read Committed < Repeatable Read < Serializable" },
  { pattern: /normalization|1nf|2nf|3nf|bcnf/i, answer: "Database Normalization:\n\n• 1NF: Atomic values, no repeating groups, unique rows\n• 2NF: 1NF + no partial dependencies on composite PK\n• 3NF: 2NF + no transitive dependencies (non-key → non-key)\n• BCNF: Every determinant is a candidate key\n\nGoal: eliminate redundancy, prevent anomalies (insert/update/delete)\nDenormalization: sometimes done for performance (read-heavy systems)" },
  { pattern: /sql.*join|join.*sql|inner join|left join|right join/i, answer: "SQL JOINs:\n\n• INNER JOIN: matching rows in both tables\n• LEFT JOIN: all from left + matching from right (NULL if none)\n• RIGHT JOIN: all from right + matching from left\n• FULL OUTER JOIN: all rows from both, NULL where no match\n• CROSS JOIN: cartesian product (every row × every row)\n• SELF JOIN: table joined with itself\n\nExample:\nSELECT e.name, d.name\nFROM employees e\nINNER JOIN departments d ON e.dept_id = d.id" },
  { pattern: /cap theorem|cap\b/i, answer: "CAP Theorem:\n\nIn a distributed system, you can only guarantee 2 of 3:\n\n• Consistency (C): every read gets latest write\n• Availability (A): every request gets a response\n• Partition Tolerance (P): works despite network splits\n\nSince network partitions always happen:\n• CP: MongoDB, HBase (trades availability)\n• AP: Cassandra, CouchDB (trades consistency)\n• CA: traditional single-node RDBMS (no partition tolerance)" },
  { pattern: /index|indexing/i, answer: "Database Indexes:\n\n• Speed up SELECT queries; slow down INSERT/UPDATE/DELETE\n• Clustered index: physically reorders table data (one per table)\n• Non-clustered: separate structure pointing to rows (many per table)\n• Composite index: multiple columns (order matters!)\n• Covering index: query satisfied from index alone\n\nWhen to index:\n✓ Frequently filtered/sorted columns\n✓ Foreign keys\n✗ Small tables, frequently updated columns, low-selectivity columns" },

  // Computer Networks
  { pattern: /osi|tcp\/ip model/i, answer: "OSI Model (7 Layers):\n\n7. Application — HTTP, FTP, DNS, SMTP\n6. Presentation — Encryption, compression\n5. Session — Session management\n4. Transport — TCP, UDP, ports\n3. Network — IP, routing (routers)\n2. Data Link — MAC, Ethernet (switches)\n1. Physical — Bits over cable/wireless\n\nTCP/IP (4 Layers):\n4. Application (OSI 5-7)\n3. Transport\n2. Internet (OSI 3)\n1. Network Access (OSI 1-2)" },
  { pattern: /tcp.*udp|udp.*tcp/i, answer: "TCP vs UDP:\n\nTCP:\n• Connection-oriented (3-way handshake)\n• Reliable, ordered delivery, ACK\n• Flow control, congestion control\n• Use: HTTP, HTTPS, email, file transfer\n\nUDP:\n• Connectionless, no guarantees\n• Fast, low overhead\n• Use: DNS, VoIP, gaming, video streaming\n• You handle reliability at the app layer if needed" },
  { pattern: /dns/i, answer: "DNS (Domain Name System):\n\n• Translates domain names → IP addresses\n• Hierarchy: Root → TLD (com/org) → Authoritative\n• Resolution: Browser cache → OS cache → Recursive resolver → Root → TLD → Auth\n• Record types:\n  A: domain → IPv4\n  AAAA: domain → IPv6\n  CNAME: alias\n  MX: mail server\n  NS: nameserver\n• UDP port 53 (TCP for large responses)" },
  { pattern: /http.*https|https|ssl|tls/i, answer: "HTTP vs HTTPS / TLS:\n\n• HTTP: plaintext, port 80\n• HTTPS: HTTP + TLS encryption, port 443\n\nTLS Handshake:\n1. Client Hello (cipher suites)\n2. Server Hello + Certificate\n3. Key Exchange (asymmetric crypto for session key)\n4. Session established (symmetric encryption)\n\n• Certificate verified by trusted CA\n• HSTS forces HTTPS\n• HTTP/2 requires TLS in practice" },
  { pattern: /three.?way handshake|syn.*ack/i, answer: "TCP 3-Way Handshake:\n\n1. Client → Server: SYN (seq=x)\n2. Server → Client: SYN-ACK (seq=y, ack=x+1)\n3. Client → Server: ACK (ack=y+1)\nConnection established!\n\n4-Way Termination:\n1. FIN from initiator\n2. ACK from receiver\n3. FIN from receiver\n4. ACK from initiator" },

  // OOP
  { pattern: /solid/i, answer: "SOLID Principles:\n\n• S — Single Responsibility: one class, one reason to change\n• O — Open/Closed: open for extension, closed for modification\n• L — Liskov Substitution: subclass must be usable where parent is expected\n• I — Interface Segregation: don't force clients to implement unused methods\n• D — Dependency Inversion: depend on abstractions, not concrete classes\n\nMemory tip: SOLID makes code maintainable, testable, and scalable." },
  { pattern: /inherit|polymorphism|encapsulation|abstraction|oop pillar/i, answer: "4 Pillars of OOP:\n\n1. Encapsulation: bundling data + methods, hiding internals (private fields)\n2. Abstraction: expose only what's needed, hide complexity (interfaces)\n3. Inheritance: child class extends parent, reuses behavior\n4. Polymorphism:\n   • Compile-time (overloading): same name, different params\n   • Runtime (overriding): subclass redefines parent method via dynamic dispatch" },
  { pattern: /design pattern|singleton|factory|observer/i, answer: "Common Design Patterns:\n\nCreational:\n• Singleton: one instance globally (DB connection, Logger)\n• Factory: create objects without specifying class (loose coupling)\n• Builder: step-by-step object construction\n\nStructural:\n• Adapter: makes incompatible interfaces work together\n• Decorator: add behavior dynamically\n\nBehavioral:\n• Observer: pub/sub, notify multiple objects of state change\n• Strategy: swap algorithms at runtime\n• Command: encapsulate request as object" },

  // System Design
  { pattern: /load.?balanc/i, answer: "Load Balancer:\n\n• Distributes traffic across multiple servers\n• Algorithms:\n  - Round Robin: rotate through servers\n  - Least Connections: route to least busy server\n  - IP Hash: sticky sessions (same client → same server)\n  - Weighted Round Robin: high-capacity servers get more traffic\n\n• Layer 4 (TCP level) vs Layer 7 (HTTP level — smarter routing)\n• Examples: Nginx, HAProxy, AWS ELB" },
  { pattern: /cach(e|ing)/i, answer: "Caching Strategies:\n\n• Cache-aside (Lazy): app checks cache, on miss loads from DB then caches\n• Write-through: write to cache AND DB simultaneously\n• Write-back: write to cache, async write to DB (risk: data loss)\n• Read-through: cache handles reads from DB automatically\n\nEviction Policies:\n• LRU (Least Recently Used) — most common\n• LFU (Least Frequently Used)\n• FIFO\n\nTools: Redis (rich data types), Memcached (simpler, faster)" },
  { pattern: /microservice/i, answer: "Microservices vs Monolith:\n\nMonolith:\n✓ Simple to develop, deploy, test initially\n✗ Hard to scale specific parts, risky deployments\n\nMicroservices:\n✓ Independent scaling, team autonomy, tech flexibility, fault isolation\n✗ Distributed systems complexity, network latency, service discovery, distributed tracing\n\nWhen to migrate: when monolith is hard to scale or slowing teams down.\nTools: Docker, Kubernetes, service meshes (Istio), API Gateway" },
  { pattern: /rate.?limit/i, answer: "Rate Limiting Algorithms:\n\n• Token Bucket: tokens added at fixed rate, requests consume tokens. Allows bursts.\n• Leaky Bucket: requests fill a queue, processed at constant rate. Smooth output.\n• Fixed Window: count requests per minute window. Burst at boundaries.\n• Sliding Window Log: precise but memory intensive\n• Sliding Window Counter: approximate but efficient\n\nImplementation: Redis INCR + EXPIRE for distributed rate limiting\nUse case: API protection, preventing DDoS, fair usage" },

  // Web Dev
  { pattern: /event.?loop|call.?stack|microtask|macrotask/i, answer: "JavaScript Event Loop:\n\n1. Call Stack: runs synchronous code (LIFO)\n2. Web APIs: async operations (setTimeout, fetch)\n3. Microtask Queue: Promises (.then), queueMicrotask\n4. Task Queue (Macrotask): setTimeout, setInterval, DOM events\n\nOrder:\n1. Execute all synchronous code\n2. Drain entire microtask queue\n3. Take ONE task from macrotask queue\n4. Repeat\n\nSo: console.log > Promise.then > setTimeout" },
  { pattern: /jwt|json web token|auth/i, answer: "JWT Authentication:\n\nStructure: Header.Payload.Signature (base64 encoded)\n\nFlow:\n1. User logs in → Server creates JWT (signs with secret)\n2. Client stores JWT (localStorage or HttpOnly cookie)\n3. Client sends JWT in Authorization: Bearer <token> header\n4. Server verifies signature, reads payload\n\n✓ Stateless — no session storage on server\n✗ Cannot be invalidated before expiry\n\nBest practice:\n• Short expiry (15min) + Refresh tokens\n• Store in HttpOnly cookies to prevent XSS" },
  { pattern: /cors/i, answer: "CORS (Cross-Origin Resource Sharing):\n\n• Browser blocks requests to different origin (domain/port/protocol) by default\n• Server must include: Access-Control-Allow-Origin: * (or specific domain)\n\nPreflight (OPTIONS) request sent for:\n• Non-GET/POST methods\n• Custom headers\n• Non-simple content types\n\nOn the server (Express):\napp.use(cors({ origin: 'https://myapp.com' }))\n\nCORS is a browser-enforced policy — server-to-server requests are not affected." },
  { pattern: /xss|csrf|sql injection|security/i, answer: "Web Security:\n\nXSS (Cross-Site Scripting):\n• Inject malicious scripts into web pages\n• Prevention: escape output, CSP headers, HttpOnly cookies\n\nCSRF (Cross-Site Request Forgery):\n• Tricks user into making unauthorized request\n• Prevention: CSRF tokens, SameSite cookie attribute\n\nSQL Injection:\n• Inject SQL via user input\n• Prevention: prepared statements / parameterized queries, ORMs\n\nSecurity headers:\n• Content-Security-Policy, X-Frame-Options, HSTS" },

  // General CS
  { pattern: /p vs np|np.?complete|np.?hard/i, answer: "P vs NP:\n\n• P: problems solvable in polynomial time (O(nᵏ))\n• NP: problems verifiable in polynomial time\n• NP-Complete: hardest in NP; solvable by reducing any NP problem to it\n• NP-Hard: at least as hard as NP-Complete (may not be in NP)\n\nIf P=NP: encryption, cryptography would break!\nExample NP-Complete problems: SAT, Travelling Salesman, Graph Coloring\n\nPractical approach: use approximation algorithms or heuristics." },
  { pattern: /compiler|interpreter|jit/i, answer: "Compiler vs Interpreter:\n\nCompiler:\n• Translates entire source → machine code before execution\n• Fast execution, needs compile step\n• Examples: C, C++, Rust, Go\n\nInterpreter:\n• Executes line-by-line at runtime\n• Slower, easier debugging, platform-independent\n• Examples: Python, Ruby, PHP\n\nJIT (Just-In-Time):\n• Compiles at runtime (hot paths)\n• Best of both worlds: Java (JVM), JavaScript (V8), .NET" },

  // Fallback
  { pattern: /.+/, answer: "That's a great question! I may not have an exact answer in my knowledge base, but here's what I suggest:\n\n1. Use the **Mock Interview** feature to practice questions on that topic\n2. Try searching for it in your study resources\n3. Ask me a more specific CS topic like 'explain deadlock', 'what is Big O', 'how does DNS work', etc.\n\nTopics I know well: DSA, OS, DBMS, Computer Networks, OOP, System Design, Web Development." }
];

function getResponse(input) {
  const text = input.trim();
  for (const entry of KB) {
    if (entry.pattern.test(text)) return entry.answer;
  }
  return KB[KB.length - 1].answer;
}

// ============================================================
// ChatBot Component
// ============================================================
const INITIAL_MESSAGE = {
  id: 'init',
  from: 'bot',
  text: "Hi! I'm MockMate's CS assistant.\n\nAsk me anything about:\n• Data Structures & Algorithms\n• Operating Systems\n• DBMS & SQL\n• Computer Networks\n• OOP & Design Patterns\n• System Design\n• Web Development\n\nType a question to get started!",
  ts: new Date(),
};

const SUGGESTED = [
  'Explain Big O notation',
  'What is a deadlock?',
  'ACID properties',
  'TCP vs UDP',
  'SOLID principles',
  'What is caching?',
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');

    const userMsg = { id: Date.now(), from: 'user', text: q, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    setTimeout(() => {
      const answer = getResponse(q);
      const botMsg = { id: Date.now() + 1, from: 'bot', text: answer, ts: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
      if (!open) setUnread(u => u + 1);
    }, 700 + Math.random() * 400);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatText = (text) =>
    text.split('\n').map((line, i) => <span key={i}>{line}<br /></span>);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chatbot-toggle"
        className="cb-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close CS assistant' : 'Open CS assistant'}
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
        {!open && <span className="cb-toggle-label">CS Assistant</span>}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="cb-window" role="dialog" aria-label="CS Interview Assistant">
          {/* Header */}
          <div className="cb-header">
            <div className="cb-header-info">
              <div className="cb-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div className="cb-header-name">CS Assistant</div>
                <div className="cb-header-status">
                  <span className="cb-status-dot"></span>
                  Knows DSA, OS, DBMS, CN, OOP & more
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
              placeholder="Ask a CS question..."
              rows={1}
              aria-label="Type your CS question"
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
