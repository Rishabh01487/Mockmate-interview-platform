/**
 * LeetCode-style Code Editor for Mockmate
 * ----------------------------------------
 * Drop-in replacement for src/components/CodeEditor.jsx
 *
 * Props (exactly what InterviewRoom.jsx already passes):
 *   - question: { id, question, difficulty, problemStatement, constraints,
 *                 examples, testCases, starterCode, tags, timeLimit }
 *   - onSubmit: (result) => void
 *   - readOnly: boolean
 *
 * Works for ALL 14 coding questions in Mockmate's question bank:
 *   - Primitives (int, string, bool): Valid Parentheses, Climbing Stairs, etc.
 *   - 1D arrays: Two Sum, Maximum Subarray, Binary Search, etc.
 *   - 2D arrays: Number of Islands
 *   - Linked lists: Merge Two Sorted Lists, Reverse Linked List (auto ListNode ser/de)
 *   - Trees: Invert Binary Tree (auto TreeNode ser/de, level-order)
 *   - Design problems: LRU Cache (operation-sequence execution model)
 *
 * Execution backends:
 *   - JavaScript → in-browser sandboxed `new Function` (with ListNode/TreeNode injection)
 *   - Python     → in-browser via Pyodide (CPython WASM, lazy-loaded)
 *   - C++        → Wandbox public API (clang C++23, auto-generates main() with type-aware parsing)
 *   - Java       → graceful fallback to Mockmate's backend/judge/runners/java.js
 *
 * Install: npm install @monaco-editor/react monaco-editor
 * Keyboard: Ctrl/Cmd+Enter = Run, Ctrl/Cmd+Shift+Enter = Submit
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { API_BASE } from '../config/api.js';
import { getTestCasesFor, getReferenceSolution, generateExpectedOutput, isValidAnswer } from '../data/leetcodeTestcases.js';

// ── Language metadata ────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
  { id: 'python', label: 'Python', monacoLang: 'python' },
  { id: 'java', label: 'Java', monacoLang: 'java' },
  { id: 'cpp', label: 'C++', monacoLang: 'cpp' },
];

// ── LeetCode palette ─────────────────────────────────────────────────────────
const LC = {
  bg: '#1a1a1a', panel: '#1f1f1f', panelAlt: '#262626',
  border: '#333333', borderLight: '#404040',
  text: '#d4d4d4', textDim: '#858585', textMute: '#5a5a5a',
  accent: '#ffa116', accepted: '#00b8a3', wrong: '#ef4444', warning: '#f0a830',
  hover: '#2a2a2a',
};

const normalize = (s) => String(s ?? '').replace(/\r/g, '').replace(/\s+$/g, '').trim();

// ── Question type detection ──────────────────────────────────────────────────
// Inspects the starter code + tags to figure out what kind of LeetCode question
// this is, so we know how to serialize/deserialize inputs and outputs.
function detectQuestionType(question, code) {
  const tags = (question.tags || []).join(' ').toLowerCase();
  const isDesign = /\bclass\s+\w+\s*[{(]/.test(code) && !/class\s+Solution\b/.test(code);

  // Extract parameter names from `function foo(a, b, c)` or `def foo(self, a, b)`
  const fnMatch = code.match(/(?:function|def)\s+\w+\s*\(([^)]*)\)/);
  const paramsRaw = fnMatch ? fnMatch[1] : '';
  const params = paramsRaw.split(',').map(p => p.trim().replace(/^self[:,]?/, '').trim()).filter(Boolean);

  const isLinkedList = tags.includes('linked-list') ||
    params.some(p => /^(head|list1|list2|list|l1|l2)$/.test(p));
  const isTree = tags.includes('trees') || tags.includes('tree') ||
    params.some(p => /^(root|tree|node)$/.test(p));

  return { isDesign, isLinkedList, isTree, params };
}

// ── ListNode / TreeNode definitions ─────────────────────────────────────────
// These are defined as REAL functions at module level (so they're available
// for argument preparation outside the wrapper) AND their source is injected
// into the user code wrapper (so the user's code can use ListNode/TreeNode).

function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}
function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}
function _arrayToList(arr) {
  const dummy = new ListNode(0);
  let cur = dummy;
  for (const v of arr) { cur.next = new ListNode(v); cur = cur.next; }
  return dummy.next;
}
function _listToArray(head) {
  const out = [];
  while (head) { out.push(head.val); head = head.next; }
  return out;
}
function _arrayToTree(arr) {
  if (!arr || arr.length === 0 || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length && i < arr.length) {
    const node = queue.shift();
    if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); queue.push(node.left); }
    i++;
    if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); queue.push(node.right); }
    i++;
  }
  return root;
}
function _treeToArray(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node) { out.push(node.val); queue.push(node.left); queue.push(node.right); }
    else { out.push(null); }
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

// String version to inject into the user code wrapper (so user code can use ListNode etc.)
const JS_LISTNODE_TREECODE = `
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}
function TreeNode(val, left, right) {
  this.val = (val === undefined ? 0 : val);
  this.left = (left === undefined ? null : left);
  this.right = (right === undefined ? null : right);
}
`;

// ── Parse a single test case input line into JS values ──────────────────────
function parseJsValue(raw) {
  // Handle non-string values (e.g. numbers from parsed JSON arrays in design problems)
  if (typeof raw !== 'string') return raw;
  const s = raw.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  // Try JSON (arrays, strings, 2D arrays)
  if (s.startsWith('[') || s.startsWith('"') || s.startsWith("'")) {
    try { return JSON.parse(s); } catch { /* fall through */ }
  }
  return s; // bare string
}

// ── JavaScript runner ────────────────────────────────────────────────────────
function runJavaScript(code, testCases, question) {
  const { isDesign, isLinkedList, isTree } = detectQuestionType(question, code);
  const results = [];

  // Find the function name (or class name for design problems)
  let fnName = null, className = null;
  if (isDesign) {
    const m = code.match(/class\s+(\w+)/);
    className = m ? m[1] : null;
  } else {
    const patterns = [
      /function\s+([a-zA-Z_$][\w$]*)\s*\(/,
      /(?:var|let|const)\s+([a-zA-Z_$][\w$]*)\s*=\s*function/,
      /(?:var|let|const)\s+([a-zA-Z_$][\w$]*)\s*=\s*\(/,
    ];
    for (const re of patterns) {
      const m = code.match(re);
      if (m) { fnName = m[1]; break; }
    }
  }

  if (!isDesign && !fnName) {
    return { results: [], compileError: 'Could not detect a function to call. Declare your solution as `function solution(...)`.' };
  }
  if (isDesign && !className) {
    return { results: [], compileError: 'Could not detect a class to instantiate. Declare your solution as `class Solution { ... }`.' };
  }

  // For each test case, run the code in an isolated scope
  for (const tc of testCases) {
    const stdout = [];
    const sandboxConsole = {
      log: (...a) => stdout.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')),
    };
    const start = performance.now();
    try {
      let actual;

      if (isDesign) {
        // Design problem: input is two lines — operations and args
        // e.g. ["LRUCache","put","get"]\n[[2],[1,1],[1]]
        const lines = tc.input.split('\n').filter(l => l.trim());
        const ops = JSON.parse(lines[0]);
        const argsList = JSON.parse(lines[1]);
        const wrapper = new Function('console', `${JS_LISTNODE_TREECODE}\n${code}\n;return ${className};`);
        const Cls = wrapper(sandboxConsole);
        let instance = null;
        const out = [];
        for (let i = 0; i < ops.length; i++) {
          const op = ops[i];
          const args = (argsList[i] || []).map(parseJsValue);
          if (i === 0) {
            instance = new Cls(...args);
            out.push(null);
          } else {
            const r = instance[op](...args);
            out.push(r === undefined ? null : r);
          }
        }
        actual = JSON.stringify(out);
      } else {
        // Standard function call
        const wrapper = new Function('console', `"use strict";\n${JS_LISTNODE_TREECODE}\n${code}\n;return (typeof ${fnName} !== 'undefined') ? ${fnName} : null;`);
        const fn = wrapper(sandboxConsole);
        if (typeof fn !== 'function') {
          return { results: [], compileError: `Could not find function "${fnName}" in your code.` };
        }

        // Parse arguments based on type
        const inputLines = tc.input.split('\n').filter(l => l.trim());
        const args = inputLines.map(raw => {
          const parsed = parseJsValue(raw);
          if (isLinkedList && Array.isArray(parsed)) return _arrayToList(parsed);
          if (isTree && Array.isArray(parsed)) return _arrayToTree(parsed);
          return parsed;
        });

        const result = fn(...args);

        // Format result based on type
        if (isLinkedList && result && typeof result === 'object' && 'val' in result) {
          actual = JSON.stringify(_listToArray(result));
        } else if (isTree && result && typeof result === 'object' && 'val' in result) {
          actual = JSON.stringify(_treeToArray(result));
        } else if (result === undefined) {
          actual = 'undefined';
        } else if (result === null) {
          actual = 'null';
        } else if (typeof result === 'string') {
          actual = result;
        } else if (typeof result === 'boolean') {
          actual = result ? 'true' : 'false';
        } else {
          actual = JSON.stringify(result);
        }
      }

      results.push({
        input: tc.input,
        expected: '',
        actual,
        passed: false,
        stdout,
        elapsedMs: performance.now() - start,
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: '',
        actual: '',
        passed: false,
        stdout,
        error: err?.message ?? String(err),
        elapsedMs: performance.now() - start,
      });
    }
  }
  return { results };
}

// ── Python runner (Pyodide) ─────────────────────────────────────────────────
const PYODIDE_VERSION = '0.26.2';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let pyodidePromise = null;

function loadPyodide() {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    if (typeof window !== 'undefined' && !window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PYODIDE_BASE + 'pyodide.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Pyodide from CDN'));
        document.head.appendChild(s);
      });
    }
    if (!window.loadPyodide) throw new Error('Pyodide loader not available');
    return window.loadPyodide({ indexURL: PYODIDE_BASE });
  })();
  return pyodidePromise;
}

