import { useState } from "react";
import { supabase } from "../supabase";
import { colors, font, radius } from "../styles/theme";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Account created! You can now log in.");
    }
    setLoading(false);
  }

  const inputStyle = {
    width: "100%",
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "10px 14px",
    color: colors.text,
    fontSize: "14px",
    outline: "none",
    fontFamily: font.sans,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: font.sans,
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "28px",
            fontWeight: "700",
            color: colors.orange,
            letterSpacing: "-0.5px",
            marginBottom: "4px",
          }}>
            DSA Tracker
          </div>
          <div style={{ fontSize: "13px", color: colors.textMuted }}>
            Track. Revise. Master.
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: colors.bgSecondary,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          padding: "28px",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            marginBottom: "24px",
            borderBottom: `1px solid ${colors.border}`,
          }}>
            {["Login", "Sign Up"].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError(""); setMessage(""); }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${isLogin === (i === 0) ? colors.orange : "transparent"}`,
                  color: isLogin === (i === 0) ? colors.orange : colors.textMuted,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: "-1px",
                }}>{tab}</button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", color: colors.textSecondary, display: "block", marginBottom: "6px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: colors.textSecondary, display: "block", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && <p style={{ color: colors.hard, fontSize: "13px", margin: 0 }}>{error}</p>}
            {message && <p style={{ color: colors.easy, fontSize: "13px", margin: 0 }}>{message}</p>}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: "100%",
              padding: "11px",
              background: loading ? colors.bgTertiary : colors.orange,
              border: "none",
              borderRadius: radius.md,
              color: loading ? colors.textMuted : "#1a1a1a",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginTop: "4px",
            }}>
              {loading ? "Please wait…" : isLogin ? "Login" : "Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}