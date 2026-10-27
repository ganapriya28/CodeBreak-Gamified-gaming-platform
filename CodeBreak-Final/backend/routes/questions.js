const express = require('express');
const { getDB } = require('../db');
const { requireAuth } = require('../auth');
const { generateQuestion } = require('../services/localAI');

const router = express.Router();
const supportedRooms = new Set(['algorithm', 'debug', 'vault', 'team']);
const supportedLanguages = new Set(['python', 'c', 'java']);

router.get('/:roomType/:language/:level', requireAuth, async (req, res) => {
  const { roomType, language } = req.params;
  const level = Number(req.params.level);
  if (!supportedRooms.has(roomType)) return res.status(400).json({ error: 'Unknown room.' });
  if (!supportedLanguages.has(language)) return res.status(400).json({ error: 'Unsupported programming language.' });
  if (!Number.isSafeInteger(level) || level < 1 || level > 1000000) return res.status(400).json({ error: 'Level must be a positive number.' });

  const db = getDB();
  const filter = { roomType, language, level };
  try {
    let q = await db.collection('questions').findOne(filter, { projection: { solution: 0 } });
    if (!q) {
      const recent = await db.collection('questions').find({ roomType, language }, { projection: { title: 1 } }).sort({ level: -1 }).limit(25).toArray();
      const generated = await generateQuestion({ roomType, language, level, previousTitles: recent.map(x => x.title) });
      try {
        const inserted = await db.collection('questions').insertOne(generated);
        q = { ...generated, _id: inserted.insertedId };
      } catch (insertError) {
        // Two teammates may request the same level at once. Reuse the winner's question.
        if (insertError.code !== 11000) throw insertError;
        q = await db.collection('questions').findOne(filter);
      }
    }
    if (!q) return res.status(500).json({ error: 'Question could not be created. Please retry.' });
    const { solution, ...publicQuestion } = q;
    return res.json(publicQuestion);
  } catch (error) {
    console.error('Question load/generation failed:', error.message);
    const status = /Cannot reach local AI|Ollama returned|local AI model|local AI did not/i.test(error.message) ? 503 : 500;
    return res.status(status).json({ error: `${error.message || 'Could not load question'} Make sure Ollama is running and the configured model is downloaded, then retry.` });
  }
});

router.get('/:roomType/:language', requireAuth, async (req, res) => {
  try {
    const qs = await getDB().collection('questions')
      .find({ roomType: req.params.roomType, language: req.params.language }, { projection: { solution: 0 } })
      .sort({ level: 1 }).toArray();
    res.json(qs);
  } catch (e) { res.status(500).json({ error: 'Failed to load questions' }); }
});

module.exports = router;
