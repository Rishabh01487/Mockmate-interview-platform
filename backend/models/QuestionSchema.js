const mongoose = require('mongoose');

// ── MCQ Option sub-schema ─────────────────────────────────────
const optionSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: true } // keep _id so we can reference option by id
);

// ── Coding example sub-schema ─────────────────────────────────
const exampleSchema = new mongoose.Schema(
  {
    input:       { type: String, default: '' },
    output:      { type: String, default: '' },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

// ── Test case sub-schema ──────────────────────────────────────
const testCaseSchema = new mongoose.Schema(
  {
    input:          { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden:       { type: Boolean, default: false }, // hidden cases not shown to candidate
    explanation:    { type: String, default: '' },
  },
  { _id: false }
);

// ── Resource ref sub-schema ───────────────────────────────────
const resourceRefSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url:   { type: String, required: true, trim: true },
    type:  {
      type: String,
      enum: ['article', 'video', 'documentation', 'course', 'book'],
      default: 'article',
    },
  },
  { _id: false }
);

// ── Main Question Schema ──────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    // ── Core ─────────────────────────────────────────────────
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [5, 'Question text must be at least 5 characters'],
    },

    // WHAT type of question is this?
    questionType: {
      type: String,
      enum: ['text', 'mcq', 'coding'],
      default: 'text',
      required: true,
    },

    // ── Classification ────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
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
    subcategory: { type: String, trim: true },
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: ['easy', 'medium', 'hard'],
    },
    type: {
      type: String,
      enum: ['technical', 'behavioral', 'system_design', 'hr'],
      default: 'technical',
    },

    // ── Text Question Fields ───────────────────────────────────
    expectedAnswer: { type: String, trim: true },
    keyPoints:      { type: [String], default: [] },
    hints:          { type: [String], default: [] },

    // ── MCQ Fields (questionType === 'mcq') ───────────────────
    options: {
      type: [optionSchema],
      default: [],
      validate: {
        validator: function (opts) {
          if (this.questionType !== 'mcq') return true;
          return opts.length >= 2 && opts.length <= 6;
        },
        message: 'MCQ must have 2–6 options',
      },
    },
    correctOptionIndex: {
      type: Number,
      // Index of the correct option in the options array
    },
    explanation: {
      type: String,
      trim: true,
      // Shown after user answers MCQ — explains why the answer is correct
    },

    // ── Coding Fields (questionType === 'coding') ─────────────
    problemStatement: {
      type: String,
      trim: true,
      // Full markdown problem description (shown in split-pane)
    },
    constraints: {
      type: [String],
      default: [],
      // e.g. ["1 <= n <= 10^5", "All integers are non-negative"]
    },
    examples: {
      type: [exampleSchema],
      default: [],
    },
    testCases: {
      type: [testCaseSchema],
      default: [],
    },
    starterCode: {
      javascript: { type: String, default: '// Write your solution here\nfunction solution(input) {\n\n}' },
      python:     { type: String, default: '# Write your solution here\ndef solution(input):\n    pass' },
      cpp:        { type: String, default: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}' },
      java:       { type: String, default: '// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}' },
    },
    expectedTimeComplexity:  { type: String, default: '' }, // e.g. "O(n log n)"
    expectedSpaceComplexity: { type: String, default: '' }, // e.g. "O(n)"

    // ── Shared Fields ─────────────────────────────────────────
    resources: { type: [resourceRefSchema], default: [] },
    tags:      { type: [String], default: [] },
    timeLimit: { type: Number, default: 120, min: 30, max: 3600 }, // seconds

    // ── Admin / Meta ─────────────────────────────────────────
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    stats: {
      timesAsked:   { type: Number, default: 0 },
      avgScore:     { type: Number, default: 0, min: 0, max: 100 },
      avgTimeTaken: { type: Number, default: 0 },
      // MCQ-specific
      correctRate:  { type: Number, default: 0 }, // % who got it right
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────
questionSchema.index({ category: 1, difficulty: 1, questionType: 1 });
questionSchema.index({ questionType: 1, isActive: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ isActive: 1, category: 1, difficulty: 1 });
questionSchema.index({ text: 'text', tags: 'text', subcategory: 'text' });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
