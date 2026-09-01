require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS — fixes Atlas SRV lookup on local machines
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { WebSocketServer } = require('ws');

// ── Models ───────────────────────────────────────────────────
const User             = require('./models/UserSchema');
const Interview        = require('./models/InterviewSchema');
const Question         = require('./models/QuestionSchema');
const Resource         = require('./models/ResourceSchema');
const Feedback         = require('./models/FeedbackSchema');
const Analytics        = require('./models/AnalyticsSchema');
const InterviewRoom    = require('./models/InterviewRoomSchema');
const CodingSubmission = require('./models/CodingSubmissionSchema');
const TrainingData     = require('./models/TrainingDataSchema');

// ── Services ─────────────────────────────────────────────────
const { logQuestionGeneration, logCandidateAnswers, exportToFDrive, getTrainingStats } = require('./services/trainingCollector');

// ── Controllers ──────────────────────────────────────────────
const { register, login, updateProfile, changePassword } = require('./controller/authController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mockmate-dev-secret';

// ── WebSocket ────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const WS_ROOMS = new Map(); // roomCode → Set<WebSocket>

// Compute leaderboard for a room code (reuses existing logic inline)
async function computeLeaderboard(code) {
  const maxPerQ = { easy: 5, medium: 10, hard: 20 };
  const computeEntries = (participants, questions) => {
    const totalMax = (questions || []).reduce((s, aq) => {
      const diff = (aq.difficulty || aq.questionId?.difficulty || 'medium').toLowerCase();
      return s + (maxPerQ[diff] || maxPerQ.medium);
    }, 0) || 10;
    return (participants || []).map(p => {
      const answers = p.answers || [];
      const earned = answers.reduce((s, ans) => {
        const diff = (ans.difficulty || 'medium').toLowerCase();
        return s + Math.round(((ans.score || 0) / 100) * (maxPerQ[diff] || maxPerQ.medium));
      }, 0);
      return {
        participantId: p.id, name: p.name || 'Anonymous', email: p.email || '',
        points: earned, maxPoints: totalMax,
        percentage: totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0,
        questionsAnswered: answers.length,
        totalQuestions: (questions || []).length || answers.length,
        status: p.status || 'active',
      };
    }).sort((a, b) => b.points - a.points);
  };

  // Try in-memory first
  let roomData = LIVE_ROOMS.get(code);
  if (!roomData) {
    const cached = await LiveRoomCache.findOne({ roomCode: code }).lean();
    if (!cached) return null;
    roomData = cached.data || cached;
  }
  const participants = roomData.participants || [];
  if (participants.length > 0) {
    return { leaderboard: computeEntries(participants, roomData.assignedQuestions || []), roomStatus: roomData.status || 'active' };
  }
  // Single-candidate fallback
  const questions = roomData.assignedQuestions || [];
  const answers = roomData.candidateAnswers || [];
  const totalMax = questions.reduce((s, aq) => s + (maxPerQ[(aq.difficulty || 'medium').toLowerCase()] || maxPerQ.medium), questions.length > 0 ? 0 : answers.length * 10);
  const earned = answers.reduce((s, ans) => s + Math.round(((ans.score || 0) / 100) * (maxPerQ[(ans.difficulty || 'medium').toLowerCase()] || maxPerQ.medium)), 0);
  return {
    leaderboard: [{
      name: roomData.candidateEmail || 'Candidate', email: roomData.candidateEmail || '',
      points: earned, maxPoints: totalMax,
      percentage: totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0,
      questionsAnswered: answers.length, totalQuestions: questions.length || answers.length,
    }],
    roomStatus: roomData.status || 'active',
  };
}

async function broadcastLeaderboard(code) {
  const data = await computeLeaderboard(code);
  if (!data) return;
  const msg = JSON.stringify({ type: 'leaderboard-update', roomCode: code, ...data });
  const clients = WS_ROOMS.get(code);
  if (clients) {
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(msg);
    }
  }
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'join-room' && msg.roomCode) {
        const code = msg.roomCode.toUpperCase();
        currentRoom = code;
        if (!WS_ROOMS.has(code)) WS_ROOMS.set(code, new Set());
        WS_ROOMS.get(code).add(ws);
      }
    } catch {}
  });
  ws.on('close', () => {
    if (currentRoom && WS_ROOMS.has(currentRoom)) {
      WS_ROOMS.get(currentRoom).delete(ws);
      if (WS_ROOMS.get(currentRoom).size === 0) WS_ROOMS.delete(currentRoom);
    }
  });
});

// ════════════════════════════════════════════════════════════
//  Core Middleware
// ════════════════════════════════════════════════════════════
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  /\.vercel\.app$/,  // allow all *.vercel.app subdomains
  /\.github\.io$/,   // allow GitHub Pages (training dashboard)
  /^http:\/\/localhost:\d+$/,            // allow any localhost port for dev
  /^http:\/\/127\.0\.0\.1:\d+$/,        // allow 127.0.0.1 dev
  /preview-.*\.space-z\.ai$/,         // allow sandbox preview URLs
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow file:// origins (null) for local training dashboard
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (!allowed) { console.warn(`[CORS] Rejected origin: ${origin}`); return callback(null, false); } callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle OPTIONS preflight for all routes
app.options('*', cors());

app.use(express.json({ limit: '50kb' }));

// Serve training dashboard at /training (avoids CORS issues)
const path = require('path');
app.get('/training', (req, res) => {
  const dashPath = path.resolve(__dirname, '../../MockMate-AI-Training/dashboard.html');
  const fs = require('fs');
  if (fs.existsSync(dashPath)) {
    let html = fs.readFileSync(dashPath, 'utf8');
    // Override API_URL to same origin so no CORS needed
    html = html.replace(
      "let API_URL = localStorage.getItem('mockmate_api_url') || DEFAULT_URL;",
      "let API_URL = window.location.origin;"
    );
    res.type('html').send(html);
  } else {
    res.status(404).send('Training dashboard not found. Place dashboard.html at D:\\MockMate-AI-Training\\');
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });
}

// ════════════════════════════════════════════════════════════
//  Database
// ════════════════════════════════════════════════════════════
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mockmate')
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => { console.warn('⚠️ MongoDB connection failed (Server running in offline mode):', err.message); });

// ════════════════════════════════════════════════════════════
//  Middleware Helpers
// ════════════════════════════════════════════════════════════
const authenticate = (req, res, next) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

const adminOnly = (req, res, next) =>
  req.user?.role !== 'admin'
    ? res.status(403).json({ success: false, message: 'Admin access required' })
    : next();

// Difficulty-based point values
const POINTS = { easy: 5, medium: 10, hard: 20 };

// Mock AI scorer — replace with GPT/Gemini call in production
const mockScore = (answer = '', timedOut = false) => {
  if (timedOut || !answer.trim()) return { overall: 0, clarity: 0, relevance: 0, technical: 0, completeness: 0 };
  const words = answer.trim().split(/\s+/).length;
  const base  = Math.min(100, Math.round((words / 80) * 100));
  return {
    overall:      base,
    clarity:      Math.round(base * 0.92),
    relevance:    Math.round(base * 0.95),
    technical:    Math.round(base * 0.88),
    completeness: Math.round(base * 0.85),
  };
};

// Score a response with difficulty weighting: returns { points, maxPoints, pct }
const scoreWithDifficulty = (difficulty = 'medium', answer = '', timedOut = false) => {
  const pct = mockScore(answer, timedOut);
  const maxPoints = POINTS[difficulty] || POINTS.medium;
  return { points: Math.round((pct.overall / 100) * maxPoints), maxPoints, pct: pct.overall };
};

// ════════════════════════════════════════════════════════════
//  Auth Routes   /api/auth
// ════════════════════════════════════════════════════════════
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.patch('/api/auth/profile',  authenticate, updateProfile);
app.patch('/api/auth/password', authenticate, changePassword);

// ════════════════════════════════════════════════════════════
//  Live Rooms — MongoDB-backed (survives Render spin-downs)
//  Uses a lightweight schema with TTL auto-delete after 48h
// ════════════════════════════════════════════════════════════
const liveRoomCacheSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  data:     { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt:{ type: Date, default: Date.now },
});
liveRoomCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 }); // auto-delete after 48h
const LiveRoomCache = mongoose.model('LiveRoomCache', liveRoomCacheSchema);

// In-memory cache for speed (lost on restart, MongoDB is the source of truth)
const LIVE_ROOMS = new Map();

