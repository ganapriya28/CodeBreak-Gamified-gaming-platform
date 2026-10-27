import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
type Room = "algorithm" | "debug" | "vault" | "team";
type ThemeName = "space" | "castle" | "jungle" | "robot" | "cars" | "animals" | "dolls" | "stars" | "sky" | "amusement" | "ocean" | "dinosaurs" | "candy";
type Screen = "login" | "rooms" | "teamLobby" | "language" | "levels" | "play" | "dashboard" | "leaderboard";

interface Question {
  _id: string; roomType: Room; level: number; language: string; title: string; prompt: string; concept?: string; difficulty?: number;
  starterCode?: string; solution?: string; expectedOutput?: string; hints?: string[]; steps?: string[];
}
interface Progress { roomType: Room; language: string; level: number; score: number; stars: number; attempts: number; hintsUsed: number; timeSeconds?: number; }
interface TeamState { code: string; members: { email: string }[]; codeText: string; level: number; unlockedLevel: number; language?: string | null; solved: boolean; }
interface DashboardData { totalScore:number; avgScore:number; solved:number; totalTime:number; avgAttempts:number; maxStars:number; byRoom:Record<string,{solved:number;score:number;stars:number}>; recent:any[] }
interface Badge { id:string; icon:string; title:string; desc:string; earned:boolean }

const themes: Record<ThemeName, any> = {
  space: { label: "Space Explorers", emoji: "🚀", bg: "#eaf7ff", card: "#ffffff", accent: "#1687c9", text: "#16324f", soft: "#d9f1ff" },
  castle: { label: "Magic Castle", emoji: "🏰", bg: "#fff4fb", card: "#ffffff", accent: "#9b59b6", text: "#3e2852", soft: "#f7def3" },
  jungle: { label: "Jungle Animals", emoji: "🦁", bg: "#effbf1", card: "#ffffff", accent: "#2e9b59", text: "#1f4930", soft: "#dff5e4" },
  robot: { label: "Robot Lab", emoji: "🤖", bg: "#f2f8ff", card: "#ffffff", accent: "#1677a8", text: "#20364a", soft: "#dceeff" },
  cars: { label: "Racing Cars", emoji: "🏎️", bg: "#fff2e8", card: "#ffffff", accent: "#ed6338", text: "#66321e", soft: "#ffe0ce" },
  animals: { label: "Animal Safari", emoji: "🦊", bg: "#f2ffe9", card: "#ffffff", accent: "#68a83e", text: "#294b22", soft: "#e0f5ce" },
  dolls: { label: "Dolls & Fairies", emoji: "🧚", bg: "#fff0f7", card: "#ffffff", accent: "#e45da5", text: "#6b2850", soft: "#ffd9ec" },
  stars: { label: "Rainbow Stars", emoji: "🌟", bg: "#fff9dc", card: "#ffffff", accent: "#d89c13", text: "#614711", soft: "#ffefad" },
  sky: { label: "Cloud Kingdom", emoji: "☁️", bg: "#eafaff", card: "#ffffff", accent: "#38a9dc", text: "#174c68", soft: "#d0f1ff" },
  amusement: { label: "Amusement Park", emoji: "🎡", bg: "#fff2e9", card: "#ffffff", accent: "#f07837", text: "#69371f", soft: "#ffddc8" },
  ocean: { label: "Ocean Friends", emoji: "🐬", bg: "#e7fbff", card: "#ffffff", accent: "#0d9fbd", text: "#174d64", soft: "#c8f4fb" },
  dinosaurs: { label: "Dinosaur World", emoji: "🦕", bg: "#f1f9df", card: "#ffffff", accent: "#729d36", text: "#344c20", soft: "#e1efbd" },
  candy: { label: "Candy Land", emoji: "🍭", bg: "#fff0fc", card: "#ffffff", accent: "#c85bc6", text: "#602a66", soft: "#f7d7f5" }
};

// Small, decorative characters that roam around the edges of the screen.
// They are pointer-transparent so they never block buttons, forms, or the code editor.
const themeCritters: Record<ThemeName, string[]> = {
  space: ["🚀", "⭐", "🪐", "👾"], castle: ["🦄", "🐉", "🧚", "✨"],
  jungle: ["🐒", "🦋", "🦁", "🦜"], robot: ["🤖", "⚙️", "🛸", "🔋"],
  cars: ["🏎️", "🚙", "🏁", "🚕"], animals: ["🦊", "🐼", "🐰", "🦋"],
  dolls: ["🧚", "🦄", "💖", "🦋"], stars: ["🌟", "🌈", "🌙", "✨"],
  sky: ["☁️", "🐦", "🛩️", "🌤️"], amusement: ["🎈", "🎠", "🎡", "🎢"],
  ocean: ["🐬", "🐠", "🐢", "🫧"], dinosaurs: ["🦕", "🦖", "🥚", "🌿"],
  candy: ["🍭", "🍬", "🧁", "🍩"]
};

function ThemeMovers({ themeName }: { themeName: ThemeName }) {
  const critters = themeCritters[themeName] || themeCritters.space;
  return <div className="theme-movers" aria-hidden="true" key={themeName}>
    {critters.map((emoji, i) => <span key={`${themeName}-${emoji}-${i}`} className={`theme-mover theme-mover-${i}`}>{emoji}</span>)}
  </div>;
}

