import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ThemeProvider, useTheme } from './theme';
import { BODY } from './utils';
import { APPS as FALLBACK_APPS } from './constants';
import api from './api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PostModal from './components/PostModal';
import NewPostForm from './components/NewPostForm';
import BoardView from './views/BoardView';
import RoadmapView from './views/RoadmapView';
import ChangelogView from './views/ChangelogView';

function FeedbackApp() {
  const { t } = useTheme();
  const isAdmin = Boolean(import.meta.env.VITE_ADMIN_JWT);

  const [selectedApp, setSelectedApp] = useState(null);
  const [view, setView] = useState("board");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [filters, setFilters] = useState({ search: "", type: "all", status: "all", sort: "newest" });

  // API-driven state
  const [apps, setApps] = useState(
    isAdmin ? FALLBACK_APPS : FALLBACK_APPS.filter(a => !a.is_admin_only)
  );
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [upvotedPosts, setUpvotedPosts] = useState(new Set());

  // Debounce ref for search
  const searchTimerRef = useRef(null);

  // Set of visible app IDs for filtering posts in "All Apps" view
  const visibleAppIds = useMemo(() => new Set(apps.map(a => a.id)), [apps]);

  // Apply URL params on mount (?app_id=UUID&sidebar=collapsed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appId = params.get('app_id');
    if (appId) setSelectedApp(appId);
    if (params.get('sidebar') === 'collapsed') setSidebarCollapsed(true);
  }, []);

  // Initialize fingerprint and fetch apps on mount
  useEffect(() => {
    const fp = api.getFingerprint();
    setFingerprint(fp);

    api.getApps({ isAdmin })
      .then((data) => {
        if (data && data.length > 0) {
          const slugToUrl = (s) => {
              const overrides = {};
              return `https://${overrides[s] || s}.devlab502.net`;
            };
            setApps(data.map((a) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
            url: slugToUrl(a.slug),
            accent: a.accent_color || '#6366f1',
            emoji: a.icon_emoji || '📦',
            is_admin_only: a.is_admin_only || false,
          })));
        }
      })
      .catch(() => {
        // Keep fallback apps on error
      });
  }, []);

  // Fetch posts when view, selectedApp, or filters change
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (view === "roadmap") {
        data = await api.getRoadmap({ appId: selectedApp || undefined });
      } else if (view === "changelog") {
        data = await api.getChangelog({ appId: selectedApp || undefined });
      } else {
        data = await api.getPosts({
          appId: selectedApp || undefined,
          type: filters.type,
          status: filters.status,
          search: filters.search || undefined,
          sort: filters.sort,
        });
      }
      setPosts(data || []);
    } catch (err) {
      setError(err.message || "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [view, selectedApp, filters]);

  useEffect(() => {
    // Debounce search filter changes, immediate for other filter changes
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchPosts();
    }, filters.search ? 300 : 0);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [fetchPosts]);

  // Filter posts: in "All Apps" view, exclude posts from admin-only apps for non-admin
  const visiblePosts = useMemo(() => {
    if (selectedApp) return posts;
    return posts.filter(p => visibleAppIds.has(p.app_id));
  }, [posts, selectedApp, visibleAppIds]);

  // Upvote handler
  const handleUpvote = useCallback(async (postId) => {
    if (!fingerprint) return;
    if (upvotedPosts.has(postId)) return;

    const success = await api.upvotePost(postId, fingerprint);
    if (success) {
      setUpvotedPosts((prev) => new Set(prev).add(postId));
      // Optimistic update: increment the count locally
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, upvote_count: p.upvote_count + 1 } : p
      ));
    }
  }, [fingerprint, upvotedPosts]);

  // Check upvote status for visible posts
  useEffect(() => {
    if (!fingerprint || posts.length === 0) return;

    const checkUpvotes = async () => {
      const newUpvoted = new Set(upvotedPosts);
      const uncheckedPosts = posts.filter((p) => !upvotedPosts.has(p.id));

      // Check in batches to avoid too many concurrent requests
      const batch = uncheckedPosts.slice(0, 20);
      await Promise.allSettled(
        batch.map(async (post) => {
          const voted = await api.hasUpvoted(post.id, fingerprint);
          if (voted) newUpvoted.add(post.id);
        })
      );

      if (newUpvoted.size !== upvotedPosts.size) {
        setUpvotedPosts(newUpvoted);
      }
    };

    checkUpvotes();
  }, [fingerprint, posts]);

  // Create post handler
  const handleCreatePost = useCallback(async (formData) => {
    const result = await api.createPost({
      appId: formData.appId,
      type: formData.type,
      title: formData.title,
      body: formData.body,
      authorName: formData.authorName,
      authorEmail: formData.authorEmail,
      tags: [],
      images: formData.images || [],
    });
    // Refetch posts after creation
    fetchPosts();
    return result;
  }, [fetchPosts]);

  // Poll vote handler
  const handlePollVote = useCallback(async (optionId) => {
    if (!fingerprint) return false;
    const success = await api.votePoll(optionId, fingerprint);
    return success;
  }, [fingerprint]);

  // ── Admin features ──────────────────────────────────────────
  const handleStatusChange = useCallback(async (postId, newStatus) => {
    await api.updatePostStatus(postId, newStatus);
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, status: newStatus } : p
    ));
    setSelectedPost((prev) => prev && prev.id === postId ? { ...prev, status: newStatus } : prev);
  }, []);

  const handleDelete = useCallback(async (postId) => {
    await api.deletePost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setSelectedPost(null);
  }, []);

  const handleTogglePin = useCallback(async (postId, currentlyPinned) => {
    await api.togglePin(postId, currentlyPinned);
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, is_pinned: !currentlyPinned } : p
    ));
    setSelectedPost((prev) => prev && prev.id === postId ? { ...prev, is_pinned: !currentlyPinned } : prev);
  }, []);

  const handleToggleAdminOnly = useCallback(async (appId, currentValue) => {
    await api.updateApp(appId, { is_admin_only: !currentValue });
    setApps((prev) => prev.map((a) =>
      a.id === appId ? { ...a, is_admin_only: !currentValue } : a
    ));
  }, []);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: t.bg,
      fontFamily: BODY, transition: "background 0.4s ease, color 0.4s ease",
    }}>
      <Sidebar apps={apps} selectedApp={selectedApp} onSelectApp={setSelectedApp}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isAdmin={isAdmin} onToggleAdminOnly={handleToggleAdminOnly} />

      <main style={{ flex: 1, padding: "32px 36px", maxWidth: 1100, overflow: "auto" }}>
        <Header view={view} onViewChange={setView} selectedApp={selectedApp} apps={apps} />

        {view === "board" && (
          <BoardView
            posts={visiblePosts}
            apps={apps}
            filters={filters}
            loading={loading}
            error={error}
            upvotedPosts={upvotedPosts}
            onFilterChange={setFilters}
            onNewPost={() => setShowNewPostForm(true)}
            onSelectPost={setSelectedPost}
            onUpvote={handleUpvote}
            onRetry={fetchPosts}
          />
        )}

        {view === "roadmap" && (
          <RoadmapView posts={visiblePosts} apps={apps} loading={loading} />
        )}
        {view === "changelog" && (
          <ChangelogView posts={visiblePosts} apps={apps} loading={loading} />
        )}
      </main>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          apps={apps}
          fingerprint={fingerprint}
          upvoted={upvotedPosts.has(selectedPost.id)}
          isAdmin={isAdmin}
          onUpvote={handleUpvote}
          onPollVote={handlePollVote}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onClose={() => setSelectedPost(null)}
        />
      )}
      {showNewPostForm && (
        <NewPostForm
          apps={apps}
          selectedApp={selectedApp}
          existingPosts={visiblePosts}
          fingerprint={fingerprint}
          isAdmin={isAdmin}
          onClose={() => setShowNewPostForm(false)}
          onSubmit={async (data) => {
            await handleCreatePost(data);
            setShowNewPostForm(false);
          }}
        />
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
