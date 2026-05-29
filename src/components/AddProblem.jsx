import { useState, useEffect } from "react";
import { colors, font, radius } from "../styles/theme";
import { DIFFICULTIES, TOPICS, STATUSES, extractSlug, slugToTitle } from "../utils/helpers";

export default function AddProblem({ onAdd, onClose }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topic, setTopic] = useState("Array");
  const [status, setStatus] = useState("Not Started");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const slug = extractSlug(url);
    if (slug) setTitle(slugToTitle(slug));
  }, [url]);

  function handleAdd() {
    if (!url.trim()) { setError("Please enter a LeetCode URL"); return; }
    const slug = extractSlug(url);
    if (!slug) { setError("Invalid LeetCode URL"); return; }
    onAdd({ url: url.trim(), slug, title: title || slugToTitle(slug), difficulty, topic, status, notes });
    onClose();
  }

  const inputStyle = {
    width: "100%",
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "9px 12px",
    color: colors.text,
    fontSize: "13px",
    outline: "none",
    fontFamily: font.sans,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontSize: "11px",
    color: colors.textMuted,
    display: "block",
    marginBottom: "5px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.lg,
        padding: "24px",
        maxWidth: "480px", width: "100%",
        fontFamily: font.sans,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: colors.text }}>
            Add Problem
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: colors.textMuted,
            fontSize: "18px", cursor: "pointer", padding: "2px 6px",
          }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* URL */}
          <div>
            <label style={labelStyle}>LeetCode URL *</label>
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); setError(""); }}
              placeholder="https://leetcode.com/problems/two-sum/"
              style={{ ...inputStyle, borderColor: error ? colors.hard : colors.border }}
            />
            {error && <p style={{ color: colors.hard, fontSize: "12px", margin: "4px 0 0" }}>{error}</p>}
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Auto-filled from URL"
              style={inputStyle}
            />
          </div>

          {/* Difficulty + Topic */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Topic</label>
              <select value={topic} onChange={e => setTopic(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: "5px 12px", borderRadius: radius.sm, fontSize: "12px",
                  cursor: "pointer", fontFamily: font.sans, transition: "all 0.15s",
                  border: `1px solid ${status === s ? colors.orange : colors.border}`,
                  background: status === s ? colors.orangeDim : "transparent",
                  color: status === s ? colors.orange : colors.textMuted,
                  fontWeight: status === s ? "600" : "400",
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Key insights, approach, edge cases…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: radius.md,
            border: `1px solid ${colors.border}`, background: "transparent",
            color: colors.textMuted, cursor: "pointer", fontSize: "13px",
          }}>Cancel</button>
          <button onClick={handleAdd} style={{
            flex: 2, padding: "10px", borderRadius: radius.md,
            border: "none", background: colors.orange,
            color: "#1a1a1a", cursor: "pointer", fontSize: "13px",
            fontWeight: "700",
          }}>Add Problem</button>
        </div>
      </div>
    </div>
  );
}