/**
 * Curated test case database for popular LeetCode problems.
 *
 * LeetCode's judge endpoint is protected by Cloudflare (requires auth + JS
 * challenge), so we can't call it directly from the browser. Instead, we
 * maintain a database of test cases WITH expected outputs for the most
 * popular problems. For problems not in this database, the editor falls
 * back to the example test cases from the problem description (which don't
 * have expected outputs, so they show "Executed" instead of "Accepted").
 *
 * Each entry: { titleSlug, testCases: [{ input, expectedOutput }] }
 *
 * To add more problems, just append to this array. The editor will
 * automatically use these when the titleSlug matches.
 */

export const LEETCODE_TESTCASES = {
  // ── Arrays / Hash Map ──────────────────────────────────────────────────
  'two-sum': {
    functionName: 'twoSum',
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]' },
      { input: '[3,3]\n6', expectedOutput: '[0,1]' },
      { input: '[1,5,8,12,13]\n13', expectedOutput: '[0,2]', acceptAnyValid: true, problemType: 'two-sum' },
      { input: '[0,4,3,0]\n0', expectedOutput: '[0,3]' },
      { input: '[-3,4,3,90]\n0', expectedOutput: '[0,2]' },
    ],
  },

  // ── String / Stack ─────────────────────────────────────────────────────
  'valid-parentheses': {
    functionName: 'isValid',
    testCases: [
      { input: '()', expectedOutput: 'true' },
      { input: '()[]{}', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '([)]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true' },
      { input: '', expectedOutput: 'true' },
      { input: '(', expectedOutput: 'false' },
      { input: ']', expectedOutput: 'false' },
    ],
  },

  'longest-substring-without-repeating-characters': {
    functionName: 'lengthOfLongestSubstring',
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3' },
      { input: 'bbbbb', expectedOutput: '1' },
      { input: 'pwwkew', expectedOutput: '3' },
      { input: '', expectedOutput: '0' },
      { input: ' ', expectedOutput: '1' },
      { input: 'dvdf', expectedOutput: '3' },
      { input: 'anviaj', expectedOutput: '5' },
    ],
  },

  'valid-anagram': {
    functionName: 'isAnagram',
    testCases: [
      { input: 'anagram\nnagaram', expectedOutput: 'true' },
      { input: 'rat\ncar', expectedOutput: 'false' },
      { input: 'a\na', expectedOutput: 'true' },
      { input: 'ab\na', expectedOutput: 'false' },
      { input: 'a\nab', expectedOutput: 'false' },
    ],
  },

  // ── Linked List ────────────────────────────────────────────────────────
  'merge-two-sorted-lists': {
    functionName: 'mergeTwoLists',
    testCases: [
      { input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
      { input: '[]\n[]', expectedOutput: '[]' },
      { input: '[]\n[0]', expectedOutput: '[0]' },
      { input: '[1]\n[2]', expectedOutput: '[1,2]' },
      { input: '[5]\n[1,2,4]', expectedOutput: '[1,2,4,5]' },
    ],
  },

  'reverse-linked-list': {
    functionName: 'reverseList',
    testCases: [
      { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
      { input: '[1,2]', expectedOutput: '[2,1]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[1]', expectedOutput: '[1]' },
      { input: '[1,2,3,4,5,6,7,8,9,10]', expectedOutput: '[10,9,8,7,6,5,4,3,2,1]' },
    ],
  },

  // ── Tree ───────────────────────────────────────────────────────────────
  'invert-binary-tree': {
    functionName: 'invertTree',
    testCases: [
      { input: '[4,2,7,1,3,6,9]', expectedOutput: '[4,7,2,9,6,3,1]' },
      { input: '[2,1,3]', expectedOutput: '[2,3,1]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[1]', expectedOutput: '[1]' },
      { input: '[1,2]', expectedOutput: '[1,null,2]' },
    ],
  },

  // ── Dynamic Programming ────────────────────────────────────────────────
  'climbing-stairs': {
    functionName: 'climbStairs',
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '4', expectedOutput: '5' },
      { input: '5', expectedOutput: '8' },
      { input: '10', expectedOutput: '89' },
      { input: '1', expectedOutput: '1' },
      { input: '45', expectedOutput: '1836311903' },
    ],
  },

  'maximum-subarray': {
    functionName: 'maxSubArray',
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[5,4,-1,7,8]', expectedOutput: '23' },
      { input: '[-1]', expectedOutput: '-1' },
      { input: '[-2,-1]', expectedOutput: '-1' },
      { input: '[-2,1]', expectedOutput: '1' },
      { input: '[1,2,3,4,5]', expectedOutput: '15' },
    ],
  },

  'coin-change': {
    functionName: 'coinChange',
    testCases: [
      { input: '[1,2,5]\n11', expectedOutput: '3' },
      { input: '[2]\n3', expectedOutput: '-1' },
      { input: '[1]\n0', expectedOutput: '0' },
      { input: '[1]\n1', expectedOutput: '1' },
      { input: '[1,2,5]\n100', expectedOutput: '20' },
      { input: '[186,419,83,408]\n6249', expectedOutput: '20' },
    ],
  },

  // ── Arrays / Prefix Sum ────────────────────────────────────────────────
  'product-of-array-except-self': {
    functionName: 'productExceptSelf',
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]' },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]' },
      { input: '[0,0]', expectedOutput: '[0,0]' },
      { input: '[1,2]', expectedOutput: '[2,1]' },
      { input: '[5]', expectedOutput: '[1]' },
    ],
  },

  // ── Binary Search ──────────────────────────────────────────────────────
  'binary-search': {
    functionName: 'search',
    testCases: [
      { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4' },
      { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1' },
      { input: '[5]\n5', expectedOutput: '0' },
      { input: '[5]\n-5', expectedOutput: '-1' },
      { input: '[1,2,3,4,5,6,7,8,9,10]\n1', expectedOutput: '0' },
      { input: '[1,2,3,4,5,6,7,8,9,10]\n10', expectedOutput: '9' },
    ],
  },

  // ── Math ───────────────────────────────────────────────────────────────
  'palindrome-number': {
    functionName: 'isPalindrome',
    testCases: [
      { input: '121', expectedOutput: 'true' },
      { input: '-121', expectedOutput: 'false' },
      { input: '10', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'true' },
      { input: '12321', expectedOutput: 'true' },
      { input: '12345', expectedOutput: 'false' },
      { input: '1001', expectedOutput: 'true' },
    ],
  },

  // ── Two Pointers ───────────────────────────────────────────────────────
  'container-with-most-water': {
    functionName: 'maxArea',
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49' },
      { input: '[1,1]', expectedOutput: '1' },
      { input: '[4,3,2,1,4]', expectedOutput: '16' },
      { input: '[1,2,1]', expectedOutput: '2' },
      { input: '[1,2]', expectedOutput: '1' },
      { input: '[2,3,4,5,18,17,6]', expectedOutput: '17' },
    ],
  },

  'trapping-rain-water': {
    functionName: 'trap',
    testCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6' },
      { input: '[4,2,0,3,2,5]', expectedOutput: '9' },
      { input: '[0,0,0,0]', expectedOutput: '0' },
      { input: '[1,2,3,4,5]', expectedOutput: '0' },
      { input: '[5,4,3,2,1]', expectedOutput: '0' },
      { input: '[3,0,3]', expectedOutput: '3' },
      { input: '[2,0,2]', expectedOutput: '2' },
      { input: '[5,2,1,2,1,5]', expectedOutput: '10' },
    ],
  },

  '3sum': {
    functionName: 'threeSum',
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]' },
      { input: '[0,1,1]', expectedOutput: '[]' },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[0]', expectedOutput: '[]' },
    ],
  },

  'two-sum-ii-input-array-is-sorted': {
    functionName: 'twoSum',
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[1,2]' },
      { input: '[2,3,4]\n6', expectedOutput: '[1,3]' },
      { input: '[-1,0]\n-1', expectedOutput: '[1,2]' },
    ],
  },

  // ── Sliding Window ─────────────────────────────────────────────────────
  'minimum-size-subarray-sum': {
    functionName: 'minSubArrayLen',
    testCases: [
      { input: '7\n[2,3,1,2,4,3]', expectedOutput: '2' },
      { input: '4\n[1,4,4]', expectedOutput: '1' },
      { input: '11\n[1,1,1,1,1,1,1,1]', expectedOutput: '0' },
    ],
  },

  // ── Stack ──────────────────────────────────────────────────────────────
  'evaluate-reverse-polish-notation': {
    functionName: 'evalRPN',
    testCases: [
      { input: '["2","1","+","3","*"]', expectedOutput: '9' },
      { input: '["4","13","5","/","+"]', expectedOutput: '6' },
      { input: '["10","6","9","3","+","-11","*","/","*","17","+","5","+"]', expectedOutput: '22' },
    ],
  },

  // ── Graph / BFS / DFS ──────────────────────────────────────────────────
  'number-of-islands': {
    functionName: 'numIslands',
    testCases: [
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expectedOutput: '3' },
      { input: '[["1"]]', expectedOutput: '1' },
      { input: '[["0"]]', expectedOutput: '0' },
      { input: '[["1","1","1"],["0","1","0"],["1","1","1"]]', expectedOutput: '1' },
    ],
  },

  // ── Heap ───────────────────────────────────────────────────────────────
  'kth-largest-element-in-a-stream': {
    functionName: 'kthLargest',
    testCases: [
      { input: '3\n[4,5,8,2]', expectedOutput: '4' },
    ],
  },

  // ── Bit Manipulation ───────────────────────────────────────────────────
  'single-number': {
    functionName: 'singleNumber',
    testCases: [
      { input: '[2,2,1]', expectedOutput: '1' },
      { input: '[4,1,2,1,2]', expectedOutput: '4' },
      { input: '[1]', expectedOutput: '1' },
      { input: '[-1,-1,-2]', expectedOutput: '-2' },
    ],
  },

  // ── Design ─────────────────────────────────────────────────────────────
  'lru-cache': {
    functionName: 'LRUCache',
    isDesign: true,
    testCases: [
      { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', expectedOutput: '[null,null,null,1,null,-1,null,-1,3,4]' },
      { input: '["LRUCache","get","put","get","put","put","get","get"]\n[[2],[2],[2,6],[1],[1,5],[1,2],[1],[2]]', expectedOutput: '[null,-1,null,-1,null,null,2,6]' },
    ],
  },

  // ── Matrix ─────────────────────────────────────────────────────────────
  'set-matrix-zeroes': {
    functionName: 'setZeroes',
    testCases: [
      { input: '[[1,1,1],[1,0,1],[1,1,1]]', expectedOutput: '[[1,0,1],[0,0,0],[1,0,1]]' },
      { input: '[[0,1,2,0],[3,4,5,2],[1,3,1,5]]', expectedOutput: '[[0,0,0,0],[0,4,5,0],[0,3,1,0]]' },
    ],
  },

  'spiral-matrix': {
    functionName: 'spiralOrder',
    testCases: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', expectedOutput: '[1,2,3,6,9,8,7,4,5]' },
      { input: '[[1,2,3,4],[5,6,7,8],[9,10,11,12]]', expectedOutput: '[1,2,3,4,8,12,11,10,9,5,6,7]' },
      { input: '[[1]]', expectedOutput: '[1]' },
      { input: '[[1,2],[3,4]]', expectedOutput: '[1,2,4,3]' },
    ],
  },

  // ── String ─────────────────────────────────────────────────────────────
  'group-anagrams': {
    functionName: 'groupAnagrams',
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: '[""]', expectedOutput: '[[""]]' },
      { input: '["a"]', expectedOutput: '[["a"]]' },
    ],
  },

  'longest-palindromic-substring': {
    functionName: 'longestPalindrome',
    testCases: [
      { input: 'babad', expectedOutput: 'bab' },
      { input: 'cbbd', expectedOutput: 'bb' },
      { input: 'a', expectedOutput: 'a' },
      { input: 'ac', expectedOutput: 'a' },
    ],
  },

  // ── Interval ───────────────────────────────────────────────────────────
  'merge-intervals': {
    functionName: 'merge',
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
      { input: '[[1,4],[2,3]]', expectedOutput: '[[1,4]]' },
      { input: '[]', expectedOutput: '[]' },
      { input: '[[1,4]]', expectedOutput: '[[1,4]]' },
    ],
  },
};

