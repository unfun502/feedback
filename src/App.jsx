import { useState, useCallback } from 'react';
import { ThemeProvider, useTheme } from './theme';
import { BODY } from './utils';
import { MOCK_POSTS } from './mockData';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PostModal from './components/PostModal';
import NewPostForm from './components/NewPostForm';
import BoardView from './views/BoardView';
import RoadmapView from './views/RoadmapView';
import ChangelogView from './views/ChangelogView';

function FeedbackApp() {
  const { t } = useTheme();
  const [selectedApp, setSelectedApp] = useState(null);
  const [view, setView] = useState("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [filters, setFilters] = useState({ search: "", type: "all", status: "all", sort: "newest" });

  const filteredPosts = MOCK_POSTS.filter((p) => {
    if (selectedApp && p.app_id !== selectedApp) return false;
    if (filters.type !== "all" && p.type !== filters.type) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!p.title.toLowerCase().includes(s) && !p.body?.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (filters.sort === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (filters.sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (filters.sort === "upvotes") return b.upvote_count - a.upvote_count;
    return 0;
  });

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: t.bg,
      fontFamily: BODY, transition: "background 0.4s ease, color 0.4s ease",
    }}>
      <Sidebar selectedApp={selectedApp} onSelectApp={setSelectedApp}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main style={{ flex: 1, padding: "32px 36px", maxWidth: 1100, overflow: "auto" }}>
        <Header view={view} onViewChange={setView} selectedApp={selectedApp} />

        {view === "board" && (
          <BoardView
            posts={filteredPosts}
            filters={filters}
            onFilterChange={setFilters}
            onNewPost={() => setShowNewPostForm(true)}
            onSelectPost={setSelectedPost}
          />
        )}

        {view === "roadmap" && <RoadmapView posts={selectedApp ? MOCK_POSTS.filter((p) => p.app_id === selectedApp) : MOCK_POSTS} />}
        {view === "changelog" && <ChangelogView posts={selectedApp ? MOCK_POSTS.filter((p) => p.app_id === selectedApp) : MOCK_POSTS} />}
      </main>

      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {showNewPostForm && (
        <NewPostForm selectedApp={selectedApp} onClose={() => setShowNewPostForm(false)}
          onSubmit={() => setShowNewPostForm(false)} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #78716c40; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #78716c80; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        input::placeholder, textarea::placeholder { color: #78716c; }
        select:focus, input:focus, textarea:focus { border-color: #a8a29e; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FeedbackApp />
    </ThemeProvider>
  );
}
