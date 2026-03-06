import { useState } from 'react';
import { useTheme } from '../theme';
import { NUM } from '../utils';

function UpvoteButton({ count, voted, onVote }) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onVote} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
      padding: "8px 10px", border: `1px solid ${voted ? "#10b981" : t.border}`,
      borderRadius: 12, background: voted ? "#10b98115" : hovered ? t.btnSecondaryBg : "transparent",
      cursor: "pointer", transition: "all 0.2s ease", minWidth: 44,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={voted ? "#10b981" : "none"} stroke={voted ? "#10b981" : hovered ? t.text : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
      <span style={{ fontFamily: NUM, fontSize: 13, fontWeight: 600, color: voted ? "#10b981" : t.text, lineHeight: 1 }}>{count}</span>
    </button>
  );
}

export default UpvoteButton;
