const mongoose = require('mongoose');

// ── Sub-schema: category breakdown for a day ─────────────────
const categoryBreakdownSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    questionsAnswered: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0, min: 0, max: 100 },
    timeSpent: { type: Number, default: 0 }, // minutes
  },
  { _id: false }
);

// ── Main Analytics Schema ─────────────────────────────────────
const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },

    // ── Date-scoped record (one document per user per day) ───
    date: {
      type: Date,
      required: [true, 'Date is required'],
      // Store as start-of-day UTC for easy grouping
    },

    // ── Daily Activity ───────────────────────────────────────
    interviewsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    interviewsAbandoned: {
      type: Number,
      default: 0,
      min: 0,
    },
    questionsAnswered: {
      type: Number,
      default: 0,
      min: 0,
    },
    questionsSkipped: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Scores ───────────────────────────────────────────────
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    highestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lowestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Time tracking ────────────────────────────────────────
    timeSpent: {
      type: Number,
      default: 0, // minutes
      min: 0,
    },

    // ── Topics practiced ─────────────────────────────────────
    topicsPracticed: {
      type: [String],
      default: [],
      // Unique list of categories/topics touched today
    },
    categoryBreakdown: {
      type: [categoryBreakdownSchema],
      default: [],
      // Per-category drill-down for the day
    },

    // ── Improvement vs previous session ─────────────────────
    improvementRate: {
      type: Number,
      default: 0,
      // Percentage change in avg score from previous day
      // Positive = improved, Negative = declined
    },

    // ── Difficulty distribution ──────────────────────────────
    difficultyBreakdown: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },

    // ── Streak (snapshot at end of day) ─────────────────────
    streakCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Ensure one document per user per day ─────────────────────
analyticsSchema.index({ userId: 1, date: 1 }, { unique: true });

// ── Other indexes for common queries ─────────────────────────
analyticsSchema.index({ userId: 1, date: -1 }); // recent history
analyticsSchema.index({ userId: 1, averageScore: -1 }); // best days

// ── Virtual: performance label for the day ───────────────────
analyticsSchema.virtual('performanceLabel').get(function () {
  const s = this.averageScore;
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Average';
  if (s >= 30) return 'Needs Work';
  return 'Poor';
});

// ── Static: get a user's last N days of analytics ────────────
analyticsSchema.statics.getRecentHistory = function (userId, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return this.find({ userId, date: { $gte: since } }).sort({ date: 1 });
};

// ── Static: upsert today's record for a user ─────────────────
analyticsSchema.statics.upsertToday = async function (userId, updates) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // normalise to start of day

  return this.findOneAndUpdate(
    { userId, date: today },
    { $inc: updates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;
