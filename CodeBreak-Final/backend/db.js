const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "codebreak";

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("questions").createIndex({ roomType: 1, language: 1, level: 1 }, { unique: true }),
    db.collection("progress").createIndex(
      { userId: 1, roomType: 1, language: 1, level: 1 },
      { unique: true }
    ),
    db.collection("teamRooms").createIndex({ code: 1 }, { unique: true })
  ]);

  console.log(`MongoDB connected: ${dbName}`);
  return db;
}

function getDB() {
  if (!db) throw new Error("Database not connected");
  return db;
}

async function closeDB() {
  if (client) await client.close();
}

module.exports = { connectDB, getDB, closeDB };
