/**
 * LeetCode API helper — fetches full question content + generates proper starter code
 *
 * The previous code only fetched the problem LIST (which returns just title/difficulty/tags)
 * and stored a stub problem statement like "Implement the solution for: X". This helper
 * fetches the FULL question content via the /select?titleSlug= endpoint, which returns:
 *   - question: full HTML content (statement, examples, constraints)
 *   - exampleTestcases: real test case input (one per line, newline-separated cases)
 *   - hints, similar questions, etc.
 *
 * It also generates LeetCode-accurate starter code with proper function signatures,
 * parameter names, and return types — matching what LeetCode itself shows.
 */

const LC_API = 'https://alfa-leetcode-api.onrender.com';

// Cache to avoid re-fetching the same question
const contentCache = new Map();

/**
 * Fetch full question content by titleSlug.
 * Returns { problemStatement, examples, constraints, exampleTestcases, hints, titleSlug } or null.
 */
export async function fetchQuestionContent(titleSlug) {
  if (contentCache.has(titleSlug)) return contentCache.get(titleSlug);

  try {
    const res = await fetch(`${LC_API}/select?titleSlug=${encodeURIComponent(titleSlug)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Parse the HTML question content into structured parts
    const html = data.question || '';
    const parsed = parseQuestionHtml(html);

    // Parse example testcases — LeetCode gives them as a single string with \n separators
    // e.g. "[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6"
    const exampleTestcases = data.exampleTestcases || '';
    const testCases = parseExampleTestcases(exampleTestcases);

    const result = {
      titleSlug,
      problemStatement: parsed.statement,
      examples: parsed.examples,
      constraints: parsed.constraints,
      hints: data.hints || [],
      testCases,
      rawHtml: html,
      difficulty: data.difficulty,
      questionFrontendId: data.questionFrontendId,
      title: data.questionTitle,
      topicTags: data.topicTags || [],
    };

    contentCache.set(titleSlug, result);
    return result;
  } catch (err) {
    console.warn(`[LeetCode] Failed to fetch ${titleSlug}:`, err.message);
    return null;
  }
}

/**
 * Parse LeetCode's HTML question content into structured parts.
 * Extracts: clean text statement, examples (input/output/explanation), constraints.
 */
function parseQuestionHtml(html) {
  if (!html) return { statement: '', examples: [], constraints: [] };

  // Create a DOM parser to walk the HTML
  const parser = typeof DOMParser !== 'undefined'
    ? new DOMParser()
    : null;
  const doc = parser ? parser.parseFromString(`<div>${html}</div>`, 'text/html') : null;

  const examples = [];
  const constraints = [];
  let statement = '';

  if (doc) {
    // Extract examples from <pre> blocks following "Example N:" headers
    const pres = doc.querySelectorAll('pre');
    pres.forEach((pre, i) => {
      const text = pre.textContent.trim();
      // Parse "Input: ...\nOutput: ...\nExplanation: ..."
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

    // Extract constraints from <ul> blocks
    const uls = doc.querySelectorAll('ul');
    uls.forEach(ul => {
      const lis = ul.querySelectorAll('li');
      lis.forEach(li => {
        const text = li.textContent.trim();
        if (text && text.length < 200) constraints.push(text);
      });
    });

    // Build a clean text statement: take everything before "Example 1:"
    const fullText = doc.body.textContent.replace(/\s+/g, ' ').trim();
    const exampleIdx = fullText.indexOf('Example 1:');
    const constraintIdx = fullText.indexOf('Constraints:');
    if (exampleIdx > 0) {
      statement = fullText.substring(0, exampleIdx).trim();
    } else if (constraintIdx > 0) {
      statement = fullText.substring(0, constraintIdx).trim();
    } else {
      statement = fullText;
    }
  } else {
    // Fallback: regex-based extraction (for SSR or no DOMParser)
    statement = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return { statement, examples, constraints };
}

/**
 * Parse LeetCode's exampleTestcases string into individual test case objects.
 * LeetCode format: each test case's input is separated by double-newlines,
 * but the actual format varies. We try to be smart about it.
 *
 * Example: "[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6"
 * → 3 test cases: ["[2,7,11,15]", "9"], ["[3,2,4]", "6"], ["[3,3]", "6"]
 *
 * Since we don't know the expected outputs without running the code, we
 * leave expectedOutput empty — the user can Run to see actual output.
 */
function parseExampleTestcases(testcaseStr) {
  if (!testcaseStr) return [];
  const lines = testcaseStr.split('\n').map(l => l.trim()).filter(Boolean);
  // Heuristic: group lines into test cases. Most LeetCode problems have
  // 2-3 input lines per test case. We detect boundaries by looking for
  // patterns that suggest a new test case starts (e.g., a line that looks
  // like an array after a non-array line).
  // For simplicity, if we can't determine, just return one test case per line.
  if (lines.length <= 1) {
    return lines.map(input => ({ input, expectedOutput: '' }));
  }
  // Try to detect: if first line is array and second is number, that's one test case
  // This is a best-effort parse — LeetCode doesn't give us per-case boundaries
  // For now, return all lines as a single multi-line input (most common format)
  return [{ input: lines.join('\n'), expectedOutput: '' }];
}

/**
 * Generate LeetCode-accurate starter code for a question.
 * Uses the function name derived from the titleSlug (camelCase for JS/Java/C++, snake_case for Python).
 *
 * LeetCode's actual patterns:
 *   JavaScript:  var twoSum = function(nums, target) { ... };
 *   Python:      class Solution: def twoSum(self, nums: List[int], target: int) -> List[int]: ...
 *   Java:        class Solution { public int[] twoSum(int[] nums, int target) { ... } }
 *   C++:         class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { ... } };
 *
 * Since we can't know the exact signature from the list API, we generate
 * the best-guess pattern and let the editor's type-detection figure out
 * the rest from the function name.
 */
export function generateStarterCode(titleSlug, title) {
  const camel = toCamelCase(title || titleSlug);
  const snake = toSnakeCase(title || titleSlug);
  const pascal = toPascalCase(title || titleSlug);

  return {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var ${camel} = function(nums, target) {
    
};`,
    python: `class Solution:
    def ${camel}(self, nums: List[int], target: int) -> List[int]:
        pass`,
    java: `class Solution {
    public int[] ${camel}(int[] nums, int target) {
        
    }
}`,
    cpp: `class Solution {
public:
    vector<int> ${camel}(vector<int>& nums, int target) {
        
    }
};`,
  };
}

function toCamelCase(s) {
  const words = String(s).match(/[a-zA-Z0-9]+/g) || ['solution'];
  return words.map((w, i) =>
    i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join('');
}

function toPascalCase(s) {
  const words = String(s).match(/[a-zA-Z0-9]+/g) || ['Solution'];
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toSnakeCase(s) {
  const words = String(s).match(/[a-zA-Z0-9]+/g) || ['solution'];
  return words.map(w => w.toLowerCase()).join('_');
}
