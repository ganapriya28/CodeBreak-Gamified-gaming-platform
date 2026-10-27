const express = require("express");
const crypto = require("crypto");
const { getDB } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
function code() { return crypto.randomBytes(3).toString("hex").toUpperCase(); }
function publicRoom(room) {
  return { code: room.code, members: room.members || [], codeText: room.codeText || "", level: room.level || 1, unlockedLevel: room.unlockedLevel || 1, language: room.language || null, solved: !!room.solved, updatedAt: room.updatedAt };
}
function isMember(room, userId) { return (room.members || []).some(m => m.userId === userId); }

router.post("/create", requireAuth, async (req,res) => {
  const db = getDB(); let created = null;
  for (let i=0;i<10;i++) {
    const c = code();
    try {
      const room = { code:c, ownerId:req.user.userId, members:[{userId:req.user.userId,email:req.user.email}], codeText:"", level:1, unlockedLevel:1, solved:false, updatedAt:new Date() };
      await db.collection("teamRooms").insertOne(room); created = room; break;
    } catch {}
  }
  if (!created) return res.status(500).json({error:"Could not create team room"});
  res.json({code:created.code});
});

router.post("/join", requireAuth, async (req,res) => {
  const db = getDB(), c = String(req.body.code || "").trim().toUpperCase();
  const room = await db.collection("teamRooms").findOne({code:c});
  if (!room) return res.status(404).json({error:"Team room not found"});
  if (!isMember(room, req.user.userId)) {
    if ((room.members || []).length >= 4) return res.status(400).json({error:"This room is full"});
    await db.collection("teamRooms").updateOne({_id:room._id},{$push:{members:{userId:req.user.userId,email:req.user.email}},$set:{updatedAt:new Date()}});
  }
  const fresh = await db.collection("teamRooms").findOne({_id:room._id});
  res.json(publicRoom(fresh));
});

router.get("/:code", requireAuth, async (req,res) => {
  const room = await getDB().collection("teamRooms").findOne({code:req.params.code.toUpperCase()});
  if (!room) return res.status(404).json({error:"Team room not found"});
  if (!isMember(room, req.user.userId)) return res.status(403).json({error:"You are not a member of this team room"});
  res.json(publicRoom(room));
});

router.patch("/:code", requireAuth, async (req,res) => {
  const db = getDB();
  const room = await db.collection("teamRooms").findOne({code:req.params.code.toUpperCase()});
  if (!room) return res.status(404).json({error:"Team room not found"});
  if (!isMember(room, req.user.userId)) return res.status(403).json({error:"You are not a member of this team room"});
  const set = {updatedAt:new Date()};
  if (req.body.codeText !== undefined) set.codeText = String(req.body.codeText);
  if (req.body.language !== undefined) {
    const language = String(req.body.language).toLowerCase();
    if (!['python', 'c', 'java'].includes(language)) return res.status(400).json({ error: 'Unsupported team language.' });
    if (room.language && room.language !== language) return res.status(409).json({ error: `This team room already uses ${room.language}. All teammates must use the same language.` });
    set.language = language;
  }
  if (req.body.solved !== undefined) set.solved = !!req.body.solved;
  if (req.body.level !== undefined) {
    const next = Math.max(1, Math.min(1000000, Number(req.body.level) || 1));
    set.level = next;
    set.unlockedLevel = Math.max(Number(room.unlockedLevel || 1), next);
  }
  if (req.body.solved === true) set.solved = true;
  await db.collection("teamRooms").updateOne({_id:room._id},{$set:set});
  const fresh = await db.collection("teamRooms").findOne({_id:room._id});
  res.json(publicRoom(fresh));
});

module.exports = router;
