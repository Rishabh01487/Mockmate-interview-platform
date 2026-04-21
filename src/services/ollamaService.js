// ════════════════════════════════════════════════════════════
//  Verge1.o — Cloud AI Service Layer
//  Routes through backend proxy → SambaNova Cloud API
//  API key is stored securely in backend/.env
// ════════════════════════════════════════════════════════════

const AI_BASE = '/api/ai';

/**
 * Check if the AI backend is reachable and API key is configured
 */
export async function isOllamaOnline() {
  try {
    const res = await fetch(`${AI_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.online === true;
  } catch {
    return false;
  }
}

/**
 * Send a chat completion through the backend proxy
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - { model, temperature }
 * @returns {Promise<string>} The assistant's response text
 */
export async function chatCompletion(messages, options = {}) {
  const { model = 'gemma3:12b', temperature = 0.7 } = options;

  const res = await fetch(`${AI_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, temperature })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `AI responded with ${res.status}`);
  }

  const data = await res.json();
  return data.message?.content || '';
}

/**
 * Generate interview questions for a specific domain using AI
 * @param {string} domain - e.g. 'dsa', 'os', 'dbms'
 * @param {number} count - number of questions to generate
 * @param {string} difficulty - 'Easy' | 'Medium' | 'Hard' | null (mixed)
 * @returns {Promise<Array>} Array of question objects
 */
export async function generateQuestions(domain, count = 10, difficulty = null, typeFilter = 'all') {
  const domainNames = {
    dsa: 'Data Structures & Algorithms',
    os: 'Operating Systems',
    dbms: 'Database Management Systems (SQL/NoSQL)',
    cn: 'Computer Networks',
    oop: 'Object-Oriented Programming & Design Patterns',
    systemdesign: 'System Design & Architecture',
    webdev: 'Web Development (Frontend/Backend/Full-Stack)',
    corecs: 'Core Computer Science Theory'
  };

  const domainLabel = domainNames[domain] || domain;
  const diffClause = difficulty ? ` All questions must be ${difficulty} difficulty.` : ' Include a mix of Easy, Medium, and Hard questions.';
  
  let typeClause = '- Vary question types: some coding, some MCQ, some verbal/conceptual.';
  if (typeFilter === 'mcq') typeClause = '- CRITICAL: ALL questions MUST be Multiple Choice Questions (questionType: "mcq"). Do NOT generate coding or text questions.';
  if (typeFilter === 'text') typeClause = '- CRITICAL: ALL questions MUST be verbal/conceptual theory questions (questionType: "text"). Do NOT generate mcq or coding questions.';
  if (typeFilter === 'coding') typeClause = '- CRITICAL: ALL questions MUST be algorithmic coding problems (questionType: "coding"). Do NOT generate mcq or text questions.';

  const prompt = `You are an expert CS interview question generator. Generate exactly ${count} unique technical interview questions about ${domainLabel}.${diffClause}

RULES:
- Each question must be a standalone interview question (the kind asked at Google, Meta, Amazon).
- For coding/DSA questions: include a problem statement, constraints, and at least one example with input/output.
- For theory questions: make them deep and probing, not surface-level.
${typeClause}

Return ONLY valid JSON array. Each element must have this exact structure:
{
  "question": "The question title or text",
  "questionType": "coding" | "mcq" | "text",
  "difficulty": "Easy" | "Medium" | "Hard",
  "tags": ["tag1", "tag2"],
  "problemStatement": "Full problem description (for coding) or question body",
  "timeLimit": 120-300,
  "constraints": ["constraint1"],
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "expectedPoints": ["key point 1", "key point 2"],
  "options": [{"text": "A"}, {"text": "B"}, {"text": "C"}, {"text": "D"}],
  "correctOptionIndex": 0
}

Notes:
- "options" and "correctOptionIndex" only for questionType "mcq"
- "constraints", "examples" only for questionType "coding"
- "expectedPoints" for "text" type questions
- DO NOT include any text outside the JSON array. No markdown fences, no explanation.`;

  const response = await chatCompletion([
    { role: 'system', content: 'You are a precise JSON generator. Output ONLY valid JSON arrays. No markdown fences, no commentary.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.8 });

  // Parse the JSON from the response, handling potential markdown fences
  let cleaned = response.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('AI did not return an array');

  // Normalize and assign IDs
  return parsed.map((q, i) => ({
    id: `${domain}-ai-${Date.now()}-${i}`,
    questionType: q.questionType || 'voice',
    question: q.question || 'Untitled Question',
    difficulty: q.difficulty || 'Medium',
    tags: [...(q.tags || []), 'ai-generated'],
    timeLimit: q.timeLimit || 180,
    problemStatement: q.problemStatement || q.question,
    constraints: q.constraints || [],
    examples: q.examples || [],
    expectedPoints: q.expectedPoints || [],
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    starterCode: q.questionType === 'coding' ? {
      javascript: `// AI Generated: ${q.question}\nfunction solution() {\n  \n}`,
      python: `# AI Generated: ${q.question}\ndef solution():\n    pass`,
      cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n// AI Generated: ${q.question}\nint main() {\n    \n    return 0;\n}`,
      java: `// AI Generated: ${q.question}\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}`
    } : undefined,
    _aiGenerated: true
  }));
}

/**
 * Analyze/debug/compile code using AI
 * @param {string} code - The source code
 * @param {string} language - 'javascript' | 'python' | 'cpp' | 'java'
 * @param {string} problemStatement - The problem being solved
 * @param {Array} testCases - Array of { input, expectedOutput }
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeCode(code, language, problemStatement, testCases = []) {
  const langNames = { javascript: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java' };

  const testCaseText = testCases.length > 0
    ? `\nTest Cases:\n${testCases.map((tc, i) => `  Case ${i+1}: Input: ${tc.input} → Expected Output: ${tc.expectedOutput}`).join('\n')}`
    : '';

  const prompt = `You are an expert ${langNames[language] || language} compiler and code reviewer. Analyze this code precisely.

PROBLEM: ${problemStatement || 'Not specified'}
${testCaseText}

CODE (${langNames[language] || language}):
\`\`\`${language}
${code}
\`\`\`

Perform these tasks:
1. COMPILE CHECK: Would this code compile/run without syntax errors? List any syntax errors found.
2. LOGIC CHECK: Trace through each test case mentally. For each test case, determine the actual output.
3. BUG DETECTION: Identify any logical bugs, edge case failures, off-by-one errors, or runtime exceptions.
4. OPTIMIZATION: Suggest time/space complexity improvements if any.

Return ONLY valid JSON with this exact structure:
{
  "compiles": true/false,
  "syntaxErrors": ["error description"],
  "testResults": [
    {
      "input": "the input",
      "expectedOutput": "expected",
      "actualOutput": "what the code would actually produce",
      "passed": true/false,
      "explanation": "brief trace of execution"
    }
  ],
  "bugs": ["bug description"],
  "suggestions": ["optimization suggestion"],
  "overallVerdict": "accepted" | "wrong_answer" | "compilation_error" | "runtime_error",
  "score": 0-100
}`;

  const response = await chatCompletion([
    { role: 'system', content: 'You are a precise code analysis engine. Output ONLY valid JSON. No markdown fences, no commentary. Be accurate — trace through the code step by step before determining outputs.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.2 });

  let cleaned = response.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(cleaned);
}
