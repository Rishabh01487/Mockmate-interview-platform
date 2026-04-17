const mongoose = require('mongoose');

// ── Sub-schema: AI Feedback per question ─────────────────────
const aiFeedbackSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvements: {
      type: [String],
      default: [],
    },
    suggestedAnswer: {
      type: String,
      default: '',
    },
    clarityScore: { type: Number, min: 0, max: 100, default: 0 },
    relevanceScore: { type: Number, min: 0, max: 100, default: 0 },
    technicalAccuracyScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

// ── Sub-schema: individual question inside a session ─────────
const sessionQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    userAnswer: {
      type: String,
      default: '',
      trim: true,
    },
    aiFeedback: {
      type: aiFeedbackSchema,
      default: () => ({}),
    },
    timeTaken: {
      type: Number, // seconds
      min: 0,
      default: 0,
    },
    timedOut: {
      type: Boolean,
      default: false,
    },
    answeredAt: {
      type: Date,
    },
    skipped: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// ── Main Interview Schema ────────────────────────────────────
const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // Interview classification
    type: {
      type: String,
      enum: ['technical', 'behavioral', 'system_design', 'hr'],
      required: [true, 'Interview type is required'],
    },
    topic: {
      type: String,
      trim: true,
      // e.g. 'Arrays', 'React', 'Process Scheduling'
    },
    category: {
      type: String,
      enum: [
        'Data Structures & Algorithms',
        'Operating Systems',
        'Database Management Systems',
        'Computer Networks',
        'Object-Oriented Programming',
        'System Design',
        'Web Development',
        'Cloud Computing',
        'Cybersecurity',
        'Artificial Intelligence',
        'Software Engineering',
        'Behavioral',
      ],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },

    // Questions answered in this session
    questions: {
      type: [sessionQuestionSchema],
      default: [],
    },

    // Aggregated scores
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      min: 1,
    },
    completedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Session lifecycle
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    totalTimeTaken: {
      type: Number, // seconds for the whole session
      default: 0,
    },

    // Reference to full Feedback documents (one per question answered)
    feedbackIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtuals ─────────────────────────────────────────────────
interviewSchema.virtual('completionRate').get(function () {
  if (!this.totalQuestions) return 0;
  return Math.round((this.completedQuestions / this.totalQuestions) * 100);
});

interviewSchema.virtual('duration').get(function () {
  if (!this.completedAt || !this.startedAt) return null;
  return Math.round((this.completedAt - this.startedAt) / 1000); // seconds
});

// ── Indexes ──────────────────────────────────────────────────
interviewSchema.index({ userId: 1, createdAt: -1 });
interviewSchema.index({ userId: 1, status: 1 });
interviewSchema.index({ userId: 1, category: 1 });
interviewSchema.index({ status: 1, createdAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);
module.exports = Interview;
