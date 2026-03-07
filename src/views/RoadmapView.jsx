import { useTheme } from '../theme';
import { HEADING, BODY, NUM } from '../utils';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import TypeBadge from '../components/TypeBadge';

function RoadmapView({ posts, apps, loading }) {
  const { t } = useTheme();
  const columns = ["reviewing", "planned", "in_progress", "done"];

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 16, minHeight: 400 }}>
        {columns.map((status) => (
          <div key={status}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "0 4px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[status] }} />
              <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: t.text }}>{STATUS_LABELS[status]}</span>
            </div>
            <div style={{
              background: t.bgAlt, borderRadius: 14, padding: 10,
              minHeight: 200, border: `1px solid ${t.borderLight}`,
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {[1, 2].map((i) => (
                <div key={i} style={{
                  background: t.card, border: `1px solid ${t.border}`,
                  borderRadius: 12, padding: 14, height: 80,
                }}>
                  <div style={{ height: 14, width: "70%", background: t.bgAlt, borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ height: 10, width: "40%", background: t.bgAlt, borderRadius: 6 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 16, minHeight: 400 }}>
      {columns.map((status) => {
        const colPosts = posts.filter((p) => p.status === status).sort((a, b) => b.upvote_count - a.upvote_count);
        return (
          <div key={status}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "0 4px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[status] }} />
              <span style={{ fontFamily: BODY, fontSize: 13, fontWeight: 600, color: t.text, textTransform: "capitalize" }}>{STATUS_LABELS[status]}</span>
              <span style={{ fontFamily: NUM, fontSize: 12, color: t.textFaint }}>{colPosts.length}</span>
            </div>
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
              background: t.bgAlt, borderRadius: 14, padding: 10,
              minHeight: 200, border: `1px solid ${t.borderLight}`,
            }}>
              {colPosts.map((post) => {
                const app = apps.find((a) => a.id === post.app_id);
                return (
                  <div key={post.id} style={{
                    background: t.card, border: `1px solid ${t.border}`,
                    borderRadius: 12, padding: 14, boxShadow: t.shadowCard,
                  }}>
                    <div style={{ fontFamily: HEADING, fontSize: 14, fontWeight: 600, color: t.text, lineHeight: 1.35, marginBottom: 8 }}>{post.title}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <TypeBadge type={post.type} />
                      <span style={{ fontFamily: NUM, fontSize: 12, fontWeight: 600, color: t.textMuted, display: "flex", alignItems: "center", gap: 3 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                        {post.upvote_count}
                      </span>
                    </div>
                    {app && <div style={{ fontFamily: BODY, fontSize: 11, color: t.textFaint, marginTop: 8 }}>{app.emoji} {app.name}</div>}
                  </div>
                );
              })}
              {colPosts.length === 0 && (
                <div style={{ fontFamily: BODY, fontSize: 13, color: t.textFaint, textAlign: "center", padding: "40px 10px" }}>No items</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RoadmapView;
