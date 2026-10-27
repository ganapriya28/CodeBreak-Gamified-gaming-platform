const express = require("express");
const bcrypt = require("bcryptjs");
const { getDB } = require("../db");
const { signToken } = require("../auth");

const router = express.Router();

router.post("/signup", async (req,res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) return res.status(400).json({error:"Email and password (6+ characters) are required."});
    const db = getDB();
    const normalized = email.trim().toLowerCase();
    const existing = await db.collection("users").findOne({email:normalized});
    if (existing) return res.status(409).json({error:"Account already exists."});
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({email:normalized,passwordHash,createdAt:new Date()});
    const user = {_id:result.insertedId,email:normalized};
    res.json({token:signToken(user),email:normalized});
  } catch(e) { res.status(500).json({error:"Signup failed."}); }
});

router.post("/login", async (req,res) => {
  try {
    const {email,password} = req.body;
    const db = getDB();
    const user = await db.collection("users").findOne({email:String(email||"").trim().toLowerCase()});
    if (!user || !(await bcrypt.compare(password||"", user.passwordHash))) return res.status(401).json({error:"Invalid email or password."});
    res.json({token:signToken(user),email:user.email});
  } catch(e) { res.status(500).json({error:"Login failed."}); }
});

module.exports = router;
