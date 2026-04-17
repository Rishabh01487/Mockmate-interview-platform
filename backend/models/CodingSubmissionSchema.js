const mongoose = require('mongoose');

// ── Test Case result sub-schema ──────────────────────────────
const testResultSchema = new mongoose.Schema(
  {
    passed:         { type: Boolean, default: false },
    input:          { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput:   { type: String, default: '' },
    executionTime:  { type: Number, default: 0 }, // ms
    error:          { type: String, default: '' },
  },
  { _id: false }
);

// ── Main Coding Submission Schema ─────────────────────────────
const codingSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Either a solo interview or a room-based interview
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewRoom',
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },

    // Code
    language: {
      type: String,
      enum: ['javascript', 'python', 'cpp', 'java'],
      required: true,
    },
    code: {
      type: String,
      required: true,
    },

    // Execution results
    testResults: {
      type: [testResultSchema],
      default: [],
    },
    passedCount: { type: Number, default: 0, min: 0 },
    totalTests:  { type: Number, default: 0, min: 0 },

    // Overall verdict
    status: {
      type: String,
      enum: ['pending', 'accepted', 'wrong_answer', 'runtime_error', 'time_limit_exceeded', 'compilation_error'],
      default: 'pending',
    },

    // Scores (0–100)
    score: { type: Number, default: 0, min: 0, max: 100 },
    timeTaken: { type: Number, default: 0 }, // seconds from question open to submit

    // Attempt tracking (allow multiple submissions per question)
    attemptNumber: { type: Number, default: 1 },

    // Execution metadata
    executionTimeMs: { type: Number, default: 0 },
    executionEngine:  {
      type: String,
      enum: ['client_js', 'judge0', 'mock'],
      default: 'mock',
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────
codingSubmissionSchema.index({ userId: 1, questionId: 1 });
codingSubmissionSchema.index({ roomId: 1, userId: 1 });
codingSubmissionSchema.index({ interviewId: 1 });

const CodingSubmission = mongoose.model('CodingSubmission', codingSubmissionSchema);
module.exports = CodingSubmission;
