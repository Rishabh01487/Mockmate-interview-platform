const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ── Violation log sub-schema (proctoring) ─────────────────────
const violationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['tab_switch', 'window_blur', 'copy_paste', 'right_click', 'devtools'],
      required: true,
    },
    occurredAt: { type: Date, default: Date.now },
    details:    { type: String, default: '' },
  },
  { _id: false }
);

// ── Candidate answer entry ────────────────────────────────────
const roomAnswerSchema = new mongoose.Schema(
  {
    questionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    questionType: { type: String, enum: ['text', 'mcq', 'coding'], required: true },

    // text / mcq answers
    textAnswer:   { type: String, default: '' },
    selectedOption: { type: Number, default: null }, // MCQ option index
    isCorrect:    { type: Boolean },                 // for MCQ

    // coding — ref to CodingSubmission
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingSubmission' },

    score:        { type: Number, default: 0, min: 0, max: 100 },
    timeTaken:    { type: Number, default: 0 }, // seconds
    answeredAt:   { type: Date },
    skipped:      { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Main Room Schema ──────────────────────────────────────────
const interviewRoomSchema = new mongoose.Schema(
  {
    // Unique human-readable room code (e.g. "XK9P2M")
    roomCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },

    title: {
      type: String,
      trim: true,
      default: 'Mock Interview Session',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },

    // Parties
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    candidateEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // Question assignment
    assignedQuestions: [
      {
        questionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        questionType: { type: String, enum: ['text', 'mcq', 'coding'], required: true },
        orderIndex:   { type: Number, required: true },
        points:       { type: Number, default: 10 }, // max marks for this question
      },
    ],

    // Session settings
    settings: {
      timeLimitMinutes:    { type: Number, default: 60 },
      allowLanguageChoice: { type: Boolean, default: true },
      defaultLanguage:     { type: String, enum: ['javascript', 'python', 'cpp', 'java'], default: 'javascript' },
      showHints:           { type: Boolean, default: false },
      shuffleQuestions:    { type: Boolean, default: false },
      // Proctoring
      proctoring: {
        enabled:                 { type: Boolean, default: true },
        tabSwitchLimit:          { type: Number, default: 1 },   // violations before auto-suspend
        blockOnTabSwitch:        { type: Boolean, default: true },
        requireInterviewerRevive:{ type: Boolean, default: true },
      },
    },

    // ── Proctoring / Violations ──────────────────────────────
    violations: {
      type: [violationSchema],
      default: [],
    },
    tabSwitchCount: { type: Number, default: 0 },

    // ── Session Lifecycle ────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'waiting', 'active', 'suspended', 'completed', 'expired', 'revoked'],
      default: 'draft',
    },

    // Suspension state (proctoring)
    suspension: {
      isSuspended:     { type: Boolean, default: false },
      suspendedAt:     { type: Date },
      suspendReason:   { type: String, default: '' },
      revivedAt:       { type: Date },
      revivedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviveRequested: { type: Boolean, default: false },
      reviveRequestedAt:{ type: Date },
    },

    // Timestamps
    startedAt:   { type: Date },
    completedAt: { type: Date },
    expiresAt:   { type: Date }, // room link expires

    // Candidate's answers during this room session
    candidateAnswers: {
      type: [roomAnswerSchema],
      default: [],
    },

    // Scores
    scores: {
      overall:  { type: Number, default: 0, min: 0, max: 100 },
      mcq:      { type: Number, default: 0 },
      coding:   { type: Number, default: 0 },
      text:     { type: Number, default: 0 },
    },

    // Generated report
    report: {
      generated:   { type: Boolean, default: false },
      generatedAt: { type: Date },
      downloadUrl: { type: String, default: '' }, // S3/CDN URL if stored
    },

    // Interviewer's private notes
    interviewerNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Pre-save: Generate room code ──────────────────────────────
interviewRoomSchema.pre('save', function (next) {
  if (!this.roomCode) {
    // Generate 6-char alphanumeric code from UUID
    this.roomCode = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
  }
  if (!this.expiresAt) {
    // Room expires 48 hours after creation
    this.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
  next();
});

// ── Virtual: is room expired ──────────────────────────────────
interviewRoomSchema.virtual('isExpired').get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});

// ── Virtual: duration in minutes ─────────────────────────────
interviewRoomSchema.virtual('durationMinutes').get(function () {
  if (!this.startedAt || !this.completedAt) return null;
  return Math.round((this.completedAt - this.startedAt) / 60000);
});

// ── Indexes ───────────────────────────────────────────────────
interviewRoomSchema.index({ roomCode: 1 }, { unique: true });
interviewRoomSchema.index({ interviewerId: 1, createdAt: -1 });
interviewRoomSchema.index({ candidateId: 1 });
interviewRoomSchema.index({ status: 1, expiresAt: 1 });

const InterviewRoom = mongoose.model('InterviewRoom', interviewRoomSchema);
module.exports = InterviewRoom;
