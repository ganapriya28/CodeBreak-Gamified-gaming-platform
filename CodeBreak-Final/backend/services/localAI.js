const OLLAMA_URL = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

async function ollamaChat(messages, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 120000);
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        ...(options.json ? { format: 'json' } : {}),
        options: { temperature: options.temperature ?? 0.5, num_ctx: 4096 }
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Ollama returned ${response.status}. ${detail.slice(0, 250)}`);
    }
    const data = await response.json();
    const content = data?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('The local AI model returned an empty response.');
    return content.trim();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The local AI model took too long. Try again or use a smaller model.');
    if (error.cause?.code === 'ECONNREFUSED' || /fetch failed/i.test(error.message)) {
      throw new Error(`Cannot reach local AI at ${OLLAMA_URL}. Install Ollama, run it, and download model ${OLLAMA_MODEL}.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('The local AI did not return valid JSON. Please retry.');
}

async function generateQuestion({ roomType, language, level, previousTitles = [] }) {
  const difficulty = level <= 5 ? 'beginner' : level <= 12 ? 'intermediate' : level <= 25 ? 'advanced' : 'challenging';
  const roomGuidance = {
    algorithm: 'Create an algorithm-ordering puzzle. steps must be 4 to 7 short actions in the correct order. starterCode and expectedOutput may be empty strings.',
    debug: 'Create a true debugging task, NOT a code-completion task. starterCode must be a complete, runnable program with one intentional syntax, runtime, or logic bug. The student must edit/fix that existing program. solution must be the same program with only the bug fixed. expectedOutput must be the exact output of the fixed solution. Do not use blanks, underscores, TODOs, placeholders, or an empty skeleton. The buggy starter must fail to compile, crash, loop incorrectly, or produce the wrong output before repair; the fixed solution must produce expectedOutput.',
    vault: 'Create a code-writing task. starterCode should be a useful partial program or a simple starting program and expectedOutput must be the exact output a correct solution prints.',
    team: 'Create a collaborative code-writing task suitable for two students. starterCode should be a useful partial program and expectedOutput must be the exact output a correct solution prints.'
  };
  const system = `You create accurate, concise coding-learning challenges for a student coding game. Return ONLY one JSON object. The programming language is ${language}; use valid ${language} syntax in starterCode and solution. Room: ${roomType}. Difficulty: ${difficulty} (level ${level}). ${roomGuidance[roomType] || roomGuidance.vault}
JSON schema: {"title":"short title","prompt":"clear student-facing task","concept":"learning concept","difficulty":1,"starterCode":"code string","expectedOutput":"exact output string","solution":"complete correct code string","hints":["hint 1","hint 2","hint 3"],"steps":["step 1","step 2","step 3","step 4"]}. For non-algorithm rooms, steps may be []. For algorithm room, steps must be in correct order and expectedOutput may be empty. Make each challenge different, self-contained, and solvable without external files or libraries. Use fixed inputs and exact predictable output. Avoid markdown fences. Do not include hidden tests. Do not repeat these previous titles: ${previousTitles.slice(-25).join(' | ') || 'none'}.`;
  const raw = await ollamaChat([{ role: 'system', content: system }, { role: 'user', content: `Generate the challenge for level ${level} in room ${roomType}, language ${language}.` }], { json: true, temperature: 0.75, timeoutMs: 180000 });
  const q = parseJson(raw);
  if (!q || typeof q.title !== 'string' || typeof q.prompt !== 'string' || !q.title.trim() || !q.prompt.trim()) throw new Error('Generated question is missing a title or prompt. Please retry.');
  const steps = Array.isArray(q.steps) ? q.steps.filter(x => typeof x === 'string' && x.trim()).slice(0, 8) : [];
  const hints = Array.isArray(q.hints) ? q.hints.filter(x => typeof x === 'string' && x.trim()).slice(0, 4) : [];
  if (roomType === 'algorithm' && steps.length < 3) throw new Error('Generated algorithm puzzle is incomplete. Please retry.');
  if (roomType !== 'algorithm' && (!String(q.starterCode || '').trim() || typeof q.expectedOutput !== 'string')) throw new Error('Generated coding challenge is missing starter code or expected output. Please retry.');
  if (roomType === 'debug' && String(q.starterCode || '').trim() === String(q.solution || '').trim()) throw new Error('Generated debugging challenge has no visible bug. Please retry.');
  return {
    roomType, language, level,
    title: q.title.trim().slice(0, 120),
    prompt: q.prompt.trim().slice(0, 3000),
    concept: String(q.concept || 'Programming fundamentals').slice(0, 200),
    difficulty: Math.min(5, Math.max(1, Number(q.difficulty) || (level <= 5 ? 1 : level <= 12 ? 3 : 4))),
    starterCode: String(q.starterCode || ''),
    expectedOutput: String(q.expectedOutput || ''),
    solution: String(q.solution || ''),
    hints: hints.length ? hints : ['Break the task into smaller steps.', 'Trace the values in your program.', 'Compare the expected output with your current output.'],
    steps,
    generatedBy: 'ollama',
    createdAt: new Date()
  };
}

module.exports = { ollamaChat, generateQuestion, OLLAMA_MODEL };
