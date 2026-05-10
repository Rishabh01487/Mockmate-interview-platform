require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ── Models ───────────────────────────────────────────────────
const User             = require('./models/UserSchema');
const Interview        = require('./models/InterviewSchema');
const Question         = require('./models/QuestionSchema');
const Resource         = require('./models/ResourceSchema');
const Feedback         = require('./models/FeedbackSchema');
const Analytics        = require('./models/AnalyticsSchema');
const InterviewRoom    = require('./models/InterviewRoomSchema');
const CodingSubmission = require('./models/CodingSubmissionSchema');

// ── Controllers ──────────────────────────────────────────────
const { register, login, updateProfile, changePassword } = require('./controller/authController');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mockmate-dev-secret';

// ════════════════════════════════════════════════════════════
//  Core Middleware
// ════════════════════════════════════════════════════════════
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  /\.vercel\.app$/,  // allow all *.vercel.app subdomains
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle OPTIONS preflight for all routes
app.options('*', cors());

app.use(express.json({ limit: '50kb' }));

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

// PATCH /api/live-rooms/:code — update room state (violations, status, answers)
app.patch('/api/live-rooms/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    // Get current data from memory or DB
    let room = LIVE_ROOMS.get(code);
    if (!room) {
      const cached = await LiveRoomCache.findOne({ roomCode: code });
      if (!cached) return res.status(404).json({ success: false, message: 'Room not found' });
      room = cached.data;
    }
    const updated = { ...room, ...req.body };
    // Update both memory and MongoDB
    LIVE_ROOMS.set(code, updated);
    await LiveRoomCache.findOneAndUpdate({ roomCode: code }, { data: updated });
    res.json({ success: true, room: updated });
  } catch (err) {
    console.error('[PATCH /api/live-rooms/:code]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
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
//  Verge1.o — AI Proxy (auto-detects Ollama or OpenAI format)
//  Ollama cloud:   set OLLAMA_API_URL + OLLAMA_API_KEY
//  OpenAI-compat:  set AI_API_URL + AI_API_KEY + AI_MODEL
// ════════════════════════════════════════════════════════════
const OLLAMA_URL = (process.env.OLLAMA_API_URL || '').trim();
const OLLAMA_KEY = (process.env.OLLAMA_API_KEY || '').trim();
const OAI_URL    = (process.env.AI_API_URL || '').trim();
const OAI_KEY    = (process.env.AI_API_KEY || '').trim();
const AI_MODEL   = (process.env.AI_MODEL || 'Meta-Llama-3.1-70B-Instruct').trim();

// Use Ollama native format if OLLAMA_API_URL is set (and not overridden by AI_API_URL)
const USE_OLLAMA = !!OLLAMA_URL && !OAI_URL;
const AI_BASE_URL = USE_OLLAMA
  ? OLLAMA_URL.replace(/\/$/, '')
  : (OAI_URL || 'http://localhost:11434/v1').replace(/\/$/, '');
const AI_KEY = USE_OLLAMA ? OLLAMA_KEY : OAI_KEY;

// Health check — works for both Ollama and OpenAI providers
app.get('/api/ai/health', async (req, res) => {
  try {
    const checkUrl = USE_OLLAMA ? `${AI_BASE_URL}/api/tags` : `${AI_BASE_URL}/models`;
    const check = await fetch(checkUrl, {
      headers: { 'Authorization': `Bearer ${AI_KEY}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    res.json({ status: check.ok ? 'online' : 'error', online: check.ok, provider: AI_BASE_URL });
  } catch (err) {
    res.json({ status: 'offline', online: false, error: err.message });
  }
});

// Chat proxy — routes to correct format automatically
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model, temperature = 0.7 } = req.body;
    let response;

    if (USE_OLLAMA) {
      // Ollama native format: /api/chat
      response = await fetch(`${AI_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
        body: JSON.stringify({ model: model || 'gemma3:12b', messages, stream: false, options: { temperature } }),
        signal: AbortSignal.timeout(60000)
      });
      if (!response.ok) return res.status(response.status).json({ error: await response.text() });
      const data = await response.json();
      return res.json({ message: data.message || { content: '', role: 'assistant' } });
    } else {
      // OpenAI-compatible format: /v1/chat/completions
      response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_KEY}` },
        body: JSON.stringify({ model: model || AI_MODEL, messages, temperature, max_tokens: 4096, stream: false }),
        signal: AbortSignal.timeout(60000)
      });
      if (!response.ok) return res.status(response.status).json({ error: await response.text() });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return res.json({ message: { content, role: 'assistant' } });
    }
  } catch (err) {
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
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (room.suspension?.isSuspended)
      return res.status(403).json({ success: false, message: 'Session is suspended' });

    const existing = room.candidateAnswers.find(a => a.questionId?.toString() === questionId);
    const answerEntry = {
      questionId, questionType,
      textAnswer: textAnswer || '',
      selectedOption: selectedOption ?? undefined,
      isCorrect: isCorrect ?? undefined,
      submissionId: submissionId || undefined,
      score: score || 0,
      timeTaken: timeTaken || 0,
      answeredAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, answerEntry);
    } else {
      room.candidateAnswers.push(answerEntry);
    }
    await room.save();
    res.json({ success: true });
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
    const room = await InterviewRoom.findOne({ roomCode: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Calculate scores
    const answers = room.candidateAnswers;
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
    res.json({ success: true, room });
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

// Only start the HTTP server when running directly (not when imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => console.log(`✓ MockMate API → http://localhost:${PORT}`));
}

module.exports = app;