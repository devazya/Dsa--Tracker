import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { colors, font, radius } from "../styles/theme";
import { DIFFICULTIES, TOPICS, STATUSES, daysUntil } from "../utils/helpers";
import StatsBar from "./StatsBar";
import ProblemCard from "./ProblemCard";
import AddProblem from "./AddProblem";
import AIPanel from "./AIPanel";

export default function Dashboard({ user }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importUsername, setImportUsername] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [filter, setFilter] = useState({ status: "All", difficulty: "All", topic: "All", search: "" });
  const [sortBy, setSortBy] = useState("added_at");

  useEffect(() => { fetchProblems(); fetchProfile(); }, []);

  async function fetchProblems() {
    setLoading(true);
    const { data } = await supabase
      .from("problems")
      .select("*")
      .order("added_at", { ascending: false });
    setProblems(data || []);
    setLoading(false);
  }

  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("gemini_api_key")
      .eq("id", user.id)
      .single();
    if (data?.gemini_api_key) {
      setSavedKey(data.gemini_api_key);
      setApiKey(data.gemini_api_key);
    }
  }

  async function saveApiKey() {
    await supabase.from("profiles").upsert({ id: user.id, gemini_api_key: apiKey });
    setSavedKey(apiKey);
    setShowSettings(false);
  }

  async function addProblem(p) {
    const { data } = await supabase.from("problems").insert([{
      ...p, user_id: user.id, attempts: 0,
      added_at: new Date().toISOString(),
    }]).select().single();
    if (data) setProblems(prev => [data, ...prev]);
  }

  async function updateProblem(p) {
    const { id, user_id, ...fields } = p;
    await supabase.from("problems").update(fields).eq("id", id);
    setProblems(prev => prev.map(x => x.id === id ? p : x));
  }

  async function deleteProblem(id) {
    await supabase.from("problems").delete().eq("id", id);
    setProblems(prev => prev.filter(x => x.id !== id));
  }

  async function importFromLeetCode() {
    if (!importUsername.trim()) { setImportError("Please enter your LeetCode username"); return; }
    setImportLoading(true);
    setImportError("");
    setImportSuccess("");
    try {
      const graphRes = await fetch("https://leetcode-api-fuk5.onrender.com/user/" + importUsername.trim());
      const graphData = await graphRes.json();
      const solvedProblems = graphData?.recentSubmissions || [];
      if (solvedProblems.length === 0) {
        setImportError("No submissions found. Check your username and try again.");
        setImportLoading(false);
        return;
      }
      const seen = new Set();
      let added = 0;
      for (const p of solvedProblems) {
        if (seen.has(p.titleSlug)) continue;
        seen.add(p.titleSlug);
        const exists = problems.find(x => x.slug === p.titleSlug);
        if (exists) continue;
        const { data: inserted } = await supabase.from("problems").insert([{
          user_id: user.id,
          url: `https://leetcode.com/problems/${p.titleSlug}/`,
          slug: p.titleSlug,
          title: p.title,
          difficulty: p.difficulty || "Medium",
          topic: "Array",
          status: p.statusDisplay === "Accepted" ? "Solved" : "Attempted",
          notes: "",
          attempts: 1,
          last_solved: new Date(p.timestamp * 1000).toISOString(),
          next_review: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          added_at: new Date().toISOString(),
        }]).select().single();
        if (inserted) { setProblems(prev => [inserted, ...prev]); added++; }
      }
      setImportSuccess(`✅ Successfully imported ${added} problems!`);
    } catch (e) {
      setImportError("Could not fetch LeetCode data. Try again.");
    }
    setImportLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const filtered = problems
    .filter(p => filter.status === "All" || p.status === filter.status)
    .filter(p => filter.difficulty === "All" || p.difficulty === filter.difficulty)
    .filter(p => filter.topic === "All" || p.topic === filter.topic)
    .filter(p => !filter.search || p.title.toLowerCase().includes(filter.search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "added_at") return new Date(b.added_at) - new Date(a.added_at);
      if (sortBy === "difficulty") return DIFFICULTIES.indexOf(b.difficulty) - DIFFICULTIES.indexOf(a.difficulty);
      if (sortBy === "next_review") return (a.next_review || "9") < (b.next_review || "9") ? -1 : 1;
      return 0;
    });

  const selStyle = {
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    padding: "6px 10px",
    color: colors.textSecondary,
    fontSize: "12px",
    cursor: "pointer",
    outline: "none",
    fontFamily: font.sans,
  };

  const btnHover = (e, bg, color) => { e.target.style.background = bg; if (color) e.target.style.color = color; };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: font.sans, color: colors.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${colors.bg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 2px; }
        select option { background: ${colors.bgSecondary}; }
        a:hover { color: ${colors.orange} !important; }
      `}</style>

      {/* Top Nav */}
      <div style={{
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.border}`,
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "50px", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: "700", color: colors.orange }}>DSA</span>
          <span style={{ fontSize: "18px", fontWeight: "700", color: colors.text }}>Tracker</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: colors.textMuted }}>{user.email}</span>
          <button
            onClick={() => setShowSettings(true)}
            onMouseEnter={e => btnHover(e, colors.border)}
            onMouseLeave={e => btnHover(e, colors.bgTertiary)}
            style={{
              background: colors.bgTertiary, border: `1px solid ${colors.border}`,
              color: colors.textSecondary, borderRadius: radius.sm,
              padding: "5px 12px", cursor: "pointer", fontSize: "12px", transition: "all 0.2s",
            }}>⚙ Groq API Key</button>
          <button
            onClick={signOut}
            onMouseEnter={e => btnHover(e, colors.bgTertiary)}
            onMouseLeave={e => btnHover(e, "transparent")}
            style={{
              background: "transparent", border: `1px solid ${colors.border}`,
              color: colors.textMuted, borderRadius: radius.sm,
              padding: "5px 12px", cursor: "pointer", fontSize: "12px", transition: "all 0.2s",
            }}>Sign Out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 20px" }}>

        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: colors.text }}>My Problems</h1>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: colors.textMuted }}>{problems.length} problems tracked</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowAI(true)}
              onMouseEnter={e => btnHover(e, colors.orange, "#1a1a1a")}
              onMouseLeave={e => btnHover(e, colors.orangeDim, colors.orange)}
              style={{
                padding: "8px 16px", borderRadius: radius.md, fontSize: "13px",
                cursor: "pointer", border: `1px solid ${colors.orange}`,
                background: colors.orangeDim, color: colors.orange,
                fontWeight: "600", transition: "all 0.2s",
              }}>✦ AI Analysis</button>
            <button
              onClick={() => setShowImport(true)}
              onMouseEnter={e => btnHover(e, colors.bgTertiary, colors.orange)}
              onMouseLeave={e => btnHover(e, "transparent", colors.textSecondary)}
              style={{
                padding: "8px 16px", borderRadius: radius.md, fontSize: "13px",
                cursor: "pointer", border: `1px solid ${colors.border}`,
                background: "transparent", color: colors.textSecondary,
                fontWeight: "600", transition: "all 0.2s",
              }}>⬇ Import LeetCode</button>
            <button
              onClick={() => setShowAdd(true)}
              onMouseEnter={e => btnHover(e, "#ffb84d")}
              onMouseLeave={e => btnHover(e, colors.orange)}
              style={{
                padding: "8px 16px", borderRadius: radius.md, fontSize: "13px",
                cursor: "pointer", border: "none",
                background: colors.orange, color: "#1a1a1a",
                fontWeight: "700", transition: "all 0.2s",
              }}>+ Add Problem</button>
          </div>
        </div>

        {/* Stats */}
        {problems.length > 0 && <StatsBar problems={problems} />}

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            placeholder="Search problems…"
            style={{
              flex: "1 1 160px", minWidth: "120px",
              background: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, padding: "6px 10px",
              color: colors.text, fontSize: "12px",
              outline: "none", fontFamily: font.sans,
            }}
          />
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={selStyle}>
            <option value="All">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filter.difficulty} onChange={e => setFilter(f => ({ ...f, difficulty: e.target.value }))} style={selStyle}>
            <option value="All">All Difficulty</option>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
          <select value={filter.topic} onChange={e => setFilter(f => ({ ...f, topic: e.target.value }))} style={selStyle}>
            <option value="All">All Topics</option>
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selStyle}>
            <option value="added_at">Recent</option>
            <option value="difficulty">Difficulty</option>
            <option value="next_review">Review Date</option>
          </select>
        </div>

        {/* Problem List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: colors.textMuted, fontSize: "13px" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            border: `1px dashed ${colors.border}`, borderRadius: radius.lg,
          }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{problems.length === 0 ? "📋" : "🔍"}</div>
            <p style={{ color: colors.textMuted, fontSize: "14px", margin: "0 0 16px" }}>
              {problems.length === 0 ? "No problems yet. Add your first LeetCode problem!" : "No problems match your filters."}
            </p>
            {problems.length === 0 && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setShowImport(true)} style={{
                  padding: "8px 20px", borderRadius: radius.md,
                  border: `1px solid ${colors.border}`, background: "transparent",
                  color: colors.textSecondary, cursor: "pointer", fontSize: "13px", fontWeight: "600",
                }}>⬇ Import from LeetCode</button>
                <button onClick={() => setShowAdd(true)} style={{
                  padding: "8px 20px", borderRadius: radius.md, border: "none",
                  background: colors.orange, color: "#1a1a1a",
                  cursor: "pointer", fontSize: "13px", fontWeight: "700",
                }}>+ Add Problem</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filtered.map(p => (
              <ProblemCard key={p.id} problem={p} onUpdate={updateProblem} onDelete={deleteProblem} />
            ))}
          </div>
        )}
      </div>

      {/* Groq API Key Modal */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg, padding: "24px", maxWidth: "460px", width: "100%",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: colors.text }}>Groq API Key</h3>
              <button onClick={() => setShowSettings(false)} style={{
                background: "none", border: "none", color: colors.textMuted, fontSize: "18px", cursor: "pointer",
              }}>×</button>
            </div>
            <div style={{
              background: colors.bg, border: `1px solid ${colors.orange}`,
              borderLeft: `3px solid ${colors.orange}`,
              borderRadius: radius.md, padding: "14px 16px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "12px", color: colors.orange, fontWeight: "700", marginBottom: "8px" }}>
                📋 How to get your free Groq API Key
              </div>
              <ol style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {["Go to console.groq.com", "Sign up / Log in with Google", 'Click "API Keys" in the sidebar', 'Click "Create API Key"', "Copy the key and paste it below"].map((step, i) => (
                  <li key={i} style={{ fontSize: "12px", color: colors.textSecondary }}>{step}</li>
                ))}
              </ol>
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{
                display: "inline-block", marginTop: "10px", fontSize: "12px",
                color: colors.orange, textDecoration: "none", fontWeight: "600",
              }}>→ Open Groq Console ↗</a>
            </div>
            <label style={{ fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Paste your Groq API Key
            </label>
            <input
              type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="gsk_..."
              style={{
                width: "100%", background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: radius.md, padding: "9px 12px", color: colors.text,
                fontSize: "13px", outline: "none", fontFamily: font.mono, boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: "11px", color: colors.textMuted, margin: "6px 0 0" }}>
              🔒 Your key is stored only in your account — never shared.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowSettings(false)} style={{
                flex: 1, padding: "9px", borderRadius: radius.md,
                border: `1px solid ${colors.border}`, background: "transparent",
                color: colors.textMuted, cursor: "pointer", fontSize: "13px",
              }}>Cancel</button>
              <button onClick={saveApiKey}
                onMouseEnter={e => btnHover(e, "#ffb84d")}
                onMouseLeave={e => btnHover(e, colors.orange)}
                style={{
                  flex: 2, padding: "9px", borderRadius: radius.md, border: "none",
                  background: colors.orange, color: "#1a1a1a",
                  cursor: "pointer", fontSize: "13px", fontWeight: "700", transition: "all 0.2s",
                }}>Save Key</button>
            </div>
          </div>
        </div>
      )}

      {/* Import LeetCode Modal */}
      {showImport && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div style={{
            background: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg, padding: "24px", maxWidth: "460px", width: "100%",
            fontFamily: font.sans,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: colors.text }}>Import from LeetCode</h3>
              <button onClick={() => { setShowImport(false); setImportError(""); setImportSuccess(""); }} style={{
                background: "none", border: "none", color: colors.textMuted, fontSize: "18px", cursor: "pointer",
              }}>×</button>
            </div>

            {/* Instructions */}
            <div style={{
              background: colors.bg, border: `1px solid ${colors.border}`,
              borderLeft: `3px solid ${colors.easy}`,
              borderRadius: radius.md, padding: "14px 16px", marginBottom: "16px",
            }}>
              <div style={{ fontSize: "12px", color: colors.easy, fontWeight: "700", marginBottom: "8px" }}>
                📋 How to find your LeetCode username
              </div>
              <ol style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  "Go to leetcode.com and log in",
                  "Click your profile picture (top right)",
                  "Your username is shown in the URL: leetcode.com/u/YOUR_USERNAME",
                  "Copy that username and paste it below",
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: "12px", color: colors.textSecondary }}>{step}</li>
                ))}
              </ol>
              <a href="https://leetcode.com" target="_blank" rel="noreferrer" style={{
                display: "inline-block", marginTop: "10px", fontSize: "12px",
                color: colors.easy, textDecoration: "none", fontWeight: "600",
              }}>→ Open LeetCode ↗</a>
            </div>

            <label style={{ fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              LeetCode Username
            </label>
            <input
              value={importUsername}
              onChange={e => { setImportUsername(e.target.value); setImportError(""); }}
              placeholder="e.g. neal_wu"
              onKeyDown={e => e.key === "Enter" && importFromLeetCode()}
              style={{
                width: "100%", background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: radius.md, padding: "9px 12px", color: colors.text,
                fontSize: "13px", outline: "none", fontFamily: font.mono,
                boxSizing: "border-box", marginBottom: "12px",
              }}
            />

            {importError && <p style={{ color: colors.hard, fontSize: "12px", margin: "0 0 12px" }}>{importError}</p>}
            {importSuccess && <p style={{ color: colors.easy, fontSize: "12px", margin: "0 0 12px" }}>{importSuccess}</p>}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowImport(false); setImportError(""); setImportSuccess(""); }} style={{
                flex: 1, padding: "9px", borderRadius: radius.md,
                border: `1px solid ${colors.border}`, background: "transparent",
                color: colors.textMuted, cursor: "pointer", fontSize: "13px",
              }}>Cancel</button>
              <button onClick={importFromLeetCode} disabled={importLoading}
                onMouseEnter={e => { if (!importLoading) btnHover(e, "#ffb84d"); }}
                onMouseLeave={e => { if (!importLoading) btnHover(e, colors.orange); }}
                style={{
                  flex: 2, padding: "9px", borderRadius: radius.md, border: "none",
                  background: importLoading ? colors.bgTertiary : colors.orange,
                  color: importLoading ? colors.textMuted : "#1a1a1a",
                  cursor: importLoading ? "not-allowed" : "pointer",
                  fontSize: "13px", fontWeight: "700", transition: "all 0.2s",
                }}>{importLoading ? "Importing…" : "Import Problems"}</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddProblem onAdd={addProblem} onClose={() => setShowAdd(false)} savedKey={savedKey} />}
      {showAI && <AIPanel problems={problems} apiKey={savedKey} onClose={() => setShowAI(false)} />}
    </div>
  );
}