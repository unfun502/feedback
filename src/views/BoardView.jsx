import { useTheme } from '../theme';
import { BODY, HEADING } from '../utils';
import DashboardStats from '../components/DashboardStats';
import FilterBar from '../components/FilterBar';
import FeedbackCard from '../components/FeedbackCard';

function BoardView({ posts, apps, filters, loading, error, upvotedPosts, onFilterChange, onNewPost, onSelectPost, onUpvote, onRetry }) {
  const { t } = useTheme();

  return (
    <>
      <DashboardStats posts={posts} />
      <FilterBar filters={filters} onFilterChange={onFilterChange} onNewPost={onNewPost} />

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{
              background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
              padding: 18, height: 180, animation: "fadeIn 0.3s ease",
            }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 44, height: 60, borderRadius: 12, background: t.bgAlt }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, width: "40%", background: t.bgAlt, borderRadius: 6, marginBottom: 10 }} />
                  <div style={{ height: 16, width: "80%", background: t.bgAlt, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 12, width: "100%", background: t.bgAlt, borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ height: 12, width: "60%", background: t.bgAlt, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
        }}>
          <div style={{ fontFamily: HEADING, fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontFamily: BODY, fontSize: 14, color: t.textMuted, marginBottom: 16 }}>
            {error}
          </div>
          <button onClick={onRetry} style={{
            fontFamily: BODY, fontSize: 13, fontWeight: 600, padding: "8px 20px",
            border: `1px solid ${t.border}`, borderRadius: 10,
            background: t.btnSecondaryBg, color: t.text, cursor: "pointer",
            transition: "all 0.2s ease",
          }}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {[...posts].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map((post, i) => (
            <div key={post.id} style={{ animation: `cardIn 0.4s ease ${i * 0.04}s both` }}>
              <FeedbackCard
                post={post}
                apps={apps}
                voted={upvotedPosts?.has(post.id)}
                onSelect={onSelectPost}
                onUpvote={onUpvote}
              />
            </div>
          ))}
          {posts.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", fontFamily: BODY, fontSize: 14, color: t.textMuted }}>
              No feedback found. Be the first to share your thoughts!
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default BoardView;
