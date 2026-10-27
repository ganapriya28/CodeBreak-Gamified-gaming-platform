const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const userId = new ObjectId(req.user.userId);
    const [progress, user] = await Promise.all([
      db.collection('progress').find({ userId }).sort({ solvedAt: 1 }).toArray(),
      db.collection('users').findOne({ _id: userId }, { projection: { password: 0 } })
    ]);
    const solved = progress.filter(p => (p.stars || 0) > 0);
    const totalScore = solved.reduce((s,p) => s + (p.score || 0), 0);
    const totalTime = solved.reduce((s,p) => s + (p.timeSeconds || 0), 0);
    const avgScore = solved.length ? Math.round(totalScore / solved.length) : 0;
    const avgAttempts = solved.length ? +(solved.reduce((s,p) => s + (p.attempts || 0), 0) / solved.length).toFixed(1) : 0;
    const byRoom = {};
    for (const p of solved) {
      if (!byRoom[p.roomType]) byRoom[p.roomType] = { solved: 0, score: 0, stars: 0 };
      byRoom[p.roomType].solved += 1;
      byRoom[p.roomType].score += p.score || 0;
      byRoom[p.roomType].stars += p.stars || 0;
    }
    res.json({
      email: user?.email || req.user.email,
      totalScore, avgScore, solved: solved.length, totalTime, avgAttempts,
      maxStars: solved.reduce((s,p)=>s+(p.stars||0),0), byRoom,
      recent: solved.slice(-10).reverse().map(p => ({ roomType:p.roomType, language:p.language, level:p.level, score:p.score, stars:p.stars, solvedAt:p.solvedAt }))
    });
  } catch (e) { res.status(500).json({ error: 'Could not load dashboard' }); }
});

router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const rows = await db.collection('progress').aggregate([
      { $match: { stars: { $gt: 0 } } },
      { $group: { _id: '$userId', score: { $sum: '$score' }, solved: { $sum: 1 }, stars: { $sum: '$stars' }, time: { $sum: '$timeSeconds' } } },
      { $sort: { score: -1, solved: -1, stars: -1, time: 1 } },
      { $limit: 25 }
    ]).toArray();
    const ids = rows.map(r => r._id);
    const users = await db.collection('users').find({ _id: { $in: ids } }, { projection: { email: 1 } }).toArray();
    const names = new Map(users.map(u => [String(u._id), u.email]));
    const mask = (email) => { if (!email) return 'Explorer'; const [u,d] = email.split('@'); return `${(u||'e').slice(0,2)}***@${d||'student'}`; };
    res.json(rows.map((r,i) => ({ rank:i+1, email:mask(names.get(String(r._id))), isCurrent:String(r._id)===String(req.user.userId), score:r.score, solved:r.solved, stars:r.stars, time:r.time })));
  } catch (e) { res.status(500).json({ error: 'Could not load leaderboard' }); }
});

router.get('/badges', requireAuth, async (req, res) => {
  try {
    const rows = await getDB().collection('progress').find({ userId:new ObjectId(req.user.userId), stars:{ $gt:0 } }).toArray();
    const total = rows.length;
    const score = rows.reduce((s,p)=>s+(p.score||0),0);
    const stars = rows.reduce((s,p)=>s+(p.stars||0),0);
    const rooms = new Set(rows.map(p=>p.roomType)).size;
    const badges = [
      { id:'first-door', icon:'🚪', title:'First Escape', desc:'Clear your first chamber.', earned: total >= 1 },
      { id:'five', icon:'⭐', title:'Puzzle Pathfinder', desc:'Clear 5 chambers.', earned: total >= 5 },
      { id:'ten', icon:'🏆', title:'Code Adventurer', desc:'Clear 10 chambers.', earned: total >= 10 },
      { id:'twenty', icon:'👑', title:'DSA Explorer', desc:'Clear 20 chambers.', earned: total >= 20 },
      { id:'perfect', icon:'💎', title:'Perfect Seal', desc:'Earn 15 stars.', earned: stars >= 15 },
      { id:'all-rooms', icon:'🗺️', title:'World Hopper', desc:'Clear a chamber in every room.', earned: rooms >= 4 },
      { id:'high-score', icon:'🔥', title:'Score Hunter', desc:'Reach 1000 total points.', earned: score >= 1000 }
    ];
    res.json(badges);
  } catch (e) { res.status(500).json({ error:'Could not load badges' }); }
});

module.exports = router;
