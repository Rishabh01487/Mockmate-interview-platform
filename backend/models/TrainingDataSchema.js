const mongoose = require('mongoose');

// ════════════════════════════════════════════════════════════
//  Training Data Schema
//  Captures every AI interaction for future model fine-tuning
//  Format: instruction → input → output (Alpaca-style)
// ════════════════════════════════════════════════════════════

const TrainingDataSchema = new mongoose.Schema({
  // Core training fields (Alpaca format for fine-tuning)
  instruction: { type: String, required: true },   // What the AI was asked to do
  input:       { type: String, default: '' },       // Additional context/domain
  output:      { type: String, required: true },    // The AI's response (questions generated)

  // Metadata for filtering & quality
  domain:      { type: String, index: true },       // dsa, os, dbms, cn, etc.
  difficulty:  { type: String },                     // Easy, Medium, Hard
  questionType:{ type: String },                     // mcq, text, coding
  source:      { type: String, default: 'practice' }, // practice, interview, chatbot

  // Quality signals (for filtering good training samples)
  candidateScore: { type: Number },                  // How well the candidate scored (0-100)
  questionCount:  { type: Number },                  // Number of questions in this batch
  isValidJSON:    { type: Boolean, default: true },  // Whether AI output was valid JSON
  modelUsed:      { type: String },                  // Which AI model generated this

  // Candidate response data (for training answer evaluation)
  candidateAnswers: [{
    question:     String,
    answer:       String,
    score:        Number,
    isCorrect:    Boolean,
    questionType: String,
    difficulty:   String
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  exported:  { type: Boolean, default: false, index: true }  // Whether exported to F: drive
});

// Compound index for efficient querying
TrainingDataSchema.index({ domain: 1, difficulty: 1, createdAt: -1 });
TrainingDataSchema.index({ exported: 1, createdAt: 1 });

module.exports = mongoose.model('TrainingData', TrainingDataSchema);
