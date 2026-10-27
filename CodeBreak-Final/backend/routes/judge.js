const express = require("express");
const { getDB } = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

function normalize(s="") {
  return String(s).replace(/\r\n/g,"\n").split("\n").map(x=>x.trimEnd()).join("\n").trim();
}

const ids = {python:71,c:50,java:62};

router.post("/run", requireAuth, async (req,res) => {
  try {
    const {code,expected_output,language} = req.body;
    if (!code || !language) return res.status(400).json({error:"code and language required"});
    const url = process.env.JUDGE0_URL || "https://ce.judge0.com";
    const language_id = ids[language];
    if (!language_id) return res.status(400).json({error:"Unsupported language"});

    const r = await fetch(`${url}/submissions?base64_encoded=false&wait=true`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({language_id,source_code:code,stdin:""})
    });
    if (!r.ok) return res.status(502).json({error:"Judge0 request failed"});
    const data = await r.json();
    const output = data.stdout || data.compile_output || data.stderr || "";
    const passed = normalize(output) === normalize(expected_output);
    res.json({passed,output,expected:expected_output,status:data.status?.description||"Unknown"});
  } catch(e) {
    console.error(e);
    res.status(500).json({error:"Code execution failed"});
  }
});

module.exports = router;
