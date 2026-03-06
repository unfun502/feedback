import { useEffect } from 'react';
import { useTheme } from '../theme';
import { HEADING, BODY, NUM, timeAgo } from '../utils';
import { APPS } from '../constants';
import TypeBadge from './TypeBadge';
import StatusBadge from './StatusBadge';
import ImageGallery from './ImageGallery';
import PollDisplay from './PollDisplay';

function PostModal({ post, onClose }) {
  const { t } = useTheme();
  const app = APPS.find((a) => a.id === post.app_id);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: t.overlayBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 20, animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: t.card, borderRadius: 18, padding: 32,
        maxWidth: 640, width: "100%", maxHeight: "80vh",
        overflow: "auto", boxShadow: t.shadowLg,
        animation: "modalIn 0.25s ease", border: `1px solid ${t.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: t.textMuted,
            cursor: "pointer", padding: 4, borderRadius: 8, display: "flex",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <TypeBadge type={post.type} />
          <StatusBadge status={post.status} />
          {app && (
            <span style={{
              fontFamily: BODY, fontSize: 12, color: app.accent, fontWeight: 500,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>{app.emoji} {app.name}</span>
          )}
        </div>

        <h2 style={{
          fontFamily: HEADING, fontSize: 26, fontWeight: 700, color: t.text,
          margin: "0 0 16px 0", lineHeight: 1.3, letterSpacing: "-0.01em",
        }}>{post.title}</h2>

        <p style={{
          fontFamily: BODY, fontSize: 15, color: t.textSecondary,
          lineHeight: 1.7, margin: "0 0 20px 0", whiteSpace: "pre-wrap",
        }}>{post.body}</p>

        <ImageGallery images={post.images} />
        <PollDisplay poll={post.poll} />

        {post.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{
                fontFamily: BODY, fontSize: 12, color: t.textMuted,
                background: t.badgeBg, padding: "4px 12px", borderRadius: 8,
              }}>{tag}</span>
            ))}
          </div>
        )}

        <div style={{ height: 1, background: t.border, margin: "0 0 16px 0" }} />

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontFamily: BODY, fontSize: 13, color: t.textMuted,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 500 }}>{post.author_name}</span>
            <span>·</span>
            <span style={{ fontFamily: NUM, fontSize: 12 }}>{timeAgo(post.created_at)}</span>
            {post.author_email && (
              <>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#10b981" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  Subscribed to updates
                </span>
              </>
            )}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontFamily: NUM, fontWeight: 600, fontSize: 14, color: t.text,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
            {post.upvote_count}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostModal;
