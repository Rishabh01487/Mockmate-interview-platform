const { compileAndTest } = require('./firecracker');
const { runTests, submitTests } = require('./index');

async function runHandler(req, res) {
  try {
    const { language, code, input, expectedOutput } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });
    if (language === 'cpp') {
      const testCases = [{ input: input || '', expectedOutput: expectedOutput || '' }];
      const details = await compileAndTest({ lang: language, code, testCases, sampleOnly: true });
      res.json(details[0]);
    } else {
      const results = await runTests(language, code, [{ input: input || '', expectedOutput: expectedOutput || '' }]);
      res.json(results[0]);
    }
  } catch (err) {
    res.json({ passed: false, status: 'runtime_error', error: err.message, actualOutput: `Error: ${err.message}` });
  }
}

async function submitHandler(req, res) {
  try {
    const { language, code, testCases } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });
    if (!testCases || !testCases.length) return res.status(400).json({ error: 'No test cases' });
    if (language === 'cpp') {
      const details = await compileAndTest({ lang: language, code, testCases, sampleOnly: false });
      const passedCount = details.filter(r => r.passed).length;
      const totalTests = details.length;
      res.json({
        language, code,
        testResults: details,
        passedCount, totalTests,
        score: totalTests > 0 ? Math.round((passedCount / totalTests) * 100) : 0,
        status: passedCount === totalTests ? 'accepted'
          : details.some(r => r.status === 'compile_error' || r.status === 'runtime_error') ? 'runtime_error'
          : details.some(r => r.status === 'time_limit_exceeded') ? 'time_limit_exceeded'
          : 'wrong_answer',
      });
    } else {
      const result = await submitTests(language, code, testCases);
      res.json(result);
    }
  } catch (err) {
    res.json({ status: 'runtime_error', error: err.message, passedCount: 0, totalTests: 0, score: 0, testResults: [] });
  }
}

module.exports = { runHandler, submitHandler };
