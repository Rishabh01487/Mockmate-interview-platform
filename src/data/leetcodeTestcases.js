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
      { input: '[1,5,8,12,13]\n13', expectedOutput: '[0,2]' },
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
