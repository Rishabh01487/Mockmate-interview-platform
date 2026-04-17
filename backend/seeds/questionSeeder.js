require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Question = require('../models/QuestionSchema');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mockmate';

// ════════════════════════════════════════════════════════════
//  SEED DATA — Text, MCQ, and Coding Questions
// ════════════════════════════════════════════════════════════
const questions = [

  // ── TEXT QUESTIONS ──────────────────────────────────────────
  {
    questionType: 'text', category: 'Data Structures & Algorithms',
    subcategory: 'Sorting', difficulty: 'medium', type: 'technical',
    text: 'Explain QuickSort algorithm, its average and worst-case time complexity, and when you would avoid using it.',
    keyPoints: ['Divide and conquer', 'Pivot selection', 'Average O(n log n)', 'Worst case O(n²) on sorted input', 'In-place sorting'],
    hints: ['Think about what happens when pivot is always the smallest/largest element'],
    tags: ['sorting', 'quicksort', 'complexity'],
    timeLimit: 180,
  },
  {
    questionType: 'text', category: 'Operating Systems',
    subcategory: 'Process Management', difficulty: 'hard', type: 'technical',
    text: 'What are the four necessary conditions for deadlock? Explain how the Banker\'s algorithm prevents deadlock.',
    keyPoints: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait', 'Safe state', 'Resource allocation graph'],
    hints: ['Use the acronym MHNC', 'Safe state means at least one process can complete'],
    tags: ['deadlock', 'os', 'banker', 'process'],
    timeLimit: 240,
  },
  {
    questionType: 'text', category: 'Database Management Systems',
    subcategory: 'Normalization', difficulty: 'medium', type: 'technical',
    text: 'Explain 1NF, 2NF, and 3NF with examples. Why is normalization important?',
    keyPoints: ['1NF: atomic values', '2NF: no partial dependency', '3NF: no transitive dependency', 'Reduces redundancy', 'Improves data integrity'],
    tags: ['normalization', 'dbms', 'sql'],
    timeLimit: 210,
  },
  {
    questionType: 'text', category: 'System Design',
    subcategory: 'Distributed Systems', difficulty: 'hard', type: 'system_design',
    text: 'Design a URL shortener like bit.ly. Discuss database schema, hashing strategy, caching, and how to handle 100M URLs at scale.',
    keyPoints: ['Base62 encoding', 'Key-value store', 'Redis caching', 'Load balancer', 'Database sharding', 'Analytics tracking'],
    timeLimit: 600,
  },
  {
    questionType: 'text', category: 'Computer Networks',
    subcategory: 'Transport Layer', difficulty: 'easy', type: 'technical',
    text: 'What is the difference between TCP and UDP? Give real-world use cases for each.',
    keyPoints: ['TCP: connection-oriented, reliable, ordered', 'UDP: connectionless, fast, no guaranteed delivery', 'TCP: HTTP, FTP, email', 'UDP: DNS, video streaming, gaming'],
    tags: ['tcp', 'udp', 'networking', 'transport'],
    timeLimit: 150,
  },
  {
    questionType: 'text', category: 'Object-Oriented Programming',
    subcategory: 'Design Principles', difficulty: 'medium', type: 'technical',
    text: 'Explain the SOLID principles with a real-world example for each.',
    keyPoints: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
    hints: ['Use a payment processing system or e-commerce example'],
    tags: ['solid', 'oop', 'design', 'principles'],
    timeLimit: 300,
  },
  {
    questionType: 'text', category: 'Web Development',
    subcategory: 'React', difficulty: 'medium', type: 'technical',
    text: 'Explain the React component lifecycle. How does useEffect replace lifecycle methods in functional components?',
    keyPoints: ['Mount, update, unmount', 'useEffect dependencies array', 'Cleanup function', 'componentDidMount equivalent', 'componentWillUnmount equivalent'],
    tags: ['react', 'hooks', 'lifecycle', 'javascript'],
    timeLimit: 180,
  },
  {
    questionType: 'text', category: 'Behavioral',
    difficulty: 'easy', type: 'behavioral',
    text: 'Tell me about a time you had to debug a complex issue under pressure. What was your approach?',
    keyPoints: ['Problem isolation', 'Systematic debugging', 'Communication with team', 'Root cause analysis', 'Prevention of recurrence'],
    timeLimit: 240,
  },

  // ── MCQ QUESTIONS ───────────────────────────────────────────
  {
    questionType: 'mcq', category: 'Data Structures & Algorithms',
    subcategory: 'Trees', difficulty: 'easy', type: 'technical',
    text: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
    options: [
      { text: 'O(1)',      isCorrect: false },
      { text: 'O(log n)', isCorrect: true  },
      { text: 'O(n)',      isCorrect: false },
      { text: 'O(n log n)', isCorrect: false },
    ],
    correctOptionIndex: 1,
    explanation: 'In a balanced BST, each comparison halves the search space, resulting in O(log n) search time. An unbalanced BST degrades to O(n) in the worst case.',
    tags: ['bst', 'trees', 'complexity'],
    timeLimit: 60,
  },
  {
    questionType: 'mcq', category: 'Operating Systems',
    subcategory: 'Deadlock', difficulty: 'medium', type: 'technical',
    text: 'Which of the following is NOT a necessary condition for deadlock?',
    options: [
      { text: 'Mutual Exclusion',  isCorrect: false },
      { text: 'Preemption',        isCorrect: true  },
      { text: 'Hold and Wait',     isCorrect: false },
      { text: 'Circular Wait',     isCorrect: false },
    ],
    correctOptionIndex: 1,
    explanation: '"No Preemption" (the absence of preemption) is required for deadlock, not "Preemption" itself. The four conditions are: Mutual Exclusion, Hold-and-Wait, No Preemption, and Circular Wait.',
    tags: ['deadlock', 'os'],
    timeLimit: 60,
  },
  {
    questionType: 'mcq', category: 'Database Management Systems',
    subcategory: 'SQL', difficulty: 'easy', type: 'technical',
    text: 'Which SQL clause is used to filter groups AFTER a GROUP BY operation?',
    options: [
      { text: 'WHERE',   isCorrect: false },
      { text: 'FILTER',  isCorrect: false },
      { text: 'HAVING',  isCorrect: true  },
      { text: 'BETWEEN', isCorrect: false },
    ],
    correctOptionIndex: 2,
    explanation: 'HAVING filters groups after aggregation. WHERE filters individual rows before grouping. You cannot use aggregate functions (like COUNT, SUM) in a WHERE clause.',
    tags: ['sql', 'groupby', 'having'],
    timeLimit: 45,
  },
  {
    questionType: 'mcq', category: 'Computer Networks',
    subcategory: 'Transport Layer', difficulty: 'easy', type: 'technical',
    text: 'What does the acronym "HTTP" stand for?',
    options: [
      { text: 'HyperText Transfer Protocol',        isCorrect: true  },
      { text: 'HyperText Transmission Program',     isCorrect: false },
      { text: 'High-speed Text Transfer Protocol',  isCorrect: false },
      { text: 'Hybrid Transfer Text Protocol',      isCorrect: false },
    ],
    correctOptionIndex: 0,
    explanation: 'HTTP stands for HyperText Transfer Protocol. It is the foundation of data communication on the World Wide Web, operating at the application layer.',
    tags: ['http', 'networking', 'acronym'],
    timeLimit: 30,
  },
  {
    questionType: 'mcq', category: 'Data Structures & Algorithms',
    subcategory: 'Graphs', difficulty: 'medium', type: 'technical',
    text: 'Which data structure is used internally by BFS (Breadth-First Search)?',
    options: [
      { text: 'Stack',        isCorrect: false },
      { text: 'Queue',        isCorrect: true  },
      { text: 'Priority Queue', isCorrect: false },
      { text: 'Hash Map',     isCorrect: false },
    ],
    correctOptionIndex: 1,
    explanation: 'BFS uses a Queue (FIFO) to track nodes to visit next. DFS uses a Stack (or recursion). Dijkstra\'s uses a Priority Queue.',
    tags: ['bfs', 'graph', 'queue'],
    timeLimit: 45,
  },
  {
    questionType: 'mcq', category: 'Object-Oriented Programming',
    subcategory: 'Concepts', difficulty: 'easy', type: 'technical',
    text: 'Which OOP concept allows a child class to provide a specific implementation of a method already defined in its parent class?',
    options: [
      { text: 'Overloading',  isCorrect: false },
      { text: 'Abstraction',  isCorrect: false },
      { text: 'Overriding',   isCorrect: true  },
      { text: 'Encapsulation', isCorrect: false },
    ],
    correctOptionIndex: 2,
    explanation: 'Method Overriding allows a subclass to provide its own implementation of a method inherited from a superclass. This is the basis of runtime polymorphism.',
    tags: ['oop', 'overriding', 'polymorphism'],
    timeLimit: 45,
  },
  {
    questionType: 'mcq', category: 'Web Development',
    subcategory: 'JavaScript', difficulty: 'medium', type: 'technical',
    text: 'What is the output of: console.log(typeof null)?',
    options: [
      { text: '"null"',    isCorrect: false },
      { text: '"object"',  isCorrect: true  },
      { text: '"undefined"', isCorrect: false },
      { text: '"boolean"', isCorrect: false },
    ],
    correctOptionIndex: 1,
    explanation: 'This is a well-known JavaScript bug/quirk. typeof null returns "object" due to how values were represented in the original JavaScript implementation. It should have been "null".',
    tags: ['javascript', 'typeof', 'quirks'],
    timeLimit: 45,
  },
  {
    questionType: 'mcq', category: 'Data Structures & Algorithms',
    subcategory: 'Dynamic Programming', difficulty: 'hard', type: 'technical',
    text: 'Which of the following problems CANNOT be solved optimally with a greedy approach?',
    options: [
      { text: 'Activity Selection Problem', isCorrect: false },
      { text: 'Fractional Knapsack',        isCorrect: false },
      { text: '0/1 Knapsack Problem',       isCorrect: true  },
      { text: "Prim's MST Algorithm",        isCorrect: false },
    ],
    correctOptionIndex: 2,
    explanation: 'The 0/1 Knapsack problem requires Dynamic Programming because you must either take or leave an item (no fractions). Greedy works for the Fractional Knapsack variant.',
    tags: ['greedy', 'dp', 'knapsack'],
    timeLimit: 60,
  },

  // ── CODING QUESTIONS ─────────────────────────────────────────
  {
    questionType: 'coding', category: 'Data Structures & Algorithms',
    subcategory: 'Arrays', difficulty: 'easy', type: 'technical',
    text: 'Two Sum',
    problemStatement: 'Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6',     output: '[1,2]', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
      { input: 'nums = [3,3], target = 6',       output: '[0,1]', explanation: '' },
    ],
    testCases: [
      { input: 'nums=[2,7,11,15] target=9',  expectedOutput: '[0,1]',  isHidden: false },
      { input: 'nums=[3,2,4] target=6',      expectedOutput: '[1,2]',  isHidden: false },
      { input: 'nums=[3,3] target=6',        expectedOutput: '[0,1]',  isHidden: true  },
      { input: 'nums=[-1,-2,-3] target=-5',  expectedOutput: '[1,2]',  isHidden: true  },
    ],
    expectedTimeComplexity:  'O(n)',
    expectedSpaceComplexity: 'O(n)',
    starterCode: {
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Your solution here\n    \n}',
      python:     'def two_sum(nums, target):\n    """\n    :type nums: List[int]\n    :type target: int\n    :rtype: List[int]\n    """\n    # Your solution here\n    pass',
      cpp:        '#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your solution here\n    }\n};',
      java:       'import java.util.HashMap;\nimport java.util.Map;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}',
    },
    tags: ['array', 'hash-map', 'two-pointers'],
    timeLimit: 1800,
  },
  {
    questionType: 'coding', category: 'Data Structures & Algorithms',
    subcategory: 'Stack', difficulty: 'easy', type: 'technical',
    text: 'Valid Parentheses',
    problemStatement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is **valid**.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only `(){}{}`'],
    examples: [
      { input: 's = "()"',      output: 'true',  explanation: '' },
      { input: 's = "()[]{}"',  output: 'true',  explanation: '' },
      { input: 's = "(]"',      output: 'false', explanation: '' },
      { input: 's = "([)]"',    output: 'false', explanation: '' },
      { input: 's = "{[]}"',    output: 'true',  explanation: '' },
    ],
    testCases: [
      { input: '()',      expectedOutput: 'true',  isHidden: false },
      { input: '()[]{}', expectedOutput: 'true',  isHidden: false },
      { input: '(]',     expectedOutput: 'false', isHidden: false },
      { input: '{[]}',   expectedOutput: 'true',  isHidden: true  },
      { input: ']',      expectedOutput: 'false', isHidden: true  },
    ],
    expectedTimeComplexity:  'O(n)',
    expectedSpaceComplexity: 'O(n)',
    starterCode: {
      javascript: '/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n    // Your solution here\n    \n}',
      python:     'def is_valid(s: str) -> bool:\n    # Your solution here\n    pass',
      cpp:        '#include <string>\n#include <stack>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Your solution here\n    }\n};',
      java:       'import java.util.Stack;\n\nclass Solution {\n    public boolean isValid(String s) {\n        // Your solution here\n        return false;\n    }\n}',
    },
    tags: ['stack', 'string', 'brackets'],
    timeLimit: 1800,
  },
  {
    questionType: 'coding', category: 'Data Structures & Algorithms',
    subcategory: 'Linked Lists', difficulty: 'easy', type: 'technical',
    text: 'Reverse Linked List',
    problemStatement: 'Given the `head` of a singly linked list, reverse the list, and return the **reversed list**.\n\nYou must reverse the list in-place using O(1) extra space.',
    constraints: ['The number of nodes in the list is in range [0, 5000]', '-5000 <= Node.val <= 5000'],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: '' },
      { input: 'head = [1,2]',       output: '[2,1]',        explanation: '' },
      { input: 'head = []',          output: '[]',           explanation: '' },
    ],
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
      { input: '[1,2]',       expectedOutput: '[2,1]',        isHidden: false },
      { input: '[]',          expectedOutput: '[]',           isHidden: true  },
    ],
    expectedTimeComplexity:  'O(n)',
    expectedSpaceComplexity: 'O(1)',
    starterCode: {
      javascript: '// class ListNode {\n//   constructor(val, next = null) { this.val = val; this.next = next; }\n// }\n\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n    // Your solution here\n    \n}',
      python:     '# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\ndef reverse_list(head):\n    # Your solution here\n    pass',
      cpp:        '// struct ListNode { int val; ListNode *next; ListNode(int x) : val(x), next(nullptr) {} };\n\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Your solution here\n    }\n};',
      java:       '// public class ListNode { int val; ListNode next; ListNode(int x) { val = x; } }\n\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Your solution here\n        return head;\n    }\n}',
    },
    tags: ['linked-list', 'in-place', 'two-pointers'],
    timeLimit: 1800,
  },
  {
    questionType: 'coding', category: 'Data Structures & Algorithms',
    subcategory: 'Binary Search', difficulty: 'easy', type: 'technical',
    text: 'Binary Search',
    problemStatement: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with **O(log n)** runtime complexity.',
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All integers in nums are unique', 'nums is sorted in ascending order'],
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4',  explanation: '9 exists in nums and its index is 4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1' },
    ],
    testCases: [
      { input: '[-1,0,3,5,9,12] 9',  expectedOutput: '4',  isHidden: false },
      { input: '[-1,0,3,5,9,12] 2',  expectedOutput: '-1', isHidden: false },
      { input: '[5] 5',              expectedOutput: '0',  isHidden: true  },
      { input: '[1,2,3] 4',          expectedOutput: '-1', isHidden: true  },
    ],
    expectedTimeComplexity:  'O(log n)',
    expectedSpaceComplexity: 'O(1)',
    starterCode: {
      javascript: '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n    // Your solution here\n    \n}',
      python:     'def search(nums, target: int) -> int:\n    # Your solution here\n    pass',
      cpp:        '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Your solution here\n    }\n};',
      java:       'class Solution {\n    public int search(int[] nums, int target) {\n        // Your solution here\n        return -1;\n    }\n}',
    },
    tags: ['binary-search', 'array'],
    timeLimit: 1800,
  },
];

// ════════════════════════════════════════════════════════════
//  Seed Function
// ════════════════════════════════════════════════════════════
async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  const existing = await Question.countDocuments();
  if (existing > 0) {
    console.log(`⚠  ${existing} questions already exist. Use --force to overwrite.`);
    if (!process.argv.includes('--force')) {
      process.exit(0);
    }
    await Question.deleteMany({});
    console.log('✓ Cleared existing questions');
  }

  const inserted = await Question.insertMany(questions);
  console.log(`✓ Seeded ${inserted.length} questions:`);
  console.log(`  • Text:   ${inserted.filter(q => q.questionType === 'text').length}`);
  console.log(`  • MCQ:    ${inserted.filter(q => q.questionType === 'mcq').length}`);
  console.log(`  • Coding: ${inserted.filter(q => q.questionType === 'coding').length}`);

  await mongoose.disconnect();
  console.log('✓ Done');
  process.exit(0);
}

seed().catch(err => {
  console.error('✗ Seed failed:', err);
  process.exit(1);
});
