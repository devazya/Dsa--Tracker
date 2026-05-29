import { useState, useEffect, useRef } from "react";
import { colors, font, radius } from "../styles/theme";

export default function AIPanel({ problems, apiKey, onClose }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { fetchAnalysis(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function callGroq(msgs) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: msgs,
        temperature: 0.7,
        max_tokens: 1000,
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async function fetchAnalysis() {
    if (!apiKey) { setError("No API key found. Please add it in Groq API Key settings."); setLoading(false); return; }
    if (problems.length === 0) { setError("Add some problems first!"); setLoading(false); return; }
    try {
      const summary = problems.map(p =>
        `- "${p.title}" (${p.difficulty}, ${p.topic}): Status=${p.status}, Attempts=${p.attempts || 0}`
      ).join("\n");

      const text = await callGroq([{
        role: "user",
        content: `You are a DSA coaching assistant. Analyze this LeetCode practice log.

Problems:
${summary}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "overallScore": <number 0-100>,
  "weakTopics": [<string>],
  "strongTopics": [<string>],
  "urgentReviews": [{"title": <string>, "reason": <string>}],
  "suggestions": [{"type": "Revise"|"Practice"|"Master", "problem": <string>, "reason": <string>}],
  "nextSessionPlan": <string>
}`
      }]);

      const clean = text.replace(/```json|```/g, "").trim();
      setAnalysis(JSON.parse(clean));

      // Seed chat with context
      setMessages([{
        role: "assistant",
        content: "Hi! I've analyzed your problems above. Ask me anything — I can suggest problems, explain solutions, or help you prep for interviews! 🚀"
      }]);
    } catch (e) {
      setError("Could not load AI analysis. Check your Groq API key.");
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);

    try {
      const summary = problems.map(p =>
        `- "${p.title}" (${p.difficulty}, ${p.topic}): Status=${p.status}, Attempts=${p.attempts || 0}`
      ).join("\n");

      const systemPrompt = {
        role: "system",
        content: `You are an expert DSA tutor and coding interview coach. The user is tracking these LeetCode problems:\n${summary}\n\nYou can:
- Suggest random or specific problems to practice
- Explain solutions with code examples
- Analyze their weak areas
- Give study plans
- Answer any DSA/algorithm questions
Keep responses concise and practical. Use markdown for code blocks.`
      };

      const response = await callGroq([systemPrompt, ...newMessages]);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    }
    setChatLoading(false);
  }

  const typeColors = { Revise: colors.review, Practice: colors.blue, Master: colors.easy };

  const quickPrompts = [
    "Give me a random Hard problem",
    "What should I practice today?",
    "Explain Two Sum solution",
    "My weakest topic?",
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: font.sans,
    }}>
      <div style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        width: "100%", maxWidth: "680px",
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 24px", borderBottom: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: "11px", color: colors.orange, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>AI Coach</div>
            <h2 style={{ margin: 0, fontSize: "18px", color: colors.text, fontWeight: "600" }}>Progress Analysis & Chat</h2>
          </div>
          <button onClick={onClose} style={{
            background: colors.bgTertiary, border: `1px solid ${colors.border}`,
            color: colors.textMuted, borderRadius: radius.sm,
            padding: "6px 12px", cursor: "pointer", fontSize: "13px",
          }}>Close</button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{
                width: "36px", height: "36px",
                border: `3px solid ${colors.border}`,
                borderTop: `3px solid ${colors.orange}`,
                borderRadius: "50%", animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }} />
              <p style={{ color: colors.textMuted, fontSize: "13px" }}>Analyzing your patterns…</p>
            </div>
          )}

          {error && <p style={{ color: colors.hard, textAlign: "center", padding: "32px 0" }}>{error}</p>}

          {/* Analysis */}
          {analysis && !loading && (
            <>
              {/* Score */}
              <div style={{
                display: "flex", alignItems: "center", gap: "20px",
                background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: radius.md, padding: "16px",
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke={colors.bgTertiary} strokeWidth="5" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke={colors.orange} strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 30}`}
                      strokeDashoffset={`${2 * Math.PI * 30 * (1 - analysis.overallScore / 100)}`}
                      strokeLinecap="round" transform="rotate(-90 36 36)" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: colors.orange, fontFamily: font.mono }}>{analysis.overallScore}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "6px" }}>Overall Score</div>
                  <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                    Strong: <span style={{ color: colors.easy }}>{analysis.strongTopics?.join(", ") || "—"}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: colors.textSecondary, marginTop: "3px" }}>
                    Weak: <span style={{ color: colors.hard }}>{analysis.weakTopics?.join(", ") || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Urgent Reviews */}
              {analysis.urgentReviews?.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: colors.orange, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>⚡ Urgent Reviews</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {analysis.urgentReviews.map((r, i) => (
                      <div key={i} style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        borderLeft: `3px solid ${colors.orange}`,
                        borderRadius: radius.sm, padding: "10px 14px",
                      }}>
                        <span style={{ color: colors.text, fontWeight: "600", fontSize: "13px" }}>{r.title}</span>
                        <span style={{ color: colors.textMuted, fontSize: "12px" }}> — {r.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", color: colors.blue, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>💡 Suggestions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {analysis.suggestions.map((s, i) => (
                      <div key={i} style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        borderRadius: radius.sm, padding: "10px 14px",
                        display: "flex", gap: "10px", alignItems: "flex-start",
                      }}>
                        <span style={{
                          background: (typeColors[s.type] || colors.blue) + "18",
                          color: typeColors[s.type] || colors.blue,
                          fontSize: "10px", fontWeight: "700", letterSpacing: "1px",
                          padding: "2px 7px", borderRadius: radius.sm, flexShrink: 0,
                          textTransform: "uppercase", marginTop: "1px",
                        }}>{s.type}</span>
                        <div>
                          <div style={{ color: colors.text, fontSize: "13px", fontWeight: "600" }}>{s.problem}</div>
                          <div style={{ color: colors.textMuted, fontSize: "12px", marginTop: "2px" }}>{s.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Session */}
              {analysis.nextSessionPlan && (
                <div style={{
                  background: colors.bg, border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${colors.easy}`,
                  borderRadius: radius.sm, padding: "14px 16px",
                }}>
                  <div style={{ fontSize: "11px", color: colors.easy, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>📋 Next Session Plan</div>
                  <p style={{ color: colors.textSecondary, fontSize: "13px", lineHeight: "1.7", margin: 0 }}>{analysis.nextSessionPlan}</p>
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "16px" }}>
                <div style={{ fontSize: "11px", color: colors.textMuted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>💬 Chat with AI Tutor</div>

                {/* Quick prompts */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {quickPrompts.map((p, i) => (
                    <button key={i} onClick={() => setInput(p)} style={{
                      padding: "5px 10px", borderRadius: radius.sm, fontSize: "11px",
                      cursor: "pointer", border: `1px solid ${colors.border}`,
                      background: colors.bgTertiary, color: colors.textSecondary,
                      transition: "all 0.15s",
                    }}>{p}</button>
                  ))}
                </div>

                {/* Chat messages */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    }}>
                      <div style={{
                        maxWidth: "85%",
                        background: msg.role === "user" ? colors.orange : colors.bg,
                        color: msg.role === "user" ? "#1a1a1a" : colors.textSecondary,
                        padding: "10px 14px", borderRadius: radius.md,
                        fontSize: "13px", lineHeight: "1.6",
                        border: `1px solid ${msg.role === "user" ? colors.orange : colors.border}`,
                        whiteSpace: "pre-wrap",
                      }}>{msg.content}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        padding: "10px 14px", borderRadius: radius.md,
                        fontSize: "13px", color: colors.textMuted,
                      }}>Thinking…</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chat input — fixed at bottom */}
        {analysis && !loading && (
          <div style={{
            padding: "16px 24px", borderTop: `1px solid ${colors.border}`,
            display: "flex", gap: "8px", flexShrink: 0,
            background: colors.bgSecondary,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything — problems, solutions, study plan…"
              style={{
                flex: 1, background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md, padding: "9px 12px",
                color: colors.text, fontSize: "13px",
                outline: "none", fontFamily: font.sans,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={chatLoading}
              onMouseEnter={e => e.target.style.background = colors.orangeHover}
              onMouseLeave={e => e.target.style.background = colors.orange}
              style={{
                padding: "9px 18px", borderRadius: radius.md, border: "none",
                background: colors.orange, color: "#1a1a1a",
                cursor: chatLoading ? "not-allowed" : "pointer",
                fontSize: "13px", fontWeight: "700", transition: "all 0.2s",
              }}>Send</button>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}