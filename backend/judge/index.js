const runners = {
  javascript: require('./runners/javascript'),
  python:     require('./runners/python'),
  cpp:        require('./runners/cpp'),
  java:       require('./runners/java'),
};

const VERDICTS = { AC: 'accepted', WA: 'wrong_answer', CE: 'compile_error', RE: 'runtime_error', TLE: 'time_limit_exceeded', MLE: 'memory_limit_exceeded' };

function matchOutput(actual, expected) {
  return actual.trim() === expected.trim();
}

async function runTests(language, code, testCases, options = {}) {
  const runner = runners[language];
  if (!runner) throw new Error(`Unsupported language: ${language}`);

  const results = [];
  const timeLimitMs = options.timeLimit || 5000;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const start = Date.now();
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TLE')), timeLimitMs));
      const exec = runner.run(code, tc.input, options);
      const out = await Promise.race([exec, timeout]);
      const elapsed = Date.now() - start;
      const passed = matchOutput(out.output, tc.expectedOutput);
      results.push({
        passed,
        status: passed ? VERDICTS.AC : VERDICTS.WA,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: out.output,
        executionTime: elapsed,
        error: out.error || '',
      });
    } catch (err) {
      const elapsed = Date.now() - start;
      const status = err.message === 'TLE' ? VERDICTS.TLE : err.message.includes('compile') ? VERDICTS.CE : VERDICTS.RE;
      results.push({
        passed: false,
        status,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: status === VERDICTS.TLE ? '(Time Limit Exceeded)' : `Error: ${err.message}`,
        executionTime: elapsed,
        error: err.message,
      });
    }
  }
  return results;
}

async function submitTests(language, code, testCases, options = {}) {
  const results = await runTests(language, code, testCases, options);
  const passedCount = results.filter(r => r.passed).length;
  const totalTests = results.length;
  return {
    language,
    code,
    testResults: results,
    passedCount,
    totalTests,
    score: totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0,
    status: passedCount === totalTests ? VERDICTS.AC
      : results.some(r => r.status === VERDICTS.RE || r.status === VERDICTS.CE) ? VERDICTS.RE
      : results.some(r => r.status === VERDICTS.TLE) ? VERDICTS.TLE
      : VERDICTS.WA,
  };
}

module.exports = { runTests, submitTests, VERDICTS };
