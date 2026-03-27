import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../theme';
import { HEADING, BODY, NUM } from '../utils';
import ImageDropZone from './ImageDropZone';

function NewPostForm({ apps, selectedApp, existingPosts, fingerprint, isAdmin, onClose, onSubmit }) {
  const { t } = useTheme();
  const [form, setForm] = useState({
    title: "", body: "", type: "general", authorName: "", authorEmail: "",
    notifyOnUpdate: false, appId: selectedApp || apps[0]?.id || "", website: "",
  });
  const [images, setImages] = useState([]);
  const [addPoll, setAddPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Bot protection: track when form was opened
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const inputStyle = {
    fontFamily: BODY, fontSize: 14, padding: "10px 14px", borderRadius: 10,
    border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text,
    outline: "none", width: "100%", transition: "border-color 0.2s",
  };
  const labelStyle = {
    fontFamily: BODY, fontSize: 12, fontWeight: 600, color: t.textMuted,
    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, display: "block",
  };
  const canSubmit = form.title.trim().length > 0 && !submitting && !images.some(img => img.uploading);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    // ── Bot protection checks (skipped for admin) ─────────
    if (!isAdmin) {
      // 1. Honeypot: silently reject if hidden field filled
      if (form.website.length > 0) {
        setTimeout(() => onClose(), 800);
        return;
      }

      // 2. Timing: silently reject if submitted too fast (< 3 seconds)
      if (Date.now() - mountTimeRef.current < 3000) {
        setTimeout(() => onClose(), 800);
        return;
      }
    }

    // 3. Rate limit: max 5 posts per 10 minutes per fingerprint (skipped for admin)
    if (fingerprint && !isAdmin) {
      const RATE_KEY = 'feedback_submissions';
      const RATE_WINDOW = 10 * 60 * 1000;
      const RATE_LIMIT = 5;
      const stored = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
      const now = Date.now();
      const fpSubmissions = (stored[fingerprint] || []).filter(ts => now - ts < RATE_WINDOW);
      if (fpSubmissions.length >= RATE_LIMIT) {
        setSubmitError("Too many submissions. Please try again in a few minutes.");
        setSubmitting(false);
        return;
      }
    }

    if (!isAdmin) {
      // 4. URL count: reject if > 2 URLs in title + body
      const urlRegex = /https?:\/\/[^\s]+/gi;
      const urlCount = ((form.title || '').match(urlRegex) || []).length
                     + ((form.body || '').match(urlRegex) || []).length;
      if (urlCount > 2) {
        setSubmitError("Too many links. Please reduce the number of URLs in your post.");
        setSubmitting(false);
        return;
      }

      // 5. Duplicate title: check against loaded posts
      if (existingPosts && existingPosts.length > 0) {
        const normalizedTitle = form.title.trim().toLowerCase();
        const duplicate = existingPosts.find(p => p.title.toLowerCase().trim() === normalizedTitle);
        if (duplicate) {
          setSubmitError("A similar post already exists. Please search for existing feedback before posting.");
          setSubmitting(false);
          return;
        }
      }
    }

    // TURNSTILE: uncomment when site key is provisioned
    // if (!turnstileToken) {
    //   setSubmitError("Please complete the verification.");
    //   setSubmitting(false);
    //   return;
    // }
    // ── End bot protection ─────────────────────────────────

    try {
      // Extract uploaded URL strings only (filter out failed uploads)
      const imageUrls = images.filter(img => img.url).map(img => img.url);
      await onSubmit({ ...form, images: imageUrls, poll: addPoll ? { question: pollQuestion, options: pollOptions } : null });

      // Record successful submission for rate limiting
      if (fingerprint) {
        const RATE_KEY = 'feedback_submissions';
        const stored = JSON.parse(localStorage.getItem(RATE_KEY) || '{}');
        const fpSubmissions = stored[fingerprint] || [];
        fpSubmissions.push(Date.now());
        stored[fingerprint] = fpSubmissions;
        localStorage.setItem(RATE_KEY, JSON.stringify(stored));
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: t.overlayBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 20, animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: t.card, borderRadius: 18, padding: 0,
        maxWidth: 580, width: "100%", maxHeight: "88vh",
        overflow: "auto", boxShadow: t.shadowLg,
        animation: "modalIn 0.25s ease", border: `1px solid ${t.border}`,
      }}>
        <div style={{
          padding: "20px 24px 16px", borderBottom: `1px solid ${t.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>New Post</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: t.textMuted,
            cursor: "pointer", padding: 4, borderRadius: 8, display: "flex",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>App</label>
              <select value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                {apps.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="bug">🐛 Bug</option>
                <option value="feature">✨ Feature</option>
                <option value="general">💬 General</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Title *</label>
            <input type="text" placeholder="Short summary of your feedback"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          </div>

          {/* Honeypot field — hidden from users, bots fill it */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
            <label htmlFor="website">Website</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off"
              value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>

          <div>
            <label style={labelStyle}>Details</label>
            <textarea placeholder="Add more context, steps to reproduce, etc."
              value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
          </div>

          <div>
            <label style={labelStyle}>Screenshots</label>
            <ImageDropZone images={images} onImagesChange={setImages} />
          </div>

          {/* Poll toggle */}
          <div>
            <button onClick={() => setAddPoll(!addPoll)} style={{
              fontFamily: BODY, fontSize: 13, fontWeight: 500,
              padding: "8px 14px", borderRadius: 10,
              border: `1px solid ${addPoll ? "#8b5cf6" : t.border}`,
              background: addPoll ? "#8b5cf618" : "transparent",
              color: addPoll ? "#8b5cf6" : t.textMuted,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s ease",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8" rx="1"/><rect x="14" y="6" width="3" height="12" rx="1"/>
              </svg>
              {addPoll ? "Remove poll" : "Add a poll"}
            </button>

            {addPoll && (
              <div style={{
                marginTop: 12, padding: 16, background: t.bgAlt,
                borderRadius: 12, border: `1px solid ${t.border}`,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <input type="text" placeholder="Poll question" value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  style={{ ...inputStyle, fontWeight: 600 }} />
                {pollOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: NUM, fontSize: 12, color: t.textFaint, width: 20, textAlign: "center" }}>{i + 1}</span>
                    <input type="text" placeholder={`Option ${i + 1}`} value={opt}
                      onChange={(e) => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }}
                      style={{ ...inputStyle, flex: 1 }} />
                    {pollOptions.length > 2 && (
                      <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} style={{
                        background: "none", border: "none", color: t.textFaint,
                        cursor: "pointer", padding: 4, fontSize: 16, lineHeight: 1,
                      }}>×</button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button onClick={() => setPollOptions([...pollOptions, ""])} style={{
                    fontFamily: BODY, fontSize: 12, color: t.textMuted,
                    background: "none", border: "none", cursor: "pointer", padding: "4px 0", textAlign: "left",
                  }}>+ Add option</button>
                )}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: t.border }} />

          {/* Author info */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Your Name</label>
              <input type="text" placeholder="Anonymous" value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Email (optional)</label>
              <input type="email" placeholder="you@example.com" value={form.authorEmail}
                onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {/* Email notification opt-in */}
          {form.authorEmail.trim().length > 0 && (
            <div
              onClick={() => setForm({ ...form, notifyOnUpdate: !form.notifyOnUpdate })}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", borderRadius: 10,
                background: form.notifyOnUpdate ? "#10b98108" : t.bgAlt,
                border: `1px solid ${form.notifyOnUpdate ? "#10b98140" : t.border}`,
                cursor: "pointer", transition: "all 0.2s ease",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                border: `2px solid ${form.notifyOnUpdate ? "#10b981" : t.inputBorder}`,
                background: form.notifyOnUpdate ? "#10b981" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1, transition: "all 0.2s ease",
              }}>
                {form.notifyOnUpdate && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontFamily: BODY, fontSize: 13, fontWeight: 500, color: t.text }}>
                  Notify me of status changes
                </div>
                <div style={{ fontFamily: BODY, fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                  Get an email when this post moves to Reviewing, Planned, In Progress, or Done
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div style={{
              fontFamily: BODY, fontSize: 13, color: "#ef4444",
              background: "#ef444415", padding: "10px 14px", borderRadius: 10,
              border: "1px solid #ef444430",
            }}>
              {submitError}
            </div>
          )}

          {/* TURNSTILE: uncomment when site key is provisioned
          <div style={{ marginBottom: 16 }}>
            <div className="cf-turnstile" data-sitekey="YOUR_SITE_KEY_HERE" data-callback="onTurnstileVerify" data-theme="dark" />
          </div>
          */}

          <button disabled={!canSubmit} onClick={handleSubmit} style={{
            fontFamily: BODY, fontSize: 14, fontWeight: 600,
            padding: "12px 24px", border: "none", borderRadius: 12,
            background: canSubmit ? t.btnPrimaryBg : t.btnSecondaryBg,
            color: canSubmit ? t.btnPrimaryText : t.textFaint,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.2s ease", width: "100%",
            opacity: submitting ? 0.7 : 1,
          }}>{submitting ? "Posting..." : "Post Feedback"}</button>
        </div>
      </div>
    </div>
  );
}

export default NewPostForm;