/**
 * Look up test cases for a LeetCode problem by its titleSlug.
 * Returns an array of { input, expectedOutput } or null if not found.
 */
export function getTestCasesFor(titleSlug) {
  const entry = LEETCODE_TESTCASES[titleSlug];
  if (!entry) return null;
  return entry.testCases;
}

/**
 * Get the expected function name for a problem (used for design problems
 * where the class name matters).
 */
export function getFunctionNameFor(titleSlug) {
  return LEETCODE_TESTCASES[titleSlug]?.functionName || null;
}

/**
 * Check if a problem is a design problem (multiple methods).
 */
export function isDesignProblem(titleSlug) {
  return !!LEETCODE_TESTCASES[titleSlug]?.isDesign;
}

/**
 * Reference solutions for auto-verification.
 *
 * When a problem has a reference solution, the editor can generate expected
 * outputs for ANY test input by running the reference solution. This means
 * we don't need to hardcode expected outputs — we just need a correct
 * solution, and the system will verify the user's output against it.
 *
 * This is how real judges work: they run a known-correct solution to
 * generate expected outputs, then compare the user's output.
 *
 * Each entry: { titleSlug, solution (JS function), functionName }
 * The solution is a JS function that takes the same arguments as the
 * LeetCode problem and returns the expected output.
 */
