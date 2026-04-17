const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    // Content
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },

    // Classification
    type: {
      type: String,
      enum: ['article', 'video', 'course', 'documentation', 'cheatsheet', 'book'],
      required: [true, 'Resource type is required'],
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
        'General',
      ],
      required: [true, 'Category is required'],
    },
    subcategory: {
      type: String,
      trim: true,
      // e.g. 'Binary Trees', 'SQL Joins'
    },
    tags: {
      type: [String],
      default: [],
    },

    // Levelling
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },

    // Access control
    isPremium: {
      type: Boolean,
      default: false,
    },

    // Author / source info
    author: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      // e.g. 'GeeksForGeeks', 'Coursera', 'YouTube'
    },
    estimatedReadTime: {
      type: Number, // minutes
      min: 0,
    },

    // Admin
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Engagement stats
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────
resourceSchema.index({ category: 1, type: 1 });
resourceSchema.index({ category: 1, difficulty: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ isPremium: 1, isActive: 1 });
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' }); // full-text

const Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;
