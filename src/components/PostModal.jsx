import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../theme';
import { HEADING, BODY, NUM, timeAgo } from '../utils';
import { STATUSES, STATUS_COLORS, STATUS_LABELS } from '../constants';
import api from '../api';
import TypeBadge from './TypeBadge';
import StatusBadge from './StatusBadge';
import ImageGallery from './ImageGallery';
import PollDisplay from './PollDisplay';
import UpvoteButton from './UpvoteButton';

function PostModal({ post, apps, fingerprint, upvoted, isAdmin, onUpvote, onPollVote, onStatusChange, onDelete, onTogglePin, onClose }) {
  const { t } = useTheme();
  const app = apps.find((a) => a.id === post.app_id);
  const [poll, setPoll] = useState(null);
  const [pollLoading, setPollLoading] = useState(true);

  // Admin notes state
  const [devResponse, setDevResponse] = useState(null);
  const [adminNotes, setAdminNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Fetch poll for this post
  useEffect(() => {
    let cancelled = false;
    setPollLoading(true);
    api.getPollForPost(post.id)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          // Normalize API shape to what PollDisplay expects
          setPoll({
            ...data,
            options: (data.poll_options || []).map((o) => ({
              id: o.id,
              label: o.label,
              votes: o.vote_count ?? 0,
            })),
          });
        } else {
          setPoll(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPoll(null);
      })
      .finally(() => {
        if (!cancelled) setPollLoading(false);
      });
    return () => { cancelled = true; };
  }, [post.id]);

  // Fetch admin notes or public developer response
  useEffect(() => {
    let cancelled = false;
    if (isAdmin) {
      api.getAdminNotes(post.id)
        .then((data) => {
          if (cancelled) return;
          setAdminNotes(data || []);
          if (data && data.length > 0) {
            setDevResponse(data[0]);
          }
        })
        .catch(() => {
          if (!cancelled) setAdminNotes([]);
        });
    } else {
      api.getDevResponse(post.id)
        .then((data) => {
          if (cancelled) return;
          if (data && data.length > 0) {
            setDevResponse(data[0]);
          }
        })
        .catch(() => {
          if (!cancelled) setDevResponse(null);
        });
    }
    return () => { cancelled = true; };
  }, [post.id, isAdmin]);

  const handleSaveNote = useCallback(async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      if (editingNoteId) {
        await api.updateAdminNote(editingNoteId, noteText.trim());
        setAdminNotes((prev) => prev.map((n) =>
          n.id === editingNoteId ? { ...n, note: noteText.trim() } : n
        ));
        setDevResponse((prev) => prev && prev.id === editingNoteId ? { ...prev, note: noteText.trim() } : prev);
      } else {
        const result = await api.createAdminNote(post.id, noteText.trim());
        const newNote = Array.isArray(result) ? result[0] : result;
        setAdminNotes((prev) => [newNote, ...prev]);
        setDevResponse(newNote);
      }
      setNoteText("");
      setEditingNoteId(null);
    } catch (err) {
      // Keep text so user can retry
    } finally {
      setSavingNote(false);
    }
  }, [noteText, editingNoteId, post.id]);

  const handleEditNote = (note) => {
    setNoteText(note.note);
    setEditingNoteId(note.id);
  };

  const handleCancelEdit = () => {
    setNoteText("");
    setEditingNoteId(null);
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: t.overlayBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 20, animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: t.card, borderRadius: 18, padding: 32,
        maxWidth: 640, width: "100%", maxHeight: "85vh",
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
          {post.is_pinned && (
            <span style={{
              fontFamily: BODY, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: "#f59e0b18", color: "#f59e0b",
            }}>📌 Pinned</span>
          )}
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

        {!pollLoading && poll && (
          <PollDisplay poll={poll} onVote={onPollVote} />
        )}

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
          <div onClick={(e) => e.stopPropagation()}>
            <UpvoteButton count={post.upvote_count} voted={upvoted} onVote={() => onUpvote && onUpvote(post.id)} />
          </div>
        </div>

        {/* ── Developer Response (visible to all) ──────────────── */}
        {!isAdmin && devResponse && (
          <div style={{
            marginTop: 20, padding: "14px 18px",
            borderLeft: "3px solid #8b5cf6",
            background: "#8b5cf610", borderRadius: "0 12px 12px 0",
          }}>
            <div style={{
              fontFamily: BODY, fontSize: 11, fontWeight: 600, color: "#8b5cf6",
              textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8,
            }}>Developer Response</div>
            <div style={{
              fontFamily: BODY, fontSize: 14, color: t.text,
              lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>{devResponse.note}</div>
          </div>
        )}

        {/* ── Admin Controls ────────────────────────────────────── */}
        {isAdmin && (
          <div style={{
            marginTop: 24, padding: 20,
            background: t.bgAlt, borderRadius: 14,
            border: `1px solid ${t.border}`,
          }}>
            <div style={{
              fontFamily: BODY, fontSize: 11, fontWeight: 700,
              color: "#f59e0b", textTransform: "uppercase",
              letterSpacing: "0.06em", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4"/>
              </svg>
              Admin Controls
            </div>

            {/* Status + Pin + Delete row */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
              {/* Status dropdown */}
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{
                  fontFamily: BODY, fontSize: 11, fontWeight: 600, color: t.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4, display: "block",
                }}>Status</label>
                <select
                  value={post.status}
                  onChange={(e) => onStatusChange && onStatusChange(post.id, e.target.value)}
                  style={{
                    fontFamily: BODY, fontSize: 13, padding: "8px 12px", borderRadius: 10,
                    border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text,
                    outline: "none", width: "100%", cursor: "pointer",
                    borderLeftWidth: 3, borderLeftColor: STATUS_COLORS[post.status] || t.border,
                  }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Pin toggle */}
              <button
                onClick={() => onTogglePin && onTogglePin(post.id, post.is_pinned)}
                style={{
                  fontFamily: BODY, fontSize: 12, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                  border: `1px solid ${post.is_pinned ? "#f59e0b40" : t.border}`,
                  background: post.is_pinned ? "#f59e0b18" : "transparent",
                  color: post.is_pinned ? "#f59e0b" : t.textMuted,
                  display: "flex", alignItems: "center", gap: 5,
                  transition: "all 0.2s ease", whiteSpace: "nowrap",
                  marginTop: 18,
                }}
              >
                📌 {post.is_pinned ? "Unpin" : "Pin"}
              </button>

              {/* Delete button */}
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                    onDelete && onDelete(post.id);
                  }
                }}
                style={{
                  fontFamily: BODY, fontSize: 12, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                  border: "1px solid #ef444430",
                  background: "#ef444412",
                  color: "#ef4444",
                  display: "flex", alignItems: "center", gap: 5,
                  transition: "all 0.2s ease", whiteSpace: "nowrap",
                  marginTop: 18,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete
              </button>
            </div>

            {/* Developer Response section */}
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
              <label style={{
                fontFamily: BODY, fontSize: 11, fontWeight: 600, color: t.textMuted,
                textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "block",
              }}>
                Developer Response {devResponse ? "(public)" : "(write a public response)"}
              </label>

              {/* Show existing response with edit option */}
              {devResponse && !editingNoteId && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10,
                  borderLeft: "3px solid #8b5cf6",
                  background: "#8b5cf610", marginBottom: 12,
                }}>
                  <div style={{
                    fontFamily: BODY, fontSize: 14, color: t.text,
                    lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>{devResponse.note}</div>
                  <button
                    onClick={() => handleEditNote(devResponse)}
                    style={{
                      fontFamily: BODY, fontSize: 11, fontWeight: 600, color: "#8b5cf6",
                      background: "none", border: "none", cursor: "pointer",
                      padding: "6px 0 0", display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit response
                  </button>
                </div>
              )}

              {/* Textarea for new or editing response */}
              {(!devResponse || editingNoteId) && (
                <div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write a developer response visible to all users..."
                    rows={3}
                    style={{
                      fontFamily: BODY, fontSize: 13, padding: "10px 14px", borderRadius: 10,
                      border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text,
                      outline: "none", width: "100%", resize: "vertical", minHeight: 70,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      disabled={!noteText.trim() || savingNote}
                      onClick={handleSaveNote}
                      style={{
                        fontFamily: BODY, fontSize: 12, fontWeight: 600,
                        padding: "8px 16px", borderRadius: 10, cursor: noteText.trim() && !savingNote ? "pointer" : "not-allowed",
                        border: "none",
                        background: noteText.trim() && !savingNote ? "#8b5cf6" : t.btnSecondaryBg,
                        color: noteText.trim() && !savingNote ? "#fff" : t.textFaint,
                        transition: "all 0.2s ease",
                        opacity: savingNote ? 0.7 : 1,
                      }}
                    >
                      {savingNote ? "Saving..." : editingNoteId ? "Update Response" : "Save Response"}
                    </button>
                    {editingNoteId && (
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          fontFamily: BODY, fontSize: 12, fontWeight: 500,
                          padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                          border: `1px solid ${t.border}`,
                          background: "transparent", color: t.textMuted,
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PostModal;
