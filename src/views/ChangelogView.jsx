import { useTheme } from '../theme';
import { HEADING, BODY, NUM } from '../utils';
import { STATUS_COLORS } from '../constants';
import TypeBadge from '../components/TypeBadge';

function ChangelogView({ posts, apps, loading }) {
  const { t } = useTheme();

  if (loading) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ position: "relative", paddingLeft: 32 }}>
          <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: t.border, borderRadius: 1 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 28, position: "relative" }}>
              <div style={{
                position: "absolute", left: -28, top: 6,
                width: 12, height: 12, borderRadius: "50%",
                background: t.bgAlt, border: `3px solid ${t.bg}`,
              }} />
              <div style={{ height: 12, width: 120, background: t.bgAlt, borderRadius: 6, marginBottom: 6 }} />
              <div style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
                padding: 18, height: 100,
              }}>
                <div style={{ height: 12, width: "50%", background: t.bgAlt, borderRadius: 6, marginBottom: 10 }} />
                <div style={{ height: 16, width: "70%", background: t.bgAlt, borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 12, width: "90%", background: t.bgAlt, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Posts from getChangelog() are already filtered for done status and sorted by completed_at
  const completed = posts.filter((p) => p.status === "done" && p.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  return (
    <div style={{ maxWidth: 640 }}>
      {completed.length === 0 ? (
        <div style={{ fontFamily: BODY, fontSize: 14, color: t.textMuted, textAlign: "center", padding: "60px 20px" }}>No completed items yet.</div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 32 }}>
          <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: t.border, borderRadius: 1 }} />
          {completed.map((post) => {
            const app = apps.find((a) => a.id === post.app_id);
            return (
              <div key={post.id} style={{ marginBottom: 28, position: "relative" }}>
                <div style={{
                  position: "absolute", left: -28, top: 6,
                  width: 12, height: 12, borderRadius: "50%",
                  background: STATUS_COLORS.done, border: `3px solid ${t.bg}`,
                }} />
                <div style={{ fontFamily: NUM, fontSize: 12, color: t.textFaint, marginBottom: 6 }}>
                  {new Date(post.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18, boxShadow: t.shadowCard }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                    <TypeBadge type={post.type} />
                    {app && (
                      <span style={{ fontFamily: BODY, fontSize: 11, color: app.accent, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>{app.emoji} {app.name}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: HEADING, fontSize: 16, fontWeight: 600, color: t.text, lineHeight: 1.35, marginBottom: 6 }}>{post.title}</div>
                  <div style={{ fontFamily: BODY, fontSize: 13, color: t.textSecondary, lineHeight: 1.5 }}>{post.body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChangelogView;
