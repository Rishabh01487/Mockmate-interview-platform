function runJavaScript(code, input) {
  const logs = [];
  const sandbox = {
    console: { log: (...a) => logs.push(a.map(String).join(' ')), error: (...a) => logs.push('[ERR] ' + a.join(' ')) },
    input,
  };
  try {
    const fn = new Function(...Object.keys(sandbox), code);
    fn(...Object.values(sandbox));
    return { output: logs.join('\n') || '(no output)', error: null };
  } catch (e) {
    return { output: '', error: e.message };
  }
}

module.exports = {
  run(code, input, options = {}) {
    const result = runJavaScript(code, input);
    if (result.error) throw new Error(result.error);
    return Promise.resolve({ output: result.output, error: null });
  },
};
