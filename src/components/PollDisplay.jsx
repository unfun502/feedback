import { useState } from 'react';
import { useTheme } from '../theme';
import { NUM, BODY } from '../utils';

function PollDisplay({ poll, compact = false, onVote }) {
  const { t } = useTheme();
  const [votedOption, setVotedOption] = useState(null);

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const hasVoted = votedOption !== null;

  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px", background: t.pollBarBg,
        borderRadius: 8, marginTop: 10,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8" rx="1"/><rect x="14" y="6" width="3" height="12" rx="1"/>
        </svg>
        <span style={{ fontFamily: BODY, fontSize: 12, color: t.textMuted, flex: 1 }}>
          {poll.question}
        </span>
        <span style={{ fontFamily: NUM, fontSize: 11, color: t.textFaint }}>
          {totalVotes} votes
        </span>
      </div>
    );
  }

  return (
    <div style={{
      background: t.bgAlt, border: `1px solid ${t.border}`,
      borderRadius: 14, padding: 18, marginBottom: 20,
    }}>
      <div style={{
        fontFamily: BODY, fontSize: 14, fontWeight: 600, color: t.text,
        marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8" rx="1"/><rect x="14" y="6" width="3" height="12" rx="1"/>
        </svg>
        {poll.question}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {poll.options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isVoted = votedOption === opt.id;
          const showResults = hasVoted;

          return (
            <button
              key={opt.id}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasVoted) {
                  setVotedOption(opt.id);
                  if (onVote) onVote(opt.id);
                }
              }}
              disabled={hasVoted}
              style={{
                position: "relative", padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${isVoted ? "#10b981" : t.border}`,
                background: "transparent", cursor: hasVoted ? "default" : "pointer",
                textAlign: "left", fontFamily: BODY, fontSize: 13, color: t.text,
                overflow: "hidden", transition: "all 0.2s ease",
              }}
            >
              {showResults && (
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isVoted ? "#10b98118" : `${t.pollBarFill}08`,
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  borderRadius: 9,
                }} />
              )}
              <div style={{
                position: "relative", display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontWeight: isVoted ? 600 : 400 }}>
                  {isVoted && <span style={{ color: "#10b981", marginRight: 6 }}>{"\u2713"}</span>}
                  {opt.label}
                </span>
                {showResults && (
                  <span style={{
                    fontFamily: NUM, fontSize: 12, fontWeight: 600,
                    color: isVoted ? "#10b981" : t.textMuted, marginLeft: 12,
                  }}>{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        fontFamily: NUM, fontSize: 11, color: t.textFaint,
        marginTop: 10, textAlign: "right",
      }}>
        {hasVoted ? totalVotes + 1 : totalVotes} vote{totalVotes !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default PollDisplay;
