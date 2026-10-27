require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");

const app = express();
app.use(cors());
app.use(express.json({limit:"1mb"}));

app.get("/", (req,res)=>res.json({name:"CodeBreak API",version:"2.0.0",status:"ok"}));

app.use("/auth", require("./routes/auth"));
app.use("/questions", require("./routes/questions"));
app.use("/judge", require("./routes/judge"));
app.use("/progress", require("./routes/progress"));
app.use("/ai", require("./routes/ai"));
app.use("/team", require("./routes/team"));
app.use("/analytics", require("./routes/analytics"));

const PORT = process.env.PORT || 3000;
connectDB().then(()=>app.listen(PORT,()=>console.log(`CodeBreak backend running on http://localhost:${PORT}`)))
.catch(err=>{console.error("MongoDB connection failed:",err); process.exit(1);});
