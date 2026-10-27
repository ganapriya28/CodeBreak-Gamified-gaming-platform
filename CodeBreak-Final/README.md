# CodeBreak — Local AI Coding Escape Room

CodeBreak is a full-stack coding-learning game. It includes four rooms (Algorithm Temple, Debugger's Lab, Code Vault, and Team Mission), login/signup, code execution through the existing Judge0 CE endpoint, progress, scores, badges, leaderboard, and a question-specific tutor.

## What changed

- New questions are generated on demand for each room, language, and level. The student-facing level map is no longer capped at 20.
- Generated questions are stored in MongoDB, so revisiting a level reuses the same question.
- Each active question has a tutor chatbot. The tutor receives the question, room, language, recent chat, student's code, and execution result when available.
- Algorithm Temple also has a tutor panel.
- Team Mission no longer caps the shared level at 10/20, and team members request the same stored question for a room/language/level.
- AI runs locally through Ollama. No paid AI API key is required.

## Requirements (free)

1. Node.js 20 LTS (Node 18+ should work).
2. MongoDB Community Server running locally on `mongodb://127.0.0.1:27017`.
3. Ollama installed locally: https://ollama.com/download
4. A few GB of free disk space for the local model. `qwen2.5:3b` is the default model; performance depends on laptop RAM/CPU.
5. Internet access for the existing Judge0 CE code-runner endpoint. The AI question generator and tutor themselves run locally.

## Windows / VS Code setup

### 1. Install the local AI model (one time)

Install Ollama from https://ollama.com/download, then open a new VS Code terminal and run:

```powershell
ollama pull qwen2.5:3b
```

Make sure Ollama is running. The Ollama Windows app normally starts the local service automatically. You can test it with:

```powershell
ollama run qwen2.5:3b
```

Type `hi` and confirm the model responds, then type `/bye` to exit. The app/backend uses `http://127.0.0.1:11434` by default.

### 2. Start MongoDB

Install MongoDB Community Server and start the MongoDB service. The default connection expected by CodeBreak is `mongodb://127.0.0.1:27017`.

### 3. Configure and start the backend

Open the extracted `CodeBreak-Final` folder in VS Code. In terminal 1:

```powershell
cd backend
npm install
copy .env.example .env
```

Open `backend/.env` and set a private local JWT secret. Example:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=codebreak
JWT_SECRET=change_this_to_a_long_random_secret
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
JUDGE0_URL=https://ce.judge0.com
```

Seed the starter questions (safe to rerun; AI-generated questions are preserved):

```powershell
npm run seed
```

Then start the backend:

```powershell
npm run dev
```

You should see a message that MongoDB connected and CodeBreak backend is running on `http://localhost:3000`.

### 4. Start the frontend

Open terminal 2 in VS Code (the project root), then run:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

### 5. Use the application

1. Create an account on the login screen.
2. Select a room and a language (Python, C, or Java).
3. Open an unlocked chamber and solve the challenge.
4. Use the tutor panel for explanations, hints, and debugging help.
5. Complete the chamber to unlock the next one. The next question is generated automatically if it is not already in MongoDB.

## Check the local AI connection

After starting the backend and Ollama, open `http://localhost:3000/ai/status` in your browser. This endpoint should return JSON with `"ready": true` and the configured model name. If it returns an error, check that the Ollama app is running and that `ollama list` shows `qwen2.5:3b`.

## Troubleshooting

- **Cannot reach local AI / Ollama connection error:** Start the Ollama app and run `ollama list`. If needed, run `ollama pull qwen2.5:3b` again.
- **MongoDB connection failed:** Start the MongoDB Community Server service, then restart the backend.
- **Question generation takes time:** First generation may take a while while the local model loads. Keep the backend terminal open and retry if the request times out.
- **Laptop is low on memory:** You can try a smaller compatible Ollama model by pulling it and changing `OLLAMA_MODEL` in `backend/.env`. Make sure the selected model supports chat and JSON output.
- **Code execution fails:** The existing Judge0 CE integration requires internet access and the public service may be temporarily unavailable. This is separate from the local AI chatbot and question generator.
- **Port in use:** Close the other process using port 3000 or 5173, or adjust the matching local configuration.

## Important notes

- This project is intended to run locally; no deployment is required.
- AI generation is expandable, but generation speed and the number of questions you can create depend on your laptop resources and available disk space.
- Keep `backend/.env` private. Do not put AI configuration in frontend code.
