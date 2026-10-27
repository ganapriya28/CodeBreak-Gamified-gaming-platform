const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');
const { requireAuth } = require('../auth');
const { ollamaChat, OLLAMA_MODEL } = require('../services/localAI');

const router = express.Router();
const tutorSystem = `You are CodeBreak Tutor, a patient coding mentor for school and college students. Explain clearly in simple language, use short examples when useful, and answer follow-up questions using the supplied conversation. Use the active question and the student's code as context. Prefer hints that help the learner think, but if they explicitly request a complete solution, explain it educationally. Never claim that code was executed unless actual execution results are supplied. Distinguish syntax, runtime, and logic errors. Do not reveal hidden test cases or secrets. Keep the response focused and friendly.`;

router.get('/status', async (_req, res) => {
  try {
    const answer = await ollamaChat([{ role: 'user', content: 'Reply with the single word READY.' }], { timeoutMs: 10000, temperature: 0 });
    res.json({ ready: true, model: OLLAMA_MODEL, message: answer });
  } catch (error) {
    res.status(503).json({ ready: false, model: OLLAMA_MODEL, error: error.message });
  }
});

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, history = [], question, code, roomType, level, language, output } = req.body;
    if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Enter a message first.' });
    if (message.length > 2000) return res.status(400).json({ error: 'Please keep each message under 2,000 characters.' });
    const safeHistory = Array.isArray(history) ? history.slice(-10).filter(m => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string').map(m => ({ role: m.role, content: m.content.slice(0, 2000) })) : [];
    if (safeHistory.length && safeHistory[safeHistory.length - 1].role === 'user' && safeHistory[safeHistory.length - 1].content.trim() === message.trim()) safeHistory.pop();
    const storedQuestion = roomType && language && Number(level) > 0
      ? await getDB().collection('questions').findOne({ roomType, language, level: Number(level) }, { projection: { solution: 0 } })
      : null;
    const authoritativeQuestion = storedQuestion
      ? `${storedQuestion.title}: ${storedQuestion.prompt}${Array.isArray(storedQuestion.steps) ? `\nAlgorithm steps: ${storedQuestion.steps.join(' | ')}` : ''}`
      : String(question || 'No question details supplied').slice(0, 4000);
    const context = `Current challenge: ${authoritativeQuestion}\nRoom: ${String(roomType || '')}\nLevel: ${String(level || '')}\nLanguage: ${String(language || '')}\nStudent's current code or arrangement:\n${String(code || '(no code yet)').slice(0, 6000)}\nActual execution result, if any:\n${String(output || '(no execution result supplied)').slice(0, 2000)}`;
    const answer = await ollamaChat([
      { role: 'system', content: `${tutorSystem}\n\nUse this context for the current question:\n${context}` },
      ...safeHistory,
      { role: 'user', content: message.trim() }
    ], { temperature: 0.4, timeoutMs: 120000 });
    res.json({ answer, model: OLLAMA_MODEL });
  } catch (error) {
    console.error('Local tutor failed:', error.message);
    res.status(503).json({ error: `${error.message} Check that Ollama is running and the model is installed, then try again.` });
  }
});

router.post('/hint', requireAuth, async (req, res) => {
  try {
    const { prompt, code, level, roomType, language, question } = req.body;
    const storedQuestion = roomType && language && Number(level) > 0
      ? await getDB().collection('questions').findOne({ roomType, language, level: Number(level) }, { projection: { solution: 0 } })
      : null;
    const challenge = storedQuestion ? `${storedQuestion.title}: ${storedQuestion.prompt}` : (question || prompt || '');
    const answer = await ollamaChat([
      { role: 'system', content: 'You are a friendly coding tutor. Give exactly one concise, progressive hint for the current challenge. Do not give the final code or answer. Tailor the hint to the room and student code. If this is an algorithm-ordering puzzle, explain which step should be considered next.' },
      { role: 'user', content: `Room: ${roomType}\nLevel: ${level}\nLanguage: ${language}\nQuestion: ${challenge}\nStudent code: ${code || '(none yet)'}\nGive one useful hint.` }
    ], { temperature: 0.4 });
    res.json({ answer });
  } catch (error) {
    res.status(503).json({ error: `${error.message} Start Ollama and retry.` });
  }
});

router.post('/next-question', requireAuth, async (req, res) => {
  try {
    const { roomType, language, currentLevel } = req.body;
    const db = getDB();
    const userId = new ObjectId(req.user.userId);
    const rows = await db.collection('progress').find({ userId, roomType, language }).sort({ level: 1 }).toArray();
    const completed = rows.filter(x => (x.stars || 0) > 0);
    const maxUnlocked = Math.max(1, ...completed.map(x => Number(x.level) + 1));
    const recent = completed.slice(-5);
    const avgAttempts = recent.length ? recent.reduce((a, x) => a + (x.attempts || 0), 0) / recent.length : 0;
    const avgScore = recent.length ? recent.reduce((a, x) => a + (x.score || 0), 0) / recent.length : 100;
    const avgHints = recent.length ? recent.reduce((a, x) => a + (x.hintsUsed || 0), 0) / recent.length : 0;
    let suggested = Math.max(1, Number(currentLevel) || maxUnlocked);
    let reason = 'Continue to the next chamber in your learning path.';
    if (avgAttempts >= 3 || avgHints >= 2 || avgScore < 55) {
      suggested = Math.max(1, suggested - 1);
      reason = 'Your recent attempts suggest reviewing a previous concept could help.';
    } else if (avgAttempts <= 1 && avgHints === 0 && avgScore >= 85) {
      suggested = Math.max(suggested, maxUnlocked);
      reason = 'Your recent performance suggests you are ready for a harder challenge.';
    }
    const existing = await db.collection('questions').findOne({ roomType, language, level: suggested }, { projection: { solution: 0 } });
    res.json({ question: existing, recommendedLevel: suggested, reason, stats: { avgAttempts: +avgAttempts.toFixed(1), avgScore: Math.round(avgScore), avgHints: +avgHints.toFixed(1) } });
  } catch (e) { res.status(500).json({ error: 'Adaptive selection failed' }); }
});

router.post('/explain', requireAuth, async (req, res) => {
  try {
    const { concept, question } = req.body;
    const answer = await ollamaChat([
      { role: 'system', content: 'Explain a programming concept to a beginner using plain language, a short analogy, one tiny example, and one check-for-understanding question. Do not give away the complete answer to an active challenge.' },
      { role: 'user', content: `Concept: ${String(concept || '').slice(0, 500)}\nQuestion context: ${String(question || '').slice(0, 2000)}` }
    ]);
    res.json({ answer });
  } catch (error) { res.status(503).json({ error: `${error.message} Start Ollama and retry.` }); }
});

module.exports = router;
