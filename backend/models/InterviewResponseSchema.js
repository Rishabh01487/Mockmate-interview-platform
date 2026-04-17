const mongoose = require('mongoose');

const interviewResponseSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: [true, 'Session reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: [true, 'Question reference is required'],
    },
    userAnswer: {
      type: String,
      required: [true, 'User answer is required'],
      trim: true,
    },
    aiFeedback: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    timeTaken: {
      type: Number, // seconds taken to answer
      min: 0,
    },
    timedOut: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // answeredAt = createdAt
  }
);

// Index for session-based queries
interviewResponseSchema.index({ session: 1 });
interviewResponseSchema.index({ user: 1, createdAt: -1 });

const InterviewResponse = mongoose.model('InterviewResponse', interviewResponseSchema);
module.exports = InterviewResponse;
