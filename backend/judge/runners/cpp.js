const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s) {
  return s.replace(/\u001b\[.*?m/g, '').replace(/\u001b\[.*?[A-Za-z]/g, '');
}

function generateMain(code, useStdin) {
  const className = (code.match(/class\s+(\w+)/) || [])[1] || 'Solution';
  const methodRe = /public\s*:\s*\n?\s*(.+?)\s+(\w+)\s*\(([^()]*)\)/s;
  const m = code.match(methodRe);
  if (!m) return '';

  const params = [];
  const paramsStr = m[3].trim();
  if (paramsStr) {
    let depth = 0, cur = '';
    for (const ch of paramsStr) {
      if (ch === '<' || ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === '>' || ch === ')' || ch === ']' || ch === '}') depth--;
      if (ch === ',' && depth === 0) { params.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    params.push(cur.trim());
  }

  let body = '';
  if (useStdin) {
    body += '  string __l;\n';
    for (const p of params) {
      const name = p.replace(/.*\s+/, '');
      body += `  getline(cin,__l); auto ${name}=__p_i(__l);\n`;
    }
  }
  const args = params.map(p => p.replace(/.*\s+/, '')).join(',');
  body += `  cout<<sol.${m[2]}(${args})<<endl;\n`;

  return `int main(){\n  ${className} sol;\n${body}  return 0;\n}`;
}

const STD_HEADERS = [
  'algorithm','array','bitset','cassert','cctype','chrono','climits','cmath',
  'cstdint','cstdio','cstdlib','cstring','ctime','deque','forward_list','fstream',
  'functional','iomanip','ios','iostream','istream','iterator','limits','list',
  'locale','map','memory','mutex','numeric','ostream','queue','random','regex',
  'set','sstream','stack','stdexcept','streambuf','string','thread','tuple',
  'type_traits','typeinfo','unordered_map','unordered_set','utility','valarray','vector'
].map(h => `#include <${h}>`).join('\n');

function wrapCode(code) {
  if (code.includes('int main(') || code.includes('main(')) return code;
  const hasIncludes = code.includes('#include');
  const hasNamespace = code.includes('using namespace');
  const wrapped = [];
  if (!hasIncludes) wrapped.push(STD_HEADERS);
  if (!hasNamespace) wrapped.push('using namespace std;');
  wrapped.push('');
  wrapped.push(code);
  wrapped.push('');
  const mainCode = generateMain(code, true);
  if (mainCode) wrapped.push(mainCode);
  else wrapped.push('int main() { return 0; }');
  return wrapped.join('\n');
}

module.exports = {
  async run(code, input, options = {}) {
    const compiled = wrapCode(code);
    const body = {
      code: compiled,
      compiler: 'clang-head',
      options: '-std=c++23 -O2 -fsanitize=address -stdlib=libstdc++',
      stdin: input || '',
      save: false,
      compiler_option_raw: true,
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