const PY_LISTNODE_TREECODE = `
import json
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
def _array_to_list(arr):
    dummy = ListNode(0)
    cur = dummy
    for v in arr:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next
def _list_to_array(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out
def _array_to_tree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root
def _tree_to_array(root):
    if not root:
        return []
    out = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            out.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            out.append(None)
    while out and out[-1] is None:
        out.pop()
    return out
def _fmt(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, list) or isinstance(v, tuple):
        return json.dumps(list(v), separators=(',', ':'))
    if isinstance(v, dict):
        return json.dumps(v, separators=(',', ':'))
    if v is None:
        return "null"
    if hasattr(v, 'val') and hasattr(v, 'next'):
        return json.dumps(_list_to_array(v), separators=(',', ':'))
    if hasattr(v, 'val') and (hasattr(v, 'left') or hasattr(v, 'right')):
        return json.dumps(_tree_to_array(v), separators=(',', ':'))
    return str(v)
`;

async function runPython(code, testCases, question) {
  const { isDesign, isLinkedList, isTree } = detectQuestionType(question, code);
  let pyodide;
  try {
    pyodide = await loadPyodide();
  } catch (err) {
    return { results: [], compileError: `Failed to load Python runtime: ${err?.message ?? err}` };
  }

  // Detect method name for non-design problems
  let methodName = null, className = null;
  if (isDesign) {
    const m = code.match(/class\s+(\w+)/);
    className = m ? m[1] : null;
    if (!className) return { results: [], compileError: 'Could not detect a class to instantiate.' };
  } else {
    // Look for `def method_name(self, ...)` inside a Solution class
    const m = code.match(/class\s+\w+:[\s\S]*?def\s+(\w+)\s*\(\s*self/);
    methodName = m ? m[1] : null;
    if (!methodName) {
      // Fallback: top-level function
      const m2 = code.match(/def\s+(\w+)\s*\(/);
      methodName = m2 ? m2[1] : null;
    }
    if (!methodName) return { results: [], compileError: 'Could not detect a method/function to call.' };
  }

  const results = [];
  for (const tc of testCases) {
    const stdout = [];
    const start = performance.now();
    try {
      pyodide.setStdout({ batched: (s) => stdout.push(s) });
      pyodide.setStderr({ batched: (s) => stdout.push(s) });

      let wrapper;
      if (isDesign) {
        const lines = tc.input.split('\n').filter(l => l.trim());
        const ops = JSON.parse(lines[0]);
        const argsList = JSON.parse(lines[1]);
        wrapper = `${PY_LISTNODE_TREECODE}\n${code}\n
_ops = ${JSON.stringify(ops)}
_args = ${JSON.stringify(argsList)}
_out = []
_inst = None
for i, op in enumerate(_ops):
    a = _args[i] if i < len(_args) else []
    if i == 0:
        _inst = ${className}(*a)
        _out.append(None)
    else:
        _r = getattr(_inst, op)(*a)
        _out.append(_r)
print(json.dumps([None if v is None else v for v in _out], separators=(',', ':')))
`;
      } else {
        const inputLines = tc.input.split('\n').filter(l => l.trim());
        // Build Python literals for each arg
        const pyArgs = inputLines.map(raw => {
          const s = raw.trim();
          if (s === 'true') return 'True';
          if (s === 'false') return 'False';
          if (s === 'null') return 'None';
          if (s.startsWith('[') || s.startsWith('"') || s.startsWith("'")) return s;
          if (/^-?\d+(\.\d+)?$/.test(s)) return s;
          return JSON.stringify(s);
        });

        // Add serialization wrappers if needed
        let serCode = '';
        let deserCode = '';
        const argNames = pyArgs.map((_, i) => `_arg_${i}`);
        if (isLinkedList) {
          argNames.forEach((n, i) => {
            serCode += `${n} = _array_to_list(${pyArgs[i]})\n`;
          });
          deserCode = `_result = _list_to_array(_result) if _result is not None else None\n`;
        } else if (isTree) {
          argNames.forEach((n, i) => {
            serCode += `${n} = _array_to_tree(${pyArgs[i]})\n`;
          });
          deserCode = `_result = _tree_to_array(_result) if _result is not None else None\n`;
        } else {
          argNames.forEach((n, i) => {
            serCode += `${n} = ${pyArgs[i]}\n`;
          });
        }

        const isClass = /class\s+\w+/.test(code);
        const callExpr = isClass
          ? `Solution().${methodName}(${argNames.join(', ')})`
          : `${methodName}(${argNames.join(', ')})`;

        wrapper = `${PY_LISTNODE_TREECODE}\n${code}\n
${serCode}
_result = ${callExpr}
${deserCode}print(_fmt(_result))
`;
      }

      await pyodide.runPythonAsync(wrapper);
      const out = stdout.join('').replace(/\n$/, '');
      results.push({
        input: tc.input, expected: '', actual: out, passed: false,
        stdout, elapsedMs: performance.now() - start,
      });
    } catch (err) {
      results.push({
        input: tc.input, expected: '', actual: '', passed: false,
        stdout, error: err?.message ?? String(err), elapsedMs: performance.now() - start,
      });
    }
  }
  return { results };
}

// ── C++ runner (Wandbox) ────────────────────────────────────────────────────
const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s) {
  return s.replace(/\u001b\[.*?m/g, '').replace(/\u001b\[.*?[A-Za-z]/g, '');
}

const CPP_STD_HEADERS = `#include <algorithm>
#include <array>
#include <bitset>
#include <cassert>
#include <cctype>
#include <climits>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <deque>
#include <fstream>
#include <functional>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <memory>
#include <numeric>
#include <queue>
#include <random>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>`;

const CPP_LEETCODE_TYPES = `
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};
ListNode* _array_to_list(const vector<int>& arr) {
    ListNode dummy;
    ListNode* cur = &dummy;
    for (int v : arr) { cur->next = new ListNode(v); cur = cur->next; }
    return dummy.next;
}
vector<int> _list_to_array(ListNode* head) {
    vector<int> out;
    while (head) { out.push_back(head->val); head = head->next; }
    return out;
}
TreeNode* _array_to_tree(const vector<int>& arr) {
    if (arr.empty() || arr[0] == -1) return nullptr;
    TreeNode* root = new TreeNode(arr[0]);
    queue<TreeNode*> q; q.push(root);
    int i = 1;
    while (!q.empty() && i < (int)arr.size()) {
        TreeNode* node = q.front(); q.pop();
        if (i < (int)arr.size() && arr[i] != -1) { node->left = new TreeNode(arr[i]); q.push(node->left); }
        i++;
        if (i < (int)arr.size() && arr[i] != -1) { node->right = new TreeNode(arr[i]); q.push(node->right); }
        i++;
    }
    return root;
}
string _list_to_str(ListNode* head) {
    vector<int> v = _list_to_array(head);
    string r = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) r += ","; r += to_string(v[i]); }
    return r + "]";
}
string _tree_to_str(TreeNode* root) {
    if (!root) return "[]";
    vector<string> v;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        TreeNode* n = q.front(); q.pop();
        if (n) { v.push_back(to_string(n->val)); q.push(n->left); q.push(n->right); }
        else v.push_back("null");
    }
    while (!v.empty() && v.back() == "null") v.pop_back();
    string r = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i) r += ","; r += v[i]; }
    return r + "]";
}
vector<int> _parse_int_array(const string& s) {
    string t = s;
    t.erase(remove(t.begin(), t.end(), '['), t.end());
    t.erase(remove(t.begin(), t.end(), ']'), t.end());
    vector<int> out;
    stringstream ss(t);
    string tok;
    while (getline(ss, tok, ',')) {
        if (!tok.empty()) out.push_back(stoi(tok));
    }
    return out;
}
vector<vector<string>> _parse_2d_string_array(const string& s) {
    vector<vector<string>> out;
    string t = s;
    size_t i = 0;
    while (i < t.size()) {
        if (t[i] == '[') {
            i++;
            vector<string> row;
            string cur;
            bool inStr = false;
            int depth = 0;
            for (; i < t.size(); i++) {
                if (t[i] == '"') inStr = !inStr;
                else if (!inStr && t[i] == '[') depth++;
                else if (!inStr && t[i] == ']') {
                    if (depth == 0) { i++; break; }
                    depth--;
                }
                else if (!inStr && t[i] == ',' && depth == 0) {
                    if (!cur.empty()) row.push_back(cur);
                    cur.clear();
                    continue;
                }
                if (inStr) cur += t[i];
            }
            if (!cur.empty()) row.push_back(cur);
            out.push_back(row);
        } else { i++; }
    }
    return out;
}
`;

function buildCppWrapper(code, question) {
  if (/\bint\s+main\s*\(/.test(code)) return code;

  const tags = (question.tags || []).join(' ').toLowerCase();
  const isDesign = /\bclass\s+\w+\s*[{(]/.test(code) && !/class\s+Solution\b/.test(code);
  const isLinkedList = tags.includes('linked-list');
  const isTree = tags.includes('trees') || tags.includes('tree');

  // Parse function signature
  const classMatch = code.match(/class\s+(\w+)/);
  const methodMatch = code.match(/public\s*:\s*\n?\s*([\w<>&\s:,*]+?)\s+(\w+)\s*\(([^()]*)\)/);
  const className = classMatch ? classMatch[1] : 'Solution';

  if (isDesign) {
    // Design problem — parse operations + args, execute sequentially
    return `${CPP_STD_HEADERS}\nusing namespace std;\n${code}\n
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string line1, line2;
    getline(cin, line1);
    getline(cin, line2);
    // Parse operations
    vector<string> ops;
    {
        string t = line1;
        t.erase(remove(t.begin(), t.end(), '['), t.end());
        t.erase(remove(t.begin(), t.end(), ']'), t.end());
        stringstream ss(t);
        string tok;
        while (getline(ss, tok, ',')) {
            // strip quotes
            string clean;
            for (char c : tok) if (c != '"') clean += c;
            if (!clean.empty()) ops.push_back(clean);
        }
    }
    // Parse args (2D array)
    vector<vector<long long>> argsList;
    {
        // simple parser: find each [...] group
        string t = line2;
        size_t i = 0;
        while (i < t.size()) {
            if (t[i] == '[') {
                i++;
                vector<long long> row;
                string cur;
                int depth = 0;
                for (; i < t.size(); i++) {
                    if (t[i] == '[') depth++;
                    else if (t[i] == ']') {
                        if (depth == 0) { i++; break; }
                        depth--;
                    }
                    else if (t[i] == ',' && depth == 0) {
                        if (!cur.empty()) row.push_back(stoll(cur));
                        cur.clear();
                        continue;
                    }
                    if (!isspace(t[i])) cur += t[i];
                }
                if (!cur.empty()) row.push_back(stoll(cur));
                argsList.push_back(row);
            } else { i++; }
        }
    }
    cout << "[";
    ${className}* inst = nullptr;
    for (size_t i = 0; i < ops.size(); i++) {
        if (i) cout << ",";
        if (i == 0) {
            long long cap = argsList[i].empty() ? 0 : argsList[i][0];
            inst = new ${className}((int)cap);
            cout << "null";
        } else {
            // Call method based on op name
            string op = ops[i];
            vector<long long> a = argsList[i];
            if (op == "get") {
                cout << inst->get((int)a[0]);
            } else if (op == "put") {
                inst->put((int)a[0], (int)a[1]);
                cout << "null";
            } else {
                cout << "null";
            }
        }
    }
    cout << "]" << endl;
    return 0;
}`;
  }

  if (!methodMatch) {
    return `${CPP_STD_HEADERS}\nusing namespace std;\n${code}\n\nint main() { ${className} sol; return 0; }`;
  }

  const retType = methodMatch[1].trim();
  const methodName = methodMatch[2];
  const paramsStr = methodMatch[3].trim();
  const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];

  let mainBody = `  ${className} sol;\n`;
  const callArgs = [];
  for (let i = 0; i < params.length; i++) {
    const parts = params[i].split(/\s+/);
    const name = parts[parts.length - 1];
    const type = parts.slice(0, -1).join(' ');
    callArgs.push(name);

    if (type.includes('vector<vector')) {
      mainBody += `  string _l${i}; getline(cin, _l${i}); auto ${name} = _parse_2d_string_array(_l${i});\n`;
    } else if (isLinkedList && (type.includes('ListNode') || type.includes('List'))) {
      // Linked list parameter: parse input as int array, then convert to ListNode*
      mainBody += `  string _l${i}; getline(cin, _l${i}); auto _arr${i} = _parse_int_array(_l${i});\n`;
      mainBody += `  ListNode* ${name} = _array_to_list(_arr${i});\n`;
    } else if (isTree && (type.includes('TreeNode') || type.includes('Tree'))) {
      // Tree parameter: parse input as int array, then convert to TreeNode*
      mainBody += `  string _l${i}; getline(cin, _l${i}); auto _arr${i} = _parse_int_array(_l${i});\n`;
      mainBody += `  TreeNode* ${name} = _array_to_tree(_arr${i});\n`;
    } else if (type.includes('vector<int>')) {
      mainBody += `  string _l${i}; getline(cin, _l${i}); auto _arr${i} = _parse_int_array(_l${i});\n`;
      mainBody += `  vector<int> ${name} = _arr${i};\n`;
    } else if (type.includes('string')) {
      mainBody += `  string ${name}; getline(cin, ${name});\n`;
    } else {
      mainBody += `  string _l${i}; getline(cin, _l${i}); ${type} ${name} = stoi(_l${i});\n`;
    }
  }

  // Format return value
  let retFmt;
  if (retType === 'void') {
    retFmt = `cout << "void" << endl;`;
  } else if (retType.includes('ListNode')) {
    retFmt = `cout << _list_to_str(sol.${methodName}(${callArgs.join(', ')})) << endl;`;
  } else if (retType.includes('TreeNode')) {
    retFmt = `cout << _tree_to_str(sol.${methodName}(${callArgs.join(', ')})) << endl;`;
  } else if (retType.includes('vector<int>')) {
    retFmt = `{auto _r = sol.${methodName}(${callArgs.join(', ')}); cout << "["; for(size_t i=0;i<_r.size();i++){if(i)cout<<",";cout<<_r[i];}cout<<"]"<<endl;}`;
  } else if (retType.includes('bool')) {
    retFmt = `bool _r = sol.${methodName}(${callArgs.join(', ')}); cout << (_r?"true":"false") << endl;`;
  } else {
    retFmt = `auto _r = sol.${methodName}(${callArgs.join(', ')}); cout << _r << endl;`;
  }

  return `${CPP_STD_HEADERS}\nusing namespace std;\n${CPP_LEETCODE_TYPES}\n${code}\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n${mainBody}  ${retFmt}\n  return 0;\n}`;
}

async function runCpp(code, testCases, question) {
  const wrapped = buildCppWrapper(code, question);
  const results = [];
  for (const tc of testCases) {
    const start = performance.now();
    try {
      const res = await fetch(WANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: wrapped, compiler: 'clang-head',
          options: '-std=c++23 -O2 -stdlib=libstdc++',
          stdin: tc.input, save: false, compiler_option_raw: true,
        }),
      });
      const data = await res.json();
      const elapsed = performance.now() - start;
      if (data.compiler_error) {
        return { results: [], compileError: 'Compile error:\n' + stripANSI(data.compiler_error).slice(0, 2000) };
      }
      const out = stripANSI(data.program_output || data.program_message || '').replace(/\n$/, '');
      const err = data.status !== '0' ? stripANSI(data.program_message || '') : undefined;
      results.push({
        input: tc.input, expected: '', actual: out, passed: false,
        stdout: out ? [out] : [], error: err, elapsedMs: elapsed,
      });
    } catch (err) {
      results.push({
        input: tc.input, expected: '', actual: '', passed: false,
        stdout: [], error: err?.message ?? String(err), elapsedMs: performance.now() - start,
      });
    }
  }
  return { results };
}

function javaFallback() {
  return {
    results: [],
    compileError: 'Java execution requires the Mockmate backend judge (backend/judge/runners/java.js). Set JDDOODLE_CLIENT_ID and JDDOODLE_CLIENT_SECRET in backend/.env and run the backend server.',
  };
}

// ── Default starter code generator ───────────────────────────────────────────
// Generates LeetCode-accurate starter code based on question tags + title.
// Handles common LeetCode naming patterns:
//   - Boolean problems get "is" prefix (Same Tree → isSameTree)
//   - Tree problems with two trees (Same Tree → TreeNode* p, TreeNode* q)
//   - Linked list, string, math, design patterns
function defaultStarter(lang, questionName, question) {
  const lowerTitle = (questionName || '').toLowerCase();
  const tags = (question?.tags || []).join(' ').toLowerCase();
  const isLinkedList = tags.includes('linked-list');
  const isTree = tags.includes('trees') || tags.includes('tree') || lowerTitle.includes('tree');
  const isDesign = tags.includes('design');
  const isString = (tags.includes('string') && !tags.includes('arrays')) || lowerTitle.includes('string') || lowerTitle.includes('palindrome') || lowerTitle.includes('anagram');
  const isMath = tags.includes('math') || lowerTitle.includes('number') || lowerTitle.includes('integer') || lowerTitle.includes('roman');

  // LeetCode boolean naming: isXxx for problems that return bool
  const booleanKeywords = ['same', 'valid', 'symmetric', 'balanced', 'palindrome', 'subtree',
    'identical', 'happy', 'ugly', 'power', 'perfect', 'buddy', 'winner', 'monotonic'];
  const isBoolean = booleanKeywords.some(k => lowerTitle.includes(k));

  // LeetCode "is" prefix for boolean problems
  let fnName = toCamel(questionName);
  if (isBoolean && !fnName.startsWith('is')) {
    fnName = 'is' + fnName.charAt(0).toUpperCase() + fnName.slice(1);
  }

  // Detect two-tree problems (Same Tree, Symmetric Tree, etc.)
  const twoTreeProblems = ['same tree', 'symmetric tree', 'identical', 'subtree of another', 'flip equivalent', 'leaf similar'];
  const isTwoTree = isTree && twoTreeProblems.some(p => lowerTitle.includes(p));

  // Detect tree problems that return bool (not modifying the tree)
  const treeBoolProblems = ['same tree', 'symmetric', 'balanced', 'subtree', 'path sum', 'identical',
    'is same', 'is symmetric', 'is balanced', 'univalue', 'cousins', 'cousin'];
  const isTreeBool = isTree && treeBoolProblems.some(p => lowerTitle.includes(p));

  let sig;
  if (isDesign) {
    const pascal = toPascal(questionName);
    sig = {
      js: `var ${pascal} = function() {\n    \n};`,
      py: `class ${pascal}:\n    def __init__(self):\n        pass`,
      java: `class ${pascal} {\n    public ${pascal}() {\n        \n    }\n}`,
      cpp: `class ${pascal} {\npublic:\n    ${pascal}() {\n        \n    }\n};`,
    };
  } else if (isTree) {
    if (isTwoTree) {
      // Two tree params: Same Tree, Symmetric Tree, etc.
      sig = {
        js: `/**\n * @param {TreeNode} p\n * @param {TreeNode} q\n * @return {boolean}\n */\nvar ${fnName} = function(p, q) {\n    \n};`,
        py: `class Solution:\n    def ${fnName}(self, p: Optional[TreeNode], q: Optional[TreeNode]) -> bool:\n        pass`,
        java: `class Solution {\n    public boolean ${fnName}(TreeNode p, TreeNode q) {\n        \n    }\n}`,
        cpp: `class Solution {\npublic:\n    bool ${fnName}(TreeNode* p, TreeNode* q) {\n        \n    }\n};`,
      };
    } else if (isTreeBool) {
      // Single tree param, returns bool: Balanced, Path Sum, etc.
      sig = {
        js: `/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar ${fnName} = function(root) {\n    \n};`,
        py: `class Solution:\n    def ${fnName}(self, root: Optional[TreeNode]) -> bool:\n        pass`,
        java: `class Solution {\n    public boolean ${fnName}(TreeNode root) {\n        \n    }\n}`,
        cpp: `class Solution {\npublic:\n    bool ${fnName}(TreeNode* root) {\n        \n    }\n};`,
      };
    } else {
      // Single tree param, returns TreeNode*: Invert, Merge, etc.
      sig = {
        js: `/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar ${fnName} = function(root) {\n    \n};`,
        py: `class Solution:\n    def ${fnName}(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        pass`,
        java: `class Solution {\n    public TreeNode ${fnName}(TreeNode root) {\n        \n    }\n}`,
        cpp: `class Solution {\npublic:\n    TreeNode* ${fnName}(TreeNode* root) {\n        \n    }\n};`,
      };
    }
  } else if (isLinkedList) {
    sig = {
      js: `/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar ${fnName} = function(head) {\n    \n};`,
      py: `class Solution:\n    def ${fnName}(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        pass`,
      java: `class Solution {\n    public ListNode ${fnName}(ListNode head) {\n        \n    }\n}`,
      cpp: `class Solution {\npublic:\n    ListNode* ${fnName}(ListNode* head) {\n        \n    }\n};`,
    };
  } else if (isString) {
    if (isBoolean) {
      sig = {
        js: `/**\n * @param {string} s\n * @return {boolean}\n */\nvar ${fnName} = function(s) {\n    \n};`,
        py: `class Solution:\n    def ${fnName}(self, s: str) -> bool:\n        pass`,
        java: `class Solution {\n    public boolean ${fnName}(String s) {\n        \n    }\n}`,
        cpp: `class Solution {\npublic:\n    bool ${fnName}(string s) {\n        \n    }\n};`,
      };
    } else {
      sig = {
        js: `/**\n * @param {string} s\n * @return {number}\n */\nvar ${fnName} = function(s) {\n    \n};`,
        py: `class Solution:\n    def ${fnName}(self, s: str) -> int:\n        pass`,
        java: `class Solution {\n    public int ${fnName}(String s) {\n        \n    }\n}`,
        cpp: `class Solution {\npublic:\n    int ${fnName}(string s) {\n        \n    }\n};`,
      };
    }
  } else if (isMath) {
    sig = {
      js: `/**\n * @param {number} x\n * @return {number}\n */\nvar ${fnName} = function(x) {\n    \n};`,
      py: `class Solution:\n    def ${fnName}(self, x: int) -> int:\n        pass`,
      java: `class Solution {\n    public int ${fnName}(int x) {\n        \n    }\n}`,
      cpp: `class Solution {\npublic:\n    int ${fnName}(int x) {\n        \n    }\n};`,
    };
  } else {
    // Default: array + int → array (Two Sum pattern)
    sig = {
      js: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar ${fnName} = function(nums, target) {\n    \n};`,
      py: `class Solution:\n    def ${fnName}(self, nums: List[int], target: int) -> List[int]:\n        pass`,
      java: `class Solution {\n    public int[] ${fnName}(int[] nums, int target) {\n        \n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> ${fnName}(vector<int>& nums, int target) {\n        \n    }\n};`,
    };
  }
  return sig[lang] || sig.js;
}

function toCamel(s) {
  const words = String(s).match(/[a-zA-Z0-9]+/g) || ['solution'];
  return words.map((w, i) =>
    i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join('');
}
function toPascal(s) {
  const words = String(s).match(/[a-zA-Z0-9]+/g) || ['Solution'];
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}
function toSnake(s) {
  const words = String(s).match(/[a-zA-Z0-9]+/g) || ['solution'];
  return words.map(w => w.toLowerCase()).join('_');
}

// ── Component ────────────────────────────────────────────────────────────────
const LeetCodeCodeEditor = ({ question, onSubmit, readOnly }) => {
  const [language, setLanguage] = useState('javascript');
  const [codeByLang, setCodeByLang] = useState(() => {
    const initial = { javascript: '', python: '', java: '', cpp: '' };
    for (const lang of Object.keys(initial)) {
      initial[lang] = question.starterCode?.[lang] ?? defaultStarter(lang, question.question, question);
    }
    return initial;
  });
  const [activeTab, setActiveTab] = useState('testcase');
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [compileError, setCompileError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [fontSize, setFontSize] = useState(14);
  const [prevQuestionId, setPrevQuestionId] = useState(question.id);
  const [enrichedQuestion, setEnrichedQuestion] = useState(question);
  const [contentLoading, setContentLoading] = useState(false);
  const editorRef = useRef(null);

  // If this is a live LeetCode question, fetch the FULL content (statement,
  // examples, constraints, test cases) AND the official code templates from
  // LeetCode's GraphQL API. The alfa API only returns the description; the
  // official API returns the exact starter code for every language with the
  // correct function signature, parameter names, and return types.
  useEffect(() => {
    if (!question.needsContentFetch || !question.titleSlug) {
      setEnrichedQuestion(question);
      return;
    }
    let cancelled = false;
    setContentLoading(true);
    (async () => {
      try {
        // Fetch description/examples/constraints from alfa API
        const descRes = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${encodeURIComponent(question.titleSlug)}`);

        // Fetch official code templates. LeetCode blocks browser CORS, so try
        // multiple approaches in order:
        //   1. Backend proxy (best — deployed on Render)
        //   2. Public CORS proxy (fallback — works but slower)
        //   3. Generic defaultStarter (last resort — may not match LeetCode exactly)
        let starterCode = question.starterCode || {};
        let codeFetched = false;

        // Attempt 1: Backend proxy
        try {
          const codeRes = await fetch(`${API_BASE}/api/leetcode/code/${encodeURIComponent(question.titleSlug)}`);
          if (codeRes.ok) {
            const codeData = await codeRes.json();
            if (codeData?.starterCode && Object.keys(codeData.starterCode).length > 0) {
              starterCode = { ...starterCode, ...codeData.starterCode };
              codeFetched = true;
            }
          }
        } catch (proxyErr) {
          console.warn('[CodeEditor] Backend proxy unavailable, trying CORS proxy');
        }

        // Attempt 2: Public CORS proxy (allorigins.win)
        if (!codeFetched) {
          try {
            const graphqlBody = JSON.stringify({
              query: `query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { codeSnippets { lang langSlug code } } }`,
              variables: { titleSlug: question.titleSlug },
            });
            const corsRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://leetcode.com/graphql')}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: graphqlBody,
            });
            if (corsRes.ok) {
              const corsData = await corsRes.json();
              const snippets = corsData?.data?.question?.codeSnippets || [];
              const langMap = { javascript: 'javascript', python3: 'python', python: 'python', java: 'java', cpp: 'cpp' };
              for (const snip of snippets) {
                const ourLang = langMap[snip.langSlug];
                if (ourLang && !starterCode[ourLang]) {
                  starterCode[ourLang] = snip.code;
                  codeFetched = true;
                }
              }
            }
          } catch (corsErr) {
            console.warn('[CodeEditor] CORS proxy failed, using generic starter code');
          }
        }

        const data = await descRes.json();
        if (cancelled) return;

        // Parse the HTML content for description/examples/constraints
        const html = data.question || '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');

        const examples = [];
        doc.querySelectorAll('pre').forEach(pre => {
          const text = pre.textContent.trim();
          const inputMatch = text.match(/Input:\s*([^\n]+)/);
          const outputMatch = text.match(/Output:\s*([^\n]+)/);
          const explanationMatch = text.match(/Explanation:\s*([\s\S]+?)(?=\n\n|$)/);
          if (inputMatch || outputMatch) {
            examples.push({
              input: inputMatch ? inputMatch[1].trim() : '',
              output: outputMatch ? outputMatch[1].trim() : '',
              explanation: explanationMatch ? explanationMatch[1].trim() : '',
            });
          }
        });

        const constraints = [];
        doc.querySelectorAll('ul').forEach(ul => {
          ul.querySelectorAll('li').forEach(li => {
            const text = li.textContent.trim();
            if (text && text.length < 300) constraints.push(text);
          });
        });

        // Store BOTH plain text (for matching) AND raw HTML (for rich rendering)
        const fullText = doc.body.textContent.replace(/\s+/g, ' ').trim();
        let statement = fullText;
        const exIdx = fullText.indexOf('Example 1:');
        const conIdx = fullText.indexOf('Constraints:');
        if (exIdx > 0) statement = fullText.substring(0, exIdx).trim();
        else if (conIdx > 0) statement = fullText.substring(0, conIdx).trim();

        // Extract the HTML for the statement portion (before "Example 1:")
        // This preserves images, visualizations, formatted code blocks, etc.
        let statementHtml = html;
        // Try to find where "Example" starts in the HTML and cut there
        const exampleHtmlMatch = html.match(/<p><strong class="example">/i);
        if (exampleHtmlMatch && exampleHtmlMatch.index > 0) {
          statementHtml = html.substring(0, exampleHtmlMatch.index);
        }
        // Also cut at "Constraints:"
        const constraintsHtmlMatch = statementHtml.match(/<p><strong>Constraints:<\/strong>/i);
        if (constraintsHtmlMatch && constraintsHtmlMatch.index > 0) {
          statementHtml = statementHtml.substring(0, constraintsHtmlMatch.index);
        }

        // ── Test cases ──────────────────────────────────────────────────────
        // Priority: curated database > reference solution auto-verify > examples
        const curatedTestCases = getTestCasesFor(question.titleSlug);
        const refSolution = getReferenceSolution(question.titleSlug);
        let testCases;

        if (curatedTestCases && curatedTestCases.length > 0) {
          // Level 1: Curated test cases with hardcoded expected outputs
          testCases = curatedTestCases;
        } else {
          // Level 2/3: Use example testcases from the problem description
          const testcaseStr = data.exampleTestcases || '';
          const tcLines = testcaseStr.split('\n').map(l => l.trim()).filter(Boolean);
          let paramCount = 1;
          const jsCode = starterCode.javascript || '';
          const sigMatch = jsCode.match(/function\s*\w*\s*\(([^)]*)\)/) || jsCode.match(/var\s+\w+\s*=\s*function\s*\(([^)]*)\)/);
          if (sigMatch && sigMatch[1]) {
            paramCount = sigMatch[1].split(',').map(p => p.trim()).filter(Boolean).length || 1;
          }
          testCases = [];
          for (let i = 0; i < tcLines.length; i += paramCount) {
            const chunk = tcLines.slice(i, i + paramCount);
            if (chunk.length === paramCount) {
              testCases.push({ input: chunk.join('\n'), expectedOutput: '' });
            }
          }
          if (testCases.length === 0 && tcLines.length > 0) {
            testCases.push({ input: tcLines.join('\n'), expectedOutput: '' });
          }

          // Level 2: Auto-generate expected outputs using reference solution
          if (refSolution && !refSolution.isDesign && refSolution.solution) {
            for (const tc of testCases) {
              const generated = generateExpectedOutput(question.titleSlug, tc.input);
              if (generated !== null) {
                tc.expectedOutput = generated;
              }
            }
          } else {
            // Level 3: Match test cases to examples to fill in expected outputs
            if (examples.length > 0 && testCases.length > 0) {
              for (const tc of testCases) {
                const tcValues = tc.input.split('\n').map(v => v.trim());
                for (const ex of examples) {
                  const exInputStr = ex.input || '';
                  const valueMatches = exInputStr.match(/=\s*([^,=]+(?:\[[^\]]*\])?)/g);
                  if (valueMatches) {
                    const exValues = valueMatches.map(v => v.replace(/^=\s*/, '').trim());
                    const matches = exValues.length === tcValues.length &&
                      exValues.every((ev, i) => normalize(ev) === normalize(tcValues[i]));
                    if (matches) {
                      tc.expectedOutput = (ex.output || '').trim();
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        if (!cancelled) {
          setEnrichedQuestion({
            ...question,
            problemStatement: statement,
            problemStatementHtml: statementHtml,
            examples,
            constraints,
            testCases,
            starterCode,
            needsContentFetch: false,
          });
          // Update the code for ALL languages — the user may switch
          // languages after the fetch completes, so we need to populate
          // every language, not just the current one.
          setCodeByLang(prev => {
            const updated = { ...prev };
            for (const lang of Object.keys(starterCode)) {
              // Only overwrite if the user hasn't already typed something
              // (i.e. the current code is still the default or empty)
              if (!updated[lang] || updated[lang].trim() === '' ||
                  updated[lang].includes('function') && updated[lang].includes('    \n') ||
                  updated[lang].includes('class Solution') && updated[lang].includes('        \n')) {
                updated[lang] = starterCode[lang];
              }
            }
            return updated;
          });
          setContentLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[CodeEditor] Failed to fetch LeetCode content:', err.message);
          setEnrichedQuestion({
            ...question,
            problemStatement: `Failed to load full problem description. Visit https://leetcode.com/problems/${question.titleSlug}/ for the complete problem.`,
            needsContentFetch: false,
          });
          setContentLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [question.id, question.titleSlug, question.needsContentFetch]);

  // Use enrichedQuestion throughout the component instead of question
  const q = enrichedQuestion;

  const testCases = useMemo(() => {
    if (q.testCases?.length) return q.testCases;
    if (q.examples?.length) {
      return q.examples.map(e => ({ input: e.input, expectedOutput: e.output }));
    }
    return [];
  }, [q]);

  // Reset state when question changes
  if (prevQuestionId !== question.id) {
    setPrevQuestionId(question.id);
    setRunResult(null); setCompileError(null); setSubmitted(false);
    setFinalResult(null); setActiveTab('testcase'); setActiveCaseIdx(0);
    const initial = { javascript: '', python: '', java: '', cpp: '' };
    for (const lang of Object.keys(initial)) {
      initial[lang] = question.starterCode?.[lang] ?? defaultStarter(lang, question.question, question);
    }
    setCodeByLang(initial);
  }

  const beforeMount = (monaco) => {
    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'variable', foreground: '9cdcfe' },
        { token: 'constant', foreground: '4fc1ff' },
      ],
      colors: {
        'editor.background': '#1e1e1e', 'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585', 'editorLineNumber.activeForeground': '#c6c6c6',
        'editorCursor.foreground': '#aeafad', 'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorIndentGuide.background': '#404040', 'editorIndentGuide.activeBackground': '#707070',
        'editorWidget.background': '#252526', 'editorWidget.border': '#454545',
        'editorBracketMatch.background': '#0064001a', 'editorBracketMatch.border': '#888',
        'scrollbarSlider.background': '#79797966', 'scrollbarSlider.hoverBackground': '#646464b3',
      },
    });
  };

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, submitCode);
  };

  const executeAll = async (code, testCases, language) => {
    if (language === 'javascript') {
      const out = runJavaScript(code, testCases, question);
      return { raw: out.results, compileError: out.compileError };
    }
    if (language === 'python') {
      const out = await runPython(code, testCases, question);
      return { raw: out.results, compileError: out.compileError };
    }
    if (language === 'cpp') {
      const out = await runCpp(code, testCases, question);
      return { raw: out.results, compileError: out.compileError };
    }
    const out = javaFallback();
    return { raw: out.results, compileError: out.compileError };
  };

  const runCode = async () => {
    if (running || submitting || readOnly) return;
    setRunning(true); setCompileError(null); setActiveTab('result');
    try {
      const code = codeByLang[language];
      const { raw, compileError } = await executeAll(code, testCases, language);
      if (compileError) {
        setCompileError(compileError); setRunResult([]); setRunning(false); return;
      }
      setRunResult(raw.map((r, i) => {
        const tc = testCases[i];
        let passed;
        if (r.error) passed = false;
        else if (!tc?.expectedOutput) passed = true;
        else if (normalize(r.actual) === normalize(tc.expectedOutput)) passed = true;
        else {
          // Custom validator for problems with multiple valid answers
          const slug = question.titleSlug || q.titleSlug;
          const valid = slug ? isValidAnswer(slug, tc.input, r.actual) : null;
          passed = valid !== null ? valid : false;
        }
        return { ...r, expected: tc?.expectedOutput ?? '', passed, noExpected: !tc?.expectedOutput };
      }));
      setRunning(false);
    } catch (err) {
      setCompileError(err?.message ?? String(err)); setRunResult([]); setRunning(false);
    }
  };

  const submitCode = async () => {
    if (running || submitting || readOnly) return;
    setSubmitting(true); setActiveTab('result');
    try {
      const code = codeByLang[language];
      const { raw, compileError } = await executeAll(code, testCases, language);
      if (compileError) {
        setCompileError(compileError); setRunResult([]);
        const failed = { code, language, score: 0, passed: 0, total: testCases.length, details: [], status: 'compile_error' };
        setFinalResult(failed); setSubmitted(true); setSubmitting(false);
        onSubmit?.(failed); return;
      }
      const annotated = raw.map((r, i) => {
        const tc = testCases[i];
        let passed;
        if (r.error) passed = false;
        else if (!tc?.expectedOutput) passed = true;
        else if (normalize(r.actual) === normalize(tc.expectedOutput)) passed = true;
        else {
          const slug = question.titleSlug || q.titleSlug;
          const valid = slug ? isValidAnswer(slug, tc.input, r.actual) : null;
          passed = valid !== null ? valid : false;
        }
        return { ...r, expected: tc?.expectedOutput ?? '', passed, noExpected: !tc?.expectedOutput };
      });
      const passed = annotated.filter(r => r.passed).length;
      const total = annotated.length;
      const hasExpected = annotated.some(r => !r.noExpected);
      const score = total > 0 ? Math.round((passed / total) * 100) : 0;
      // If no test cases have expected outputs, status is 'executed' (not 'accepted')
      const status = !hasExpected ? (annotated.some(r => r.error) ? 'error' : 'executed')
        : passed === total ? 'accepted' : passed === 0 ? 'error' : 'wrong';
      const result = { code, language, score, passed, total, details: annotated, status };
      setRunResult(annotated); setFinalResult(result);
      setSubmitted(true); setSubmitting(false); onSubmit?.(result);
    } catch (err) {
      setCompileError(err?.message ?? String(err)); setSubmitting(false);
    }
  };

  const code = codeByLang[language];
  const diffColor = (q.difficulty || '').toLowerCase();
  const passedCount = runResult?.filter(r => r.passed).length ?? 0;
  const allPassed = runResult !== null && passedCount === testCases.length && testCases.length > 0;
  const isReadOnly = readOnly || submitted;

  return (
    <div className="lc-editor-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: LC.bg, color: LC.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{globalCss}</style>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Problem description */}
        <div style={{ width: '42%', minWidth: 360, maxWidth: 720, borderRight: `1px solid ${LC.border}`, background: LC.panel, overflowY: 'auto', padding: '20px 24px' }}>
          <ProblemDescription question={q} diffColor={diffColor} contentLoading={contentLoading} />
        </div>
        {/* Editor + console */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: LC.bg }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: LC.panel, borderBottom: `1px solid ${LC.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {LANGUAGES.map(l => (
                <button key={l.id} onClick={() => setLanguage(l.id)} className="lc-lang-tab"
                  style={{ background: language === l.id ? LC.panelAlt : 'transparent', color: language === l.id ? LC.text : LC.textDim, border: `1px solid ${language === l.id ? LC.borderLight : 'transparent'}`, padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>{l.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="lc-icon-btn" title="Decrease font size" onClick={() => setFontSize(f => Math.max(10, f - 1))} style={iconBtnStyle}>A−</button>
              <span style={{ fontSize: 12, color: LC.textDim, minWidth: 32, textAlign: 'center' }}>{fontSize}px</span>
              <button className="lc-icon-btn" title="Increase font size" onClick={() => setFontSize(f => Math.min(24, f + 1))} style={iconBtnStyle}>A+</button>
              <button className="lc-icon-btn" title="Reset" onClick={() => setFontSize(14)} style={iconBtnStyle}>⟲</button>
            </div>
          </div>
          {/* Monaco */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Editor
              key={`${question.id}-${language}`} height="100%"
              language={LANGUAGES.find(l => l.id === language)?.monacoLang}
              value={code} theme="leetcode-dark" beforeMount={beforeMount} onMount={onMount}
              onChange={val => setCodeByLang(prev => ({ ...prev, [language]: val ?? '' }))}
              options={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace",
                fontLigatures: true, fontSize, lineHeight: 21,
                minimap: { enabled: false }, scrollBeyondLastLine: false,
                smoothScrolling: true, cursorBlinking: 'smooth', cursorSmoothCaretAnimation: 'on',
                tabSize: 2, insertSpaces: true, wordWrap: 'on',
                padding: { top: 12, bottom: 12 }, renderLineHighlight: 'all',
                scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
                automaticLayout: true, readOnly: isReadOnly, contextmenu: true,
                mouseWheelZoom: true, bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true }, fixedOverflowWidgets: true,
              }}
            />
          </div>
          {/* Bottom panel */}
          <div style={{ height: 280, borderTop: `1px solid ${LC.border}`, background: LC.panel, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${LC.border}`, padding: '0 12px', height: 36, flexShrink: 0 }}>
              <button onClick={() => setActiveTab('testcase')} style={tabStyle(activeTab === 'testcase')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>Testcases
                </span>
              </button>
              <button onClick={() => setActiveTab('result')} style={tabStyle(activeTab === 'result')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Test Result
                  {runResult && runResult.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: allPassed ? LC.accepted : LC.wrong, color: 'white', borderRadius: 10, padding: '0 6px', fontSize: 10, fontWeight: 700, height: 16, minWidth: 16 }}>{passedCount}/{runResult.length}</span>
                  )}
                </span>
              </button>
              <div style={{ flex: 1 }} />
              {!submitted && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={runCode} disabled={running || submitting || isReadOnly} style={{ ...btnStyle(LC.accent), opacity: running ? 0.7 : 1 }}>
                    {running ? <><Spinner /> Running…</> : <><PlayIcon /> Run</>}
                  </button>
                  <button onClick={submitCode} disabled={running || submitting || isReadOnly} style={{ ...btnStyle(LC.accepted), opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? <><Spinner /> Submitting…</> : <><SubmitIcon /> Submit</>}
                  </button>
                </div>
              )}
              {submitted && finalResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: finalResult.status === 'accepted' ? `${LC.accepted}22` : finalResult.status === 'executed' ? `${LC.textDim}22` : `${LC.wrong}22`, color: finalResult.status === 'accepted' ? LC.accepted : finalResult.status === 'executed' ? LC.textDim : LC.wrong, border: `1px solid ${finalResult.status === 'accepted' ? LC.accepted : finalResult.status === 'executed' ? LC.textDim : LC.wrong}` }}>
                    {finalResult.status === 'accepted' ? '✓ Accepted' : finalResult.status === 'executed' ? '● Executed' : finalResult.status === 'compile_error' ? 'Compile Error' : '✗ Wrong Answer'}
                  </span>
                  <span style={{ fontSize: 12, color: LC.textDim }}>Score: <b style={{ color: LC.text }}>{finalResult.score}</b>/100 · {finalResult.passed}/{finalResult.total} cases</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
              {activeTab === 'testcase' ? (
                <TestCasesPanel testCases={testCases} activeIdx={activeCaseIdx} onSelect={setActiveCaseIdx} />
              ) : (
                <ResultsPanel running={running} submitting={submitting} results={runResult} compileError={compileError} testCases={testCases} submitted={submitted} finalResult={finalResult} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Subcomponents ────────────────────────────────────────────────────────────
const ProblemDescription = ({ question, diffColor, contentLoading }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: LC.text, margin: 0, letterSpacing: -0.3 }}>{question.id}. {question.question}</h1>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: diffColor === 'easy' ? `${LC.accepted}22` : diffColor === 'medium' ? `${LC.warning}22` : diffColor === 'hard' ? `${LC.wrong}22` : `${LC.textDim}22`, color: diffColor === 'easy' ? LC.accepted : diffColor === 'medium' ? LC.warning : diffColor === 'hard' ? LC.wrong : LC.textDim }}>{question.difficulty || 'Unknown'}</span>
      {question.tags?.map(t => <span key={t} style={{ padding: '2px 8px', background: LC.panelAlt, color: LC.textDim, borderRadius: 4, fontSize: 11 }}>{t}</span>)}
      {question.timeLimit && <span style={{ marginLeft: 'auto', fontSize: 11, color: LC.textMute }}>⏱ {question.timeLimit}s</span>}
    </div>
    {contentLoading ? (
      <div style={{ padding: '24px 0', textAlign: 'center', color: LC.textDim, fontSize: 13 }}>
        <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid ' + LC.border, borderTopColor: LC.accent, borderRadius: '50%', animation: 'lc-spin 0.8s linear infinite', marginBottom: 8 }} />
        <div>Loading full problem from LeetCode…</div>
      </div>
    ) : (
      <>
        {question.problemStatementHtml ? (
          <div className="lc-problem-html" style={{ fontSize: 14, lineHeight: 1.7, color: LC.text, margin: '0 0 16px' }} dangerouslySetInnerHTML={{ __html: question.problemStatementHtml }} />
        ) : (
          question.problemStatement && <p style={{ fontSize: 14, lineHeight: 1.7, color: LC.text, margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{question.problemStatement}</p>
        )}
        {question.examples?.map((ex, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: LC.text, margin: '0 0 6px' }}>Example {i + 1}:</p>
            <pre style={{ background: LC.panelAlt, border: `1px solid ${LC.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, color: LC.text, fontFamily: "'JetBrains Mono', 'Menlo', monospace", lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
              <span style={{ color: LC.textDim }}>Input:</span> {ex.input}{'\n'}<span style={{ color: LC.textDim }}>Output:</span> {ex.output}{ex.explanation && <>{'\n'}<span style={{ color: LC.textDim }}>Explanation:</span> {ex.explanation}</>}
            </pre>
          </div>
        ))}
        {question.constraints?.length > 0 && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: LC.text, margin: '0 0 6px' }}>Constraints:</p>
            <ul style={{ margin: 0, paddingLeft: 18, color: LC.text }}>
              {question.constraints.map((c, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.7, fontFamily: "'JetBrains Mono', 'Menlo', monospace" }}>{c}</li>)}
            </ul>
          </div>
        )}
        {question.titleSlug && (
          <p style={{ marginTop: 16, fontSize: 11, color: LC.textMute }}>
            Source: <a href={`https://leetcode.com/problems/${question.titleSlug}/`} target="_blank" rel="noreferrer" style={{ color: LC.accent }}>leetcode.com/problems/{question.titleSlug}</a>
          </p>
        )}
      </>
    )}
  </div>
);

const TestCasesPanel = ({ testCases, activeIdx, onSelect }) => {
  if (!testCases.length) return <div style={{ color: LC.textDim, fontSize: 13 }}>No test cases defined for this question.</div>;
  const tc = testCases[activeIdx];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {testCases.map((_, i) => <button key={i} onClick={() => onSelect(i)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: i === activeIdx ? LC.panelAlt : 'transparent', color: i === activeIdx ? LC.text : LC.textDim, border: `1px solid ${i === activeIdx ? LC.borderLight : LC.border}` }}>Case {i + 1}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={{ fontSize: 12, color: LC.textDim, display: 'block', marginBottom: 4 }}>Input</label><pre style={ioBoxStyle}>{tc.input}</pre></div>
        <div>
          <label style={{ fontSize: 12, color: LC.textDim, display: 'block', marginBottom: 4 }}>Expected Output {!tc.expectedOutput && <span style={{ color: LC.textMute, fontSize: 10 }}>(unverified)</span>}</label>
          <pre style={{ ...ioBoxStyle, color: tc.expectedOutput ? LC.text : LC.textMute }}>{tc.expectedOutput || 'N/A — output will be shown after Run'}</pre>
        </div>
      </div>
    </div>
  );
};

const ResultsPanel = ({ running, submitting, results, compileError, testCases, submitted, finalResult }) => {
  if (running || submitting) return <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: LC.textDim, fontSize: 13 }}><Spinner />{submitting ? 'Submitting your code against all test cases…' : 'Running your code against test cases…'}</div>;
  if (compileError) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: `${LC.wrong}22`, color: LC.wrong }}>Runtime Error</span></div>
      <pre style={{ background: LC.panelAlt, border: `1px solid ${LC.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 12, color: LC.wrong, fontFamily: "'JetBrains Mono', 'Menlo', monospace", whiteSpace: 'pre-wrap', margin: 0 }}>{compileError}</pre>
    </div>
  );
  if (!results || results.length === 0) return <div style={{ color: LC.textDim, fontSize: 13 }}>Click <b style={{ color: LC.accent }}>Run</b> to test your code against the test cases. Click <b style={{ color: LC.accepted }}>Submit</b> to record your final score.</div>;
  const passed = results.filter(r => r.passed).length, total = results.length, allPassed = passed === total;
  const hasExpected = results.some(r => !r.noExpected);
  const isExecuted = !hasExpected && results.every(r => !r.error);
  const summaryColor = isExecuted ? LC.textDim : allPassed ? LC.accepted : LC.wrong;
  const summaryLabel = isExecuted ? 'Executed' : allPassed ? 'Accepted' : finalResult?.status === 'compile_error' ? 'Compile Error' : 'Wrong Answer';
  return (
    <div>
      {submitted && finalResult ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: isExecuted ? `${LC.textDim}11` : allPassed ? `${LC.accepted}11` : `${LC.wrong}11`, border: `1px solid ${isExecuted ? LC.textDim : allPassed ? LC.accepted : LC.wrong}`, borderRadius: 6, marginBottom: 12 }}>
          {isExecuted ? <ExecCheckIcon /> : allPassed ? <AcceptedCheckIcon /> : <WrongXIcon />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: summaryColor }}>{summaryLabel}</div>
            <div style={{ fontSize: 12, color: LC.textDim, marginTop: 2 }}>{hasExpected ? `${passed} / ${total} test cases passed` : `${total} test cases executed`} · Score: {finalResult.score}/100</div>
          </div>
        </div>
      ) : <div style={{ marginBottom: 12, fontSize: 13, color: LC.textDim }}>{hasExpected ? `${passed} / ${total} test cases passed` : `${total} test cases executed`}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {results.map((r, i) => <TestCaseResultRow key={i} idx={i} result={r} expected={testCases[i]?.expectedOutput ?? ''} />)}
      </div>
    </div>
  );
};

const TestCaseResultRow = ({ idx, result, expected }) => {
  const isExecuted = result.noExpected && !result.error;
  const statusColor = result.passed && !result.noExpected ? LC.accepted : result.error ? LC.wrong : isExecuted ? LC.textDim : LC.wrong;
  const statusBg = result.passed && !result.noExpected ? `${LC.accepted}11` : result.error ? `${LC.wrong}11` : isExecuted ? `${LC.textDim}11` : `${LC.wrong}11`;
  const statusBorder = result.passed && !result.noExpected ? `${LC.accepted}55` : result.error ? `${LC.wrong}55` : isExecuted ? `${LC.textDim}55` : `${LC.wrong}55`;
  const statusLabel = result.error ? 'Runtime Error' : isExecuted ? 'Executed' : result.passed ? 'Accepted' : 'Wrong Answer';
  const dotColor = result.passed && !result.noExpected ? LC.accepted : result.error ? LC.wrong : isExecuted ? LC.textDim : LC.wrong;
  return (
  <div style={{ background: LC.panelAlt, border: `1px solid ${statusBorder}`, borderRadius: 6, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: statusBg, borderBottom: `1px solid ${LC.border}` }}>
      {result.error ? <FailDot /> : isExecuted ? <ExecDot color={dotColor} /> : result.passed ? <PassDot /> : <FailDot />}
      <span style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>Case {idx + 1} {statusLabel}</span>
      <span style={{ fontSize: 11, color: LC.textMute, marginLeft: 'auto' }}>{result.elapsedMs.toFixed(1)}ms</span>
    </div>
    <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
      <div><div style={{ color: LC.textDim, marginBottom: 4 }}>Input</div><pre style={{ ...miniPreStyle, color: LC.text }}>{result.input}</pre></div>
      <div><div style={{ color: LC.textDim, marginBottom: 4 }}>Expected</div><pre style={{ ...miniPreStyle, color: expected ? LC.text : LC.textMute }}>{expected || 'N/A (live LeetCode)'}</pre></div>
      <div><div style={{ color: LC.textDim, marginBottom: 4 }}>{result.error ? 'Error' : 'Output'}</div><pre style={{ ...miniPreStyle, color: result.error ? LC.wrong : LC.text }}>{result.error ? result.error : result.actual}</pre></div>
    </div>
    {result.stdout.length > 0 && <div style={{ padding: '0 12px 10px', fontSize: 12 }}><div style={{ color: LC.textDim, marginBottom: 4 }}>stdout</div><pre style={{ ...miniPreStyle, color: LC.textDim }}>{result.stdout.join('\n')}</pre></div>}
  </div>
  );
};

// ── Inline style objects ─────────────────────────────────────────────────────
const iconBtnStyle = { background: 'transparent', border: `1px solid ${LC.border}`, color: LC.textDim, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 };
const tabStyle = (active) => ({ background: 'transparent', border: 'none', borderBottom: active ? `2px solid ${LC.accent}` : '2px solid transparent', color: active ? LC.text : LC.textDim, padding: '8px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center' });
const btnStyle = (bg) => ({ background: bg, color: '#1a1a1a', border: 'none', borderRadius: 4, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 });
const ioBoxStyle = { background: LC.panelAlt, border: `1px solid ${LC.border}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, color: LC.text, fontFamily: "'JetBrains Mono', 'Menlo', monospace", lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', minHeight: 60 };
const miniPreStyle = { background: 'transparent', border: 'none', padding: 0, margin: 0, fontFamily: "'JetBrains Mono', 'Menlo', monospace", fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' };

// ── Icons ────────────────────────────────────────────────────────────────────
const Spinner = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ animation: 'lc-spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
const PlayIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const SubmitIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const PassDot = () => <svg width="14" height="14" viewBox="0 0 24 24" fill={LC.accepted}><circle cx="12" cy="12" r="10" /><polyline points="17 8 10 15 7 12" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const FailDot = () => <svg width="14" height="14" viewBox="0 0 24 24" fill={LC.wrong}><circle cx="12" cy="12" r="10" /><line x1="9" y1="9" x2="15" y2="15" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" /><line x1="15" y1="9" x2="9" y2="15" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" /></svg>;
const ExecDot = ({ color }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={color || LC.textDim}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="#1a1a1a" /></svg>;
const AcceptedCheckIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={LC.accepted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" /></svg>;
const ExecCheckIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={LC.textDim} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill={LC.textDim} stroke="none" /></svg>;
const WrongXIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={LC.wrong} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>;

const globalCss = `
  @keyframes lc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .lc-editor-root ::-webkit-scrollbar { width: 10px; height: 10px; }
  .lc-editor-root ::-webkit-scrollbar-track { background: ${LC.panel}; }
  .lc-editor-root ::-webkit-scrollbar-thumb { background: ${LC.borderLight}; border-radius: 5px; }
  .lc-editor-root ::-webkit-scrollbar-thumb:hover { background: ${LC.textMute}; }
  .lc-editor-root button:hover { opacity: 0.92; }
  .lc-editor-root .lc-lang-tab:hover { background: ${LC.hover}; }
  .lc-editor-root .lc-icon-btn:hover { background: ${LC.hover}; color: ${LC.text}; }
  /* ── LeetCode HTML description styling ── */
  .lc-problem-html { color: ${LC.text}; }
  .lc-problem-html p { margin: 0 0 12px; line-height: 1.7; }
  .lc-problem-html strong, .lc-problem-html b { color: #fff; font-weight: 600; }
  .lc-problem-html em, .lc-problem-html i { color: ${LC.textDim}; }
  .lc-problem-html code {
    background: ${LC.panelAlt}; color: ${LC.accent};
    padding: 1px 5px; border-radius: 3px;
    font-family: 'JetBrains Mono', 'Menlo', monospace; font-size: 0.9em;
  }
  .lc-problem-html pre {
    background: ${LC.panelAlt}; border: 1px solid ${LC.border};
    border-radius: 6px; padding: 10px 12px;
    color: ${LC.text}; font-family: 'JetBrains Mono', 'Menlo', monospace;
    font-size: 13px; line-height: 1.6; margin: 8px 0; white-space: pre-wrap;
    overflow-x: auto;
  }
  .lc-problem-html pre code {
    background: transparent; color: ${LC.text}; padding: 0; border: none;
  }
  .lc-problem-html ul, .lc-problem-html ol { margin: 8px 0; padding-left: 20px; }
  .lc-problem-html li { margin: 4px 0; line-height: 1.7; color: ${LC.text}; }
  .lc-problem-html img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
  .lc-problem-html sup { font-size: 0.7em; vertical-align: super; color: ${LC.textDim}; }
  .lc-problem-html sub { font-size: 0.7em; vertical-align: sub; color: ${LC.textDim}; }
  .lc-problem-html a { color: ${LC.accent}; text-decoration: none; }
  .lc-problem-html a:hover { text-decoration: underline; }
  .lc-problem-html table { border-collapse: collapse; margin: 8px 0; width: 100%; }
  .lc-problem-html th, .lc-problem-html td {
    border: 1px solid ${LC.border}; padding: 6px 10px;
    color: ${LC.text}; text-align: left;
  }
  .lc-problem-html th { background: ${LC.panelAlt}; font-weight: 600; }
  .lc-problem-html .example { color: ${LC.accent}; font-weight: 600; }
  .lc-problem-html blockquote {
    border-left: 3px solid ${LC.accent}; padding-left: 12px;
    margin: 8px 0; color: ${LC.textDim};
  }
  .lc-problem-html .force-bold { color: #fff; font-weight: 600; }
`;

export default LeetCodeCodeEditor;
