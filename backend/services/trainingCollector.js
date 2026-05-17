const TrainingData = require('../models/TrainingDataSchema');
const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════
//  Training Data Collector
//  Automatically captures AI interactions for fine-tuning
// ════════════════════════════════════════════════════════════

/**
 * Log an AI question generation event as training data
 */
async function logQuestionGeneration({ prompt, response, domain, difficulty, questionType, questionCount, modelUsed, isValidJSON }) {
  try {
    await TrainingData.create({
      instruction: `Generate ${questionCount} ${difficulty || 'mixed'} difficulty ${questionType || 'mixed'} interview questions about ${domain}.`,
      input: prompt,
      output: response,
      domain,
      difficulty,
      questionType,
      questionCount,
      modelUsed,
      isValidJSON,
      source: 'practice'
    });
    console.log(`[Training] Logged ${questionCount} ${domain} questions for training`);
  } catch (err) {
    console.warn('[Training] Failed to log:', err.message);
  }
}

/**
 * Log candidate answers for training the evaluation model
 */
async function logCandidateAnswers({ domain, difficulty, answers, overallScore }) {
  try {
    await TrainingData.create({
      instruction: `Evaluate candidate answers for ${domain} interview questions.`,
      input: JSON.stringify(answers.map(a => ({ question: a.question, answer: a.answer }))),
      output: JSON.stringify(answers.map(a => ({ score: a.score, isCorrect: a.isCorrect, feedback: a.feedback }))),
      domain,
      difficulty,
      source: 'candidate-eval',
      candidateScore: overallScore,
      candidateAnswers: answers,
      questionCount: answers.length
    });
    console.log(`[Training] Logged ${answers.length} candidate answers (score: ${overallScore}%)`);
  } catch (err) {
    console.warn('[Training] Failed to log answers:', err.message);
  }
}

/**
 * Export training data to F: drive in JSONL format (for fine-tuning)
 * Run periodically or manually via API
 */
async function exportToFDrive(exportPath = 'F:\\MockMate-AI-Training') {
  try {
    // Create export directory
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }

    // Get unexported data
    const data = await TrainingData.find({ exported: false }).lean();
    if (!data.length) {
      console.log('[Training] No new data to export');
      return { exported: 0 };
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `training_${timestamp}.jsonl`;
    const filepath = path.join(exportPath, filename);

    // Convert to JSONL (Alpaca format — standard for fine-tuning)
    const jsonl = data.map(d => JSON.stringify({
      instruction: d.instruction,
      input: d.input,
      output: d.output,
      domain: d.domain,
      difficulty: d.difficulty,
      questionType: d.questionType
    })).join('\n');

    fs.writeFileSync(filepath, jsonl, 'utf8');

    // Mark as exported
    const ids = data.map(d => d._id);
    await TrainingData.updateMany({ _id: { $in: ids } }, { exported: true });

    // Also maintain a cumulative file
    const cumulativePath = path.join(exportPath, 'all_training_data.jsonl');
    fs.appendFileSync(cumulativePath, jsonl + '\n', 'utf8');

    console.log(`[Training] Exported ${data.length} samples → ${filepath}`);
    return { exported: data.length, path: filepath };
  } catch (err) {
    console.error('[Training] Export failed:', err.message);
    return { exported: 0, error: err.message };
  }
}

/**
 * Get training data statistics
 */
async function getTrainingStats() {
  const total = await TrainingData.countDocuments();
  const unexported = await TrainingData.countDocuments({ exported: false });
  const byDomain = await TrainingData.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const bySource = await TrainingData.aggregate([
    { $group: { _id: '$source', count: { $sum: 1 } } }
  ]);

  return {
    totalSamples: total,
    unexported,
    byDomain: byDomain.reduce((acc, d) => { acc[d._id] = d.count; return acc; }, {}),
    bySource: bySource.reduce((acc, d) => { acc[d._id] = d.count; return acc; }, {}),
    estimatedFinetuneReady: total >= 500 ? 'Ready' : `Need ${500 - total} more samples`
  };
}

module.exports = { logQuestionGeneration, logCandidateAnswers, exportToFDrive, getTrainingStats };