const rooms = [
  { id: "algorithm" as Room, icon: "🧩", title: "Algorithm Temple", desc: "Arrange the ancient algorithm fragments in the correct order to open the temple doors.", color: "#38bdf8" },
  { id: "debug" as Room, icon: "🐛", title: "Debugger's Lab", desc: "Repair a broken machine, pass its tests and unlock the next laboratory chamber.", color: "#4ade80" },
  { id: "vault" as Room, icon: "🔐", title: "Code Vault", desc: "Reconstruct hidden programs, solve the locks and escape deeper into the vault.", color: "#c084fc" },
  { id: "team" as Room, icon: "👥", title: "Team Mission", desc: "Create or join an escape room, share code with a teammate and unlock the team doors.", color: "#facc15" }
];

function App() {
  const [token, setToken] = useState(localStorage.getItem("cb-token") || "");
  const [email, setEmail] = useState(localStorage.getItem("cb-email") || "");
  const [screen, setScreen] = useState<Screen>(token ? "rooms" : "login");
  const [room, setRoom] = useState<Room>("algorithm");
  const [language, setLanguage] = useState("python");
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [themeName, setThemeName] = useState<ThemeName>((localStorage.getItem("cb-theme") as ThemeName) || "space");
  const [teamRoom, setTeamRoom] = useState("");
  const [teamState, setTeamState] = useState<TeamState | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const theme = themes[themeName] || themes.space;

  async function api(path: string, options: any = {}) {
    const r = await fetch(API + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401) {
      localStorage.removeItem("cb-token"); localStorage.removeItem("cb-email");
      setToken(""); setEmail(""); setScreen("login");
      throw new Error("Session expired. Please login again.");
    }
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  useEffect(() => { if (token) api("/progress").then(setProgress).catch(() => {}); }, [token]);
  useEffect(() => {
    if (!token) return;
    Promise.all([api("/analytics/dashboard"), api("/analytics/badges"), api("/analytics/leaderboard")])
      .then(([d,b,l]) => { setDashboard(d); setBadges(b); setLeaderboard(l); }).catch(() => {});
  }, [token, progress.length]);

  useEffect(() => {
    if (!teamRoom || room !== "team") return;
    const load = async () => { try { setTeamState(await api(`/team/${teamRoom}`)); } catch {} };
    load();
    const id = setInterval(load, 1200);
    return () => clearInterval(id);
  }, [teamRoom, room]);

  function login(t: string, e: string) { setToken(t); setEmail(e); localStorage.setItem("cb-token", t); localStorage.setItem("cb-email", e); setScreen("rooms"); }
  function logout() { localStorage.removeItem("cb-token"); localStorage.removeItem("cb-email"); setToken(""); setEmail(""); setTeamRoom(""); setTeamState(null); setScreen("login"); }
  function chooseRoom(r: Room) { setRoom(r); if (r === "team") setScreen("teamLobby"); else setScreen("language"); }
  async function chooseLanguage(l: string) {
    if (room === "team" && teamRoom) {
      try {
        const state = await api(`/team/${teamRoom}`, { method: "PATCH", body: JSON.stringify({ language: l }) });
        setTeamState(state);
        setLanguage(state.language || l);
        setScreen("levels");
      } catch (e: any) { alert(e.message || "Could not set the team language."); }
      return;
    }
    setLanguage(l);
    setScreen("levels");
  }
  async function chooseLevel(n: number) {
    if (room !== "team") {
      const previous = progress.find(p => p.roomType === room && p.language === language && p.level === n - 1);
      if (n > 1 && !previous) return;
    } else if (teamState && n > teamState.unlockedLevel) return;
    setLevel(n);
    try {
      const q = await api(`/questions/${room}/${language}/${n}`);
      if (room === "team" && teamRoom) {
        const state = await api(`/team/${teamRoom}`, { method: "PATCH", body: JSON.stringify({ level: n, solved: false, codeText: q.starterCode || "" }) });
        setTeamState(state);
      }
      setQuestion(q);
      setScreen("play");
    } catch (e: any) { alert(e.message); }
  }
  function changeTheme(t: ThemeName) { setThemeName(t); localStorage.setItem("cb-theme", t); }
  async function solved(p: Progress) { setProgress(prev => [...prev.filter((x:Progress) => !(x.roomType === p.roomType && x.language === p.language && x.level === p.level)), p]); try { const [d,b,l] = await Promise.all([api("/analytics/dashboard"), api("/analytics/badges"), api("/analytics/leaderboard")]); setDashboard(d); setBadges(b); setLeaderboard(l); } catch {} }

  if (screen === "login") return <Login theme={theme} onLogin={login} themeName={themeName} onThemeChange={changeTheme} />;
  return <div className="app" style={{ background: theme.bg, color: theme.text }}><ThemeMovers themeName={themeName} />
    <header className="topbar">
      <div className="logo">CODEBREAK</div>
      <div className="top-actions">
        {room === "team" && teamRoom && <span className="room-code-pill">ROOM {teamRoom}</span>}
        <span>{themes[themeName].emoji} {email}</span>
        <button className="nav-button" onClick={() => setScreen("dashboard")}>📊 Progress</button>
        <button className="nav-button" onClick={() => setScreen("leaderboard")}>🏆 Leaderboard</button>
        <select value={themeName} onChange={e => changeTheme(e.target.value as ThemeName)}>{Object.entries(themes).map(([k, v]: any) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button onClick={logout}>Logout</button>
      </div>
    </header>
    {screen === "rooms" && <Rooms onSelect={chooseRoom} dashboard={dashboard} badges={badges} onDashboard={() => setScreen("dashboard")} themeName={themeName} onThemeChange={changeTheme} />}
    {screen === "dashboard" && <Dashboard data={dashboard} badges={badges} progress={progress} theme={theme} onBack={() => setScreen("rooms")} />}
    {screen === "leaderboard" && <Leaderboard rows={leaderboard} email={email} theme={theme} onBack={() => setScreen("rooms")} />}
    {screen === "teamLobby" && <TeamLobby theme={theme} api={api} onBack={() => setScreen("rooms")} onReady={(code, state) => { setTeamRoom(code); setTeamState(state); setScreen("language"); }} />}
    {screen === "language" && <LanguageSelect room={room} theme={theme} teamRoom={teamRoom} teamState={teamState} onBack={() => setScreen(room === "team" ? "teamLobby" : "rooms")} onSelect={chooseLanguage} />}
    {screen === "levels" && <Levels room={room} language={language} theme={theme} progress={progress} teamState={teamState} api={api} onBack={() => setScreen("language")} onLevel={chooseLevel} />}
    {screen === "play" && question && <Play room={room} language={language} level={level} question={question} theme={theme} teamRoom={teamRoom} teamState={teamState} api={api} onBack={() => setScreen("levels")} onSolved={solved} onTeamState={setTeamState} />}
  </div>;
}

function Login({ theme, onLogin, themeName, onThemeChange }: { theme: any; onLogin: (t: string, e: string) => void; themeName: ThemeName; onThemeChange: (t: ThemeName) => void }) {
  const [signup, setSignup] = useState(false), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState("");
  async function submit() { try { const r = await fetch(`${API}/auth/${signup ? "signup" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); onLogin(d.token, d.email); } catch (e: any) { setError(e.message); } }
  return <div className="login" style={{ background: theme.bg, color: theme.text }}><ThemeMovers themeName={themeName} /><div className="login-card kid-login-card" style={{ background: theme.card, borderColor: theme.accent }}><div className="login-theme-picker"><span>🎨 Pick your world</span><select value={themeName} onChange={e => onThemeChange(e.target.value as ThemeName)}>{Object.entries(themes).map(([k, v]: any) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}</select></div><div className="login-mascots" aria-hidden="true">🚗 🦄 ⭐ 🐼 🎡</div><div className="big-logo">CODEBREAK</div><div className="subtitle">SOLVE • LEARN • ESCAPE</div><h2>{signup ? "Create your explorer account" : "Enter the coding academy"}</h2><input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><input placeholder="Password (6+ characters)" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />{error && <div className="error">{error}</div>}<button className="primary" style={{ background: theme.accent }} onClick={submit}>{signup ? "CREATE ACCOUNT" : "ENTER ROOMS"}</button><button className="link" onClick={() => setSignup(!signup)}>{signup ? "Already have an account? Login" : "New student? Create an account"}</button></div></div>;
}

function Rooms({ onSelect, dashboard, badges, onDashboard, themeName, onThemeChange }: { onSelect:(r:Room)=>void; dashboard:DashboardData|null; badges:Badge[]; onDashboard:()=>void; themeName: ThemeName; onThemeChange:(t:ThemeName)=>void }) {
  const earned = badges.filter(b=>b.earned).length;
  return <main className="page">
    <div className="hero animated-hero"><div className="eyebrow">CODEBREAK ACADEMY</div><h1>CHOOSE YOUR ESCAPE</h1><p>Learn DSA, solve coding puzzles, unlock doors and become a CodeBreaker.</p><div className="hero-stats"><span>⭐ {dashboard?.maxStars || 0} stars</span><span>🎯 {dashboard?.solved || 0} chambers</span><span>🏅 {earned} badges</span><span>🔥 {dashboard?.totalScore || 0} points</span></div></div>
    <div className="kid-welcome-strip"><span>🧸</span><div><b>Welcome, Code Explorer!</b><small>Pick a magical world, collect stars, and celebrate every little win.</small></div><span>🌈</span><span>🦄</span><span>🎈</span></div>
    <section className="theme-park"><div className="theme-park-heading"><h2>🎨 CHOOSE YOUR WORLD</h2><span>Switch the look whenever you like!</span></div><div className="theme-swatch-grid">{Object.entries(themes).map(([key, value]: any) => <button key={key} className={`theme-swatch ${themeName === key ? "selected" : ""}`} onClick={() => onThemeChange(key as ThemeName)} style={{ background: value.bg, borderColor: themeName === key ? value.accent : "#dce8ee", color: value.text }}><span>{value.emoji}</span><b>{value.label}</b>{themeName === key && <small>✓ YOUR WORLD</small>}</button>)}</div></section>
    <div className="room-grid">{rooms.map(r=><button className="room-card animated-card" key={r.id} onClick={()=>onSelect(r.id)} style={{borderColor:r.color}}><div className="room-icon">{r.icon}</div><h2>{r.title}</h2><p>{r.desc}</p><span style={{color:r.color}}>ENTER ROOM →</span><div className="room-sparkles">✦ ✧ ✦</div></button>)}</div>
    <div className="quick-actions"><button onClick={onDashboard}>📊 OPEN MY LEARNING DASHBOARD</button></div>
  </main>;
}

function Dashboard({data,badges,progress,theme,onBack}:{data:DashboardData|null;badges:Badge[];progress:Progress[];theme:any;onBack:()=>void}) {
  return <main className="page dashboard-page"><button className="back" onClick={onBack}>← BACK TO ROOMS</button><div className="hero"><div className="eyebrow">YOUR CODEBREAK JOURNEY</div><h1>LEARNING DASHBOARD</h1><p>Track solved levels, scores, stars, time and the skills you are building.</p></div>
    <div className="metric-grid"><Metric icon="🎯" label="Chambers Cleared" value={data?.solved||0}/><Metric icon="🔥" label="Total Score" value={data?.totalScore||0}/><Metric icon="⭐" label="Stars" value={data?.maxStars||0}/><Metric icon="⏱️" label="Time Learning" value={`${Math.round((data?.totalTime||0)/60)}m`}/><Metric icon="🧠" label="Avg Attempts" value={data?.avgAttempts||0}/><Metric icon="📈" label="Average Score" value={data?.avgScore||0}/></div>
    <section className="dashboard-card"><h2>LEVEL MONITORING</h2>{rooms.map(r=>{const x=data?.byRoom?.[r.id]||{solved:0,score:0,stars:0}; return <div className="room-progress-row" key={r.id}><div className="room-progress-title"><span>{r.icon} {r.title}</span><b>{x.solved} completed</b></div><div className="progress-track"><div style={{width:`${Math.min(100,x.solved/20*100)}%`,background:r.color}}/></div><small>{x.score} points · {x.stars} stars</small></div>})}</section>
    <section className="dashboard-card"><h2>BADGES</h2><div className="badge-grid">{badges.map(b=><div className={`badge ${b.earned?'earned':'locked'}`} key={b.id}><div>{b.icon}</div><b>{b.title}</b><small>{b.desc}</small>{b.earned&&<span>✓ EARNED</span>}</div>)}</div></section>
    <section className="dashboard-card"><h2>RECENT CHAMBERS</h2><div className="recent-list">{(data?.recent||[]).map((x:any,i)=><div key={i}><span>{rooms.find(r=>r.id===x.roomType)?.icon} {rooms.find(r=>r.id===x.roomType)?.title} · Level {x.level}</span><b>{x.score} pts · {'★'.repeat(Math.round(x.stars||0))}</b></div>)}{!(data?.recent||[]).length&&<p>No completed chambers yet. Your first escape will appear here.</p>}</div></section>
  </main>
}
function Metric({icon,label,value}:{icon:string;label:string;value:any}){return <div className="metric-card"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>}

function Leaderboard({rows,email,theme,onBack}:{rows:any[];email:string;theme:any;onBack:()=>void}){return <main className="page leaderboard-page"><button className="back" onClick={onBack}>← BACK TO ROOMS</button><div className="hero"><div className="eyebrow">CODEBREAK COMMUNITY</div><h1>LEADERBOARD</h1><p>Compare your learning progress with other explorers.</p></div><div className="leaderboard-card"><div className="leader-row header"><span>RANK</span><span>EXPLORER</span><span>CHAMBERS</span><span>STARS</span><span>SCORE</span></div>{rows.map(r=><div className={`leader-row ${r.isCurrent?'me':''}`} key={r.rank}><span>{r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:r.rank}</span><span>{r.isCurrent?'You':r.email}</span><span>{r.solved}</span><span>{r.stars}</span><b>{r.score}</b></div>)}{!rows.length&&<div className="empty-state">No scores yet. Be the first explorer to escape a chamber!</div>}</div></main>}

function TeamLobby({ theme, api, onBack, onReady }: { theme: any; api: any; onBack: () => void; onReady: (code: string, state: TeamState) => void }) {
  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [roomState, setRoomState] = useState<TeamState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!createdCode) return;
    const load = async () => {
      try { setRoomState(await api(`/team/${createdCode}`)); } catch {}
    };
    load();
    const id = setInterval(load, 1200);
    return () => clearInterval(id);
  }, [createdCode]);

  async function create() {
    setBusy(true); setError("");
    try {
      const d = await api("/team/create", { method: "POST" });
      const s = await api(`/team/${d.code}`);
      setCreatedCode(d.code);
      setRoomState(s);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  async function join() {
    if (!joinCode.trim()) return setError("Enter the room code first.");
    setBusy(true); setError("");
    try {
      const d = await api("/team/join", { method: "POST", body: JSON.stringify({ code: joinCode.trim() }) });
      const s = await api(`/team/${d.code}`);
      onReady(d.code, s);
    } catch (e: any) {
      setError(e.message);
    } finally { setBusy(false); }
  }

  function enterCreatedRoom() {
    if (createdCode && roomState) onReady(createdCode, roomState);
  }

  return <main className="page team-lobby">
    <button className="back" onClick={onBack}>← BACK TO ROOMS</button>
    <div className="escape-panel team-escape-panel" style={{ borderColor: theme.accent }}>
      <div className="room-icon">👥</div>
      <div className="eyebrow">TEAM MISSION</div>
      <h1>THE CO-OP ESCAPE ROOM</h1>
      <p>One student creates the room and shares the code. Another student joins with that code. Then both enter the same live chamber.</p>

      {!createdCode ? <div className="team-choice-grid">
        <div className="choice-card co-op-card">
          <div className="choice-icon">🔑</div>
          <h2>Create a Room</h2>
          <p>Become the host and generate a private six-character escape-room code.</p>
          <button className="primary" style={{ background: theme.accent }} disabled={busy} onClick={create}>{busy ? "CREATING..." : "CREATE ROOM"}</button>
        </div>
        <div className="choice-card co-op-card">
          <div className="choice-icon">🚪</div>
          <h2>Join a Room</h2>
          <p>Enter the six-character code your teammate gives you.</p>
          <input className="code-input" maxLength={6} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" />
          <button className="primary" style={{ background: theme.accent }} disabled={busy} onClick={join}>JOIN ROOM</button>
        </div>
      </div> : <div className="created-room-card">
        <div className="created-room-icon">🚪</div>
        <div className="eyebrow">ROOM CREATED</div>
        <h2>Share this escape code</h2>
        <div className="big-room-code">{createdCode}</div>
        <p className="waiting-text">{(roomState?.members?.length || 1) < 2 ? "Waiting for your teammate to enter the room..." : `Your teammate is inside. ${roomState?.members?.length} explorers are ready.`}</p>
        <div className="member-pills">{(roomState?.members || []).map((m, i) => <span key={i}>🧑‍💻 {m.email}</span>)}</div>
        <div className="room-actions">
          <button className="copy-code" onClick={() => navigator.clipboard?.writeText(createdCode)}>📋 COPY CODE</button>
          <button className="primary" style={{ background: theme.accent }} onClick={enterCreatedRoom}>ENTER TEAM MISSION →</button>
        </div>
      </div>}

      {error && <div className="error">{error}</div>}
      <div className="team-how-it-works"><b>How multiplayer works</b><span>1. Create / join → 2. Choose language → 3. Solve the same chamber → 4. Share code → 5. Unlock the next door together.</span></div>
    </div>
  </main>;
}

function LanguageSelect({ room, theme, teamRoom, teamState, onBack, onSelect }: { room: Room; theme: any; teamRoom: string; teamState: TeamState | null; onBack: () => void; onSelect: (l: string) => void }) {
  return <main className="page"><button className="back" onClick={onBack}>← BACK</button>{room === "team" && teamRoom && <div className="team-status" style={{ borderColor: theme.accent }}><b>ESCAPE ROOM CODE: {teamRoom}</b><span>Teammates inside: {teamState?.members?.length || 1}</span></div>}<div className="hero"><div className="eyebrow">{room === "team" ? "ROOM READY" : "ROOM SELECTED"}</div><h1>{rooms.find(r => r.id === room)?.title}</h1><p>Choose the language used inside this escape room.</p><div className="kid-stage-tip">🎟️ Pick your coding tool, then collect stars as you conquer each challenge! 🌟</div></div><div className="language-grid">{[["python","🐍","Python"],["c","⚙️","C"],["java","☕","Java"]].filter(([id]) => room !== "team" || !teamState?.language || id === teamState.language).map(([id, icon, name]) => <button key={id} className="language-card" style={{ borderColor: theme.accent }} onClick={() => onSelect(id)}><span>{icon}</span><b>{name}</b><small>New AI-generated challenges</small></button>)}</div></main>;
}

function Levels({ room, language, theme, progress, teamState, api, onBack, onLevel }: { room: Room; language: string; theme: any; progress: Progress[]; teamState: TeamState | null; api: any; onBack: () => void; onLevel: (n: number) => void }) {
  const r = rooms.find(x => x.id === room)!;
  const [recommendation, setRecommendation] = useState("");
  const roomProgress = progress.filter(x => x.roomType === room && x.language === language && x.stars > 0);
  const completedLevels = roomProgress.map(p => Number(p.level));
  const sequentialUnlock = Math.max(1, ...completedLevels.map(n => n + 1));
  const unlocked = room === "team" ? Math.max(1, teamState?.unlockedLevel || 1) : sequentialUnlock;
  const completed = roomProgress.length;
  const visibleLevels = Math.max(20, unlocked + 5);
  async function recommend() {
    try {
      const d = await api("/ai/next-question", { method: "POST", body: JSON.stringify({ roomType: room, language, currentLevel: unlocked }) });
      setRecommendation(`🤖 ${d.reason || "Your next chamber is selected from your recent performance."}${d.recommendedLevel ? ` Suggested Chamber ${d.recommendedLevel}.` : ""}`);
    } catch { setRecommendation("🤖 Continue with your next unlocked chamber. New questions are generated when needed."); }
  }
  return <main className={`page level-map ${room === "algorithm" ? "temple-map" : ""}`}>
    <button className="back" onClick={onBack}>← BACK</button>
    {room === "team" && <div className="team-status" style={{ borderColor: theme.accent }}><b>TEAM ROOM: {teamState?.code}</b><span>{teamState?.members?.length || 1} explorer(s) inside</span></div>}
    <div className="hero"><div className="room-icon">{r.icon}</div><div className="eyebrow">{language.toUpperCase()} • {room === "algorithm" ? "TEMPLE CHAMBERS" : "ESCAPE CHAMBERS"}</div><h1>{r.title}</h1><p>Complete a chamber to unlock the next. New AI challenges are created automatically as you progress.</p><button className="ai-recommend" onClick={recommend}>🤖 AI RECOMMEND NEXT</button>{recommendation && <div className="recommendation">{recommendation}</div>}</div>
    <div className="door-map">{Array.from({ length: visibleLevels }, (_, i) => i + 1).map(n => {
      const open = n <= unlocked;
      const done = completedLevels.includes(n);
      const stars = progress.find(p => p.roomType === room && p.language === language && p.level === n)?.stars || 0;
      return <button key={n} disabled={!open} onClick={() => onLevel(n)} className={`door-node ${open ? "open" : "locked"} ${done ? "done" : ""}`} style={{ borderColor: open ? theme.accent : "#334155", boxShadow: open ? `0 0 22px ${theme.accent}33` : "none" }}><div className="door-art">{done ? "✓" : open ? "🚪" : "🔒"}</div><strong>CHAMBER {String(n).padStart(2, "0")}</strong><span>{done ? `${"★".repeat(Math.round(stars))}${"☆".repeat(3 - Math.round(stars))}` : open ? "ENTER" : `LOCKED — CLEAR ${n - 1}`}</span></button>;
    })}</div>
    <div className="progress-line">{completed} chambers cleared • New challenges are generated as needed</div>
  </main>;
}

function AlgorithmTemple({ question, theme, level, arranged, setArranged, run, result, running, hints, getHint, onDoor, onBack, chatHistory, chatInput, setChatInput, chatLoading, sendTutorMessage, clearTutor }: any) {
  const steps: string[] = question.steps || []; const [available, setAvailable] = useState<string[]>([]);
  useEffect(() => setAvailable(shuffle(steps)), [question]);
  function collect(s: string) { setAvailable(a => { const i=a.indexOf(s); return i<0?a:[...a.slice(0,i),...a.slice(i+1)]; }); setArranged((a: string[]) => [...a, s]); }
  function remove(s: string) { setArranged((a: string[]) => { const i=a.indexOf(s); return i<0?a:[...a.slice(0,i),...a.slice(i+1)]; }); setAvailable(a => [...a, s]); }
  function move(i: number, j: number) { const a = [...arranged]; [a[i], a[j]] = [a[j], a[i]]; setArranged(a); }
  const solved = result.startsWith("DOOR UNLOCKED");
  return <main className="temple-game" style={{ background: theme.bg, color: theme.text }}><div className="temple-top"><button className="back" onClick={onBack}>← EXIT CHAMBER</button><div><b>ALGORITHM TEMPLE</b> · CHAMBER {String(level).padStart(2, "0")}</div><div className="lives">❤️ ❤️ ❤️</div></div><div className="kid-stage-tip temple-tip">🧩 Every fragment is a clue. You are the hero of this puzzle! ⭐</div><div className="temple-scene"><div className="temple-wall"><div className="temple-sign">ANCIENT ALGORITHM SEAL</div><div className="guardian">🗿<span>Arrange the fragments.<br/>The door obeys logic.</span></div><div className="pedestal">{available.map((s, i) => <button key={i + s} className="fragment" onClick={() => collect(s)}>{s}</button>)}</div><div className={`temple-door ${solved ? "unlocked" : ""}`} onClick={solved ? onDoor : undefined}><div className="door-symbol">{solved ? "✓" : "🔒"}</div><b>{solved ? "NEXT CHAMBER" : "SEALED"}</b>{solved && <small>CLICK TO ENTER</small>}</div></div><section className="temple-console"><div className="eyebrow">{question.title}</div><h2>{question.prompt}</h2><div className="arranged-title">YOUR ALGORITHM · {arranged.length}/{steps.length}</div><div className="arranged-box">{arranged.map((s, i) => <div className="temple-step" key={i + s}><span>{i + 1}</span><code>{s}</code><button disabled={i === 0} onClick={() => move(i, i - 1)}>▲</button><button disabled={i === arranged.length - 1} onClick={() => move(i, i + 1)}>▼</button><button onClick={() => remove(s)}>✕</button></div>)}</div><div className="actions"><button className="primary" style={{ background: theme.accent }} disabled={running || arranged.length !== steps.length} onClick={run}>{running ? "CHECKING SEAL..." : "ACTIVATE SEAL"}</button><button onClick={getHint}>💡 HINT</button></div>{result && <pre className={solved ? "success" : "result"}>{result}</pre>}{hints > 0 && <div className="hint-badge">Hints used: {hints}</div>}</section></div><div className="temple-tutor-wrap"><aside className="panel tutor-panel"><div className="tutor-heading"><div><h3>🤖 Algorithm Tutor</h3><span>Ask about the puzzle or your step order.</span></div><button className="clear-chat" onClick={clearTutor}>Clear</button></div><div className="tutor-suggestions"><button onClick={() => sendTutorMessage("Explain this algorithm puzzle simply.")}>Explain this</button><button onClick={() => sendTutorMessage("Give me a small hint without telling me the full order.")}>Give a hint</button></div><div className="chat-window">{!chatHistory.length && <div className="tutor-welcome"><b>Hi! I can help with this algorithm.</b><p>Ask for a concept explanation or a hint about the next step.</p></div>}{chatHistory.map((m: any, i: number) => <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>)}{chatLoading && <div className="chat-bubble assistant typing"><span /><span /><span /></div>}</div><div className="chat-composer"><input placeholder="Ask your algorithm tutor..." value={chatInput} onChange={(e: any) => setChatInput(e.target.value)} onKeyDown={(e: any) => { if (e.key === "Enter") sendTutorMessage(); }} /><button onClick={() => sendTutorMessage()} disabled={chatLoading || !chatInput.trim()}>SEND</button></div></aside></div></main>;
}

function Play({ room, language, level, question, theme, teamRoom, teamState, api, onBack, onSolved, onTeamState }: { room: Room; language: string; level: number; question: Question; theme: any; teamRoom: string; teamState: TeamState | null; api: any; onBack: () => void; onSolved: (p: Progress) => void; onTeamState: (s: TeamState) => void }) {
  const [code, setCode] = useState(question.starterCode || "");
  const [arranged, setArranged] = useState<string[]>(room === "algorithm" ? [] : shuffle(question.steps || []));
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [start] = useState(Date.now());
  const [doorUnlocked, setDoorUnlocked] = useState(teamState?.solved || false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStars, setCelebrationStars] = useState(3);
  const [celebrationMessage, setCelebrationMessage] = useState("Amazing work, superstar!");

  useEffect(() => {
    setCode(teamState?.codeText || question.starterCode || "");
    setEditing(false);
    setArranged(room === "algorithm" ? [] : shuffle(question.steps || []));
    setResult("");
    setDoorUnlocked(teamState?.solved || false);
    setShowCelebration(false);
    setChatHistory([]);
    setChatInput("");
  }, [question, level]);

  useEffect(() => {
    if (room === "team" && teamState && !editing && teamState.codeText !== undefined) {
      setCode(teamState.codeText || question.starterCode || "");
    }
  }, [teamState?.codeText]);

  useEffect(() => {
    if (teamState?.solved) setDoorUnlocked(true);
  }, [teamState?.solved]);

  async function run() {
    setRunning(true);
    setResult("");
    try {
      if (room === "algorithm") {
        const ok = JSON.stringify(arranged) === JSON.stringify(question.steps || []);
        if (!ok) {
          setAttempts(a => a + 1);
          setResult("❌ The seal rejects this order. Look for the step that must happen before the next one.");
          return;
        }
      } else {
        const d = await api("/judge/run", {
          method: "POST",
          body: JSON.stringify({ code, expected_output: question.expectedOutput, language })
        });
        if (!d.passed) {
          setAttempts(a => a + 1);
          setResult(`❌ The door stays locked.\n\nGot:\n${d.output}\n\nExpected:\n${d.expected}`);
          return;
        }
      }

      const score = Math.max(40, 100 - attempts * 10 - hints * 5);
      const stars = attempts === 0 ? 3 : attempts <= 2 ? 2 : 1;

      if (room === "team") {
        const next = level + 1;
        await api(`/team/${teamRoom}`, {
          method: "PATCH",
          body: JSON.stringify({ codeText: code, solved: true, level: next })
        });
        const s = await api(`/team/${teamRoom}`);
        onTeamState(s);
        setDoorUnlocked(true);
        setResult("DOOR UNLOCKED — your team escaped this chamber.");
        setCelebrationStars(3); setCelebrationMessage(["Teamwork magic! You escaped together!", "Super team! Your brains are unstoppable!", "High-five, CodeBreakers!"][level % 3]); setShowCelebration(true);
      } else {
        await api("/progress/submit", {
          method: "POST",
          body: JSON.stringify({ roomType: room, language, level, score, stars, attempts, hintsUsed: hints, timeSeconds: Math.round((Date.now() - start) / 1000) })
        });
        onSolved({ roomType: room, language, level, score, stars, attempts, hintsUsed: hints, timeSeconds: Math.round((Date.now() - start) / 1000) });
        setDoorUnlocked(true);
        setResult("DOOR UNLOCKED — click the door to enter the next chamber.");
        setCelebrationStars(stars); setCelebrationMessage(stars === 3 ? ["WOW! You are a coding superstar!", "Perfect sparkle! You nailed it!", "Brilliant! Three-star genius!"][level % 3] : stars === 2 ? ["Great job! Keep that sparkle going!", "You did it! Every try makes you stronger!", "Awesome work, little problem-solver!"][level % 3] : "You did it! Keep learning and shining!"); setShowCelebration(true);
      }
    } catch (e: any) {
      setResult(`⚠️ ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  async function hint() {
    setHints(h => h + 1);
    try {
      const d = await api("/ai/hint", {
        method: "POST",
        body: JSON.stringify({ prompt: question.prompt, question: question.title, code, level, roomType: room, language })
      });
      setChatHistory(h => [...h, { role: "assistant", content: `💡 Hint: ${d.answer}` }]);
    } catch {
      setChatHistory(h => [...h, { role: "assistant", content: "💡 Trace the program one step at a time. What must happen first?" }]);
    }
  }

  async function sendTutorMessage(message = chatInput) {
    const userMessage = message.trim();
    if (!userMessage || chatLoading) return;

    const nextHistory = [...chatHistory, { role: "user", content: userMessage }];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const d = await api("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage,
          history: nextHistory,
          question: `${question.title}: ${question.prompt}${room === "algorithm" ? `\nAlgorithm steps: ${(question.steps || []).join(" | ")}\nCurrent order: ${arranged.join(" | ")}` : ""}`,
          code: room === "algorithm" ? arranged.join("\n") : code,
          roomType: room,
          level,
          language,
          output: result
        })
      });
      setChatHistory(h => [...h, { role: "assistant", content: d.answer }]);
    } catch (e: any) {
      setChatHistory(h => [...h, { role: "assistant", content: `I couldn't reach the tutor right now. ${e.message || "Try again in a moment."}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function share() {
    if (room === "team" && teamRoom) {
      try {
        const s = await api(`/team/${teamRoom}`, { method: "PATCH", body: JSON.stringify({ codeText: code }) });
        onTeamState(s);
        setEditing(false);
        setChatHistory(h => [...h, { role: "assistant", content: "🤝 Your latest code is shared with everyone in the room." }]);
      } catch {}
    }
  }

  if (room === "algorithm") {
    return <><AlgorithmTemple question={question} theme={theme} level={level} arranged={arranged} setArranged={setArranged} run={run} result={result} running={running} hints={hints} getHint={hint} onDoor={onBack} onBack={onBack} chatHistory={chatHistory} chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading} sendTutorMessage={sendTutorMessage} clearTutor={() => setChatHistory([])} />{showCelebration && <StarCelebration stars={celebrationStars} message={celebrationMessage} onContinue={() => setShowCelebration(false)} />}</>;
  }

  const roomMeta: Record<string, { emoji: string; title: string; subtitle: string }> = {
    debug: { emoji: "🔧", title: "REPAIR BAY", subtitle: "Find the fault. Restart the machine." },
    vault: { emoji: "🔐", title: "SECURITY VAULT", subtitle: "Reconstruct the program before the lock resets." },
    team: { emoji: "🤝", title: "CO-OP ESCAPE ROOM", subtitle: "Two explorers. One shared console. One exit." }
  };
  const meta = roomMeta[room] || roomMeta.vault;

  return <main className="play-page">
    <div className="play-header">
      <button className="back" onClick={onBack}>← EXIT CHAMBER</button>
      <div><b>{rooms.find(r => r.id === room)?.title}</b> · Chamber {String(level).padStart(2, "0")}</div>
      <div>{room === "team" ? `ROOM ${teamRoom}` : `Attempts: ${attempts} · Hints: ${hints}`}</div>
    </div>

    <div className="kid-stage-tip play-tip">🌟 You can do it! Try, learn, and keep your explorer streak going. 🧸</div>
    {room === "team" && <div className="team-status" style={{ borderColor: theme.accent }}>
      <b>👥 TEAM ESCAPE ROOM · {teamRoom}</b>
      <span>{teamState?.members?.map(m => m.email).join(" · ")}</span>
    </div>}

    <div className="immersive-scene" aria-hidden="true">
      <div className="scene-light scene-light-one" />
      <div className="scene-light scene-light-two" />
      <div className="scene-window"><span>CHAMBER {String(level).padStart(2, "0")}</span></div>
      <div className="scene-monitor"><div className="monitor-screen">{meta.emoji} SYSTEM ONLINE<br/><small>{meta.title}</small></div></div>
      <div className="scene-console-glow" />
      <div className={`scene-door ${doorUnlocked ? "open" : "locked"}`}><div className="scene-door-panel"><span>{doorUnlocked ? "EXIT" : "LOCKED"}</span></div></div>
      <div className="scene-particle p1" /><div className="scene-particle p2" /><div className="scene-particle p3" /><div className="scene-particle p4" />
      <div className="scene-caption"><b>{meta.emoji} {meta.title}</b><span>{meta.subtitle}</span></div>
    </div>

    <div className="play-grid">
      <section className="challenge" style={{ borderColor: theme.accent }}>
        <div className="eyebrow">{question.title}</div>
        <h2>{question.prompt}</h2>
        {room === "debug" && <div className="debug-instructions"><b>🐛 DEBUGGING CHALLENGE</b><span>The starter program contains a bug. Run it, find the problem, and repair the existing code. You pass this level only when the repaired program produces the required output.</span></div>}
        {room === "vault" && <div className="vault-instructions"><b>🔐 CODE VAULT</b><span>Build or complete the program to satisfy the challenge. Use the starter code as your starting point.</span></div>}
        {room === "team" && <div className="co-op-banner">Both explorers see this shared code. Discuss the puzzle, edit the program, <b>share</b> it, then one teammate activates the door.</div>}
        <textarea
          value={code}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          data-gramm="false"
          onChange={e => { setCode(e.target.value); if (room === "team") setEditing(true); }}
          aria-label="Code editor"
        />
        {room === "team" && <button className="share-button" onClick={share}>💾 SHARE CODE WITH TEAM</button>}
        <div className="actions">
          <button className="primary" style={{ background: theme.accent }} disabled={running} onClick={run}>{running ? "RUNNING..." : "RUN CODE"}</button>
          <button onClick={hint}>💡 HINT</button>
        </div>
        {result && <pre className={result.startsWith("DOOR UNLOCKED") ? "success" : "result"}>{result}</pre>}
        {doorUnlocked && <button className="escape-door" onClick={onBack}>🚪 NEXT CHAMBER →</button>}
      </section>

      <aside className="side">
        <div className="panel tutor-panel">
          <div className="tutor-heading"><div><h3>🤖 Concept Tutor</h3><span>Ask naturally — follow-up questions work too.</span></div><button className="clear-chat" onClick={() => setChatHistory([])}>Clear</button></div>
          <div className="tutor-suggestions">
            <button onClick={() => sendTutorMessage("Explain the main concept in this chamber simply.")}>Explain this</button>
            <button onClick={() => sendTutorMessage("Give me a small example before I try.")}>Tiny example</button>
            <button onClick={() => sendTutorMessage("Look at my code and tell me what I should inspect first, without giving the answer.")}>Check my code</button>
          </div>
          <div className="chat-window">
            {!chatHistory.length && <div className="tutor-welcome"><b>Hi! I’m your coding tutor.</b><p>Ask me why something works, what a concept means, or what your code is doing. I’ll guide you step by step.</p></div>}
            {chatHistory.map((m:any, i:number) => <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>)}
            {chatLoading && <div className="chat-bubble assistant typing"><span /> <span /> <span /></div>}
          </div>
          <div className="chat-composer">
            <input placeholder="Ask your tutor anything..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendTutorMessage(); }} />
            <button onClick={() => sendTutorMessage()} disabled={chatLoading || !chatInput.trim()}>SEND</button>
          </div>
        </div>
        <div className="panel">
          <h3>💡 Guided Hint</h3>
          <p>Hints reveal the next idea, not the final code.</p>
          <button onClick={hint}>GET GUIDED HINT</button>
        </div>
      </aside>
    </div>
    {showCelebration && <StarCelebration stars={celebrationStars} message={celebrationMessage} onContinue={() => setShowCelebration(false)} />}
  </main>;
}


function StarCelebration({ stars, message, onContinue }: { stars: number; message: string; onContinue: () => void }) {
  return <div className="star-celebration-backdrop" role="dialog" aria-modal="true" aria-label="Level complete celebration">
    <div className="star-celebration-card">
      <div className="celebration-confetti" aria-hidden="true">🎉 ✨ 🎈 🌈 ✨ 🎉</div>
      <div className="celebration-cup">🏆</div>
      <div className="celebration-eyebrow">LEVEL COMPLETE!</div>
      <h2>You did it!</h2>
      <div className="popping-stars" aria-label={`${stars} stars earned`}>{[1,2,3].map(n => <span key={n} className={n <= stars ? "earned-star" : "empty-star"} style={{ animationDelay: `${n * 180}ms` }}>{n <= stars ? "⭐" : "☆"}</span>)}</div>
      <p className="praise-line">{message}</p>
      <div className="celebration-reward">🌟 {stars} stars added to your collection 🌟</div>
      <button className="celebration-continue" onClick={onContinue}>YAY! LET'S GO! 🚀</button>
      <div className="celebration-footnote">Every bug you fix makes you a stronger coder 💖</div>
    </div>
  </div>;
}

function shuffle<T>(a: T[]) { return [...a].sort(() => Math.random() - 0.5); }
export default App;