export const REFERENCE_SOLUTIONS = {
  'two-sum': {
    functionName: 'twoSum',
    solution: (nums, target) => {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
      }
      return [];
    },
  },
  'valid-parentheses': {
    functionName: 'isValid',
    solution: (s) => {
      const st = [], m = { ')': '(', '}': '{', ']': '[' };
      for (const c of s) {
        if ('({['.includes(c)) st.push(c);
        else if (st.pop() !== m[c]) return false;
      }
      return st.length === 0;
    },
  },
  'palindrome-number': {
    functionName: 'isPalindrome',
    solution: (x) => {
      if (x < 0) return false;
      const s = String(x);
      return s === s.split('').reverse().join('');
    },
  },
  'roman-to-integer': {
    functionName: 'romanToInt',
    solution: (s) => {
      const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let r = 0;
      for (let i = 0; i < s.length; i++) {
        if (i + 1 < s.length && v[s[i]] < v[s[i + 1]]) r -= v[s[i]];
        else r += v[s[i]];
      }
      return r;
    },
  },
  'longest-common-prefix': {
    functionName: 'longestCommonPrefix',
    solution: (strs) => {
      if (!strs.length) return '';
      let p = strs[0];
      for (const s of strs) while (!s.startsWith(p)) p = p.slice(0, -1);
      return p;
    },
  },
  'remove-duplicates-from-sorted-array': {
    functionName: 'removeDuplicates',
    solution: (nums) => {
      if (!nums.length) return 0;
      let k = 1;
      for (let i = 1; i < nums.length; i++) if (nums[i] !== nums[i - 1]) nums[k++] = nums[i];
      return k;
    },
  },
  'remove-element': {
    functionName: 'removeElement',
    solution: (nums, val) => {
      let k = 0;
      for (let i = 0; i < nums.length; i++) if (nums[i] !== val) nums[k++] = nums[i];
      return k;
    },
  },
  'search-insert-position': {
    functionName: 'searchInsert',
    solution: (nums, target) => {
      let l = 0, r = nums.length;
      while (l < r) { const m = (l + r) >> 1; if (nums[m] < target) l = m + 1; else r = m; }
      return l;
    },
  },
  'length-of-last-word': {
    functionName: 'lengthOfLastWord',
    solution: (s) => {
      const w = s.trim().split(' ');
      return w[w.length - 1].length;
    },
  },
  'plus-one': {
    functionName: 'plusOne',
    solution: (digits) => {
      for (let i = digits.length - 1; i >= 0; i--) {
        if (digits[i] < 9) { digits[i]++; return digits; }
        digits[i] = 0;
      }
      return [1, ...digits];
    },
  },
  'add-binary': {
    functionName: 'addBinary',
    solution: (a, b) => {
      return (BigInt('0b' + a) + BigInt('0b' + b)).toString(2);
    },
  },
  'sqrtx': {
    functionName: 'mySqrt',
    solution: (x) => Math.floor(Math.sqrt(x)),
  },
  'climbing-stairs': {
    functionName: 'climbStairs',
    solution: (n) => {
      if (n <= 2) return n;
      let a = 1, b = 2;
      for (let i = 3; i <= n; i++) [a, b] = [b, a + b];
      return b;
    },
  },
  'merge-sorted-array': {
    functionName: 'merge',
    solution: (nums1, m, nums2, n) => {
      let i = m - 1, j = n - 1, k = m + n - 1;
      while (j >= 0) {
        if (i >= 0 && nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
        else nums1[k--] = nums2[j--];
      }
      return nums1.slice(0, m + n);
    },
  },
  'binary-tree-inorder-traversal': {
    functionName: 'inorderTraversal',
    solution: (root) => {
      const r = [];
      const f = (n) => { if (!n) return; f(n.left); r.push(n.val); f(n.right); };
      f(root);
      return r;
    },
  },
  'symmetric-tree': {
    functionName: 'isSymmetric',
    solution: (root) => {
      const f = (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a.val === b.val && f(a.left, b.right) && f(a.right, b.left);
      };
      return f(root, root);
    },
  },
  'maximum-depth-of-binary-tree': {
    functionName: 'maxDepth',
    solution: (root) => {
      if (!root) return 0;
      return 1 + Math.max(solution(root.left), solution(root.right));
      function solution(n) { return n ? 1 + Math.max(solution(n.left), solution(n.right)) : 0; }
    },
  },
  'balanced-binary-tree': {
    functionName: 'isBalanced',
    solution: (root) => {
      const f = (n) => {
        if (!n) return 0;
        const l = f(n.left), r = f(n.right);
        if (l === -1 || r === -1 || Math.abs(l - r) > 1) return -1;
        return 1 + Math.max(l, r);
      };
      return f(root) !== -1;
    },
  },
  'minimum-depth-of-binary-tree': {
    functionName: 'minDepth',
    solution: (root) => {
      if (!root) return 0;
      if (!root.left) return 1 + solution(root.right);
      if (!root.right) return 1 + solution(root.left);
      return 1 + Math.min(solution(root.left), solution(root.right));
      function solution(n) { if (!n) return 0; if (!n.left) return 1 + solution(n.right); if (!n.right) return 1 + solution(n.left); return 1 + Math.min(solution(n.left), solution(n.right)); }
    },
  },
  'path-sum': {
    functionName: 'hasPathSum',
    solution: (root, targetSum) => {
      if (!root) return false;
      if (!root.left && !root.right) return root.val === targetSum;
      return solution(root.left, targetSum - root.val) || solution(root.right, targetSum - root.val);
      function solution(n, t) { if (!n) return false; if (!n.left && !n.right) return n.val === t; return solution(n.left, t - n.val) || solution(n.right, t - n.val); }
    },
  },
  'pascals-triangle': {
    functionName: 'generate',
    solution: (numRows) => {
      const r = [];
      for (let i = 0; i < numRows; i++) {
        const row = Array(i + 1).fill(1);
        for (let j = 1; j < i; j++) row[j] = r[i - 1][j - 1] + r[i - 1][j];
        r.push(row);
      }
      return r;
    },
  },
  'pascals-triangle-ii': {
    functionName: 'getRow',
    solution: (rowIndex) => {
      const row = [1];
      for (let i = 0; i < rowIndex; i++) {
        for (let j = i + 1; j > 0; j--) row[j] = (row[j] || 0) + row[j - 1];
        row[0] = 1;
      }
      return row;
    },
  },
  'best-time-to-buy-and-sell-stock': {
    functionName: 'maxProfit',
    solution: (prices) => {
      let min = Infinity, max = 0;
      for (const p of prices) { min = Math.min(min, p); max = Math.max(max, p - min); }
      return max;
    },
  },
  'valid-palindrome': {
    functionName: 'isPalindrome',
    solution: (s) => {
      const c = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return c === c.split('').reverse().join('');
    },
  },
  'single-number': {
    functionName: 'singleNumber',
    solution: (nums) => nums.reduce((a, b) => a ^ b, 0),
  },
  'linked-list-cycle': {
    functionName: 'hasCycle',
    solution: (head) => {
      let slow = head, fast = head;
      while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) return true; }
      return false;
    },
  },
  'intersection-of-two-linked-lists': {
    functionName: 'getIntersectionNode',
    solution: (headA, headB) => {
      let a = headA, b = headB;
      while (a !== b) { a = a ? a.next : headB; b = b ? b.next : headA; }
      return a;
    },
  },
  'missing-number': {
    functionName: 'missingNumber',
    solution: (nums) => {
      const n = nums.length;
      return n * (n + 1) / 2 - nums.reduce((a, b) => a + b, 0);
    },
  },
  'move-zeroes': {
    functionName: 'moveZeroes',
    solution: (nums) => {
      let j = 0;
      for (let i = 0; i < nums.length; i++) if (nums[i] !== 0) [nums[j++], nums[i]] = [nums[i], nums[j]];
      return nums;
    },
  },
  'word-pattern': {
    functionName: 'wordPattern',
    solution: (pattern, s) => {
      const w = s.split(' ');
      if (pattern.length !== w.length) return false;
      const m1 = {}, m2 = {};
      for (let i = 0; i < pattern.length; i++) {
        if (m1[pattern[i]] !== m2[w[i]]) return false;
        m1[pattern[i]] = i; m2[w[i]] = i;
      }
      return true;
    },
  },
  'range-sum-query-immutable': {
    functionName: 'NumArray',
    isDesign: true,
    solution: (nums) => {
      // Design problem — skip auto-verification
      return null;
    },
  },
  'is-subsequence': {
    functionName: 'isSubsequence',
    solution: (s, t) => {
      let i = 0;
      for (const c of t) if (i < s.length && c === s[i]) i++;
      return i === s.length;
    },
  },
  'merge-two-binary-trees': {
    functionName: 'mergeTrees',
    solution: (root1, root2) => {
      if (!root1) return root2;
      if (!root2) return root1;
      root1.val += root2.val;
      root1.left = solution(root1.left, root2.left);
      root1.right = solution(root1.right, root2.right);
      return root1;
      function solution(a, b) { if (!a) return b; if (!b) return a; a.val += b.val; a.left = solution(a.left, b.left); a.right = solution(a.right, b.right); return a; }
    },
  },
  'detect-capital': {
    functionName: 'detectCapitalUse',
    solution: (word) => {
      if (word === word.toUpperCase()) return true;
      if (word === word.toLowerCase()) return true;
      if (word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) return true;
      return false;
    },
  },
  'find-the-difference': {
    functionName: 'findTheDifference',
    solution: (s, t) => {
      let r = 0;
      for (const c of s + t) r ^= c.charCodeAt(0);
      return String.fromCharCode(r);
    },
  },
  'find-all-numbers-disappeared-in-an-array': {
    functionName: 'findDisappearedNumbers',
    solution: (nums) => {
      const r = [];
      for (let i = 0; i < nums.length; i++) {
        const idx = Math.abs(nums[i]) - 1;
        if (nums[idx] > 0) nums[idx] = -nums[idx];
      }
      for (let i = 0; i < nums.length; i++) if (nums[i] > 0) r.push(i + 1);
      return r;
    },
  },
  'hamming-distance': {
    functionName: 'hammingDistance',
    solution: (x, y) => (x ^ y).toString(2).split('').filter(c => c === '1').length,
  },
  'number-complement': {
    functionName: 'findComplement',
    solution: (num) => {
      const b = num.toString(2);
      return parseInt(b.split('').map(c => c === '1' ? '0' : '1').join(''), 2);
    },
  },
  'reverse-words-in-a-string-iii': {
    functionName: 'reverseWords',
    solution: (s) => s.split(' ').map(w => w.split('').reverse().join('')).join(' '),
  },
  'average-of-levels-in-binary-tree': {
    functionName: 'averageOfLevels',
    solution: (root) => {
      const r = [];
      const q = root ? [root] : [];
      while (q.length) {
        const n = q.length, sum = q.reduce((a, b) => a + b.val, 0);
        r.push(sum / n);
        for (let i = 0; i < n; i++) {
          const node = q.shift();
          if (node.left) q.push(node.left);
          if (node.right) q.push(node.right);
        }
      }
      return r;
    },
  },
  'maximum-product-of-three-numbers': {
    functionName: 'maximumProduct',
    solution: (nums) => {
      nums.sort((a, b) => a - b);
      const n = nums.length;
      return Math.max(nums[0] * nums[1] * nums[n - 1], nums[n - 3] * nums[n - 2] * nums[n - 1]);
    },
  },
  'kth-largest-element-in-a-stream': {
    functionName: 'KthLargest',
    isDesign: true,
    solution: () => null,
  },
  'peak-index-in-a-mountain-array': {
    functionName: 'peakIndexInMountainArray',
    solution: (arr) => arr.indexOf(Math.max(...arr)),
  },
  'leaf-similar-trees': {
    functionName: 'leafSimilar',
    solution: (root1, root2) => {
      const l1 = [], l2 = [];
      const f = (n, l) => { if (!n) return; if (!n.left && !n.right) l.push(n.val); f(n.left, l); f(n.right, l); };
      f(root1, l1); f(root2, l2);
      return JSON.stringify(l1) === JSON.stringify(l2);
    },
  },
  'robot-return-to-origin': {
    functionName: 'judgeCircle',
    solution: (moves) => {
      let x = 0, y = 0;
      for (const m of moves) { if (m === 'U') y++; if (m === 'D') y--; if (m === 'L') x--; if (m === 'R') x++; }
      return x === 0 && y === 0;
    },
  },
  'backspace-string-compare': {
    functionName: 'backspaceCompare',
    solution: (s, t) => {
      const f = (str) => { const r = []; for (const c of str) { if (c === '#') r.pop(); else r.push(c); } return r.join(''); };
      return f(s) === f(t);
    },
  },
  'min-stack': {
    functionName: 'MinStack',
    isDesign: true,
    solution: () => null,
  },
  'reverse-string': {
    functionName: 'reverseString',
    solution: (s) => { s.reverse(); return s; },
  },
  'middle-of-the-linked-list': {
    functionName: 'middleNode',
    solution: (head) => {
      let slow = head, fast = head;
      while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
      return slow;
    },
  },
  'uncommon-words-from-two-sentences': {
    functionName: 'uncommonFromSentences',
    solution: (s1, s2) => {
      const count = {};
      for (const w of (s1 + ' ' + s2).split(' ')) count[w] = (count[w] || 0) + 1;
      return Object.keys(count).filter(w => count[w] === 1);
    },
  },
};

