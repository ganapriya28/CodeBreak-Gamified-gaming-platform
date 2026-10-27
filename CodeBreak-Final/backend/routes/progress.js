const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

router.get("/", requireAuth, async (req,res) => {
  const rows = await getDB().collection("progress").find({userId:new ObjectId(req.user.userId)}).toArray();
  res.json(rows.map(x => ({...x,_id:undefined,userId:undefined})));
});

router.post("/submit", requireAuth, async (req,res) => {
  try {
    const {roomType,language,level,score,stars,attempts,hintsUsed,timeSeconds} = req.body;
    const filter = {userId:new ObjectId(req.user.userId),roomType,language,level:Number(level)};
    const value = {
      ...filter, score:Number(score)||0, stars:Number(stars)||0, attempts:Number(attempts)||0,
      hintsUsed:Number(hintsUsed)||0, timeSeconds:Number(timeSeconds)||0, solvedAt:new Date()
    };
    const existing = await getDB().collection("progress").findOne(filter);
    if (!existing) {
      await getDB().collection("progress").insertOne(value);
    } else {
      await getDB().collection("progress").updateOne(
        filter,
        {
          $set: {
            attempts: value.attempts,
            hintsUsed: value.hintsUsed,
            timeSeconds: value.timeSeconds,
            solvedAt: value.solvedAt
          },
          $max: {
            score: value.score,
            stars: value.stars
          }
        }
      );
    }
    res.json({ok:true});
  } catch(e) { res.status(500).json({error:"Could not save progress"}); }
});

module.exports = router;
