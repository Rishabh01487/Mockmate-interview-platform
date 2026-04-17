const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: '', // URL to profile picture
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // ── UI / UX Preferences ─────────────────────────────────
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'dark',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      defaultDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
      },
    },

    // ── Aggregated Statistics (denormalised for fast reads) ──
    stats: {
      totalInterviews: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0, min: 0, max: 100 },
      questionsAnswered: { type: Number, default: 0 },
      totalTimeSpent: { type: Number, default: 0 }, // minutes
      strengths: {
        type: [String],
        default: [],
        // Top performing categories, updated after each session
      },
      weaknesses: {
        type: [String],
        default: [],
        // Categories with lowest avg scores
      },
      currentStreak: { type: Number, default: 0 }, // days in a row
      longestStreak: { type: Number, default: 0 },
      lastActive: { type: Date },
    },

    // ── Auth Helpers ─────────────────────────────────────────
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'stats.avgScore': -1 }); // leaderboard

// ── Pre-save: Hash password ──────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance Methods ─────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    preferences: this.preferences,
    stats: this.stats,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

// ── Virtual: full profile URL ────────────────────────────────
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) return this.avatar;
  // Gravatar-style fallback using initials (handled on client)
  return null;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