// POST /api/live-rooms — interviewer creates a room
app.post('/api/live-rooms', async (req, res) => {
  const { room } = req.body;
  if (!room || !room.roomCode) return res.status(400).json({ success: false, message: 'Invalid room data' });
  const code = room.roomCode.toUpperCase();
  room.participants = room.participants || [];
  try {
    // Upsert in MongoDB so re-creating same code works
    await LiveRoomCache.findOneAndUpdate(
      { roomCode: code },
      { roomCode: code, data: room, createdAt: new Date() },
      { upsert: true, new: true }
    );
    LIVE_ROOMS.set(code, room); // also cache in memory for speed
    res.json({ success: true, code });
  } catch (err) {
    console.error('[POST /api/live-rooms]', err.message);
    // Fallback: memory-only if DB write fails
    LIVE_ROOMS.set(code, room);
    res.json({ success: true, code, warning: 'Saved in memory only' });
  }
});

// GET /api/live-rooms/:code — candidate joins a room
app.get('/api/live-rooms/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  // 1. Check memory cache first (fast path)
  if (LIVE_ROOMS.has(code)) {
    return res.json({ success: true, room: LIVE_ROOMS.get(code) });
  }
  // 2. Fallback to MongoDB (handles Render spin-down case)
  try {
    const cached = await LiveRoomCache.findOne({ roomCode: code });
    if (!cached) {
      return res.status(404).json({ success: false, message: 'Room not found. Check the code or ask the interviewer to create a new room.' });
    }
    LIVE_ROOMS.set(code, cached.data); // restore to memory cache
    return res.json({ success: true, room: cached.data });
  } catch (err) {
    console.error('[GET /api/live-rooms/:code]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// PATCH /api/live-rooms/:code — update room state or participant answers
app.patch('/api/live-rooms/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    let room = LIVE_ROOMS.get(code);
    if (!room) {
      const cached = await LiveRoomCache.findOne({ roomCode: code });
      if (!cached) return res.status(404).json({ success: false, message: 'Room not found' });
      room = cached.data;
    }
    const { participantId, ...rest } = req.body;
    if (participantId && room.participants) {
      // Participant-level update (e.g., answer submission)
      const idx = room.participants.findIndex(p => p.id === participantId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Participant not found' });
      if (rest.candidateAnswers) {
        room.participants[idx].answers.push(...rest.candidateAnswers);
        room.participants[idx].questionsAnswered = room.participants[idx].answers.length;
        const diffPoints = { easy: 5, medium: 10, hard: 20 };
        let totalEarned = 0;
        let totalMax = 0;
        for (const ans of room.participants[idx].answers) {
          const diff = (ans.difficulty || 'medium').toLowerCase();
          const maxPts = diffPoints[diff] || diffPoints.medium;
          totalEarned += Math.round(((ans.score || 0) / 100) * maxPts);
          totalMax += maxPts;
        }
        room.participants[idx].totalScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
      }
      if (rest.status) room.participants[idx].status = rest.status;
    } else {
      // Room-level update (status, violations, etc.)
      Object.assign(room, rest);
    }
    LIVE_ROOMS.set(code, room);
    await LiveRoomCache.findOneAndUpdate({ roomCode: code }, { data: room });
    broadcastLeaderboard(code);
    res.json({ success: true, room });
  } catch (err) {
    console.error('[PATCH /api/live-rooms/:code]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/live-rooms/:code/join — candidate joins room, gets unique participantId
app.post('/api/live-rooms/:code/join', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    let room = LIVE_ROOMS.get(code);
    if (!room) {
      const cached = await LiveRoomCache.findOne({ roomCode: code });
      if (!cached) return res.status(404).json({ success: false, message: 'Room not found. Check the code or ask the interviewer to create a new room.' });
      room = cached.data;
    }
    const { name, email } = req.body;
    const participantId = uuidv4().slice(0, 8);
    room.participants = room.participants || [];
    room.participants.push({
      id: participantId,
      name: (name || '').trim() || 'Anonymous',
      email: (email || '').trim(),
      answers: [],
      totalScore: 0,
      questionsAnswered: 0,
      status: 'active',
      joinedAt: new Date().toISOString(),
    });
    LIVE_ROOMS.set(code, room);
    await LiveRoomCache.findOneAndUpdate({ roomCode: code }, { data: room });
    broadcastLeaderboard(code);
    res.json({ success: true, participantId, participant: room.participants[room.participants.length - 1] });
  } catch (err) {
    console.error('[POST /api/live-rooms/:code/join]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/live-rooms/:code/complete — persist room results to MongoDB
// Works with or without auth — anonymous saves skip Analytics/User updates
app.post('/api/live-rooms/:code/complete', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    // Extract userId from token if present (optional auth)
    let authUserId = null;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        authUserId = decoded.userId;
      } catch {}
    }

    const { answers, violations, totalTime, candidateId, participantId, domainGroups } = req.body;

    // Mark participant as completed in live room cache
    if (participantId) {
      const liveRoom = LIVE_ROOMS.get(code) || (await LiveRoomCache.findOne({ roomCode: code }))?.data;
      if (liveRoom && liveRoom.participants) {
        const pIdx = liveRoom.participants.findIndex(p => p.id === participantId);
        if (pIdx !== -1) {
          liveRoom.participants[pIdx].status = 'completed';
          LIVE_ROOMS.set(code, liveRoom);
          await LiveRoomCache.findOneAndUpdate({ roomCode: code }, { data: liveRoom });
        }
      }
    }

    const allAnswers = answers || [];
    const totalQuestions = (domainGroups || []).reduce((s, dg) => s + (dg.questions?.length || 0), 0);

    // Build question entries with difficulty-based points
    const questionEntries = allAnswers.map((ans) => {
      const diff = (ans.difficulty || 'medium').toLowerCase();
      const maxPoints = POINTS[diff] || POINTS.medium;
      const pct = ans.score || 0;
      return {
        text: ans.question || ans.text || '',
        questionType: ans.questionType || 'text',
        userAnswer: ans.textAnswer || ans.code || '',
        score: Math.min(100, pct),
        pointsEarned: Math.round((pct / 100) * maxPoints),
        maxPossiblePoints: maxPoints,
        timeTaken: ans.timeTaken || 0,
        answeredAt: ans.answeredAt ? new Date(ans.answeredAt) : new Date(),
      };
    });

    const totalPointsEarned = questionEntries.reduce((s, q) => s + q.pointsEarned, 0);
    const totalMaxPoints = questionEntries.reduce((s, q) => s + q.maxPossiblePoints, 0);
    const overallScore = totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0;

    const effectiveUserId = candidateId || authUserId;
    const interviewData = {
      type: 'room',
      roomCode: code,
      category: domainGroups?.[0]?.domain || 'general',
      status: 'completed',
      totalQuestions: totalQuestions || allAnswers.length,
      completedQuestions: allAnswers.length,
      overallScore,
      totalPoints: totalPointsEarned,
      maxPossiblePoints: totalMaxPoints,
      completedAt: new Date(),
      totalTimeTaken: totalTime || 0,
      questions: questionEntries,
    };
    if (effectiveUserId) interviewData.userId = effectiveUserId;
    if (authUserId) interviewData.interviewerId = authUserId;

    const interview = await Interview.create(interviewData);

    if (effectiveUserId) {
      await Analytics.upsertToday(effectiveUserId, {
        interviewsCompleted: 1,
        questionsAnswered: allAnswers.length,
        timeSpent: Math.round((totalTime || 0) / 60),
      });
      await User.findByIdAndUpdate(effectiveUserId, {
        $inc: { 'stats.totalInterviews': 1, 'stats.questionsAnswered': allAnswers.length },
        $set: { 'stats.lastActive': new Date() },
      });
    }

    // Update the live room cache to mark completed
    const liveRoom = LIVE_ROOMS.get(code);
    if (liveRoom) {
      LIVE_ROOMS.set(code, { ...liveRoom, status: 'completed', completedAt: new Date().toISOString() });
      await LiveRoomCache.findOneAndUpdate({ roomCode: code }, { data: LIVE_ROOMS.get(code) });
    }

    broadcastLeaderboard(code);
    res.status(201).json({ success: true, interviewId: interview._id, totalPoints: totalPointsEarned, maxPoints: totalMaxPoints, overallScore });
  } catch (err) {
    console.error('[POST /live-rooms/:code/complete]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  C++ Compile API — proxies to Wandbox (used by CodeEditor)
// ════════════════════════════════════════════════════════════
const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

function stripANSI(s) {
  return s.replace(/\u001b\[.*?m/g, '').replace(/\u001b\[.*?[A-Za-z]/g, '');
}

// ── LeetCode-format parse/fmt helpers ────────────────────────
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

function generateMain(code, useStdin) {
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

  let body = '';
  if (useStdin) {
    body += `  string __l;\n`;
    for (const {name,type} of parsed) {
      const a = typeToAbbr(type);
      body += `  getline(cin,__l); auto ${name}=__p_${a}(__l);\n`;
    }
  } else {
    for (const {name,type} of parsed) {
      body += `  ${type} ${name}=${defaultVal(type,name)};\n`;
    }
  }

  const args = parsed.map(p=>p.name).join(',');
  if (retType==='void') {
    body += `  sol.${methodName}(${args});\n`;
  } else {
    const a = typeToAbbr(retType);
    body += `  cout<<__fmt_${a}(sol.${methodName}(${args}))<<endl;\n`;
  }

  return genHelpers(typeAbbrs) + `int main(){\n  ${className} sol;\n${body}  return 0;\n}`;
}

function defaultVal(t, name) {
  const nl = name.toLowerCase();
  if (t==='int'&&(nl.includes('target')||nl.includes('sum'))) return '9';
  if (t==='int'&&(nl.includes('val')||nl.includes('key'))) return '3';
  if (t==='int') return '0';
  if (t==='long long') return '0LL';
  if (t==='double'||t==='float') return t==='double'?'0.0':'0.0f';
  if (t==='char') return "' '";
  if (t==='bool') return 'false';
  if (t==='string'||t==='std::string') return '""';
  if (t.startsWith('vector<int>')&&(nl.includes('nums')||nl.includes('arr'))) return '{2,7,11,15}';
  if (t.startsWith('vector<')) return '{}';
  if (t==='ListNode*'||t==='TreeNode*') return 'nullptr';
  return '{}';
}

const STD_HEADERS = [
  'algorithm','array','bitset','cassert','cctype','chrono','climits','cmath',
  'cstdint','cstdio','cstdlib','cstring','ctime','deque','forward_list','fstream',
  'functional','iomanip','ios','iostream','istream','iterator','limits','list',
  'locale','map','memory','mutex','numeric','ostream','queue','random','regex',
  'set','sstream','stack','stdexcept','streambuf','string','thread','tuple',
  'type_traits','typeinfo','unordered_map','unordered_set','utility','valarray','vector'
].map(h => `#include <${h}>`).join('\n');

function wrapCode(code, useStdin) {
  if (code.includes('int main(') || code.includes('main(')) return code;
  const hasIncludes = code.includes('#include');
  const hasNamespace = code.includes('using namespace');
  const wrapped = [];
  if (!hasIncludes) wrapped.push(STD_HEADERS);
  if (!hasNamespace) wrapped.push('using namespace std;');
  wrapped.push('');
  wrapped.push(code);
  wrapped.push('');
  const mainCode = generateMain(code, useStdin);
  if (mainCode) {
    wrapped.push(mainCode);
  } else {
    wrapped.push('int main() {\n  return 0;\n}');
  }
  return wrapped.join('\n');
}

app.post('/api/compile', async (req, res) => {
  const { code, input } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  const start = Date.now();
  const MAX_RETRIES = 3;
  const compiled = wrapCode(code, !!(input && input.trim()));
  const body = {
    code: compiled,
    compiler: 'clang-head',
    options: '-std=c++23 -O2 -fsanitize=address -stdlib=libstdc++',
    stdin: input || '',
    save: false,
    compiler_option_raw: true,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
      const wandbox = await fetch(WANDBOX_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await wandbox.json();
      const execTime = Date.now() - start;

      const errMsg = stripANSI(result.compiler_error || result.program_output || '');
      if (errMsg.includes('Resource temporarily unavailable') || errMsg.includes('OCI runtime error')) {
        if (attempt < MAX_RETRIES - 1) continue;
        return res.json({ output: 'Wandbox is busy. Please try again.', success: false });
      }

      if (result.compiler_error) {
        return res.json({ output: stripANSI(result.compiler_error), success: false });
      }

      return res.json({
        output: stripANSI(result.program_output || result.program_message || '(no output)'),
        executionTime: `${execTime}ms`,
        success: result.status === '0',
      });
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) continue;
      res.json({ output: err.message, success: false });
    }
  }
});

// ════════════════════════════════════════════════════════════
//  Judge Pipeline — LeetCode-grade verdicts (AC / WA / CE / RE / TLE)
// ════════════════════════════════════════════════════════════
const { runHandler, submitHandler } = require('./judge/handlers');

let testSuites = {};

app.post('/api/judge/run', runHandler);
app.post('/api/judge/submit', submitHandler);

app.post('/api/judge/test-suites', (req, res) => {
  const { questionId, testCases } = req.body;
  if (!questionId || !testCases) return res.status(400).json({ error: 'questionId and testCases required' });
  testSuites[questionId] = testCases;
  res.json({ ok: true, count: testCases.length });
});

// LeetCode proxy: LeetCode's GraphQL API blocks browser CORS, so we proxy
// it through the backend. Returns official code templates for all 4 languages.
app.get('/api/leetcode/code/:titleSlug', async (req, res) => {
  const { titleSlug } = req.params;
  if (!titleSlug) return res.status(400).json({ error: 'titleSlug required' });
  try {
    const lcRes = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://leetcode.com',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: `query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            questionId
            title
            codeSnippets { lang langSlug code }
          }
        }`,
        variables: { titleSlug },
      }),
    });
    const data = await lcRes.json();
    const snippets = data?.data?.question?.codeSnippets || [];
    const result = {};
    for (const snip of snippets) {
      const slug = snip.langSlug;
      if (slug === 'javascript' && !result.javascript) result.javascript = snip.code;
      else if ((slug === 'python3' || slug === 'python') && !result.python) result.python = snip.code;
      else if (slug === 'java' && !result.java) result.java = snip.code;
      else if (slug === 'cpp' && !result.cpp) result.cpp = snip.code;
    }
    res.json({ titleSlug, title: data?.data?.question?.title, starterCode: result });
  } catch (err) {
    console.error('[LeetCode proxy] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch from LeetCode', details: err.message });
  }
});

app.get('/api/judge/test-suites/:questionId', (req, res) => {
  const cases = testSuites[req.params.questionId] || [];
  res.json(cases);
});

// ════════════════════════════════════════════════════════════
//  LeetCode Live API Proxy
// ════════════════════════════════════════════════════════════
app.get('/api/leetcode/snippet/:titleSlug', async (req, res) => {
  try {
    const query = `query questionEditorData($titleSlug: String!) { question(titleSlug: $titleSlug) { codeSnippets { lang langSlug code } } }`;
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query, variables: { titleSlug: req.params.titleSlug } })
    });
    const data = await response.json();
    res.json(data?.data?.question?.codeSnippets || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  LeetCode GraphQL Proxy — POST endpoint (used by CodeEditor useEffect)
// ════════════════════════════════════════════════════════════
app.post('/api/leetcode-graphql', async (req, res) => {
  try {
    const { query, variables } = req.body;
    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query, variables })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.json({ data: null, errors: [{ message: err.message }] });
  }
});

// ════════════════════════════════════════════════════════════
//  AI Proxy — OpenAI-compatible (set AI_API_URL + AI_API_KEY + AI_MODEL)
// ════════════════════════════════════════════════════════════
const AI_BASE_URL = (process.env.AI_API_URL || 'https://openrouter.ai/api/v1').trim().replace(/\/$/, '');
const AI_KEY = (process.env.AI_API_KEY || '').trim();
const AI_MODEL = (process.env.AI_MODEL || 'minimax/minimax-m3:free').trim();

console.log(`✓ AI Provider → ${AI_BASE_URL} (model: ${AI_MODEL})`);

// Health check — verify AI provider is reachable
app.get('/api/ai/health', async (req, res) => {
  try {
    const checkUrl = `${AI_BASE_URL}/models`;
    const check = await fetch(checkUrl, {
      headers: { 'Authorization': `Bearer ${AI_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://mockmate-mu-one.vercel.app', 'X-Title': 'MockMate' },
      signal: AbortSignal.timeout(8000)
    });
    if (!check.ok) {
      const errText = await check.text().catch(() => 'Unknown');
      console.warn(`[AI Health] ${check.status}: ${errText.slice(0, 200)}`);
    }
    res.json({ status: check.ok ? 'online' : 'error', online: check.ok, provider: AI_BASE_URL });
  } catch (err) {
    console.warn('[AI Health] Offline:', err.message);
    res.json({ status: 'offline', online: false, error: err.message });
  }
});

// Chat proxy — routes to correct format automatically
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model, temperature = 0.7 } = req.body;
    const useModel = model || AI_MODEL;
    // Fallback models to try if the primary is rate-limited or unavailable
    const fallbackModels = [
      useModel,
      'minimax/minimax-m3:free',
      'inclusionai/ling-3.0-flash-fin:free',
      'liquid/lfm-2.5-2.6b:free',
      'thinkingmachines/inkling-small:free',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let response, aiContent = '', lastError = '', modelUsed = useModel;

    for (const m of fallbackModels) {
      console.log(`[AI Chat] \xe2\x86\x92 model=${m}, msgs=${messages?.length}`);
      try {
        response = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}`, 'HTTP-Referer': 'https://mockmate-mu-one.vercel.app', 'X-Title': 'MockMate' },
          body: JSON.stringify({ model: m, messages, temperature, max_tokens: 4096, stream: false }),
          signal: AbortSignal.timeout(120000)
        });
        if (response.ok) {
          modelUsed = m;
          break;
        }
        const errBody = await response.text();
        lastError = errBody;
        console.warn(`[AI Chat] model ${m} failed ${response.status}, trying next...`);
        if (response.status !== 429 && response.status !== 404 && response.status !== 503) break;
      } catch (fetchErr) {
        lastError = fetchErr.message;
        console.warn(`[AI Chat] model ${m} fetch error, trying next...`);
      }
    }

    if (!response || !response.ok) {
      console.error(`[AI Chat] all models failed. Last error: ${lastError?.slice(0, 500)}`);
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again in a moment.' });
    }

    const data = await response.json();
    aiContent = data.choices?.[0]?.message?.content || '';
    res.json({ message: { content: aiContent, role: 'assistant' } });

    // ── Log to training data (non-blocking) ──
    const userMsg = messages?.find(m => m.role === 'user')?.content || '';
    const domainMatch = userMsg.match(/about\s+(.+?)\./i);
    const diffMatch = userMsg.match(/(Easy|Medium|Hard)/i);
    const countMatch = userMsg.match(/exactly\s+(\d+)/i);
    let isValid = false;
    try { isValid = Array.isArray(JSON.parse(aiContent.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, ''))); } catch {}
    logQuestionGeneration({
      prompt: userMsg.slice(0, 2000),
      response: aiContent.slice(0, 10000),
      domain: domainMatch?.[1]?.toLowerCase()?.replace(/[^a-z]/g, '') || 'unknown',
      difficulty: diffMatch?.[1] || null,
      questionType: userMsg.includes('mcq') ? 'mcq' : userMsg.includes('coding') ? 'coding' : 'text',
      questionCount: parseInt(countMatch?.[1]) || 0,
      modelUsed: useModel,
      isValidJSON: isValid
    }).catch(() => {});

  } catch (err) {
    console.error('[AI Chat] Exception:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  Training Data API — Stats, Export, Log Answers
// ════════════════════════════════════════════════════════════

// Get training data statistics
app.get('/api/training/stats', async (req, res) => {
  try {
    const stats = await getTrainingStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export training data to F: drive
app.post('/api/training/export', async (req, res) => {
  try {
    const result = await exportToFDrive(req.body.path || 'F:\\MockMate-AI-Training');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log candidate answers for training
app.post('/api/training/answers', async (req, res) => {
  try {
    const { domain, difficulty, answers, overallScore } = req.body;
    await logCandidateAnswers({ domain, difficulty, answers, overallScore });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed training data (generates 600+ samples)
app.post('/api/training/seed', async (req, res) => {
  try {
    const before = await TrainingData.countDocuments();
    const DOMAINS = {
      dsa: { label: 'Data Structures & Algorithms', topics: ['arrays','linked-lists','stacks','queues','trees','graphs','dynamic-programming','sorting','searching','hash-maps','heaps','tries','recursion','backtracking','greedy','binary-search'],
        questions: [
          {q:'What is a binary search tree?',d:'Easy'},{q:'Explain quicksort time complexity.',d:'Medium'},{q:'What is dynamic programming?',d:'Medium'},
          {q:'How does a hash map handle collisions?',d:'Medium'},{q:'BFS vs DFS differences?',d:'Easy'},{q:'Explain Dijkstra algorithm.',d:'Hard'},
          {q:'What is a heap?',d:'Medium'},{q:'Compare AVL and Red-Black trees.',d:'Hard'},{q:'What is amortized analysis?',d:'Hard'},
          {q:'What is a trie?',d:'Medium'},{q:'Explain two-pointer technique.',d:'Easy'},{q:'What is sliding window?',d:'Medium'},
          {q:'What is topological sorting?',d:'Medium'},{q:'Compare merge sort and quick sort.',d:'Medium'},{q:'What is a segment tree?',d:'Hard'},
        ]},
      os: { label: 'Operating Systems', topics: ['processes','threads','scheduling','memory','virtual-memory','deadlocks','file-systems','synchronization','paging','IPC'],
        questions: [
          {q:'Process vs thread difference?',d:'Easy'},{q:'Explain CPU scheduling algorithms.',d:'Medium'},{q:'What is a deadlock?',d:'Medium'},
          {q:'Explain virtual memory and paging.',d:'Medium'},{q:'What is thrashing?',d:'Hard'},{q:'Preemptive vs non-preemptive scheduling?',d:'Easy'},
          {q:'Semaphores vs mutexes?',d:'Medium'},{q:'Explain producer-consumer problem.',d:'Medium'},{q:'What is a page fault?',d:'Medium'},
          {q:'What are system calls?',d:'Easy'},{q:'Explain Banker algorithm.',d:'Hard'},{q:'Internal vs external fragmentation?',d:'Easy'},
          {q:'Explain dining philosophers.',d:'Hard'},{q:'What is a context switch?',d:'Medium'},{q:'Monolithic vs microkernel?',d:'Hard'},
        ]},
      dbms: { label: 'Database Management Systems', topics: ['SQL','normalization','transactions','ACID','indexing','joins','ER-diagrams','NoSQL','concurrency','views'],
        questions: [
          {q:'What is normalization? 1NF to BCNF.',d:'Medium'},{q:'What are ACID properties?',d:'Easy'},{q:'Explain types of joins.',d:'Medium'},
          {q:'What is indexing? B-tree vs hash.',d:'Medium'},{q:'Deadlock in DBMS?',d:'Hard'},{q:'SQL vs NoSQL?',d:'Easy'},
          {q:'What is a transaction?',d:'Medium'},{q:'What is a view?',d:'Easy'},{q:'Concurrency control mechanisms?',d:'Hard'},
          {q:'What is denormalization?',d:'Medium'},{q:'What are triggers?',d:'Medium'},{q:'Two-phase locking?',d:'Hard'},
          {q:'Clustered vs non-clustered index?',d:'Medium'},{q:'Explain CAP theorem.',d:'Hard'},{q:'Stored procedures vs functions?',d:'Easy'},
        ]},
      cn: { label: 'Computer Networks', topics: ['OSI-model','TCP/IP','HTTP','DNS','routing','subnetting','SSL/TLS','sockets','ARP','DHCP'],
        questions: [
          {q:'Explain OSI model layers.',d:'Easy'},{q:'TCP vs UDP?',d:'Easy'},{q:'How does DNS work?',d:'Medium'},
          {q:'What is subnetting?',d:'Medium'},{q:'TCP three-way handshake?',d:'Easy'},{q:'HTTP/2 improvements?',d:'Medium'},
          {q:'What is NAT?',d:'Medium'},{q:'How does HTTPS/TLS work?',d:'Medium'},{q:'Hub vs switch vs router?',d:'Easy'},
          {q:'TCP congestion control?',d:'Hard'},{q:'What is ARP?',d:'Medium'},{q:'What is DHCP?',d:'Easy'},
          {q:'Compare routing protocols.',d:'Hard'},{q:'What is a VLAN?',d:'Medium'},{q:'IPv4 vs IPv6?',d:'Easy'},
        ]},
      oop: { label: 'OOP Concepts', topics: ['inheritance','polymorphism','encapsulation','abstraction','design-patterns','SOLID','interfaces','composition'],
        questions: [
          {q:'Four pillars of OOP?',d:'Easy'},{q:'Abstract class vs interface?',d:'Medium'},{q:'SOLID principles?',d:'Hard'},
          {q:'Compile-time vs runtime polymorphism?',d:'Medium'},{q:'Diamond problem?',d:'Hard'},{q:'Factory pattern?',d:'Medium'},
          {q:'Composition vs inheritance?',d:'Medium'},{q:'What is encapsulation?',d:'Easy'},{q:'Singleton pattern?',d:'Medium'},
          {q:'Overloading vs overriding?',d:'Easy'},{q:'Observer pattern?',d:'Hard'},{q:'Dependency injection?',d:'Medium'},
          {q:'Shallow vs deep copy?',d:'Medium'},{q:'Liskov Substitution Principle?',d:'Hard'},{q:'Strategy vs template pattern?',d:'Hard'},
        ]},
      systemdesign: { label: 'System Design', topics: ['scalability','load-balancing','caching','microservices','databases','message-queues','CDN','API-design'],
        questions: [
          {q:'Design a URL shortener.',d:'Medium'},{q:'Horizontal vs vertical scaling?',d:'Easy'},{q:'How does a load balancer work?',d:'Medium'},
          {q:'What is caching? Redis vs Memcached?',d:'Medium'},{q:'Design a chat app.',d:'Hard'},{q:'What is a CDN?',d:'Easy'},
          {q:'Microservices vs monolithic?',d:'Medium'},{q:'Design a rate limiter.',d:'Medium'},{q:'What is database sharding?',d:'Hard'},
          {q:'Design Twitter news feed.',d:'Hard'},{q:'Eventual vs strong consistency?',d:'Medium'},{q:'Design distributed file storage.',d:'Hard'},
          {q:'API pagination strategies?',d:'Easy'},{q:'Kafka vs RabbitMQ?',d:'Medium'},{q:'Design autocomplete system.',d:'Hard'},
        ]},
      webdev: { label: 'Web Development', topics: ['JavaScript','React','Node.js','REST-API','authentication','WebSockets','CSS','security','performance'],
        questions: [
          {q:'var vs let vs const?',d:'Easy'},{q:'Virtual DOM in React?',d:'Medium'},{q:'What is CORS?',d:'Medium'},
          {q:'JWT authentication?',d:'Medium'},{q:'WebSockets vs HTTP?',d:'Medium'},{q:'JavaScript event loop?',d:'Medium'},
          {q:'REST vs GraphQL?',d:'Medium'},{q:'SSR vs CSR?',d:'Medium'},{q:'Critical rendering path?',d:'Hard'},
          {q:'Web Workers?',d:'Hard'},{q:'CSS box model?',d:'Easy'},{q:'What is XSS?',d:'Medium'},
          {q:'Lazy loading?',d:'Easy'},{q:'JavaScript closures?',d:'Medium'},{q:'Cookies vs localStorage?',d:'Easy'},
        ]},
      corecs: { label: 'Core CS Theory', topics: ['complexity','automata','compilers','discrete-math','computability','logic'],
        questions: [
          {q:'P vs NP?',d:'Hard'},{q:'Big-O notation?',d:'Easy'},{q:'DFA vs NFA?',d:'Medium'},
          {q:'Compiler phases?',d:'Medium'},{q:'Halting problem?',d:'Hard'},{q:'Regular expressions?',d:'Easy'},
          {q:'Context-free grammar?',d:'Medium'},{q:'NP-hard vs NP-complete?',d:'Hard'},{q:'Chomsky hierarchy?',d:'Hard'},
          {q:'Turing machine?',d:'Hard'},{q:'Boolean algebra?',d:'Easy'},{q:'Pushdown automata?',d:'Medium'},
          {q:'Lexical analysis?',d:'Medium'},{q:'Church-Turing thesis?',d:'Hard'},{q:'Space vs time complexity?',d:'Easy'},
        ]}
    };

    const samples = [];
    for (const [domainId, d] of Object.entries(DOMAINS)) {
      for (const q of d.questions) {
        // Question sample
        samples.push({ instruction: `Generate a ${q.d} ${domainId} interview question.`, input: `${d.label}, ${q.d}`, output: JSON.stringify({question:q.q,difficulty:q.d,type:'text',domain:domainId}), domain: domainId, difficulty: q.d, questionType: 'text', source: 'seed', questionCount: 1, isValidJSON: true, modelUsed: 'seed' });
        // Answer sample
        samples.push({ instruction: `Evaluate a ${domainId} answer.`, input: JSON.stringify({question:q.q,answer:`Key concepts of ${q.q}`}), output: JSON.stringify({score:7,isCorrect:true}), domain: domainId, difficulty: q.d, questionType: 'text', source: 'seed', questionCount: 1, isValidJSON: true, modelUsed: 'seed' });
        // MCQ sample
        samples.push({ instruction: `Generate a ${q.d} MCQ about ${domainId}.`, input: `${d.label}, ${q.d}, mcq`, output: JSON.stringify({question:q.q,type:'mcq',options:['A','B','C','D'],correctAnswer:0}), domain: domainId, difficulty: q.d, questionType: 'mcq', source: 'seed', questionCount: 1, isValidJSON: true, modelUsed: 'seed' });
        // Topic variants
        for (const t of d.topics.slice(0, 2)) {
          samples.push({ instruction: `Generate a question about ${t} in ${domainId}.`, input: `${d.label}, ${t}`, output: JSON.stringify({question:`Explain ${t} in ${d.label}.`,type:'text',domain:domainId}), domain: domainId, difficulty: q.d, questionType: 'text', source: 'seed', questionCount: 1, isValidJSON: true, modelUsed: 'seed' });
        }
      }
    }

    // Insert in batches of 50
    for (let i = 0; i < samples.length; i += 50) {
      await TrainingData.insertMany(samples.slice(i, i + 50));
    }
    const after = await TrainingData.countDocuments();
    res.json({ added: after - before, total: after, ready: after >= 500 });
  } catch (err) {
    console.error('[Seed] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});


// ════════════════════════════════════════════════════════════
//  Question Routes   /api/questions
// ════════════════════════════════════════════════════════════
app.get('/api/questions', async (req, res) => {
  try {
    const { category, difficulty, questionType, type, search, limit = 10, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category)     filter.category     = category;
    if (difficulty)   filter.difficulty   = difficulty;
    if (questionType) filter.questionType = questionType;
    if (type)         filter.type         = type;
    if (search)       filter.$text        = { $search: search };

    const lim   = Math.min(parseInt(limit), 50);
    const skip  = (parseInt(page) - 1) * lim;
    const total = await Question.countDocuments(filter);
    const questions = (search || parseInt(page) > 1)
      ? await Question.find(filter).skip(skip).limit(lim).select('-expectedAnswer -testCases')
      : await Question.aggregate([{ $match: filter }, { $sample: { size: lim } }]);

    res.json({ success: true, total, page: parseInt(page), questions });
  } catch (err) {
    console.error('[GET /questions]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/questions/:id', authenticate, async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q || !q.isActive) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, question: q });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.post('/api/questions', authenticate, adminOnly, async (req, res) => {
  try {
    const q = await Question.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json({ success: true, question: q });
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  Interview Routes   /api/interviews
// ════════════════════════════════════════════════════════════
app.post('/api/interviews', authenticate, async (req, res) => {
  try {
    const { type, category, difficulty, topic, questionIds } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'Interview type is required' });
    const interview = await Interview.create({
      userId: req.user.userId, type, category,
      difficulty: difficulty || 'medium', topic,
      totalQuestions: questionIds?.length || 5,
      questions: (questionIds || []).map(qId => ({ questionId: qId })),
    });
    res.status(201).json({ success: true, interview });
  } catch (err) {
    console.error('[POST /interviews]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/interviews', authenticate, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const filter = { userId: req.user.userId };
    if (status) filter.status = status;
    const lim   = Math.min(parseInt(limit), 50);
    const skip  = (parseInt(page) - 1) * lim;
    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 }).skip(skip).limit(lim)
      .select('-questions.aiFeedback');
    res.json({ success: true, total, page: parseInt(page), interviews });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.get('/api/interviews/:id', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.userId })
      .populate('questions.questionId', 'text category subcategory difficulty questionType tags')
      .populate('feedbackIds');
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.patch('/api/interviews/:id/answer', authenticate, async (req, res) => {
  try {
    const { questionId, userAnswer, timeTaken, timedOut } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    if (interview.status !== 'in-progress')
      return res.status(400).json({ success: false, message: 'Interview is not in progress' });

    const scores = mockScore(userAnswer, timedOut);
    const qEntry = interview.questions.find(q => q.questionId?.toString() === questionId);
    if (qEntry) {
      Object.assign(qEntry, {
        userAnswer: userAnswer || '', timeTaken: timeTaken || 0,
        timedOut: timedOut || false, answeredAt: new Date(),
        aiFeedback: {
          score: scores.overall, clarityScore: scores.clarity,
          relevanceScore: scores.relevance, technicalAccuracyScore: scores.technical,
          strengths: scores.overall > 60 ? ['Good coverage of key concepts'] : [],
          improvements: scores.overall < 70 ? ['Include more specific examples', 'Expand on edge cases'] : [],
        },
      });
    }
    interview.completedQuestions = interview.questions.filter(q => q.answeredAt).length;
    const scored = interview.questions.filter(q => q.aiFeedback?.score !== undefined && q.answeredAt);
    interview.overallScore = scored.length
      ? Math.round(scored.reduce((s, q) => s + q.aiFeedback.score, 0) / scored.length) : 0;
    await interview.save();

    const feedback = await Feedback.create({
      interviewId: interview._id, questionId, userId: req.user.userId,
      userAnswer: userAnswer || '', timeTaken: timeTaken || 0, timedOut: timedOut || false,
      clarityScore: scores.clarity, relevanceScore: scores.relevance,
      technicalAccuracyScore: scores.technical, overallScore: scores.overall,
      strengths: scores.overall > 60 ? ['Good coverage'] : [],
      improvements: scores.overall < 70 ? ['More depth needed'] : [],
      generatedBy: 'mock',
    });
    interview.feedbackIds.push(feedback._id);
    await interview.save();
    res.json({ success: true, feedback, overallScore: interview.overallScore });
  } catch (err) {
    console.error('[PATCH /interviews/:id/answer]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch('/api/interviews/:id/complete', authenticate, async (req, res) => {
  try {
    const { totalTimeTaken } = req.body;
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { status: 'completed', completedAt: new Date(), totalTimeTaken: totalTimeTaken || 0 },
      { new: true }
    );
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { 'stats.totalInterviews': 1, 'stats.questionsAnswered': interview.completedQuestions },
      $set: { 'stats.lastActive': new Date() },
    });
    await Analytics.upsertToday(req.user.userId, {
      interviewsCompleted: 1,
      questionsAnswered: interview.completedQuestions,
      timeSpent: Math.round((totalTimeTaken || 0) / 60),
    });
    res.json({ success: true, interview });
  } catch (err) {
    console.error('[PATCH /interviews/:id/complete]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch('/api/interviews/:id/abandon', authenticate, async (req, res) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId, status: 'in-progress' },
      { status: 'abandoned' }, { new: true }
    );
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    await Analytics.upsertToday(req.user.userId, { interviewsAbandoned: 1 });
    res.json({ success: true, interview });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ════════════════════════════════════════════════════════════
//  Quick-save AI Practice Session   POST /api/interviews/quick-save
//  Saves all responses, Interview doc, and Analytics in one call
//  Works with or without auth — anonymous saves skip Analytics/User updates
// ════════════════════════════════════════════════════════════
app.post('/api/interviews/quick-save', async (req, res) => {
  try {
    // Extract userId from token if present (optional auth)
    let userId = null;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch {}
    }

    const { category, difficulty, totalTimeTaken, responses } = req.body;
    if (!responses?.length) return res.status(400).json({ success: false, message: 'No responses to save' });

    const questionEntries = responses.map((r, i) => {
      const diff = (r.difficulty || difficulty || 'medium').toLowerCase();
      const maxPoints = POINTS[diff] || POINTS.medium;
      const scorePct = r.questionType === 'mcq'
        ? (r.isCorrect ? 100 : 0)
        : Math.round(((r.score || 0) / maxPoints) * 100);
      const pointsEarned = r.isCorrect ? maxPoints : (r.score || 0);
      return {
        text: r.question || '',
        questionType: r.questionType || 'text',
        userAnswer: r.answer || r.code || '',
        score: Math.min(100, scorePct),
        pointsEarned: Math.min(maxPoints, pointsEarned),
        maxPossiblePoints: maxPoints,
        timeTaken: r.timeTaken || 0,
        answeredAt: new Date(),
      };
    });

    const totalPointsEarned = questionEntries.reduce((s, q) => s + q.pointsEarned, 0);
    const totalMaxPoints = questionEntries.reduce((s, q) => s + q.maxPossiblePoints, 0);
    const overallScore = totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0;

    const interviewData = {
      type: 'technical',
      category: category || 'general',
      difficulty: (difficulty || 'medium').toLowerCase(),
      status: 'completed',
      totalQuestions: responses.length,
      completedQuestions: responses.length,
      overallScore,
      totalPoints: totalPointsEarned,
      maxPossiblePoints: totalMaxPoints,
      startedAt: new Date(Date.now() - (totalTimeTaken || 0) * 1000),
      completedAt: new Date(),
      totalTimeTaken: totalTimeTaken || 0,
      questions: questionEntries,
    };
    if (userId) interviewData.userId = userId;

    const interview = await Interview.create(interviewData);

    if (userId) {
      await Analytics.upsertToday(userId, {
        interviewsCompleted: 1,
        questionsAnswered: responses.length,
        timeSpent: Math.round((totalTimeTaken || 0) / 60),
      });
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.totalInterviews': 1, 'stats.questionsAnswered': responses.length },
        $set: { 'stats.lastActive': new Date() },
      });
    }

    res.status(201).json({ success: true, interviewId: interview._id, totalPoints: totalPointsEarned, maxPoints: totalMaxPoints, overallScore });
  } catch (err) {
    console.error('[POST /interviews/quick-save]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  Coding Submission Routes   /api/submissions
// ════════════════════════════════════════════════════════════
app.post('/api/submissions', authenticate, async (req, res) => {
  try {
    const { questionId, interviewId, roomId, language, code, testResults, timeTaken } = req.body;
    if (!questionId || !language || !code)
      return res.status(400).json({ success: false, message: 'questionId, language, and code are required' });

    const passedCount = (testResults || []).filter(r => r.passed).length;
    const totalTests  = (testResults || []).length;
    const score       = totalTests ? Math.round((passedCount / totalTests) * 100) : 0;
    const status      = passedCount === totalTests && totalTests > 0 ? 'accepted'
      : (testResults || []).some(r => r.error) ? 'runtime_error' : 'wrong_answer';

    const submission = await CodingSubmission.create({
      userId: req.user.userId, questionId,
      interviewId: interviewId || undefined,
      roomId: roomId || undefined,
      language, code, testResults: testResults || [],
      passedCount, totalTests, status, score,
      timeTaken: timeTaken || 0,
      executionEngine: language === 'javascript' ? 'client_js' : 'mock',
    });

    // Update question usage stats
    const q = await Question.findById(questionId);
    if (q) {
      q.stats.timesAsked   = (q.stats.timesAsked || 0) + 1;
      q.stats.avgScore     = Math.round(((q.stats.avgScore || 0) + score) / 2);
      q.stats.avgTimeTaken = Math.round(((q.stats.avgTimeTaken || 0) + (timeTaken || 0)) / 2);
      await q.save({ validateBeforeSave: false });
    }

    res.status(201).json({ success: true, submission });
  } catch (err) {
    console.error('[POST /submissions]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/submissions', authenticate, async (req, res) => {
  try {
    const { questionId, roomId, limit = 10 } = req.query;
    const filter = { userId: req.user.userId };
    if (questionId) filter.questionId = questionId;
    if (roomId)     filter.roomId     = roomId;
    const submissions = await CodingSubmission.find(filter)
      .sort({ createdAt: -1 }).limit(Math.min(parseInt(limit), 50));
    res.json({ success: true, submissions });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ════════════════════════════════════════════════════════════
//  Interview Room Routes   /api/rooms
// ════════════════════════════════════════════════════════════

// POST /api/rooms — create a room
app.post('/api/rooms', authenticate, async (req, res) => {
  try {
    const { title, description, candidateEmail, assignedQuestions, settings } = req.body;
    if (!assignedQuestions?.length)
      return res.status(400).json({ success: false, message: 'At least one question is required' });

    const room = await InterviewRoom.create({
      interviewerId: req.user.userId,
      title: title || 'MockMate Interview',
      description, candidateEmail,
      assignedQuestions: assignedQuestions.map((q, i) => ({
        questionId: q.questionId, questionType: q.questionType,
        orderIndex: i, points: q.points || 10,
      })),
      settings: {
        timeLimitMinutes: settings?.timeLimitMinutes || 60,
        allowLanguageChoice: settings?.allowLanguageChoice !== false,
        defaultLanguage: settings?.defaultLanguage || 'javascript',
        showHints: settings?.showHints || false,
        proctoring: {
          enabled: true,
          tabSwitchLimit: settings?.tabSwitchLimit || 1,
          blockOnTabSwitch: true,
          requireInterviewerRevive: true,
        },
      },
      status: 'waiting',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    res.status(201).json({ success: true, room });
  } catch (err) {
    console.error('[POST /rooms]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rooms — interviewer's rooms
app.get('/api/rooms', authenticate, async (req, res) => {
  try {
    const rooms = await InterviewRoom.find({ interviewerId: req.user.userId })
      .sort({ createdAt: -1 }).limit(20)
      .select('-candidateAnswers');
    res.json({ success: true, rooms });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// GET /api/rooms/:code — get room by code (candidate + interviewer)
app.get('/api/rooms/:code', async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() })
      .populate('assignedQuestions.questionId');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.isExpired) return res.status(410).json({ success: false, message: 'Room has expired' });

    // Strip hidden test cases for non-interviewers
    const safeRoom = room.toObject();
    safeRoom.assignedQuestions = safeRoom.assignedQuestions.map(aq => ({
      ...aq,
      questionId: {
        ...aq.questionId,
        testCases: (aq.questionId?.testCases || []).filter(tc => !tc.isHidden),
        expectedAnswer: undefined,
      },
    }));
    res.json({ success: true, room: safeRoom });
  } catch (err) {
    console.error('[GET /rooms/:code]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rooms/:code/join — candidate joins
app.post('/api/rooms/:code/join', authenticate, async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.isExpired) return res.status(410).json({ success: false, message: 'Room has expired' });
    if (!['waiting', 'active'].includes(room.status))
      return res.status(400).json({ success: false, message: `Room is ${room.status}` });

    if (!room.candidateId) room.candidateId = req.user.userId;
    if (room.status === 'waiting') room.status = 'active';
    if (!room.startedAt) room.startedAt = new Date();
    await room.save();
    res.json({ success: true, room });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// PATCH /api/rooms/:code/answer — candidate submits an answer
app.patch('/api/rooms/:code/answer', authenticate, async (req, res) => {
  try {
    const { questionId, questionType, textAnswer, selectedOption, isCorrect, submissionId, score, timeTaken } = req.body;
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() })
      .populate('assignedQuestions.questionId', 'difficulty');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.suspension?.isSuspended)
      return res.status(403).json({ success: false, message: 'Session is suspended' });

    // Compute difficulty-based points
    const aq = room.assignedQuestions.find(q =>
      (q.questionId?._id?.toString() || q.questionId?.toString()) === questionId
    );
    const diff = (aq?.questionId?.difficulty || 'medium').toLowerCase();
    const maxPoints = POINTS[diff] || POINTS.medium;
    const pctScore = score || 0;
    const pointsEarned = Math.round((pctScore / 100) * maxPoints);

    const existing = room.candidateAnswers.find(a => a.questionId?.toString() === questionId);
    const answerEntry = {
      questionId, questionType,
      textAnswer: textAnswer || '',
      selectedOption: selectedOption ?? undefined,
      isCorrect: isCorrect ?? undefined,
      submissionId: submissionId || undefined,
      score: pctScore,
      pointsEarned,
      maxPoints,
      timeTaken: timeTaken || 0,
      answeredAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, answerEntry);
    } else {
      room.candidateAnswers.push(answerEntry);
    }
    await room.save();
    res.json({ success: true, pointsEarned, maxPoints });
  } catch (err) {
    console.error('[PATCH /rooms/:code/answer]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rooms/:code/violation — log a proctoring violation
app.post('/api/rooms/:code/violation', authenticate, async (req, res) => {
  try {
    const { type, details } = req.body;
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    room.violations.push({ type: type || 'tab_switch', occurredAt: new Date(), details: details || '' });
    room.tabSwitchCount = (room.tabSwitchCount || 0) + 1;

    const limit = room.settings?.proctoring?.tabSwitchLimit || 1;
    if (room.tabSwitchCount >= limit && room.settings?.proctoring?.blockOnTabSwitch) {
      room.status = 'suspended';
      room.suspension = {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendReason: `Tab switched ${room.tabSwitchCount} time(s). Limit: ${limit}`,
        reviveRequested: false,
      };
    }
    await room.save();
    res.json({ success: true, suspended: room.suspension?.isSuspended || false, room });
  } catch (err) {
    console.error('[POST /rooms/:code/violation]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rooms/:code/revive-request — candidate asks to be revived
app.post('/api/rooms/:code/revive-request', authenticate, async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    room.suspension.reviveRequested    = true;
    room.suspension.reviveRequestedAt  = new Date();
    await room.save();
    res.json({ success: true, message: 'Revival request sent to interviewer' });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// PATCH /api/rooms/:code/revive — interviewer approves revival
app.patch('/api/rooms/:code/revive', authenticate, async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase(), interviewerId: req.user.userId });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found or not authorized' });
    if (!room.suspension?.isSuspended)
      return res.status(400).json({ success: false, message: 'Room is not suspended' });

    room.status = 'active';
    room.suspension.isSuspended      = false;
    room.suspension.revivedAt        = new Date();
    room.suspension.revivedBy        = req.user.userId;
    room.suspension.reviveRequested  = false;
    await room.save();
    res.json({ success: true, message: 'Session revived successfully', room });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// PATCH /api/rooms/:code/complete — end the session
app.patch('/api/rooms/:code/complete', authenticate, async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() })
      .populate('candidateAnswers.questionId', 'difficulty text');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Calculate scores with difficulty weighting
    const answers = room.candidateAnswers;
    const questions = room.assignedQuestions || [];

    const mcqAnswers    = answers.filter(a => a.questionType === 'mcq');
    const codingAnswers = answers.filter(a => a.questionType === 'coding');
    const textAnswers   = answers.filter(a => a.questionType === 'text');

    const avg = (arr) => arr.length ? Math.round(arr.reduce((s, a) => s + (a.score || 0), 0) / arr.length) : 0;
    const overall = answers.length ? avg(answers) : 0;

    room.status      = 'completed';
    room.completedAt = new Date();
    room.scores      = { overall, mcq: avg(mcqAnswers), coding: avg(codingAnswers), text: avg(textAnswers) };
    room.report      = { generated: true, generatedAt: new Date() };
    await room.save();

    // Analytics
    if (room.candidateId) {
      await Analytics.upsertToday(room.candidateId, {
        interviewsCompleted: 1,
        questionsAnswered: answers.length,
        timeSpent: Math.round((room.settings?.timeLimitMinutes || 60)),
      });
    }

    // Persist to Interview collection for long-term history
    const questionEntries = [];
    for (const ans of answers) {
      const aq = questions.find(q => {
        const qid = typeof q.questionId === 'object' ? q.questionId?._id?.toString() : q.questionId?.toString();
        return qid === ans.questionId?.toString();
      });
      const diff = (aq?.questionId?.difficulty || 'medium').toLowerCase();
      const maxPoints = POINTS[diff] || POINTS.medium;
      questionEntries.push({
        questionId: ans.questionId,
        text: aq?.text || aq?.questionId?.text || 'Unknown',
        questionType: ans.questionType || 'text',
        userAnswer: ans.textAnswer || '',
        score: ans.score || 0,
        pointsEarned: Math.round(((ans.score || 0) / 100) * maxPoints),
        maxPossiblePoints: maxPoints,
        timeTaken: ans.timeTaken || 0,
        answeredAt: ans.answeredAt,
      });
    }

    const totalPointsEarned = questionEntries.reduce((s, q) => s + q.pointsEarned, 0);
    const totalMaxPoints = questionEntries.reduce((s, q) => s + q.maxPossiblePoints, 0);

    const interview = await Interview.create({
      userId: room.candidateId,
      type: 'room',
      category: room.domainGroups?.[0]?.domain || 'general',
      status: 'completed',
      roomCode: room.roomCode,
      totalQuestions: questions.length,
      completedQuestions: answers.length,
      overallScore: totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0,
      totalPoints: totalPointsEarned,
      maxPossiblePoints: totalMaxPoints,
      completedAt: new Date(),
      totalTimeTaken: room.settings?.timeLimitMinutes * 60 || 0,
      questions: questionEntries,
      interviewerId: room.interviewerId,
    });
    await interview.save();

    // Also mark interview as completed on User stats
    if (room.candidateId) {
      await User.findByIdAndUpdate(room.candidateId, {
        $inc: { 'stats.totalInterviews': 1, 'stats.questionsAnswered': answers.length },
        $set: { 'stats.lastActive': new Date() },
      });
    }

    res.json({ success: true, room, interviewId: interview._id });
  } catch (err) {
    console.error('[PATCH /rooms/:code/complete]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rooms/:code/report — full room report
app.get('/api/rooms/:code/report', authenticate, async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() })
      .populate('candidateAnswers.questionId', 'text questionType category difficulty keyPoints options explanation')
      .populate('candidateId', 'name email')
      .populate('interviewerId', 'name email');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Only the interviewer or candidate can access
    const uid = req.user.userId;
    if (room.interviewerId?._id?.toString() !== uid && room.candidateId?._id?.toString() !== uid)
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, room, scores: room.scores, violations: room.violations });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ════════════════════════════════════════════════════════════
//  Admin Room Results   /api/rooms/:code/results
// ════════════════════════════════════════════════════════════
app.get('/api/rooms/:code/results', authenticate, async (req, res) => {
  try {
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() })
      .populate('candidateAnswers.questionId', 'text difficulty questionType category')
      .populate('candidateId', 'name email')
      .populate('interviewerId', 'name email');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const uid = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    const isInterviewer = room.interviewerId?._id?.toString() === uid || room.interviewerId?.toString() === uid;
    if (!isAdmin && !isInterviewer)
      return res.status(403).json({ success: false, message: 'Only the interviewer or an admin can view results' });

    const answers = room.candidateAnswers || [];
    const questions = room.assignedQuestions || [];

    // Build per-question breakdown with difficulty-based points
    const breakdown = questions.map(aq => {
      const ans = answers.find(a => a.questionId?.toString() === aq.questionId?.toString());
      const diff = (aq.questionId?.difficulty || 'medium').toLowerCase();
      const maxPoints = POINTS[diff] || POINTS.medium;
      const score = ans ? (ans.score || 0) : 0;
      return {
        questionId: aq.questionId?._id || aq.questionId,
        text: aq.questionId?.text || aq.text || 'Unknown',
        difficulty: diff,
        maxPoints,
        score,
        pointsEarned: Math.round((score / 100) * maxPoints),
        timeTaken: ans?.timeTaken || 0,
        answeredAt: ans?.answeredAt || null,
      };
    });

    const totalMaxPoints = breakdown.reduce((s, q) => s + q.maxPoints, 0);
    const totalPointsEarned = breakdown.reduce((s, q) => s + q.pointsEarned, 0);

    res.json({
      success: true,
      room: {
        roomCode: room.roomCode,
        title: room.title,
        status: room.status,
        createdAt: room.createdAt,
        completedAt: room.completedAt,
        candidateEmail: room.candidateEmail,
        candidate: room.candidateId ? { name: room.candidateId.name, email: room.candidateId.email } : null,
        interviewer: room.interviewerId ? { name: room.interviewerId.name, email: room.interviewerId.email } : null,
      },
      scores: {
        overall: room.scores?.overall || 0,
        totalPointsEarned,
        totalMaxPoints,
        percentage: totalMaxPoints > 0 ? Math.round((totalPointsEarned / totalMaxPoints) * 100) : 0,
      },
      breakdown,
      violations: room.violations || [],
      scores: room.scores,
    });
  } catch (err) {
    console.error('[GET /rooms/:code/results]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  Live Leaderboard   /api/rooms/:code/leaderboard
//  Polled by frontend to show candidate rankings during session
//  Supports multi-candidate participants[], single-candidate LiveRoomCache,
//  and InterviewRoom model (old system)
// ════════════════════════════════════════════════════════════
app.get('/api/rooms/:code/leaderboard', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    // Helper: compute leaderboard entries for a participant list
    const computeEntries = (participants, questions) => {
      const maxPerQ = { easy: 5, medium: 10, hard: 20 };
      const totalMax = (questions || []).reduce((s, aq) => {
        const diff = (aq.difficulty || aq.questionId?.difficulty || 'medium').toLowerCase();
        return s + (maxPerQ[diff] || maxPerQ.medium);
      }, 0) || 10; // fallback if no questions

      return (participants || []).map(p => {
        const answers = p.answers || [];
        const earned = answers.reduce((s, ans) => {
          const diff = (ans.difficulty || 'medium').toLowerCase();
          return s + Math.round(((ans.score || 0) / 100) * (maxPerQ[diff] || maxPerQ.medium));
        }, 0);
        return {
          participantId: p.id,
          name: p.name || 'Anonymous',
          email: p.email || '',
          points: earned,
          maxPoints: totalMax,
          percentage: totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0,
          questionsAnswered: answers.length,
          totalQuestions: (questions || []).length || answers.length,
          status: p.status || 'active',
        };
      });
    };

    // Try InterviewRoom model first (new room system)
    let roomDoc = await InterviewRoom.findOne({ roomCode: code })
      .populate('candidateAnswers.questionId', 'difficulty')
      .populate('candidateId', 'name email');

    if (roomDoc) {
      const questions = roomDoc.assignedQuestions || [];
      // Multi-candidate: participants[] via LiveRoom system stored in roomDoc
      // For InterviewRoom model, try to find associated LiveRoomCache
      const cached = await LiveRoomCache.findOne({ roomCode: code });
      const liveData = cached?.data || {};
      const participants = liveData.participants || [];
      if (participants.length > 1) {
        const entries = computeEntries(participants, questions);
        entries.sort((a, b) => b.points - a.points);
        return res.json({ success: true, leaderboard: entries, roomStatus: roomDoc.status });
      }
      // Single-candidate fallback for InterviewRoom
      const answers = roomDoc.candidateAnswers || [];
      const maxPerQ = { easy: 5, medium: 10, hard: 20 };
      const totalMaxPoints = questions.reduce((s, aq) => {
        const diff = (aq.questionId?.difficulty || 'medium').toLowerCase();
        return s + (maxPerQ[diff] || maxPerQ.medium);
      }, 0);
      const earnedPoints = answers.reduce((s, ans) => {
        const aq = questions.find(q => q.questionId?.toString() === ans.questionId?.toString());
        const diff = (aq?.questionId?.difficulty || 'medium').toLowerCase();
        return s + Math.round((ans.score || 0) / 100 * (maxPerQ[diff] || maxPerQ.medium));
      }, 0);
      return res.json({
        success: true,
        leaderboard: [{
          name: roomDoc.candidateId?.name || roomDoc.candidateEmail || 'Candidate',
          email: roomDoc.candidateId?.email || roomDoc.candidateEmail || '',
          points: earnedPoints,
          maxPoints: totalMaxPoints,
          percentage: totalMaxPoints > 0 ? Math.round((earnedPoints / totalMaxPoints) * 100) : 0,
          questionsAnswered: answers.length,
          totalQuestions: questions.length,
        }],
        roomStatus: roomDoc.status,
      });
    }

    // Fallback to LiveRoomCache (old live-rooms system used by frontend)
    const cached = await LiveRoomCache.findOne({ roomCode: code });
    if (!cached) return res.status(404).json({ success: false, message: 'Room not found' });
    const liveData = cached.data || cached;
    const questions = liveData.assignedQuestions || [];
    const participants = liveData.participants || [];

    if (participants.length > 0) {
      const entries = computeEntries(participants, questions);
      entries.sort((a, b) => b.points - a.points);
      return res.json({ success: true, leaderboard: entries, roomStatus: liveData.status || 'active' });
    }

    // Single-candidate fallback for LiveRoomCache (no participants array)
    const answers = liveData.candidateAnswers || [];
    const maxPerQ = { easy: 5, medium: 10, hard: 20 };
    const totalMax = questions.reduce((s, aq) => {
      const diff = (aq.difficulty || 'medium').toLowerCase();
      return s + (maxPerQ[diff] || maxPerQ.medium);
    }, questions.length > 0 ? 0 : answers.length * 10);
    const earned = answers.reduce((s, ans) => {
      const diff = (ans.difficulty || 'medium').toLowerCase();
      return s + Math.round(((ans.score || 0) / 100) * (maxPerQ[diff] || maxPerQ.medium));
    }, 0);
    res.json({
      success: true,
      leaderboard: [{
        name: liveData.candidateEmail || 'Candidate',
        email: liveData.candidateEmail || '',
        points: earned,
        maxPoints: totalMax,
        percentage: totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0,
        questionsAnswered: answers.length,
        totalQuestions: questions.length || answers.length,
      }],
      roomStatus: liveData.status || 'active',
    });
  } catch (err) {
    console.error('[GET /rooms/:code/leaderboard]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  Feedback Routes   /api/feedback
// ════════════════════════════════════════════════════════════
app.get('/api/feedback', authenticate, async (req, res) => {
  try {
    const { interviewId } = req.query;
    const filter = { userId: req.user.userId };
    if (interviewId) filter.interviewId = interviewId;
    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 })
      .populate('questionId', 'text category difficulty questionType');
    res.json({ success: true, feedbacks });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ════════════════════════════════════════════════════════════
//  User Interview History   /api/interviews/my-sessions
//  Returns recent interview sessions for the current user (or anonymous by code)
// ════════════════════════════════════════════════════════════
app.get('/api/interviews/my-sessions', async (req, res) => {
  try {
    // Extract userId from token if present
    let userId = null;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (token) {
      try { const d = jwt.verify(token, JWT_SECRET); userId = d.userId; } catch {}
    }

    if (!userId) return res.json({ success: true, sessions: [] });

    const sessions = await Interview.find({ userId })
      .sort({ completedAt: -1 })
      .limit(20)
      .select('category difficulty overallScore totalPoints maxPossiblePoints totalQuestions completedQuestions totalTimeTaken completedAt');
    res.json({ success: true, sessions });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ════════════════════════════════════════════════════════════
//  Resource Routes   /api/resources
// ════════════════════════════════════════════════════════════
app.get('/api/resources', async (req, res) => {
  try {
    const { category, type, difficulty, search, limit = 10 } = req.query;
    const filter = { isActive: true };
    if (category)   filter.category   = category;
    if (type)       filter.type       = type;
    if (difficulty) filter.difficulty = difficulty;
    if (search)     filter.$text      = { $search: search };
    const resources = await Resource.find(filter).limit(Math.min(parseInt(limit), 50)).select('-createdBy');
    res.json({ success: true, count: resources.length, resources });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

app.post('/api/resources', authenticate, adminOnly, async (req, res) => {
  try {
    const resource = await Resource.create({ ...req.body, createdBy: req.user.userId });
    res.status(201).json({ success: true, resource });
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ════════════════════════════════════════════════════════════
//  Analytics Routes   /api/analytics
// ════════════════════════════════════════════════════════════
app.get('/api/analytics/me', authenticate, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 90);
    const [history, user] = await Promise.all([
      Analytics.getRecentHistory(req.user.userId, days),
      User.findById(req.user.userId),
    ]);
    res.json({ success: true, stats: user?.stats || {}, history });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
});

// ════════════════════════════════════════════════════════════
//  Health
// ════════════════════════════════════════════════════════════
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString(),
}));

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

server.listen(PORT, () => console.log(`✓ MockMate API → http://localhost:${PORT}`));

module.exports = app;