const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s) {
  return s.replace(/\u001b\[.*?m/g, '').replace(/\u001b\[.*?[A-Za-z]/g, '');
}

// ── LeetCode struct definitions (always prepended) ──────────
const LEETCODE_HEADER = `
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
`;

// ── Type abbreviation system (maps C++ types to short codes) ─
function typeName(t) {
  return t.replace(/&/g, '').replace(/const/g, '').trim();
}
const TYPE_ABBR = {
  'int':'i','long long':'ll','double':'d','float':'f',
  'char':'c','bool':'b','string':'s','std::string':'s',
};
function typeToAbbr(t) {
  const clean = typeName(t);
  if (TYPE_ABBR[clean]) return TYPE_ABBR[clean];
  if (clean === 'ListNode*' || clean === 'ListNode *') return 'ln';
  if (clean === 'TreeNode*' || clean === 'TreeNode *') return 'tn';
  const vm = clean.match(/^vector<(.+)>$/);
  if (vm) return 'v' + typeToAbbr(vm[1]);
  return 'x' + clean.replace(/[^a-zA-Z0-9]/g, '_');
}
const ABBR_TYPE = {
  i:'int', ll:'long long', d:'double', f:'float',
  c:'char', b:'bool', s:'string',
  ln:'ListNode*', tn:'TreeNode*',
};
function abbrToType(a) {
  if (ABBR_TYPE[a]) return ABBR_TYPE[a];
  if (a.startsWith('v')) return 'vector<' + abbrToType(a.slice(1)) + '>';
  return 'int';
}

// ── Generate type-specific parser / formatter helpers ────────
function genHelpers(types) {
  const all = new Set(types);
  if (all.has('ln')) all.add('vi');
  if (all.has('tn')) all.add('vs');
  for (let done = false; !done; ) {
    done = true;
    for (const a of Array.from(all)) {
      if (a.startsWith('v') && !all.has(a.slice(1))) {
        all.add(a.slice(1)); done = false;
      }
    }
  }
  const prio = ['i','ll','d','f','c','b','s'];
  const sorted = [];
  for (const a of prio) { if (all.has(a)) { sorted.push(a); all.delete(a); } }
  sorted.push(...Array.from(all).sort((a,b)=>{
    if (a.length!==b.length) return a.length-b.length;
    const aV=a.startsWith('v')?0:1, bV=b.startsWith('v')?0:1;
    return aV-bV;
  }));
  let code = '';
  for (const a of sorted) {
    if (a==='i') {
      code+=`int __p_i(const string& s){return stoi(s);}\n`;
      code+=`string __fmt_i(int v){return to_string(v);}\n`;
    } else if (a==='ll') {
      code+=`long long __p_ll(const string& s){return stoll(s);}\n`;
      code+=`string __fmt_ll(long long v){return to_string(v);}\n`;
    } else if (a==='d') {
      code+=`double __p_d(const string& s){return stod(s);}\n`;
      code+=`string __fmt_d(double v){ostringstream __o;__o<<v;string __r=__o.str();if(__r.find('.')==string::npos)__r+=".0";return __r;}\n`;
    } else if (a==='f') {
      code+=`float __p_f(const string& s){return stof(s);}\n`;
      code+=`string __fmt_f(float v){ostringstream __o;__o<<v;string __r=__o.str();if(__r.find('.')==string::npos)__r+=".0";return __r;}\n`;
    } else if (a==='c') {
      code+=`char __p_c(const string& s){string t=s;while(t.size()&&(t[0]==' '||t[0]=='\\t'))t=t.substr(1);if(t.size()>=3&&t[0]=='\\''&&t[2]=='\\'')return t[1];return t.empty()?' ':t[0];}\n`;
      code+=`string __fmt_c(char v){return string(1,v);}\n`;
    } else if (a==='b') {
      code+=`bool __p_b(const string& s){string t=s;while(t.size()&&(t[0]==' '||t[0]=='\\t'))t=t.substr(1);return t=="true"||t=="1";}\n`;
      code+=`string __fmt_b(bool v){return v?"true":"false";}\n`;
    } else if (a==='s') {
      code+=`string __p_s(const string& s){string t=s;while(t.size()&&(t[0]==' '||t[0]=='\\t'))t=t.substr(1);if(t.size()>=2&&t[0]=='"'&&t.back()=='"')t=t.substr(1,t.size()-2);return t;}\n`;
      code+=`string __fmt_s(const string& v){return '"'+v+'"';}\n`;
    } else if (a==='ln') {
      code+=`ListNode* __p_ln(const string& s){auto v=__p_vi(s);ListNode d;ListNode* c=&d;for(int x:v){c->next=new ListNode(x);c=c->next;}return d.next;}\n`;
      code+=`string __fmt_ln(ListNode* h){vector<int> v;while(h){v.push_back(h->val);h=h->next;}return __fmt_vi(v);}\n`;
    } else if (a==='tn') {
      code+=`TreeNode* __p_tn(const string& s){auto v=__p_vs(s);if(v.empty()||v[0]=="null") return nullptr;auto r=new TreeNode(stoi(v[0]));queue<TreeNode*> q;q.push(r);int i=1;while(!q.empty()&&i<(int)v.size()){auto n=q.front();q.pop();if(i<(int)v.size()&&v[i]!="null"){n->left=new TreeNode(stoi(v[i]));q.push(n->left);} i++; if(i<(int)v.size()&&v[i]!="null"){n->right=new TreeNode(stoi(v[i]));q.push(n->right);} i++;} return r;}\n`;
      code+=`string __fmt_tn(TreeNode* r){vector<string> v;queue<TreeNode*> q;q.push(r);while(!q.empty()){auto n=q.front();q.pop();if(n){v.push_back(to_string(n->val));q.push(n->left);q.push(n->right);}else v.push_back("null");} while(!v.empty()&&v.back()=="null") v.pop_back();return __fmt_vs(v);}\n`;
    } else if (a.startsWith('v')) {
      const inner = a.slice(1);
      const innerType = abbrToType(inner);
      const fullType = abbrToType(a);
      code += `${fullType} __p_${a}(const string& s) {\n`;
      code += `  string t=s; while(t.size()&&(t[0]==' '||t[0]=='\\t'||t[0]=='\\r'))t=t.substr(1); while(t.size()&&(t.back()==' '||t.back()=='\\t'||t.back()=='\\r'))t.pop_back();\n`;
      code += `  if(t.size()>=2&&t[0]=='['&&t.back()==']')t=t.substr(1,t.size()-2);\n`;
      code += `  vector<${innerType}> res; string cur; int depth=0;\n`;
      code += `  for(char c:t){if(c=='<'||c=='['||c=='{')depth++; else if(c=='>'||c==']'||c=='}')depth--;\n`;
      code += `  if(c==','&&depth==0){while(cur.size()&&(cur[0]==' '||cur[0]=='\\t'))cur=cur.substr(1); while(cur.size()&&cur.back()==' ')cur.pop_back(); if(!cur.empty())res.push_back(__p_${inner}(cur)); cur.clear();} else cur+=c;}\n`;
      code += `  while(cur.size()&&(cur[0]==' '||cur[0]=='\\t'))cur=cur.substr(1); while(cur.size()&&cur.back()==' ')cur.pop_back(); if(!cur.empty())res.push_back(__p_${inner}(cur));\n`;
      code += `  return res;\n}\n`;
      code += `string __fmt_${a}(const ${fullType}& v) {\n`;
      code += `  string r="["; for(size_t i=0;i<v.size();i++){if(i)r+=","; r+=__fmt_${inner}(v[i]);} return r+"]";\n}\n`;
    }
  }
  return code;
}

// ── Generate main() driver ─────────────────────────────────
function generateMain(code) {
  const className = (code.match(/class\s+(\w+)/)||[])[1]||'Solution';
  const methodRe = /public\s*:\s*\n?\s*(.+?)\s+(\w+)\s*\(([^()]*)\)/s;
  const m = code.match(methodRe);
  if (!m) return '';
  let retRaw = m[1].trim().replace(/^(static|virtual|inline|constexpr)\s+/i, '');
  const methodName = m[2];
  const paramsStr = m[3].trim();
  const params = [];
  if (paramsStr) {
    let depth = 0, cur = '';
    for (const ch of paramsStr) {
      if (ch==='<'||ch==='('||ch==='['||ch==='{') depth++;
      else if (ch==='>'||ch===')'||ch===']'||ch==='}') depth--;
      if (ch===','&&depth===0) { params.push(cur.trim()); cur=''; }
      else cur += ch;
    }
    params.push(cur.trim());
  }
  const parsed = params.map(p => {
    const parts = p.split(/\s+/);
    const name = parts[parts.length-1];
    const rawType = parts.slice(0,-1).join(' ');
    return { name, rawType, type: typeName(rawType) };
  });
  const retType = typeName(retRaw);
  const typeAbbrs = new Set(parsed.map(p => typeToAbbr(p.type)));
  typeAbbrs.add(typeToAbbr(retType));

  // Build body: read each parameter from stdin using __p_* helpers
  let body = '';
  for (const {name,type} of parsed) {
    const a = typeToAbbr(type);
    body += `  string __l_${name}; getline(cin,__l_${name}); auto ${name}=__p_${a}(__l_${name});\n`;
  }
  const args = parsed.map(p=>p.name).join(',');
  if (retType==='void') {
    body += `  sol.${methodName}(${args});\n  cout<<"void"<<endl;\n`;
  } else {
    const a = typeToAbbr(retType);
    body += `  cout<<__fmt_${a}(sol.${methodName}(${args}))<<endl;\n`;
  }
  return genHelpers(typeAbbrs) +
    `int main(){\n  ios::sync_with_stdio(false);cin.tie(nullptr);\n  ${className} sol;\n${body}  return 0;\n}`;
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
  wrapped.push(LEETCODE_HEADER);
  wrapped.push(code);
  wrapped.push('');
  const mainCode = generateMain(code);
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