/**
 * Get the reference solution for a problem.
 * Returns { functionName, solution, isDesign } or null.
 */
export function getReferenceSolution(titleSlug) {
  return REFERENCE_SOLUTIONS[titleSlug] || null;
}

/**
 * Generate expected output for a test input using the reference solution.
 * Returns the expected output as a string, or null if no reference solution.
 */
export function generateExpectedOutput(titleSlug, input) {
  const ref = REFERENCE_SOLUTIONS[titleSlug];
  if (!ref || ref.isDesign || !ref.solution) return null;

  try {
    // Parse the input (one value per line)
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const args = lines.map(line => {
      if (line === 'true') return true;
      if (line === 'false') return false;
      if (line.startsWith('[')) {
        try { return JSON.parse(line); } catch { return line; }
      }
      if (/^-?\d+$/.test(line)) return parseInt(line, 10);
      if (/^-?\d+\.\d+$/.test(line)) return parseFloat(line);
      return line;
    });

    const result = ref.solution(...args);

    // Format the result
    if (typeof result === 'boolean') return result ? 'true' : 'false';
    if (typeof result === 'number') return String(result);
    if (typeof result === 'string') return result;
    if (Array.isArray(result)) return JSON.stringify(result);
    if (result === null || result === undefined) return 'null';
    return JSON.stringify(result);
  } catch (err) {
    console.warn('[Reference solution] Error:', err.message);
    return null;
  }
}

