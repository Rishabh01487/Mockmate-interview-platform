/**
 * MockMate AI — Seed Training Data
 * ==================================
 * Generates 500+ training samples from existing question bank
 * and realistic AI prompt/response patterns.
 *
 * Usage:
 *   cd backend
 *   node scripts/seedTrainingData.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const TrainingData = require('../models/TrainingDataSchema');

// ── All CS domains and their topics ──
const DOMAINS = {
  dsa: {
    label: 'Data Structures & Algorithms',
    topics: ['arrays', 'linked-lists', 'stacks', 'queues', 'trees', 'graphs', 'dynamic-programming', 'sorting', 'searching', 'hash-maps', 'heaps', 'tries', 'recursion', 'backtracking', 'greedy', 'bit-manipulation', 'two-pointers', 'sliding-window', 'binary-search', 'divide-and-conquer'],
    questions: [
      { q: 'What is a binary search tree? How does it differ from a regular binary tree?', d: 'Easy' },
      { q: 'Explain the time complexity of quicksort in best, average, and worst cases.', d: 'Medium' },
      { q: 'What is dynamic programming? Give an example with memoization vs tabulation.', d: 'Medium' },
      { q: 'How does a hash map handle collisions? Compare chaining vs open addressing.', d: 'Medium' },
      { q: 'What is the difference between BFS and DFS? When would you use each?', d: 'Easy' },
      { q: 'Explain Dijkstra\'s algorithm. What is its time complexity?', d: 'Hard' },
      { q: 'What is a heap? How is it implemented using an array?', d: 'Medium' },
      { q: 'What are the different types of balanced BSTs? Compare AVL and Red-Black trees.', d: 'Hard' },
      { q: 'Explain the concept of amortized analysis with an example.', d: 'Hard' },
      { q: 'What is a trie? How is it used for autocomplete features?', d: 'Medium' },
      { q: 'What is the two-pointer technique? Give an example problem.', d: 'Easy' },
      { q: 'Explain the sliding window technique with an example.', d: 'Medium' },
      { q: 'What is topological sorting? When is it used?', d: 'Medium' },
      { q: 'Compare merge sort and quick sort. Which is better for linked lists?', d: 'Medium' },
      { q: 'What is a segment tree? When would you use it?', d: 'Hard' },
    ]
  },
  os: {
    label: 'Operating Systems',
    topics: ['processes', 'threads', 'scheduling', 'memory-management', 'virtual-memory', 'deadlocks', 'file-systems', 'synchronization', 'paging', 'segmentation', 'IPC', 'system-calls'],
    questions: [
      { q: 'What is the difference between a process and a thread?', d: 'Easy' },
      { q: 'Explain the different CPU scheduling algorithms.', d: 'Medium' },
      { q: 'What is a deadlock? What are the four necessary conditions?', d: 'Medium' },
      { q: 'Explain virtual memory and how paging works.', d: 'Medium' },
      { q: 'What is thrashing? How can it be prevented?', d: 'Hard' },
      { q: 'Compare preemptive vs non-preemptive scheduling.', d: 'Easy' },
      { q: 'What are semaphores? How do they differ from mutexes?', d: 'Medium' },
      { q: 'Explain the producer-consumer problem and its solutions.', d: 'Medium' },
      { q: 'What is a page fault? How does the OS handle it?', d: 'Medium' },
      { q: 'What are system calls? Give examples for file operations.', d: 'Easy' },
      { q: 'Explain the Banker\'s algorithm for deadlock avoidance.', d: 'Hard' },
      { q: 'What is the difference between internal and external fragmentation?', d: 'Easy' },
      { q: 'Explain the dining philosophers problem.', d: 'Hard' },
      { q: 'What is a context switch? What overhead does it incur?', d: 'Medium' },
      { q: 'Compare monolithic vs microkernel architectures.', d: 'Hard' },
    ]
  },
  dbms: {
    label: 'Database Management Systems',
    topics: ['SQL', 'normalization', 'transactions', 'ACID', 'indexing', 'joins', 'ER-diagrams', 'NoSQL', 'concurrency', 'recovery', 'views', 'triggers'],
    questions: [
      { q: 'What is normalization? Explain 1NF, 2NF, 3NF, and BCNF.', d: 'Medium' },
      { q: 'What are ACID properties in database transactions?', d: 'Easy' },
      { q: 'Explain different types of joins with examples.', d: 'Medium' },
      { q: 'What is indexing? Compare B-tree and hash indexing.', d: 'Medium' },
      { q: 'What is a deadlock in DBMS? How is it resolved?', d: 'Hard' },
      { q: 'Explain the difference between SQL and NoSQL databases.', d: 'Easy' },
      { q: 'What is a transaction? Explain commit, rollback, and savepoint.', d: 'Medium' },
      { q: 'What is a view? How does it differ from a table?', d: 'Easy' },
      { q: 'Explain concurrency control mechanisms in DBMS.', d: 'Hard' },
      { q: 'What is denormalization? When should you use it?', d: 'Medium' },
      { q: 'What are triggers? Give an example use case.', d: 'Medium' },
      { q: 'Explain the two-phase locking protocol.', d: 'Hard' },
      { q: 'What is a clustered vs non-clustered index?', d: 'Medium' },
      { q: 'Explain the CAP theorem for distributed databases.', d: 'Hard' },
      { q: 'What are stored procedures? How do they differ from functions?', d: 'Easy' },
    ]
  },
  cn: {
    label: 'Computer Networks',
    topics: ['OSI-model', 'TCP/IP', 'HTTP', 'DNS', 'routing', 'subnetting', 'firewalls', 'SSL/TLS', 'sockets', 'ARP', 'DHCP', 'NAT'],
    questions: [
      { q: 'Explain the OSI model and its 7 layers.', d: 'Easy' },
      { q: 'What is the difference between TCP and UDP?', d: 'Easy' },
      { q: 'How does DNS resolution work?', d: 'Medium' },
      { q: 'What is subnetting? Calculate the subnet for 192.168.1.0/24.', d: 'Medium' },
      { q: 'Explain the three-way handshake in TCP.', d: 'Easy' },
      { q: 'What is HTTP/2? How does it improve over HTTP/1.1?', d: 'Medium' },
      { q: 'What is NAT? Why is it needed?', d: 'Medium' },
      { q: 'Explain how HTTPS/SSL/TLS works.', d: 'Medium' },
      { q: 'What is the difference between hub, switch, and router?', d: 'Easy' },
      { q: 'Explain congestion control mechanisms in TCP.', d: 'Hard' },
      { q: 'What is ARP? How does it resolve IP to MAC addresses?', d: 'Medium' },
      { q: 'What is DHCP? How does automatic IP assignment work?', d: 'Easy' },
      { q: 'Explain different routing protocols (RIP, OSPF, BGP).', d: 'Hard' },
      { q: 'What is a VLAN? Why is it used?', d: 'Medium' },
      { q: 'What is the difference between IPv4 and IPv6?', d: 'Easy' },
    ]
  },
  oop: {
    label: 'Object-Oriented Programming',
    topics: ['inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'design-patterns', 'SOLID', 'interfaces', 'composition', 'classes', 'objects'],
    questions: [
      { q: 'Explain the four pillars of OOP.', d: 'Easy' },
      { q: 'What is the difference between abstract class and interface?', d: 'Medium' },
      { q: 'Explain the SOLID principles with examples.', d: 'Hard' },
      { q: 'What is polymorphism? Compare compile-time and runtime polymorphism.', d: 'Medium' },
      { q: 'What is the diamond problem in multiple inheritance? How is it resolved?', d: 'Hard' },
      { q: 'Explain the factory design pattern with an example.', d: 'Medium' },
      { q: 'What is composition vs inheritance? When should you use each?', d: 'Medium' },
      { q: 'What is encapsulation? How does it achieve data hiding?', d: 'Easy' },
      { q: 'Explain the singleton design pattern. When is it used?', d: 'Medium' },
      { q: 'What is method overloading vs method overriding?', d: 'Easy' },
      { q: 'Explain the observer pattern with a real-world example.', d: 'Hard' },
      { q: 'What is dependency injection? Why is it useful?', d: 'Medium' },
      { q: 'Compare shallow copy vs deep copy of objects.', d: 'Medium' },
      { q: 'What is the Liskov Substitution Principle?', d: 'Hard' },
      { q: 'Explain the strategy pattern vs template method pattern.', d: 'Hard' },
    ]
  },
  systemdesign: {
    label: 'System Design',
    topics: ['scalability', 'load-balancing', 'caching', 'microservices', 'databases', 'message-queues', 'CDN', 'API-design', 'rate-limiting', 'sharding'],
    questions: [
      { q: 'How would you design a URL shortening service like bit.ly?', d: 'Medium' },
      { q: 'Explain horizontal vs vertical scaling.', d: 'Easy' },
      { q: 'How does a load balancer work? Compare L4 vs L7.', d: 'Medium' },
      { q: 'What is caching? Compare Redis vs Memcached.', d: 'Medium' },
      { q: 'How would you design a chat application like WhatsApp?', d: 'Hard' },
      { q: 'What is a CDN? How does it improve performance?', d: 'Easy' },
      { q: 'Explain microservices vs monolithic architecture.', d: 'Medium' },
      { q: 'How would you design a rate limiter?', d: 'Medium' },
      { q: 'What is database sharding? What are its challenges?', d: 'Hard' },
      { q: 'How would you design Twitter\'s news feed?', d: 'Hard' },
      { q: 'What is eventual consistency vs strong consistency?', d: 'Medium' },
      { q: 'How would you design a distributed file storage system?', d: 'Hard' },
      { q: 'Explain API pagination strategies.', d: 'Easy' },
      { q: 'What is a message queue? Compare Kafka vs RabbitMQ.', d: 'Medium' },
      { q: 'How would you design an autocomplete system?', d: 'Hard' },
    ]
  },
  webdev: {
    label: 'Web Development',
    topics: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'REST-API', 'authentication', 'WebSockets', 'SEO', 'performance', 'security'],
    questions: [
      { q: 'What is the difference between var, let, and const in JavaScript?', d: 'Easy' },
      { q: 'Explain the virtual DOM in React. How does it improve performance?', d: 'Medium' },
      { q: 'What is CORS? Why does it exist and how do you handle it?', d: 'Medium' },
      { q: 'Explain JWT authentication. How does it work?', d: 'Medium' },
      { q: 'What are WebSockets? How do they differ from HTTP?', d: 'Medium' },
      { q: 'What is the event loop in JavaScript?', d: 'Medium' },
      { q: 'Explain REST vs GraphQL APIs.', d: 'Medium' },
      { q: 'What is server-side rendering (SSR) vs client-side rendering (CSR)?', d: 'Medium' },
      { q: 'How does the browser render a webpage? (Critical rendering path)', d: 'Hard' },
      { q: 'What are Web Workers? When would you use them?', d: 'Hard' },
      { q: 'Explain the box model in CSS.', d: 'Easy' },
      { q: 'What is XSS? How do you prevent it?', d: 'Medium' },
      { q: 'What is lazy loading? How does it improve performance?', d: 'Easy' },
      { q: 'Explain closures in JavaScript with an example.', d: 'Medium' },
      { q: 'What is the difference between cookies, localStorage, and sessionStorage?', d: 'Easy' },
    ]
  },
  corecs: {
    label: 'Core CS Theory',
    topics: ['complexity', 'automata', 'compilers', 'discrete-math', 'number-theory', 'logic', 'computability', 'information-theory'],
    questions: [
      { q: 'What is P vs NP? Why is it important?', d: 'Hard' },
      { q: 'Explain Big-O, Big-Theta, and Big-Omega notation.', d: 'Easy' },
      { q: 'What is a finite automaton? Compare DFA and NFA.', d: 'Medium' },
      { q: 'What are the phases of a compiler?', d: 'Medium' },
      { q: 'Explain the halting problem and its significance.', d: 'Hard' },
      { q: 'What is a regular expression? Give examples.', d: 'Easy' },
      { q: 'What is a context-free grammar? Give an example.', d: 'Medium' },
      { q: 'Explain the difference between NP-hard and NP-complete.', d: 'Hard' },
      { q: 'What is the Chomsky hierarchy?', d: 'Hard' },
      { q: 'What is a Turing machine? How does it relate to computability?', d: 'Hard' },
      { q: 'Explain Boolean algebra and its applications in CS.', d: 'Easy' },
      { q: 'What are pushdown automata? How do they differ from finite automata?', d: 'Medium' },
      { q: 'Explain lexical analysis in compiler design.', d: 'Medium' },
      { q: 'What is the Church-Turing thesis?', d: 'Hard' },
      { q: 'Explain space complexity vs time complexity with examples.', d: 'Easy' },
    ]
  }
};

// ── Answer templates for realistic training data ──
function generateAnswer(domain, question, difficulty) {
  const depth = difficulty === 'Easy' ? 'brief' : difficulty === 'Medium' ? 'detailed' : 'comprehensive';
  const answers = {
    brief: `This is a fundamental concept in ${domain}. ${question.replace('?', '.')} The key points to understand are the definition, basic working mechanism, and common use cases.`,
    detailed: `${question.replace('?', '.')} To answer this comprehensively:\n\n1. **Definition**: This concept is central to ${domain}.\n2. **How it works**: The mechanism involves multiple steps and considerations.\n3. **Key differences**: When comparing related concepts, focus on performance, use cases, and trade-offs.\n4. **Real-world application**: This is commonly used in production systems for optimization and reliability.\n5. **Time/Space complexity**: Consider the computational implications when choosing an approach.`,
    comprehensive: `${question.replace('?', '.')} This is an advanced topic that requires deep understanding:\n\n1. **Core Concept**: At its foundation, this involves understanding the theoretical basis and practical implications.\n2. **Detailed Mechanism**: The internal workings include multiple components that interact in specific ways.\n3. **Trade-offs**: Every design decision involves trade-offs between performance, complexity, and maintainability.\n4. **Comparative Analysis**: When compared to alternatives, the key differentiators are scalability, efficiency, and ease of implementation.\n5. **Advanced Considerations**: In production environments, additional factors like fault tolerance, monitoring, and testing become critical.\n6. **Best Practices**: Industry standards recommend specific patterns and anti-patterns for this area.\n7. **Common Pitfalls**: Developers often make mistakes in areas like edge cases, concurrency, and resource management.`
  };
  return answers[depth];
}

// ── Main seed function ──
async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  const existingCount = await TrainingData.countDocuments();
  console.log(`📊 Existing samples: ${existingCount}`);

  const samples = [];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const types = ['text', 'mcq', 'coding'];

  for (const [domainId, domainData] of Object.entries(DOMAINS)) {
    for (const q of domainData.questions) {
      // 1. Question generation sample
      samples.push({
        instruction: `Generate a ${q.d} difficulty theory interview question about ${domainData.label}.`,
        input: `Domain: ${domainData.label}, Difficulty: ${q.d}, Type: theory`,
        output: JSON.stringify({ question: q.q, difficulty: q.d, type: 'text', domain: domainId, tags: domainData.topics.slice(0, 3) }),
        domain: domainId,
        difficulty: q.d,
        questionType: 'text',
        source: 'seed-question',
        questionCount: 1,
        isValidJSON: true,
        modelUsed: 'seed-script'
      });

      // 2. Answer evaluation sample
      const answer = generateAnswer(domainData.label, q.q, q.d);
      const score = q.d === 'Easy' ? 8 : q.d === 'Medium' ? 7 : 6;
      samples.push({
        instruction: `Evaluate this ${domainData.label} interview answer.`,
        input: JSON.stringify({ question: q.q, answer }),
        output: JSON.stringify({ score, isCorrect: true, feedback: `Good understanding of ${domainData.label} concepts.` }),
        domain: domainId,
        difficulty: q.d,
        questionType: 'text',
        source: 'seed-answer',
        candidateScore: score,
        questionCount: 1,
        isValidJSON: true,
        modelUsed: 'seed-script'
      });

      // 3. MCQ variant
      samples.push({
        instruction: `Generate a ${q.d} difficulty MCQ interview question about ${domainData.label}.`,
        input: `Domain: ${domainData.label}, Difficulty: ${q.d}, Type: mcq`,
        output: JSON.stringify({
          question: q.q.replace('Explain', 'Which of the following best describes').replace('What is', 'Which statement about'),
          type: 'mcq', difficulty: q.d,
          options: ['Option A: First possible answer', 'Option B: Second possible answer', 'Option C: Third possible answer', 'Option D: Fourth possible answer'],
          correctAnswer: 0,
          explanation: `The correct answer relates to the core concept of ${q.q.split('?')[0].toLowerCase()}.`
        }),
        domain: domainId,
        difficulty: q.d,
        questionType: 'mcq',
        source: 'seed-mcq',
        questionCount: 1,
        isValidJSON: true,
        modelUsed: 'seed-script'
      });

      // 4. Topic variation — generate related questions from topics
      for (const topic of domainData.topics.slice(0, 2)) {
        samples.push({
          instruction: `Generate a ${q.d} difficulty interview question about ${topic} in ${domainData.label}.`,
          input: `Domain: ${domainData.label}, Topic: ${topic}, Difficulty: ${q.d}`,
          output: JSON.stringify({
            question: `Explain the concept of ${topic} in ${domainData.label}. What are its key properties and applications?`,
            difficulty: q.d, type: 'text', domain: domainId, tags: [topic]
          }),
          domain: domainId,
          difficulty: q.d,
          questionType: 'text',
          source: 'seed-topic',
          questionCount: 1,
          isValidJSON: true,
          modelUsed: 'seed-script'
        });
      }
    }
  }

  console.log(`\n📝 Generated ${samples.length} training samples`);
  console.log('💾 Inserting into MongoDB...');

  // Insert in batches
  const BATCH = 100;
  for (let i = 0; i < samples.length; i += BATCH) {
    const batch = samples.slice(i, i + BATCH);
    await TrainingData.insertMany(batch);
    process.stdout.write(`   Inserted ${Math.min(i + BATCH, samples.length)}/${samples.length}\r`);
  }

  const finalCount = await TrainingData.countDocuments();
  console.log(`\n\n✅ Done! Total training samples: ${finalCount}`);
  console.log(`📊 Added: ${finalCount - existingCount} new samples`);
  console.log(`\n${finalCount >= 500 ? '🎉 Ready for fine-tuning!' : `⏳ Need ${500 - finalCount} more samples`}`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
