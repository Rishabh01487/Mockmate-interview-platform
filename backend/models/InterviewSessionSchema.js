const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['DSA', 'OS', 'DBMS', 'CN', 'OOP', 'System Design', 'Web Development', 'Core CS'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    completedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxPossibleScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    responses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewResponse',
      },
    ],
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // startedAt = createdAt
  }
);

// Virtual for score percentage
interviewSessionSchema.virtual('scorePercent').get(function () {
  if (!this.maxPossibleScore) return 0;
  return Math.round((this.totalScore / this.maxPossibleScore) * 100);
});

// Index for user-based queries
interviewSessionSchema.index({ user: 1, createdAt: -1 });
interviewSessionSchema.index({ user: 1, status: 1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
module.exports = InterviewSession;
