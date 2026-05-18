const TrainingData = require('../models/TrainingDataSchema');
const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════
//  Training Data Collector
//  Captures EACH question individually for fine-tuning
// ════════════════════════════════════════════════════════════

/**
 * Log AI question generation — splits into INDIVIDUAL question samples
 */
async function logQuestionGeneration({ prompt, response, domain, difficulty, questionType, questionCount, modelUsed, isValidJSON }) {
  try {
    // Try to parse the AI response into individual questions
    let questions = [];
    try {
      const cleaned = response.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) questions = parsed;
    } catch {}

    if (questions.length > 0) {
      // Log EACH question as a separate training sample
      const docs = questions.map((q, i) => ({
        instruction: `Generate a ${difficulty || 'medium'} difficulty ${questionType || 'theory'} interview question about ${domain}.`,
        input: `Domain: ${domain}, Difficulty: ${difficulty || 'medium'}, Type: ${questionType || 'theory'}, Question ${i + 1}`,
        output: JSON.stringify(q),
        domain,
        difficulty,
        questionType,
        questionCount: 1,
        modelUsed,
        isValidJSON: true,
        source: 'practice-question'
      }));
      await TrainingData.insertMany(docs);
      console.log(`[Training] Logged ${docs.length} individual questions for ${domain}`);
    } else {
      // Fallback: log the entire batch as one sample
      await TrainingData.create({
        instruction: `Generate ${questionCount} ${difficulty || 'mixed'} difficulty ${questionType || 'mixed'} interview questions about ${domain}.`,
        input: prompt,
        output: response,
        domain, difficulty, questionType, questionCount, modelUsed, isValidJSON,
        source: 'practice-batch'
      });
      console.log(`[Training] Logged 1 batch sample for ${domain}`);
    }
  } catch (err) {
    console.warn('[Training] Failed to log:', err.message);
  }
}

/**
 * Log candidate answers — EACH answer as individual sample
 */
async function logCandidateAnswers({ domain, difficulty, answers, overallScore }) {
  try {
    const docs = answers.map(a => ({
      instruction: `Evaluate this ${domain} interview answer.`,
      input: JSON.stringify({ question: a.question, answer: a.answer }),
      output: JSON.stringify({ score: a.score, isCorrect: a.isCorrect, feedback: a.feedback || '' }),
      domain,
      difficulty: a.difficulty || difficulty,
      questionType: a.questionType,
      source: 'candidate-answer',
      candidateScore: a.score,
      questionCount: 1,
      candidateAnswers: [a]
    }));
    await TrainingData.insertMany(docs);
    console.log(`[Training] Logged ${docs.length} individual answers (avg score: ${overallScore}%)`);
  } catch (err) {
    console.warn('[Training] Failed to log answers:', err.message);
  }
}

/**
 * Export training data to F: drive in JSONL format
 */
async function exportToFDrive(exportPath = 'F:\\MockMate-AI-Training') {
  try {
    if (!fs.existsSync(exportPath)) fs.mkdirSync(exportPath, { recursive: true });

    const data = await TrainingData.find({ exported: false }).lean();
    if (!data.length) return { exported: 0 };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filepath = path.join(exportPath, `training_${timestamp}.jsonl`);

    const jsonl = data.map(d => JSON.stringify({
      instruction: d.instruction, input: d.input, output: d.output,
      domain: d.domain, difficulty: d.difficulty, questionType: d.questionType
    })).join('\n');

    fs.writeFileSync(filepath, jsonl, 'utf8');
    await TrainingData.updateMany({ _id: { $in: data.map(d => d._id) } }, { exported: true });

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
    estimatedFinetuneReady: total >= 500 ? '✅ Ready!' : `Need ${500 - total} more`
  };
}

module.exports = { logQuestionGeneration, logCandidateAnswers, exportToFDrive, getTrainingStats };
