const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s = '') {
  return String(s)
    .replace(/\u001b\[.*?m/g, '')
    .replace(/\u001b\[.*?[A-Za-z]/g, '');
}

module.exports = {
  async run(code, input) {
    const body = {
      code,
      compiler: 'openjdk-jdk21',
      stdin: input || '',
      save: false,
    };

    const response = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error('Wandbox error: ' + text.slice(0, 200));
    }

    if (result.compiler_error) {
      throw new Error('compile_error: ' + stripANSI(result.compiler_error));
    }

    if (result.status !== '0') {
      throw new Error(stripANSI(result.program_message || result.program_error || 'runtime_error'));
    }

    return {
      output: stripANSI(result.program_output || '').trim(),
      error: null,
    };
  },
};
