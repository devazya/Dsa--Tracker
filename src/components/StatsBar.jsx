import { colors, font, radius } from "../styles/theme";
import { DIFFICULTIES, daysUntil } from "../utils/helpers";

const DIFF_COLORS = {
  Easy: colors.easy,
  Medium: colors.medium,
  Hard: colors.hard,
};

export default function StatsBar({ problems }) {
  const total = problems.length;
  const solved = problems.filter(p => p.status === "Solved").length;
  const attempted = problems.filter(p => p.status === "Attempted").length;
  const due = problems.filter(p => p.next_review && daysUntil(p.next_review) <= 1).length;
  const solvedPct = total ? Math.round((solved / total) * 100) : 0;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "1px",
      background: colors.border,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      overflow: "hidden",
      marginBottom: "20px",
    }}>
      {[
        { label: "Total", value: total, color: colors.text },
        { label: "Solved", value: solved, color: colors.easy },
        { label: "Attempted", value: attempted, color: colors.medium },
        { label: "Due Review", value: due, color: colors.orange },
        { label: "Progress", value: `${solvedPct}%`, color: colors.orange },
        ...DIFFICULTIES.map(d => ({
          label: d,
          value: problems.filter(p => p.difficulty === d).length,
          color: DIFF_COLORS[d],
        })),
      ].map((item, i) => (
        <div key={i} style={{
          background: colors.bgSecondary,
          padding: "16px 12px",
          textAlign: "center",
        }}>
          <div style={{
            fontSize: "22px",
            fontWeight: "700",
            color: item.color,
            fontFamily: font.mono,
            lineHeight: 1,
          }}>{item.value}</div>
          <div style={{
            fontSize: "11px",
            color: colors.textMuted,
            marginTop: "5px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}