/**
 * Custom validators for problems with multiple valid outputs.
 * Returns true if the user's output is a valid answer for the given input,
 * even if it differs from the reference solution's output.
 *
 * Example: Two Sum — any [i,j] where nums[i]+nums[j]==target is valid,
 * not just the specific pair the reference solution returns.
 */
export function isValidAnswer(titleSlug, input, actualOutput) {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

  // ── Two Sum: accept any valid pair ──
  if (titleSlug === 'two-sum' || titleSlug === 'two-sum-ii-input-array-is-sorted') {
    try {
      const nums = JSON.parse(lines[0]);
      const target = parseInt(lines[1], 10);
      const pair = JSON.parse(actualOutput);
      if (!Array.isArray(pair) || pair.length !== 2) return false;
      const [i, j] = pair;
      if (i < 0 || j < 0 || i >= nums.length || j >= nums.length || i === j) return false;
      return nums[i] + nums[j] === target;
    } catch { return false; }
  }

  // ── 3Sum: accept any valid set of triplets ──
  if (titleSlug === '3sum') {
    try {
      const nums = JSON.parse(lines[0]);
      const triplets = JSON.parse(actualOutput);
      if (!Array.isArray(triplets)) return false;
      for (const t of triplets) {
        if (!Array.isArray(t) || t.length !== 3) return false;
        const [a, b, c] = t;
        if (a < 0 || b < 0 || c < 0 || a >= nums.length || b >= nums.length || c >= nums.length) return false;
        if (nums[a] + nums[b] + nums[c] !== 0) return false;
      }
      return true;
    } catch { return false; }
  }

  // ── Group Anagrams: accept any valid grouping ──
  if (titleSlug === 'group-anagrams') {
    try {
      const strs = JSON.parse(lines[0]);
      const groups = JSON.parse(actualOutput);
      if (!Array.isArray(groups)) return false;
      // Check every string is in exactly one group, and each group has anagrams
      const seen = new Set();
      for (const group of groups) {
        if (!Array.isArray(group) || group.length === 0) return false;
        const sorted = group[0].split('').sort().join('');
        for (const s of group) {
          if (seen.has(s)) return false;
          seen.add(s);
          if (s.split('').sort().join('') !== sorted) return false;
        }
      }
      return seen.size === strs.length;
    } catch { return false; }
  }

  // ── Default: exact match ──
  return null; // null means "no custom validator, use exact match"
}

