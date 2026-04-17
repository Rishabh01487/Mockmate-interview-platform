const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    // ── References ──────────────────────────────────────────
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: [true, 'Interview reference is required'],
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // ── User's answer snapshot ───────────────────────────────
    userAnswer: {
      type: String,
      trim: true,
      required: [true, 'User answer snapshot is required'],
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

    // ── Granular AI Scores (0–100 each) ─────────────────────
    clarityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // How clearly the answer is articulated
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // How relevant the answer is to the question asked
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // Confidence level inferred from language/structure
    },
    technicalAccuracyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // Factual/technical correctness
    },
    completenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // How many key points were covered
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // Weighted composite of all scores
    },

    // ── Qualitative Feedback ─────────────────────────────────
    overallFeedback: {
      type: String,
      trim: true,
      // 2–4 sentence summary of the answer quality
    },
    strengths: {
      type: [String],
      default: [],
      // What the user did well
    },
    improvements: {
      type: [String],
      default: [],
      // Specific suggestions to improve the answer
    },
    suggestedAnswer: {
      type: String,
      trim: true,
      // AI-generated model answer for comparison
    },
    grammarFeedback: {
      type: String,
      trim: true,
      // Language / grammar observations (if applicable)
    },
    missingKeyPoints: {
      type: [String],
      default: [],
      // Key points from expectedAnswer that were not mentioned
    },

    // ── Recommended resources for this answer ───────────────
    recommendedResources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
      },
    ],

    // ── AI metadata ─────────────────────────────────────────
    generatedBy: {
      type: String,
      enum: ['mock', 'gpt-3.5', 'gpt-4', 'gemini', 'ollama', 'other'],
      default: 'mock',
      // Track which AI model generated this feedback
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ── Virtual: composite score label ──────────────────────────
feedbackSchema.virtual('scoreLabel').get(function () {
  const s = this.overallScore;
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Average';
  if (s >= 30) return 'Needs Work';
  return 'Poor';
});

// ── Indexes ──────────────────────────────────────────────────
feedbackSchema.index({ interviewId: 1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ questionId: 1, userId: 1 });
feedbackSchema.index({ userId: 1, overallScore: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
