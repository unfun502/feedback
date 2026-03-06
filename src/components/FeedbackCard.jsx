import { useState } from 'react';
import { useTheme } from '../theme';
import { HEADING, BODY, NUM, timeAgo } from '../utils';
import { APPS } from '../constants';
import UpvoteButton from './UpvoteButton';
import TypeBadge from './TypeBadge';
import StatusBadge from './StatusBadge';
import PollDisplay from './PollDisplay';
import ImageGallery from './ImageGallery';

function FeedbackCard({ post, onSelect }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [voted, setVoted] = useState(false);
  const app = APPS.find((a) => a.id === post.app_id);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(post)} style={{
        background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
        padding: 0, cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? t.shadowCardHover : t.shadowCard,
        overflow: "hidden", position: "relative", display: "flex", flexDirection: "column",
      }}>
      <div style={{
        height: 3, background: app?.accent || t.border,
        opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease",
      }} />
      <div style={{ padding: "16px 18px", display: "flex", gap: 12, flex: 1 }}>
        <div onClick={(e) => e.stopPropagation()}>
          <UpvoteButton count={post.upvote_count} voted={voted} onVote={() => setVoted(!voted)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <TypeBadge type={post.type} />
            <StatusBadge status={post.status} />
            {app && <span style={{ fontFamily: BODY, fontSize: 11, color: t.textFaint, marginLeft: "auto" }}>{app.emoji} {app.name}</span>}
          </div>
          <div style={{
            fontFamily: HEADING, fontSize: 16, fontWeight: 600,
            color: t.text, lineHeight: 1.35, marginBottom: 6,
          }}>{post.title}</div>
          <div style={{
            fontFamily: BODY, fontSize: 13, color: t.textSecondary, lineHeight: 1.5,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: hovered ? 4 : 2, WebkitBoxOrient: "vertical",
            transition: "all 0.3s ease",
          }}>{post.body}</div>

          {post.poll && <PollDisplay poll={post.poll} compact />}
          <ImageGallery images={post.images} compact />

          {post.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
              {post.tags.map((tag) => (
                <span key={tag} style={{ fontFamily: BODY, fontSize: 11, color: t.textMuted, background: t.badgeBg, padding: "2px 8px", borderRadius: 6 }}>{tag}</span>
              ))}
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 12,
            fontFamily: BODY, fontSize: 12, color: t.textFaint,
          }}>
            <span>{post.author_name}</span>
            <span>·</span>
            <span style={{ fontFamily: NUM, fontSize: 11 }}>{timeAgo(post.created_at)}</span>
            {post.author_email && (
              <>
                <span>·</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  subscribed
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackCard;
