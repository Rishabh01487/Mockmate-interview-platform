const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s) {
  return s.replace(/\u001b\[.*?m/g, '').replace(/\u001b\[.*?[A-Za-z]/g, '');
}

module.exports = {
  async run(code, input, options = {}) {
    const body = {
      code,
      compiler: 'cpython-3.10',
      stdin: input || '',
      save: false,
    };

    const wandbox = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await wandbox.json();

    if (result.compiler_error) {
      throw new Error('compile_error: ' + stripANSI(result.compiler_error));
    }
    return {
      output: stripANSI(result.program_output || result.program_message || '(no output)'),
      error: result.status !== '0' ? result.program_message : null,
    };
  },
};
