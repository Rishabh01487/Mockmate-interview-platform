const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { HEADER: CPP_HDR, generateMain } = require('./templates/cpp');

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s) {
  return s.replace(/\u001b\[.*?m/g, '').replace(/\u001b\[.*?[A-Za-z]/g, '');
}

let hasGpp = null;
function checkGpp() {
  if (hasGpp !== null) return hasGpp;
  try {
    execSync('g++ --version', { stdio: 'pipe' });
    hasGpp = true;
  } catch {
    hasGpp = false;
  }
  return hasGpp;
}

async function compileLocal(code, input) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'judge-'));
  try {
    const src = path.join(tmpDir, 'user.cpp');
    const mainCode = generateMain(code);
    const fullCode = [CPP_HDR, code, mainCode].join('\n');
    fs.writeFileSync(src, fullCode, 'utf8');
    execSync(`g++ -std=c++17 -O2 -s "${src}" -o "${tmpDir}/sol"`, { stdio: 'pipe', timeout: 15000 });
    const out = execSync(`"${tmpDir}/sol"`, { input, timeout: 5000, maxBuffer: 50 * 1024 * 1024 });
    return { output: out.toString().trim(), error: null };
  } catch (e) {
    const msg = e.stderr ? e.stderr.toString() : e.message;
    if (msg.includes('not recognized') || msg.includes('not found') || msg.includes('spawn')) {
      return null;
    }
    throw new Error(msg.includes('error:') || msg.includes('undefined reference') ? 'compile_error: ' + msg : msg);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

async function compileWandbox(code, input) {
  const mainCode = generateMain(code);
  const body = {
    code: [CPP_HDR, code, mainCode].join('\n'),
    compiler: 'clang-head',
    options: '-std=c++17 -O2 -stdlib=libstdc++',
    stdin: input || '',
    save: false,
    compiler_option_raw: true,
  };
  const res = await fetch(WANDBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  if (result.compiler_error) {
    throw new Error('compile_error: ' + stripANSI(result.compiler_error));
  }
  return { output: stripANSI(result.program_output || result.program_message || '(no output)').trim(), error: result.status !== '0' ? result.program_message : null };
}

async function compileAndRun(code, input) {
  if (checkGpp()) {
    const local = await compileLocal(code, input);
    if (local !== null) return local;
  }
  return compileWandbox(code, input);
}

async function compileAndTest({ lang, code, testCases, sampleOnly }) {
  if (lang !== 'cpp') {
    throw new Error('Only C++ is supported in judge templates');
  }
  const cases = sampleOnly ? testCases.slice(0, 3) : testCases;
  const details = [];
  for (const tc of cases) {
    const start = Date.now();
    try {
      const out = await compileAndRun(code, tc.input);
      const elapsed = Date.now() - start;
      const passed = out.output === (tc.expectedOutput || '').trim();
      details.push({
        passed,
        status: passed ? 'accepted' : 'wrong_answer',
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: out.output,
        executionTime: elapsed,
        error: out.error || '',
      });
    } catch (err) {
      const elapsed = Date.now() - start;
      const status = err.message === 'TLE' ? 'time_limit_exceeded'
        : err.message.includes('compile') ? 'compile_error'
        : 'runtime_error';
      details.push({
        passed: false,
        status,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: status === 'compile_error' ? err.message : `Error: ${err.message}`,
        executionTime: elapsed,
        error: err.message,
      });
    }
  }
  return details;
}

module.exports = { compileAndTest };
