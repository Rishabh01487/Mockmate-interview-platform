// Quick export script - runs through the already-connected backend
const http = require('http');
const options = { hostname: 'localhost', port: 5000, path: '/api/training/export', method: 'POST', headers: { 'Content-Type': 'application/json' } };
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => { console.log('Result:', data); });
});
req.write(JSON.stringify({ path: 'D:\\MockMate-AI-Training\\data' }));
req.end();
