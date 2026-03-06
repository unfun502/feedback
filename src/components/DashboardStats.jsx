import { useTheme } from '../theme';
import { NUM, BODY } from '../utils';
import { TYPE_COLORS, STATUS_COLORS } from '../constants';

function DashboardStats({ posts }) {
  const { t } = useTheme();
  const stats = [
    { label: "Total", value: posts.length, color: t.text },
    { label: "Bugs", value: posts.filter((p) => p.type === "bug").length, color: TYPE_COLORS.bug },
    { label: "Features", value: posts.filter((p) => p.type === "feature").length, color: TYPE_COLORS.feature },
    { label: "New", value: posts.filter((p) => p.status === "new").length, color: STATUS_COLORS.new },
    { label: "Top Votes", value: posts.reduce((max, p) => Math.max(max, p.upvote_count), 0), color: "#f59e0b" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          background: t.statsBg, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: "14px 20px", flex: "1 1 120px", minWidth: 120,
          boxShadow: t.shadowCard,
        }}>
          <div style={{ fontFamily: NUM, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
          <div style={{ fontFamily: BODY, fontSize: 12, color: t.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
