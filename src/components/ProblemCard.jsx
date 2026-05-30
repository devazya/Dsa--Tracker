import { useState } from "react";
import { colors, font, radius } from "../styles/theme";
import { daysUntil, formatDate } from "../utils/helpers";

const DIFF_COLORS = {
  Easy: colors.easy,
  Medium: colors.medium,
  Hard: colors.hard,
};

const STATUS_COLORS = {
  "Not Started": colors.notStarted,
  "Attempted": colors.attempted,
  "Solved": colors.solved,
  "Review": colors.review,
};

const STATUSES = ["Not Started", "Attempted", "Solved", "Review"];

export default function ProblemCard({ problem, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  function cycleStatus() {
    const idx = STATUSES.indexOf(problem.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    onUpdate({ ...problem, status: next });
  }

  function markSolved() {
    const next = new Date();
    next.setDate(next.getDate() + 3);
    onUpdate({
      ...problem,
      status: "Solved",
      attempts: (problem.attempts || 0) + 1,
      last_solved: new Date().toISOString(),
      next_review: next.toISOString(),
    });
  }

  const reviewDays = problem.next_review ? daysUntil(problem.next_review) : null;
  const isOverdue = reviewDays !== null && reviewDays <= 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? colors.bgTertiary : colors.bgSecondary,
        border: `1px solid ${hovered ? colors.borderLight : colors.border}`,
        borderRadius: radius.md,
        transition: "all 0.15s",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          cursor: "pointer",
        }}
      >
        <div
          onClick={e => { e.stopPropagation(); cycleStatus(); }}
          title={`Status: ${problem.status} (click to cycle)`}
          style={{
            width: "8px", height: "8px",
            borderRadius: "50%",
            background: STATUS_COLORS[problem.status],
            flexShrink: 0,
            cursor: "pointer",
            boxShadow: `0 0 6px ${STATUS_COLORS[problem.status]}`,
          }}
        />

        
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: colors.text,
            fontFamily: font.sans,
            fontSize: "14px",
            fontWeight: "500",
            textDecoration: "none",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {problem.title}
        </a>

        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
          {isOverdue && (
            <span style={{
              fontSize: "11px", padding: "2px 7px", borderRadius: radius.sm,
              background: "rgba(255,161,22,0.15)", color: colors.orange, fontWeight: "600",
            }}>Due</span>
          )}
          {reviewDays !== null && reviewDays > 0 && (
            <span style={{
              fontSize: "11px", padding: "2px 7px", borderRadius: radius.sm,
              background: "rgba(168,85,247,0.1)", color: colors.review,
            }}>📅 {formatDate(problem.next_review)}</span>
          )}
          <span style={{
            fontSize: "11px", padding: "2px 7px", borderRadius: radius.sm,
            background: colors.bgTertiary, color: colors.textSecondary,
          }}>{problem.topic}</span>
          {problem.companies?.length > 0 && problem.companies.slice(0, 3).map((company, i) => (
  <span key={i} style={{
    fontSize: "11px", padding: "2px 7px", borderRadius: radius.sm,
    background: "rgba(59,130,246,0.1)", color: colors.blue,
    fontWeight: "600",
  }}>{company}</span>
))}
          <span style={{
            fontSize: "11px", fontWeight: "700",
            padding: "2px 8px", borderRadius: radius.sm,
            background: DIFF_COLORS[problem.difficulty] + "18",
            color: DIFF_COLORS[problem.difficulty],
          }}>{problem.difficulty}</span>
          <span style={{
            fontSize: "11px", padding: "2px 7px", borderRadius: radius.sm,
            background: STATUS_COLORS[problem.status] + "18",
            color: STATUS_COLORS[problem.status],
          }}>{problem.status}</span>
          <span style={{
            color: colors.textMuted, fontSize: "12px",
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s", display: "inline-block",
          }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: "12px 16px 16px",
          borderTop: `1px solid ${colors.border}`,
          background: colors.bg,
        }}>
          <div style={{ display: "flex", gap: "20px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: colors.textMuted }}>
              Attempts: <span style={{ color: colors.textSecondary }}>{problem.attempts || 0}</span>
            </span>
            <span style={{ fontSize: "12px", color: colors.textMuted }}>
              Added: <span style={{ color: colors.textSecondary }}>{formatDate(problem.added_at)}</span>
            </span>
            {problem.last_solved && (
              <span style={{ fontSize: "12px", color: colors.textMuted }}>
                Last Solved: <span style={{ color: colors.easy }}>{formatDate(problem.last_solved)}</span>
              </span>
            )}
          </div>

          {problem.notes && (
            <p style={{
              fontSize: "13px", color: colors.textSecondary,
              lineHeight: "1.6", margin: "0 0 12px",
              fontFamily: font.mono, background: colors.bgSecondary,
              padding: "10px 12px", borderRadius: radius.sm,
              borderLeft: `3px solid ${colors.orange}`,
            }}>{problem.notes}</p>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={e => { e.stopPropagation(); markSolved(); }} style={{
              padding: "6px 14px", borderRadius: radius.sm, fontSize: "12px",
              cursor: "pointer", border: `1px solid ${colors.easy}`,
              background: colors.easyDim, color: colors.easy,
              fontWeight: "600", transition: "all 0.2s",
            }}>✓ Mark Solved</button>
            <button onClick={e => { e.stopPropagation(); onDelete(problem.id); }} style={{
              padding: "6px 14px", borderRadius: radius.sm, fontSize: "12px",
              cursor: "pointer", border: `1px solid ${colors.border}`,
              background: "transparent", color: colors.textMuted,
              transition: "all 0.2s",
            }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}