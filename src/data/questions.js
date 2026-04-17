// MockMate CS Engineering Question Bank
// 8 Categories × ~10 questions each = 80+ questions

export const CATEGORIES = [
  { id: 'dsa',            label: 'Data Structures & Algorithms', icon: 'dsa',    color: '#f5f5f5' },
  { id: 'os',             label: 'Operating Systems',            icon: 'os',     color: '#f5f5f5' },
  { id: 'dbms',           label: 'DBMS',                         icon: 'dbms',   color: '#f5f5f5' },
  { id: 'cn',             label: 'Computer Networks',            icon: 'cn',     color: '#f5f5f5' },
  { id: 'oop',            label: 'OOP Concepts',                 icon: 'oop',    color: '#f5f5f5' },
  { id: 'systemdesign',   label: 'System Design',                icon: 'sd',     color: '#f5f5f5' },
  { id: 'webdev',         label: 'Web Development',              icon: 'web',    color: '#f5f5f5' },
  { id: 'corecs',         label: 'Core CS Theory',               icon: 'theory', color: '#f5f5f5' },
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const questions = {
  dsa: [
    {
      id: 'lc-1', questionType: 'coding', question: 'Two Sum', difficulty: 'Easy', tags: ['arrays', 'hash-map'], timeLimit: 1200,
      problemStatement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= target <= 10^9'],
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
      testCases: [ { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' }, { input: '[3,2,4]\n6', expectedOutput: '[1,2]' } ],
      starterCode: { javascript: 'function twoSum(nums, target) {\n  \n}', python: 'def two_sum(nums, target):\n  pass' }
    },
    {
      id: 'lc-2', questionType: 'coding', question: 'Valid Parentheses', difficulty: 'Easy', tags: ['stack', 'string'], timeLimit: 1200,
      problemStatement: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.',
      constraints: ['1 <= s.length <= 10^4'],
      examples: [{ input: 's = "()[]{}"', output: 'true' }],
      testCases: [ { input: '()', expectedOutput: 'true' }, { input: '(]', expectedOutput: 'false' } ],
      starterCode: { javascript: 'function isValid(s) {\n  \n}', python: 'def is_valid(s):\n  pass' }
    },
    {
      id: 'lc-3', questionType: 'coding', question: 'Merge Two Sorted Lists', difficulty: 'Easy', tags: ['linked-list', 'pointers'], timeLimit: 1500,
      problemStatement: 'You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists in a one sorted list.',
      constraints: ['The number of nodes in both lists is in the range [0, 50]'],
      examples: [{ input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }],
      testCases: [ { input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]' } ],
      starterCode: { javascript: 'function mergeTwoLists(list1, list2) {\n  \n}', python: 'def merge_two_lists(list1, list2):\n  pass' }
    },
    {
      id: 'lc-4', questionType: 'coding', question: 'Maximum Subarray', difficulty: 'Medium', tags: ['arrays', 'dynamic-programming'], timeLimit: 1800,
      problemStatement: 'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
      constraints: ['1 <= nums.length <= 10^5'],
      examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum 6.' }],
      testCases: [ { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' } ],
      starterCode: { javascript: 'function maxSubArray(nums) {\n  \n}', python: 'def max_sub_array(nums):\n  pass' }
    },
    {
      id: 'lc-5', questionType: 'coding', question: 'Climbing Stairs', difficulty: 'Easy', tags: ['dynamic-programming'], timeLimit: 1200,
      problemStatement: 'You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      constraints: ['1 <= n <= 45'],
      examples: [{ input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, 2+1' }],
      testCases: [ { input: '3', expectedOutput: '3' }, { input: '5', expectedOutput: '8' } ],
      starterCode: { javascript: 'function climbStairs(n) {\n  \n}', python: 'def climb_stairs(n):\n  pass' }
    },
    {
      id: 'lc-6', questionType: 'coding', question: 'Valid Anagram', difficulty: 'Easy', tags: ['hash-map', 'string'], timeLimit: 1200,
      problemStatement: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.',
      constraints: ['1 <= s.length, t.length <= 5 * 10^4'],
      examples: [{ input: 's = "anagram", t = "nagaram"', output: 'true' }],
      testCases: [ { input: 'anagram\nnagaram', expectedOutput: 'true' }, { input: 'rat\ncar', expectedOutput: 'false' } ],
      starterCode: { javascript: 'function isAnagram(s, t) {\n  \n}', python: 'def is_anagram(s, t):\n  pass' }
    },
    {
      id: 'lc-7', questionType: 'coding', question: 'Binary Search', difficulty: 'Easy', tags: ['arrays', 'binary-search'], timeLimit: 1200,
      problemStatement: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.',
      constraints: ['1 <= nums.length <= 10^4'],
      examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' }],
      testCases: [ { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4' } ],
      starterCode: { javascript: 'function search(nums, target) {\n  \n}', python: 'def search(nums, target):\n  pass' }
    },
    {
      id: 'lc-8', questionType: 'coding', question: 'Reverse Linked List', difficulty: 'Easy', tags: ['linked-list'], timeLimit: 1500,
      problemStatement: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
      constraints: ['The number of nodes in the list is the range [0, 5000]'],
      examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }],
      testCases: [ { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' } ],
      starterCode: { javascript: 'function reverseList(head) {\n  \n}', python: 'def reverse_list(head):\n  pass' }
    },
    {
      id: 'lc-9', questionType: 'coding', question: 'Invert Binary Tree', difficulty: 'Easy', tags: ['trees', 'dfs'], timeLimit: 1500,
      problemStatement: 'Given the `root` of a binary tree, invert the tree, and return its root.',
      constraints: ['The number of nodes in the tree is in the range [0, 100]'],
      examples: [{ input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }],
      testCases: [ { input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' } ],
      starterCode: { javascript: 'function invertTree(root) {\n  \n}', python: 'def invert_tree(root):\n  pass' }
    },
    {
      id: 'lc-10', questionType: 'coding', question: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['string', 'sliding-window'], timeLimit: 2400,
      problemStatement: 'Given a string `s`, find the length of the longest substring without repeating characters.',
      constraints: ['0 <= s.length <= 5 * 10^4'],
      examples: [{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' }],
      testCases: [ { input: 'abcabcbb', expectedOutput: '3' }, { input: 'bbbbb', expectedOutput: '1' }, { input: 'pwwkew', expectedOutput: '3' } ],
      starterCode: { javascript: 'function lengthOfLongestSubstring(s) {\n  \n}', python: 'def length_of_longest_substring(s):\n  pass' }
    },
    {
      id: 'lc-11', questionType: 'coding', question: 'Product of Array Except Self', difficulty: 'Medium', tags: ['arrays', 'prefix-sum'], timeLimit: 2400,
      problemStatement: 'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`. You must write an algorithm that runs in O(n) time and without using the division operation.',
      constraints: ['2 <= nums.length <= 10^5'],
      examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' }],
      testCases: [ { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' } ],
      starterCode: { javascript: 'function productExceptSelf(nums) {\n  \n}', python: 'def product_except_self(nums):\n  pass' }
    },
    {
      id: 'lc-12', questionType: 'coding', question: 'Coin Change', difficulty: 'Medium', tags: ['dynamic-programming'], timeLimit: 2400,
      problemStatement: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the fewest number of coins that you need to make up that amount.',
      constraints: ['1 <= coins.length <= 12'],
      examples: [{ input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' }],
      testCases: [ { input: '[1,2,5]\n11', expectedOutput: '3' } ],
      starterCode: { javascript: 'function coinChange(coins, amount) {\n  \n}', python: 'def coin_change(coins, amount):\n  pass' }
    },
    {
      id: 'lc-13', questionType: 'coding', question: 'Number of Islands', difficulty: 'Medium', tags: ['graphs', 'bfs', 'dfs'], timeLimit: 2400,
      problemStatement: 'Given an `m x n` 2D binary grid `grid` which represents a map of `1`s (land) and `0`s (water), return the number of islands.',
      constraints: ['m == grid.length', 'n == grid[i].length'],
      examples: [{ input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }],
      testCases: [ { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' } ],
      starterCode: { javascript: 'function numIslands(grid) {\n  \n}', python: 'def num_islands(grid):\n  pass' }
    },
    {
      id: 'lc-14', questionType: 'coding', question: 'LRU Cache', difficulty: 'Medium', tags: ['design', 'hash-map', 'linked-list'], timeLimit: 3000,
      problemStatement: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
      constraints: ['1 <= capacity <= 3000'],
      examples: [{ input: '["LRUCache", "put", "put", "get"]', output: '[null, null, null, 1]' }],
      testCases: [ { input: '["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]', expectedOutput: '[null, null, null, 1]' } ],
      starterCode: { javascript: 'class LRUCache {\n  constructor(capacity) {\n  }\n  get(key) {\n  }\n  put(key, value) {\n  }\n}', python: 'class LRUCache:\n  def __init__(self, capacity: int):\n    pass' }
    },
    {
      id: 'dsa-mcq-1',
      questionType: 'mcq',
      question: 'What is the worst-case time complexity of QuickSort?',
      difficulty: 'Medium',
      tags: ['sorting', 'quicksort'],
      timeLimit: 60,
      options: [
        { text: 'O(n)' }, { text: 'O(n log n)' }, { text: 'O(n²)' }, { text: 'O(1)' }
      ],
      correctOptionIndex: 2,
      explanation: 'QuickSort degrades to O(n²) when the pivot chosen is always the largest or smallest element (e.g., already sorted array with bad pivot strategy).',
      expectedPoints: []
    },
    {
      id: 'dsa-mcq-2',
      questionType: 'mcq',
      question: 'Which data structure is used for Breadth-First Search (BFS) in a graph?',
      difficulty: 'Easy',
      tags: ['graphs', 'bfs'],
      timeLimit: 60,
      options: [
        { text: 'Stack' }, { text: 'Queue' }, { text: 'Priority Queue' }, { text: 'Hash Map' }
      ],
      correctOptionIndex: 1,
      explanation: 'BFS explores level-by-level, necessitating a First-In-First-Out (FIFO) queue.',
      expectedPoints: []
    },
    {
      id: 'dsa-mcq-3',
      questionType: 'mcq',
      question: 'What is the best case time complexity of Insertion Sort?',
      difficulty: 'Easy',
      tags: ['sorting'],
      timeLimit: 60,
      options: [
        { text: 'O(n²)' }, { text: 'O(1)' }, { text: 'O(n)' }, { text: 'O(n log n)' }
      ],
      correctOptionIndex: 2,
      explanation: 'If the array is already sorted, Insertion Sort only takes O(n) because the inner loop terminates immediately.',
      expectedPoints: []
    },
    {
      id: 'dsa-1',
      question: 'What is the difference between an Array and a Linked List? When would you prefer one over the other?',
      difficulty: 'Easy',
      tags: ['arrays', 'linked-list', 'data-structures'],
      timeLimit: 120,
      expectedPoints: [
        'Array: contiguous memory, O(1) random access, O(n) insertion/deletion',
        'Linked List: non-contiguous memory, O(n) access, O(1) insertion/deletion at head',
        'Use array when: frequent access by index, memory locality matters',
        'Use linked list when: frequent insertions/deletions, unknown size at compile time'
      ]
    },
    {
      id: 'dsa-2',
      question: 'Explain the concept of recursion and explain what a stack overflow is in the context of recursion.',
      difficulty: 'Easy',
      tags: ['recursion', 'stack', 'memory'],
      timeLimit: 120,
      expectedPoints: [
        'Recursion: a function calling itself with a simpler subproblem',
        'Base case prevents infinite recursion',
        'Each call is pushed onto the call stack',
        'Stack overflow: call stack exceeds memory limit due to too many recursive calls (missing or incorrect base case)'
      ]
    },
    {
      id: 'dsa-3',
      question: 'What is a Hash Table? How does it handle collisions? Explain separate chaining and open addressing.',
      difficulty: 'Easy',
      tags: ['hashing', 'hash-table', 'collision'],
      timeLimit: 120,
      expectedPoints: [
        'Hash table maps keys to values using a hash function',
        'Collision: two keys hash to same index',
        'Separate chaining: each slot holds a linked list of colliding entries',
        'Open addressing: probe next available slot (linear probing, quadratic probing, double hashing)',
        'Average O(1) for insert/search/delete'
      ]
    },
    {
      id: 'dsa-4',
      question: 'What is the difference between BFS and DFS? Give a use case for each.',
      difficulty: 'Easy',
      tags: ['graphs', 'bfs', 'dfs', 'traversal'],
      timeLimit: 120,
      expectedPoints: [
        'BFS: level-by-level traversal using a queue, good for shortest path in unweighted graphs',
        'DFS: depth-first using a stack/recursion, good for cycle detection, topological sort',
        'BFS use case: finding shortest path, web crawlers',
        'DFS use case: maze solving, detecting connected components'
      ]
    },
    {
      id: 'dsa-5',
      question: 'Explain the difference between a Stack and a Queue. Give one real-world application of each.',
      difficulty: 'Easy',
      tags: ['stack', 'queue', 'data-structures'],
      timeLimit: 90,
      expectedPoints: [
        'Stack: LIFO — Last In First Out, operations: push, pop, peek',
        'Queue: FIFO — First In First Out, operations: enqueue, dequeue',
        'Stack application: function call stack, undo operations',
        'Queue application: print queue, CPU task scheduling'
      ]
    },
    {
      id: 'dsa-6',
      question: 'Explain Binary Search. What are its prerequisites and what is its time complexity?',
      difficulty: 'Easy',
      tags: ['binary-search', 'searching', 'sorting'],
      timeLimit: 90,
      expectedPoints: [
        'Binary search works on sorted arrays',
        'Compares target with middle element, eliminates half the search space each step',
        'Time complexity: O(log n), Space: O(1) iterative, O(log n) recursive',
        'Prerequisites: array must be sorted'
      ]
    },
    {
      id: 'dsa-7',
      question: 'What is a Binary Search Tree (BST)? What are its average and worst-case time complexities for search, insert, and delete?',
      difficulty: 'Medium',
      tags: ['bst', 'trees', 'complexity'],
      timeLimit: 150,
      expectedPoints: [
        'BST: left child < parent < right child',
        'Average case: O(log n) for search, insert, delete (balanced tree)',
        'Worst case: O(n) when tree is skewed (like a linked list)',
        'Self-balancing BSTs (AVL, Red-Black) guarantee O(log n) worst case'
      ]
    },
    {
      id: 'dsa-8',
      question: 'Explain Dynamic Programming with an example. What is the difference between memoization and tabulation?',
      difficulty: 'Medium',
      tags: ['dynamic-programming', 'memoization', 'tabulation'],
      timeLimit: 180,
      expectedPoints: [
        'DP: break problem into overlapping subproblems, store results to avoid recomputation',
        'Optimal substructure + overlapping subproblems = DP applicable',
        'Memoization (top-down): recursive + cache results in a map',
        'Tabulation (bottom-up): iteratively fill a table from base case up',
        'Example: Fibonacci, Knapsack, Longest Common Subsequence'
      ]
    },
    {
      id: 'dsa-9',
      question: 'Explain Dijkstra\'s algorithm. What is its time complexity and what type of graphs is it suitable for?',
      difficulty: 'Medium',
      tags: ['graphs', 'shortest-path', 'dijkstra'],
      timeLimit: 180,
      expectedPoints: [
        'Finds shortest path from a source to all vertices in a weighted graph',
        'Uses a min-heap (priority queue), greedy approach',
        'Time complexity: O((V + E) log V) with min-heap',
        'Not suitable for graphs with negative edge weights (use Bellman-Ford instead)'
      ]
    },
    {
      id: 'dsa-10',
      question: 'What is a Segment Tree? When would you use it over a simple prefix sum array?',
      difficulty: 'Hard',
      tags: ['segment-tree', 'range-queries', 'advanced'],
      timeLimit: 240,
      expectedPoints: [
        'Segment tree stores aggregates of array ranges in a tree structure',
        'Supports range queries AND point updates both in O(log n)',
        'Prefix sum is O(1) query but O(n) update',
        'Use segment tree when you need both fast queries and fast updates',
        'Applications: range minimum/maximum/sum queries with updates'
      ]
    },
  ],

  os: [
    {
      id: 'os-1',
      question: 'What is the difference between a Process and a Thread?',
      difficulty: 'Easy',
      tags: ['process', 'thread', 'concurrency'],
      timeLimit: 120,
      expectedPoints: [
        'Process: independent program in execution with its own memory space',
        'Thread: lightweight unit within a process, shares memory with other threads',
        'Process creation is heavier (fork), thread creation is lighter',
        'Inter-process communication is harder; threads can communicate via shared memory'
      ]
    },
    {
      id: 'os-2',
      question: 'What is a Deadlock? Explain the four necessary conditions for a deadlock to occur.',
      difficulty: 'Easy',
      tags: ['deadlock', 'synchronization', 'os'],
      timeLimit: 150,
      expectedPoints: [
        'Deadlock: two or more processes waiting for each other indefinitely',
        '1. Mutual Exclusion: resource held by only one process',
        '2. Hold and Wait: process holds a resource while waiting for another',
        '3. No Preemption: resources cannot be forcibly taken',
        '4. Circular Wait: chain of processes each waiting for the next'
      ]
    },
    {
      id: 'os-3',
      question: 'Explain the concept of Virtual Memory. What are its advantages?',
      difficulty: 'Easy',
      tags: ['virtual-memory', 'paging', 'memory-management'],
      timeLimit: 120,
      expectedPoints: [
        'Virtual memory allows execution of processes larger than physical RAM',
        'Uses disk (swap space) as an extension of RAM',
        'Implemented via paging or segmentation',
        'Advantages: run larger programs, memory isolation, protection between processes',
        'Page fault: occurs when page is not in RAM, OS loads it from disk'
      ]
    },
    {
      id: 'os-4',
      question: 'What is the difference between paging and segmentation?',
      difficulty: 'Easy',
      tags: ['paging', 'segmentation', 'memory'],
      timeLimit: 120,
      expectedPoints: [
        'Paging: divides memory into fixed-size pages; no external fragmentation, internal fragmentation possible',
        'Segmentation: divides memory into variable-size segments (code, stack, heap); external fragmentation possible',
        'Paging is transparent to programmers; segmentation reflects logical structure',
        'Modern OS use both: segmented paging'
      ]
    },
    {
      id: 'os-5',
      question: 'Explain CPU scheduling algorithms: FCFS, SJF, Round Robin, and Priority Scheduling.',
      difficulty: 'Medium',
      tags: ['cpu-scheduling', 'fcfs', 'sjf', 'round-robin'],
      timeLimit: 180,
      expectedPoints: [
        'FCFS: simple but can cause convoy effect (long job blocks all others)',
        'SJF: optimal average waiting time but requires knowing burst time in advance; starvation possible',
        'Round Robin: fair, each process gets a time quantum; good for time-sharing; depends on quantum size',
        'Priority Scheduling: higher priority runs first; can cause starvation — aging as solution'
      ]
    },
    {
      id: 'os-6',
      question: 'What is a semaphore? How does it differ from a mutex?',
      difficulty: 'Medium',
      tags: ['semaphore', 'mutex', 'synchronization'],
      timeLimit: 150,
      expectedPoints: [
        'Semaphore: integer variable for signaling, two operations: wait (P) and signal (V)',
        'Binary semaphore (0/1) vs counting semaphore (any integer)',
        'Mutex: specifically a mutual exclusion lock, only the owner thread can unlock it',
        'Semaphore can be used for signaling between threads; mutex is strictly for mutual exclusion'
      ]
    },
    {
      id: 'os-7',
      question: 'What is thrashing in operating systems? How can it be prevented?',
      difficulty: 'Medium',
      tags: ['thrashing', 'virtual-memory', 'paging'],
      timeLimit: 150,
      expectedPoints: [
        'Thrashing: OS spends more time swapping pages than executing processes',
        'Occurs when too many processes compete for too little RAM',
        'Prevention: working set model, page fault frequency algorithm',
        'Also reduce degree of multiprogramming'
      ]
    },
    {
      id: 'os-8',
      question: 'Explain the concept of context switching. What information is saved/restored?',
      difficulty: 'Medium',
      tags: ['context-switch', 'process', 'scheduling'],
      timeLimit: 120,
      expectedPoints: [
        'Context switch: saving state of current process and loading state of next process',
        'PCB (Process Control Block) stores: PC, registers, memory maps, open files, scheduling info',
        'Context switching is overhead — too frequent switching reduces efficiency',
        'Hardware-assisted context switching exists in some architectures'
      ]
    },
    {
      id: 'os-9',
      question: 'What are the different types of OS kernels? Explain monolithic vs microkernel.',
      difficulty: 'Hard',
      tags: ['kernel', 'monolithic', 'microkernel', 'os-architecture'],
      timeLimit: 180,
      expectedPoints: [
        'Monolithic kernel: all OS services run in kernel space (Linux), fast but less modular',
        'Microkernel: minimal kernel (IPC, scheduling, memory), rest in user space (MINIX), more stable/secure but slower due to IPC overhead',
        'Hybrid kernel: combines both (Windows, macOS)',
        'Exokernel: gives applications direct hardware access'
      ]
    },
    {
      id: 'os-10',
      question: 'Explain the Banker\'s Algorithm. How does it help in deadlock avoidance?',
      difficulty: 'Hard',
      tags: ['bankers-algorithm', 'deadlock-avoidance', 'resource-allocation'],
      timeLimit: 240,
      expectedPoints: [
        'Banker\'s algorithm simulates resource allocation to determine a safe state',
        'Safe state: there exists a sequence of processes that can all complete',
        'Before allocating resources, check if resulting state is safe',
        'Uses: Available, Max, Allocation, Need matrices',
        'Limitation: requires knowing maximum resource needs in advance'
      ]
    },
  ],

  dbms: [
    {
      id: 'dbms-1',
      question: 'What is the difference between SQL and NoSQL databases? When would you choose one over the other?',
      difficulty: 'Easy',
      tags: ['sql', 'nosql', 'database'],
      timeLimit: 120,
      expectedPoints: [
        'SQL: relational, structured schema, ACID compliance, examples: MySQL, PostgreSQL',
        'NoSQL: flexible schema, horizontal scaling, eventual consistency, examples: MongoDB, Redis, Cassandra',
        'Choose SQL: structured data, complex queries, strong consistency needed',
        'Choose NoSQL: large scale, flexible schemas, high availability, unstructured data'
      ]
    },
    {
      id: 'dbms-2',
      question: 'Explain the ACID properties of a database transaction.',
      difficulty: 'Easy',
      tags: ['acid', 'transactions', 'database'],
      timeLimit: 120,
      expectedPoints: [
        'Atomicity: all operations succeed or all fail (no partial transactions)',
        'Consistency: database moves from one valid state to another',
        'Isolation: concurrent transactions do not interfere with each other',
        'Durability: committed transactions survive crashes (written to disk)'
      ]
    },
    {
      id: 'dbms-3',
      question: 'What are indexes in a database? Explain the types and when to use them.',
      difficulty: 'Easy',
      tags: ['indexes', 'query-optimization', 'database'],
      timeLimit: 120,
      expectedPoints: [
        'Index: data structure that speeds up query retrieval on a column',
        'Primary index: on primary key, always unique',
        'Secondary index: on non-primary key columns',
        'Clustered vs Non-clustered: clustered physically reorders data',
        'Trade-off: faster reads but slower writes and extra storage'
      ]
    },
    {
      id: 'dbms-4',
      question: 'Explain database normalization. What are 1NF, 2NF, and 3NF?',
      difficulty: 'Medium',
      tags: ['normalization', '1nf', '2nf', '3nf', 'schema-design'],
      timeLimit: 180,
      expectedPoints: [
        '1NF: atomic values, no repeating groups, each row is unique',
        '2NF: 1NF + no partial dependencies (every non-key attribute fully dependent on primary key)',
        '3NF: 2NF + no transitive dependencies (non-key attributes not depending on other non-key attributes)',
        'Goal: reduce redundancy and improve data integrity',
        'BCNF: stricter form of 3NF'
      ]
    },
    {
      id: 'dbms-5',
      question: 'What is a JOIN in SQL? Explain INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.',
      difficulty: 'Easy',
      tags: ['sql', 'joins', 'queries'],
      timeLimit: 150,
      expectedPoints: [
        'INNER JOIN: returns rows with matching values in both tables',
        'LEFT JOIN: all rows from left table + matching rows from right (NULL if no match)',
        'RIGHT JOIN: all rows from right table + matching rows from left',
        'FULL OUTER JOIN: all rows from both tables, NULL where no match',
        'CROSS JOIN: cartesian product'
      ]
    },
    {
      id: 'dbms-6',
      question: 'What are transactions and how does concurrency control work in DBMS?',
      difficulty: 'Medium',
      tags: ['transactions', 'concurrency', 'locking'],
      timeLimit: 180,
      expectedPoints: [
        'Transaction: a sequence of operations treated as a single unit',
        'Concurrency problems: dirty read, non-repeatable read, phantom read',
        'Locking: shared (read) and exclusive (write) locks',
        'Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable',
        'MVCC (Multi-Version Concurrency Control) used in PostgreSQL, MySQL InnoDB'
      ]
    },
    {
      id: 'dbms-7',
      question: 'What is a stored procedure? How is it different from a function in SQL?',
      difficulty: 'Medium',
      tags: ['stored-procedure', 'function', 'sql'],
      timeLimit: 120,
      expectedPoints: [
        'Stored procedure: precompiled SQL code stored in DB, can have input/output params',
        'Function: must return a value, can be used in SELECT statements',
        'Procedures can call functions but not vice versa',
        'Procedures can modify database state; functions should be deterministic'
      ]
    },
    {
      id: 'dbms-8',
      question: 'Explain the CAP theorem. Give examples of databases for each combination.',
      difficulty: 'Hard',
      tags: ['cap-theorem', 'distributed-systems', 'consistency', 'availability'],
      timeLimit: 180,
      expectedPoints: [
        'CAP: Consistency, Availability, Partition Tolerance — can only guarantee 2 of 3',
        'CP (Consistency + Partition): MongoDB, HBase — sacrifices availability',
        'AP (Availability + Partition): Cassandra, CouchDB — sacrifices consistency',
        'CA: traditional RDBMS (PostgreSQL) — no partition tolerance (single node)',
        'In distributed systems, partition tolerance is always required, so choose between C and A'
      ]
    },
    {
      id: 'dbms-9',
      question: 'What is query optimization? Explain how a database query optimizer works.',
      difficulty: 'Hard',
      tags: ['query-optimization', 'execution-plan', 'database'],
      timeLimit: 210,
      expectedPoints: [
        'Query optimizer selects the most efficient execution plan',
        'Parses SQL → generates logical plan → generates multiple physical plans → estimates cost → picks cheapest',
        'Cost estimation based on statistics (row counts, cardinality, histograms)',
        'Techniques: predicate pushdown, join reordering, index selection',
        'EXPLAIN/EXPLAIN ANALYZE to view execution plan'
      ]
    },
    {
      id: 'dbms-10',
      question: 'What is database sharding? How is it different from replication?',
      difficulty: 'Hard',
      tags: ['sharding', 'replication', 'scaling', 'distributed-db'],
      timeLimit: 180,
      expectedPoints: [
        'Sharding: horizontal partitioning — different rows on different servers (scale writes)',
        'Replication: same data on multiple servers (scale reads, high availability)',
        'Sharding strategies: range-based, hash-based, directory-based',
        'Challenges: cross-shard queries, hotspots, rebalancing',
        'Often used together: sharded clusters with replicated shards'
      ]
    },
  ],

  cn: [
    {
      id: 'cn-1',
      question: 'Explain the OSI model. What are the 7 layers and their functions?',
      difficulty: 'Easy',
      tags: ['osi-model', 'networking', 'layers'],
      timeLimit: 150,
      expectedPoints: [
        'Physical: bit transmission over medium',
        'Data Link: framing, MAC addressing, error detection (Ethernet)',
        'Network: routing, logical addressing, IP (routers)',
        'Transport: end-to-end communication, TCP/UDP',
        'Session: session management',
        'Presentation: data format, encryption, compression',
        'Application: user interface, HTTP, FTP, DNS'
      ]
    },
    {
      id: 'cn-2',
      question: 'What is the difference between TCP and UDP? When would you use each?',
      difficulty: 'Easy',
      tags: ['tcp', 'udp', 'transport-layer'],
      timeLimit: 120,
      expectedPoints: [
        'TCP: connection-oriented, reliable, ordered delivery, flow/congestion control, higher overhead',
        'UDP: connectionless, no guarantee of delivery or order, faster, lower overhead',
        'Use TCP: file transfer, email, HTTP, banking',
        'Use UDP: video streaming, gaming, DNS, VoIP — where speed > reliability'
      ]
    },
    {
      id: 'cn-3',
      question: 'What is the three-way handshake in TCP? Explain the process.',
      difficulty: 'Easy',
      tags: ['tcp', 'three-way-handshake', 'connection'],
      timeLimit: 120,
      expectedPoints: [
        'Step 1: Client sends SYN (synchronize)',
        'Step 2: Server replies with SYN-ACK (synchronize + acknowledge)',
        'Step 3: Client sends ACK (acknowledge)',
        'Connection is now established',
        'Four-way handshake for TCP termination: FIN, ACK, FIN, ACK'
      ]
    },
    {
      id: 'cn-4',
      question: 'What is DNS and how does it work?',
      difficulty: 'Easy',
      tags: ['dns', 'application-layer', 'domain-resolution'],
      timeLimit: 120,
      expectedPoints: [
        'DNS: Domain Name System — translates domain names to IP addresses',
        'Hierarchy: root nameservers → TLD nameservers → authoritative nameservers',
        'DNS resolution: browser cache → OS cache → recursive resolver → root → TLD → authoritative',
        'Records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (nameserver)',
        'Uses UDP port 53 (or TCP for large responses)'
      ]
    },
    {
      id: 'cn-5',
      question: 'Explain HTTP vs HTTPS. How does SSL/TLS work?',
      difficulty: 'Medium',
      tags: ['http', 'https', 'ssl', 'tls', 'security'],
      timeLimit: 180,
      expectedPoints: [
        'HTTP: application layer protocol, plaintext, port 80',
        'HTTPS: HTTP + TLS encryption, port 443',
        'TLS handshake: client hello → server hello + certificate → key exchange → session keys established',
        'Asymmetric encryption for key exchange, symmetric for data',
        'Digital certificates verified by Certificate Authorities (CA)'
      ]
    },
    {
      id: 'cn-6',
      question: 'What is subnetting? How do you calculate subnet masks and the number of hosts?',
      difficulty: 'Medium',
      tags: ['subnetting', 'ip-addressing', 'cidr'],
      timeLimit: 180,
      expectedPoints: [
        'Subnetting: dividing a network into smaller sub-networks',
        'Subnet mask determines network vs host portion of IP',
        'CIDR notation: /24 = 255.255.255.0 = 256 - 2 = 254 usable hosts',
        'Formula: 2^(host bits) - 2 (subtract network and broadcast address)',
        'Example: 192.168.1.0/26 → 64 addresses, 62 usable hosts'
      ]
    },
    {
      id: 'cn-7',
      question: 'What is the difference between routing and switching? What protocols are used in each?',
      difficulty: 'Medium',
      tags: ['routing', 'switching', 'networking'],
      timeLimit: 150,
      expectedPoints: [
        'Switching: operates at Layer 2 (Data Link), uses MAC addresses, within same network',
        'Routing: operates at Layer 3 (Network), uses IP addresses, between different networks',
        'Switching protocols: STP (Spanning Tree Protocol)',
        'Routing protocols: static routing, RIP, OSPF (link-state), BGP (path-vector, used on internet)'
      ]
    },
    {
      id: 'cn-8',
      question: 'What is congestion control in TCP? Explain slow start and congestion avoidance.',
      difficulty: 'Hard',
      tags: ['tcp', 'congestion-control', 'slow-start'],
      timeLimit: 210,
      expectedPoints: [
        'Congestion control prevents sender from overwhelming the network',
        'Slow Start: begin with cwnd=1 MSS, doubles each RTT until ssthresh',
        'Congestion Avoidance: after ssthresh, increase cwnd by 1 MSS per RTT (linear)',
        'Packet loss → ssthresh = cwnd/2, cwnd reset to 1',
        'TCP CUBIC, BBR are modern algorithms used in Linux'
      ]
    },
    {
      id: 'cn-9',
      question: 'What is NAT (Network Address Translation)? Why is it used?',
      difficulty: 'Medium',
      tags: ['nat', 'ip-addressing', 'networking'],
      timeLimit: 150,
      expectedPoints: [
        'NAT: maps private IP addresses to a public IP address',
        'Conserves IPv4 addresses (main motivation)',
        'Types: static NAT (1:1), dynamic NAT, PAT/NAPT (many:1, uses port numbers)',
        'Challenges: breaks end-to-end connectivity, complicates P2P and VoIP',
        'Made less necessary by IPv6'
      ]
    },
    {
      id: 'cn-10',
      question: 'Explain how a CDN (Content Delivery Network) works.',
      difficulty: 'Hard',
      tags: ['cdn', 'distributed-systems', 'web'],
      timeLimit: 180,
      expectedPoints: [
        'CDN: geographically distributed servers that cache content close to users',
        'Reduces latency by serving from nearest edge server',
        'Uses Anycast routing or DNS-based routing to direct users to nearest server',
        'Handles static assets (images, videos, JS), also dynamic content acceleration',
        'Examples: Cloudflare, AWS CloudFront, Akamai'
      ]
    },
  ],

  oop: [
    {
      id: 'oop-1',
      question: 'What are the four pillars of OOP? Briefly explain each.',
      difficulty: 'Easy',
      tags: ['oop', 'pillars', 'fundamentals'],
      timeLimit: 120,
      expectedPoints: [
        'Encapsulation: bundling data and methods, hiding internal implementation',
        'Abstraction: exposing only essential details, hiding complexity',
        'Inheritance: deriving new classes from existing ones, code reuse',
        'Polymorphism: same interface, different implementations (method overriding/overloading)'
      ]
    },
    {
      id: 'oop-2',
      question: 'What is the difference between method overloading and method overriding?',
      difficulty: 'Easy',
      tags: ['overloading', 'overriding', 'polymorphism'],
      timeLimit: 90,
      expectedPoints: [
        'Overloading: same method name, different parameters, resolved at compile time (static polymorphism)',
        'Overriding: subclass provides specific implementation of parent method, resolved at runtime (dynamic polymorphism)',
        'Overloading is within the same class; overriding is between parent and child classes',
        'Overriding requires same method signature'
      ]
    },
    {
      id: 'oop-3',
      question: 'What is the difference between an abstract class and an interface?',
      difficulty: 'Easy',
      tags: ['abstract-class', 'interface', 'oop'],
      timeLimit: 120,
      expectedPoints: [
        'Abstract class: can have both abstract and concrete methods, fields, constructors; single inheritance',
        'Interface: only method signatures (pre-Java 8), multiple inheritance supported',
        'Abstract class: "is-a" relationship; Interface: "can-do" / "has-a behavior" relationship',
        'Use abstract class for shared base behavior; interface for contracts/capabilities'
      ]
    },
    {
      id: 'oop-4',
      question: 'What is the SOLID principle? Explain each principle briefly.',
      difficulty: 'Medium',
      tags: ['solid', 'design-principles', 'oop'],
      timeLimit: 180,
      expectedPoints: [
        'S - Single Responsibility: class has only one reason to change',
        'O - Open/Closed: open for extension, closed for modification',
        'L - Liskov Substitution: subclasses can replace parent without breaking behavior',
        'I - Interface Segregation: no client should depend on methods it does not use',
        'D - Dependency Inversion: depend on abstractions, not concretions'
      ]
    },
    {
      id: 'oop-5',
      question: 'Explain composition vs inheritance. When would you favor composition over inheritance?',
      difficulty: 'Medium',
      tags: ['composition', 'inheritance', 'design'],
      timeLimit: 150,
      expectedPoints: [
        'Inheritance: "is-a" relationship, tight coupling, code reuse via subclassing',
        'Composition: "has-a" relationship, flexible, objects contain instances of other objects',
        'Prefer composition when: behavior needs to change at runtime, avoid deep inheritance hierarchies',
        '"Favor composition over inheritance" is a well-known design principle'
      ]
    },
    {
      id: 'oop-6',
      question: 'What are design patterns? Explain Singleton, Factory, and Observer patterns.',
      difficulty: 'Medium',
      tags: ['design-patterns', 'singleton', 'factory', 'observer'],
      timeLimit: 210,
      expectedPoints: [
        'Design patterns: reusable solutions to common software design problems',
        'Singleton: ensures only one instance of a class; use for DB connection, logger',
        'Factory: creates objects without specifying exact class; promotes loose coupling',
        'Observer: one-to-many dependency; when subject changes, observers notified; event systems, MVC'
      ]
    },
    {
      id: 'oop-7',
      question: 'What is the difference between shallow copy and deep copy?',
      difficulty: 'Easy',
      tags: ['shallow-copy', 'deep-copy', 'memory', 'oop'],
      timeLimit: 90,
      expectedPoints: [
        'Shallow copy: copies references to objects, not the objects themselves',
        'Deep copy: recursively copies all objects, completely independent',
        'Shallow copy: changes to nested objects affect both copies',
        'When to use: deep copy for mutable objects that should be independent'
      ]
    },
    {
      id: 'oop-8',
      question: 'Explain the concept of polymorphism with a real-world example. What is dynamic dispatch?',
      difficulty: 'Medium',
      tags: ['polymorphism', 'dynamic-dispatch', 'virtual-methods'],
      timeLimit: 150,
      expectedPoints: [
        'Polymorphism: same interface, different behavior based on object type',
        'Example: Animal.speak() — Dog barks, Cat meows — same method call, different behavior',
        'Dynamic dispatch: at runtime, correct method is resolved based on actual object type (vtable in C++)',
        'Achieved via virtual functions in C++, all methods are virtual in Java by default'
      ]
    },
    {
      id: 'oop-9',
      question: 'What is dependency injection? What problem does it solve?',
      difficulty: 'Hard',
      tags: ['dependency-injection', 'design-patterns', 'coupling'],
      timeLimit: 180,
      expectedPoints: [
        'DI: providing dependencies to a class from outside rather than creating them internally',
        'Solves: tight coupling between classes, makes code testable',
        'Types: constructor injection, setter injection, interface injection',
        'Frameworks: Spring (Java), Angular, ASP.NET Core use DI containers'
      ]
    },
    {
      id: 'oop-10',
      question: 'What are the differences between static, instance, and class methods? Give examples.',
      difficulty: 'Easy',
      tags: ['static', 'instance-methods', 'class-methods'],
      timeLimit: 120,
      expectedPoints: [
        'Instance method: belongs to object, can access instance variables (self/this)',
        'Class method: belongs to class, can access class variables (cls in Python)',
        'Static method: belongs to class but no access to class or instance, utility function',
        'Example: Math.sqrt() is a static method; object.toString() is an instance method'
      ]
    },
  ],

  systemdesign: [
    {
      id: 'sd-1',
      question: 'What is the difference between horizontal and vertical scaling?',
      difficulty: 'Easy',
      tags: ['scaling', 'system-design', 'distributed'],
      timeLimit: 90,
      expectedPoints: [
        'Vertical scaling (scale up): add more CPU/RAM to existing server; limited by hardware',
        'Horizontal scaling (scale out): add more servers; requires load balancing and stateless design',
        'Horizontal is more fault-tolerant and preferred at large scale',
        'Vertical is simpler but has an upper limit'
      ]
    },
    {
      id: 'sd-2',
      question: 'What is a load balancer? What are the different algorithms it can use?',
      difficulty: 'Easy',
      tags: ['load-balancer', 'system-design', 'scaling'],
      timeLimit: 120,
      expectedPoints: [
        'Load balancer: distributes traffic across multiple servers',
        'Round Robin: requests go to servers in circular order',
        'Least Connections: routes to server with fewest active connections',
        'IP Hash: same client always goes to same server (session persistence)',
        'Weighted Round Robin: servers with higher capacity get more requests'
      ]
    },
    {
      id: 'sd-3',
      question: 'What is caching? Explain different caching strategies.',
      difficulty: 'Medium',
      tags: ['caching', 'redis', 'performance', 'system-design'],
      timeLimit: 180,
      expectedPoints: [
        'Caching: storing frequently accessed data in fast-access storage (Redis, Memcached)',
        'Cache-aside (lazy loading): app checks cache, misses go to DB, then populate cache',
        'Write-through: write to cache and DB simultaneously',
        'Write-back (write-behind): write to cache first, async write to DB',
        'Cache eviction policies: LRU, LFU, FIFO'
      ]
    },
    {
      id: 'sd-4',
      question: 'Design a URL shortener like Bit.ly. What components would you use?',
      difficulty: 'Medium',
      tags: ['system-design', 'url-shortener', 'design'],
      timeLimit: 300,
      expectedPoints: [
        'Functional: shorten URL, redirect when short URL accessed',
        'Estimation: 100M URLs/day, 1:10 write:read ratio',
        'Generate short code: MD5/base62 encoding, or counter-based',
        'Database: key-value store for short→long mapping (Redis/DynamoDB)',
        'Redirect: HTTP 301 (permanent) vs 302 (temporary)',
        'Optional: analytics, custom aliases, expiration'
      ]
    },
    {
      id: 'sd-5',
      question: 'What is a message queue? When would you use RabbitMQ or Kafka?',
      difficulty: 'Medium',
      tags: ['message-queue', 'kafka', 'rabbitmq', 'async'],
      timeLimit: 180,
      expectedPoints: [
        'Message queue: async communication between services, decouples producer from consumer',
        'RabbitMQ: traditional message broker, complex routing, AMQP protocol, good for task queues',
        'Kafka: distributed event log, high throughput, replay capability, good for event streaming and analytics',
        'Use RabbitMQ: job queues, task distribution',
        'Use Kafka: event sourcing, log aggregation, real-time analytics'
      ]
    },
    {
      id: 'sd-6',
      question: 'What are microservices? What are the trade-offs compared to a monolithic architecture?',
      difficulty: 'Medium',
      tags: ['microservices', 'monolith', 'architecture'],
      timeLimit: 180,
      expectedPoints: [
        'Monolith: single deployable unit, simpler to develop initially, harder to scale individual parts',
        'Microservices: independent services per business domain, independently deployable',
        'Pros of microservices: independent scaling, technology freedom, fault isolation',
        'Cons: distributed systems complexity, network latency, service discovery, distributed tracing'
      ]
    },
    {
      id: 'sd-7',
      question: 'Design a chat application like WhatsApp. What are the key components?',
      difficulty: 'Hard',
      tags: ['system-design', 'chat', 'websockets', 'design'],
      timeLimit: 360,
      expectedPoints: [
        'WebSockets for real-time bidirectional communication',
        'Message service + message queue (Kafka) for async delivery',
        'Presence service for online/offline status',
        'Message storage: Cassandra (high write throughput, time-series)',
        'Media storage: S3 + CDN for images/videos',
        'End-to-end encryption (E2EE), push notifications for offline users'
      ]
    },
    {
      id: 'sd-8',
      question: 'What is the difference between synchronous and asynchronous communication in distributed systems?',
      difficulty: 'Medium',
      tags: ['sync', 'async', 'distributed-systems'],
      timeLimit: 150,
      expectedPoints: [
        'Synchronous: caller waits for response (REST APIs, gRPC)',
        'Asynchronous: caller does not wait, response comes later (message queues, events)',
        'Sync: simpler, tighter coupling, harder to scale, cascading failures',
        'Async: decoupled, more resilient but harder to debug and reason about'
      ]
    },
    {
      id: 'sd-9',
      question: 'What is eventual consistency? How does it differ from strong consistency?',
      difficulty: 'Hard',
      tags: ['consistency', 'distributed-systems', 'cap'],
      timeLimit: 180,
      expectedPoints: [
        'Strong consistency: every read sees the most recent write (Zookeeper, RDBMS)',
        'Eventual consistency: system will converge to same state given no new updates (Cassandra, DynamoDB)',
        'Eventual consistency is used in high-availability, geo-distributed systems',
        'Trade-off: availability and latency vs recency of data'
      ]
    },
    {
      id: 'sd-10',
      question: 'Design a rate limiter. What algorithms can be used?',
      difficulty: 'Hard',
      tags: ['rate-limiter', 'system-design', 'api'],
      timeLimit: 300,
      expectedPoints: [
        'Rate limiter: controls number of requests a client can make in a time window',
        'Token Bucket: tokens added at fixed rate, requests consume tokens',
        'Leaky Bucket: requests fill a queue, processed at constant rate',
        'Fixed Window Counter: count requests per fixed window (e.g., per minute)',
        'Sliding Window: more accurate, avoids boundary burst issues',
        'Storage: Redis for distributed rate limiting (atomic INCR + EXPIRE)'
      ]
    },
  ],

  webdev: [
    {
      id: 'web-1',
      question: 'What happens when you type a URL in the browser and press Enter? Walk through the entire process.',
      difficulty: 'Medium',
      tags: ['browser', 'networking', 'dns', 'http'],
      timeLimit: 210,
      expectedPoints: [
        '1. DNS resolution: domain → IP address',
        '2. TCP connection established (three-way handshake)',
        '3. TLS handshake (if HTTPS)',
        '4. HTTP request sent (GET / HTTP/1.1)',
        '5. Server processes request, sends HTTP response',
        '6. Browser parses HTML, builds DOM tree',
        '7. CSS/JS loaded, CSSOM built, render tree created',
        '8. Layout → Paint → Composite (page rendered)'
      ]
    },
    {
      id: 'web-2',
      question: 'What is the difference between localStorage, sessionStorage, and cookies?',
      difficulty: 'Easy',
      tags: ['web-storage', 'cookies', 'browser'],
      timeLimit: 120,
      expectedPoints: [
        'localStorage: persistent, ~5-10MB, not sent to server, available across tabs',
        'sessionStorage: cleared when tab closes, ~5MB, not sent to server, tab-specific',
        'Cookies: sent with every HTTP request, ~4KB, can have expiry, HttpOnly/Secure flags',
        'Use cookies for auth tokens (HttpOnly), localStorage for user preferences'
      ]
    },
    {
      id: 'web-3',
      question: 'What is the difference between REST and GraphQL APIs?',
      difficulty: 'Medium',
      tags: ['rest', 'graphql', 'api-design'],
      timeLimit: 150,
      expectedPoints: [
        'REST: multiple endpoints, fixed response shape, over/under fetching issues',
        'GraphQL: single endpoint, client specifies exact data needed, strongly typed schema',
        'GraphQL solves over-fetching and under-fetching',
        'REST is simpler, better caching support',
        'GraphQL better for complex, highly nested data requirements'
      ]
    },
    {
      id: 'web-4',
      question: 'What is CORS? Why does it exist and how is it handled?',
      difficulty: 'Easy',
      tags: ['cors', 'security', 'http'],
      timeLimit: 120,
      expectedPoints: [
        'CORS: Cross-Origin Resource Sharing — browser security feature',
        'Prevents malicious sites from making requests to another origin on behalf of user',
        'Browser checks for Access-Control-Allow-Origin header in response',
        'Preflight request (OPTIONS) sent for non-simple requests',
        'Server must include appropriate CORS headers to allow cross-origin requests'
      ]
    },
    {
      id: 'web-5',
      question: 'Explain the event loop in JavaScript. What is the difference between the call stack, task queue, and microtask queue?',
      difficulty: 'Medium',
      tags: ['javascript', 'event-loop', 'async'],
      timeLimit: 180,
      expectedPoints: [
        'Call stack: executes synchronous code, LIFO',
        'Task queue (macrotask): setTimeout, setInterval, DOM events',
        'Microtask queue: Promises (.then), queueMicrotask — runs before task queue',
        'Event loop: when call stack is empty, first drains microtask queue, then takes one task from task queue',
        'async/await is syntactic sugar over Promises (microtasks)'
      ]
    },
    {
      id: 'web-6',
      question: 'What is JWT (JSON Web Token)? How does authentication with JWT work?',
      difficulty: 'Medium',
      tags: ['jwt', 'authentication', 'security'],
      timeLimit: 150,
      expectedPoints: [
        'JWT: three parts — Header.Payload.Signature encoded in base64',
        'Stateless: server verifies signature without storing session',
        'Flow: login → server issues JWT → client stores → sends in Authorization header',
        'Signature verification ensures token is not tampered',
        'Downside: cannot be invalidated before expiry (use refresh tokens + blacklisting)'
      ]
    },
    {
      id: 'web-7',
      question: 'What is the critical rendering path in a browser? How do you optimize web performance?',
      difficulty: 'Hard',
      tags: ['browser', 'performance', 'critical-rendering-path'],
      timeLimit: 210,
      expectedPoints: [
        'DOM → CSSOM → Render Tree → Layout → Paint → Composite',
        'CSS is render-blocking; JS is parser-blocking',
        'Optimization: defer/async scripts, preload critical resources, minimize CSS, lazy load images',
        'Reduce render-blocking resources, minimize reflow/repaint',
        'Metrics: LCP, FID/INP, CLS (Core Web Vitals)'
      ]
    },
    {
      id: 'web-8',
      question: 'What are XSS and CSRF attacks? How do you prevent them?',
      difficulty: 'Hard',
      tags: ['security', 'xss', 'csrf', 'web-security'],
      timeLimit: 210,
      expectedPoints: [
        'XSS (Cross-Site Scripting): injecting malicious scripts into web pages',
        'XSS prevention: escape output, Content Security Policy (CSP), HttpOnly cookies',
        'CSRF (Cross-Site Request Forgery): tricks user into making unauthorized request',
        'CSRF prevention: CSRF tokens, SameSite cookie attribute, checking Origin/Referer headers',
        'XSS affects the victim\'s browser; CSRF abuses the victim\'s credentials'
      ]
    },
    {
      id: 'web-9',
      question: 'What is server-side rendering (SSR) vs client-side rendering (CSR)? When would you use each?',
      difficulty: 'Medium',
      tags: ['ssr', 'csr', 'nextjs', 'web'],
      timeLimit: 150,
      expectedPoints: [
        'CSR: HTML shell sent, JavaScript renders content in browser (React SPA)',
        'SSR: full HTML sent from server, hydrated by JavaScript (Next.js)',
        'SSR: better SEO, faster initial load, worse time-to-interactive',
        'CSR: faster subsequent navigation, worse initial load, SEO challenges',
        'Hybrid: SSG (static generation), ISR (incremental static regeneration)'
      ]
    },
    {
      id: 'web-10',
      question: 'Explain WebSockets. How do they differ from HTTP long polling?',
      difficulty: 'Medium',
      tags: ['websockets', 'real-time', 'http'],
      timeLimit: 150,
      expectedPoints: [
        'WebSocket: persistent, full-duplex TCP connection after HTTP upgrade handshake',
        'Long polling: client sends request, server holds until data available, then client re-polls',
        'WebSocket: lower latency, less overhead, true bidirectional',
        'Long polling: workaround, more HTTP overhead, simpler to implement',
        'Use WebSocket for real-time features: chat, live updates, collaborative editing'
      ]
    },
  ],

  corecs: [
    {
      id: 'cs-1',
      question: 'What is the difference between a compiler and an interpreter? Give examples.',
      difficulty: 'Easy',
      tags: ['compiler', 'interpreter', 'programming-languages'],
      timeLimit: 120,
      expectedPoints: [
        'Compiler: translates entire source code to machine code before execution (C, C++)',
        'Interpreter: translates and executes line by line (Python, Ruby)',
        'Just-In-Time (JIT): compiles at runtime (Java JVM, V8 for JS)',
        'Compiler: faster execution but needs compile step',
        'Interpreter: easier debugging, platform-independent, slower execution'
      ]
    },
    {
      id: 'cs-2',
      question: 'What is Big O notation? Why is it important and what does it measure?',
      difficulty: 'Easy',
      tags: ['complexity', 'big-o', 'algorithms'],
      timeLimit: 90,
      expectedPoints: [
        'Big O: upper bound on algorithm time/space complexity as input grows',
        'Measures worst-case growth rate, ignores constants and lower-order terms',
        'Common complexities: O(1), O(log n), O(n), O(n log n), O(n²), O(2^n)',
        'Important for choosing efficient algorithms for large inputs',
        'Omega (Ω) = lower bound, Theta (Θ) = tight bound'
      ]
    },
    {
      id: 'cs-3',
      question: 'What is a finite automaton? What is the difference between DFA and NFA?',
      difficulty: 'Medium',
      tags: ['automata', 'dfa', 'nfa', 'theory-of-computation'],
      timeLimit: 150,
      expectedPoints: [
        'Finite automaton: mathematical model of computation with states and transitions',
        'DFA (Deterministic): exactly one transition per input symbol per state',
        'NFA (Non-deterministic): multiple or zero transitions allowed per symbol',
        'DFAs and NFAs are equivalent in power (both recognize regular languages)',
        'NFA is easier to construct; every NFA can be converted to DFA (subset construction)'
      ]
    },
    {
      id: 'cs-4',
      question: 'What is a context-free grammar? Give an example.',
      difficulty: 'Medium',
      tags: ['cfg', 'formal-languages', 'theory-of-computation'],
      timeLimit: 150,
      expectedPoints: [
        'CFG: set of production rules for generating strings in a language',
        'Components: terminals, non-terminals, start symbol, production rules',
        'Example: S → aSb | ε generates {a^n b^n | n ≥ 0}',
        'Context-free languages are recognized by pushdown automata (PDA)',
        'Used in programming language syntax definition (EBNF, BNF)'
      ]
    },
    {
      id: 'cs-5',
      question: 'What is the P vs NP problem? What does NP-complete mean?',
      difficulty: 'Hard',
      tags: ['p-vs-np', 'complexity-theory', 'algorithms'],
      timeLimit: 210,
      expectedPoints: [
        'P: problems solvable in polynomial time',
        'NP: problems whose solutions can be verified in polynomial time',
        'P vs NP: does P = NP? Unsolved million-dollar problem',
        'NP-complete: hardest problems in NP; if any NP-complete is in P then P=NP',
        'Examples: SAT, Traveling Salesman, Graph Coloring',
        'Practical: use approximation algorithms or heuristics for NP-hard problems'
      ]
    },
    {
      id: 'cs-6',
      question: 'What is the difference between a stack and heap memory? How does memory management work?',
      difficulty: 'Easy',
      tags: ['memory', 'stack', 'heap', 'memory-management'],
      timeLimit: 120,
      expectedPoints: [
        'Stack: automatically managed, LIFO, stores local variables and function calls, fast, limited size',
        'Heap: manually managed (C/C++) or garbage collected (Java, Python), larger, slower allocation',
        'Stack overflow: too deep recursion or too many local variables',
        'Heap fragmentation: free memory scattered in small chunks',
        'Garbage collection: mark-and-sweep, reference counting, generational GC'
      ]
    },
    {
      id: 'cs-7',
      question: 'What is a Turing machine? What is the Church-Turing thesis?',
      difficulty: 'Hard',
      tags: ['turing-machine', 'computability', 'theory'],
      timeLimit: 180,
      expectedPoints: [
        'Turing machine: abstract machine with infinite tape, read/write head, state transition function',
        'Represents most powerful model of computation',
        'Church-Turing thesis: any algorithm can be computed by a Turing machine',
        'Halting problem: undecidable — cannot determine if program halts for all inputs',
        'Decidable vs recognizable vs undecidable languages'
      ]
    },
    {
      id: 'cs-8',
      question: 'What is cache coherence in multiprocessor systems? How is it maintained?',
      difficulty: 'Hard',
      tags: ['cache-coherence', 'multiprocessor', 'computer-architecture'],
      timeLimit: 210,
      expectedPoints: [
        'Cache coherence: ensures all processors see consistent view of memory',
        'Problem: each processor has its own cache, writes may not be immediately visible to others',
        'MESI protocol: Modified, Exclusive, Shared, Invalid states for each cache line',
        'Snooping-based: each cache monitors bus for transactions',
        'Directory-based: scaling alternative for many-core systems'
      ]
    },
    {
      id: 'cs-9',
      question: 'What are the different types of sorting algorithms? Compare merge sort, quick sort, and heap sort.',
      difficulty: 'Medium',
      tags: ['sorting', 'merge-sort', 'quick-sort', 'heap-sort'],
      timeLimit: 180,
      expectedPoints: [
        'Merge sort: O(n log n) always, stable, extra O(n) space, divide and conquer',
        'Quick sort: O(n log n) average, O(n²) worst, in-place, not stable, partition-based',
        'Heap sort: O(n log n) always, in-place, not stable, uses binary heap',
        'Quick sort is fastest in practice due to cache efficiency',
        'Merge sort preferred for linked lists and stability required cases'
      ]
    },
    {
      id: 'cs-10',
      question: 'What is the difference between 32-bit and 64-bit architectures? How does it affect memory addressing?',
      difficulty: 'Medium',
      tags: ['computer-architecture', 'memory-addressing', 'bits'],
      timeLimit: 150,
      expectedPoints: [
        '32-bit: registers and addresses are 32 bits wide, max 4GB RAM (2^32)',
        '64-bit: 64-bit addresses, theoretically 16 exabytes, practically ~256TB',
        '64-bit allows more RAM, larger data types processed in single instruction',
        'Software must be compiled for target architecture',
        'x86_64 is backward compatible with 32-bit x86 code'
      ]
    },
  ],
};

export function getQuestionsByCategory(categoryId, difficulty = null) {
  const cats = questions[categoryId] || [];
  if (!difficulty) return cats;
  return cats.filter(q => q.difficulty === difficulty);
}

export function getRandomQuestions(categoryId, count = 5, difficulty = null) {
  const pool = getQuestionsByCategory(categoryId, difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
