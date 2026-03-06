import { useTheme } from '../theme';
import { BODY } from '../utils';
import DashboardStats from '../components/DashboardStats';
import FilterBar from '../components/FilterBar';
import FeedbackCard from '../components/FeedbackCard';

function BoardView({ posts, filters, onFilterChange, onNewPost, onSelectPost }) {
  const { t } = useTheme();

  return (
    <>
      <DashboardStats posts={posts} />
      <FilterBar filters={filters} onFilterChange={onFilterChange} onNewPost={onNewPost} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {posts.map((post, i) => (
          <div key={post.id} style={{ animation: `cardIn 0.4s ease ${i * 0.04}s both` }}>
            <FeedbackCard post={post} onSelect={onSelectPost} />
          </div>
        ))}
        {posts.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", fontFamily: BODY, fontSize: 14, color: t.textMuted }}>
            No feedback found matching your filters.
          </div>
        )}
      </div>
    </>
  );
}

export default BoardView;
