// ============================================================
// Feedback API Client — connects to PostgREST on VPS
// ============================================================
// Usage:
//   import { api } from './api'
//   const apps = await api.getApps()
//   const posts = await api.getPosts({ appId, type, status, search })
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.devlab502.net';

// ── Core fetch helper ────────────────────────────────────────

async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, admin = false } = options;

  const reqHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  // For admin operations (changing status, deleting, etc.)
  if (admin) {
    const token = import.meta.env.VITE_ADMIN_JWT;
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  // PostgREST returns single objects with this header
  if (method === 'POST' && !options.returnMany) {
    reqHeaders['Prefer'] = 'return=representation';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || `API error: ${res.status}`);
    error.status = res.status;
    error.details = err;
    throw error;
  }

  // 204 No Content (e.g., successful delete)
  if (res.status === 204) return null;

  const data = await res.json();
  return data;
}

// ── Apps ─────────────────────────────────────────────────────

export async function getApps() {
  return request('/apps?order=name.asc&is_archived=is.false');
}

// ── Posts ─────────────────────────────────────────────────────

export async function getPosts({ appId, type, status, search, sort = 'newest', limit = 100 } = {}) {
  const params = new URLSearchParams();

  if (appId) params.append('app_id', `eq.${appId}`);
  if (type && type !== 'all') params.append('type', `eq.${type}`);
  if (status && status !== 'all') params.append('status', `eq.${status}`);
  if (search) {
    params.append('or', `(title.ilike.*${search}*,body.ilike.*${search}*)`);
  }

  if (sort === 'newest') params.append('order', 'created_at.desc');
  else if (sort === 'oldest') params.append('order', 'created_at.asc');
  else if (sort === 'upvotes') params.append('order', 'upvote_count.desc');

  params.append('limit', limit);

  return request(`/posts?${params.toString()}`);
}

export async function getPost(id) {
  const data = await request(`/posts?id=eq.${id}`);
  return data?.[0] || null;
}

export async function createPost({ appId, type, title, body, authorName, authorEmail, tags, images }) {
  const data = await request('/posts', {
    method: 'POST',
    body: {
      app_id: appId,
      type: type || 'general',
      title,
      body: body || null,
      author_name: authorName || 'Anonymous',
      author_email: authorEmail || null,
      tags: tags || [],
      images: images || [],
    },
  });
  return Array.isArray(data) ? data[0] : data;
}

// ── Admin: update post status ─────────────────────────────────

export async function updatePostStatus(postId, status) {
  return request(`/posts?id=eq.${postId}`, {
    method: 'PATCH',
    body: { status },
    admin: true,
  });
}

// ── Admin: delete post ────────────────────────────────────────

export async function deletePost(postId) {
  return request(`/posts?id=eq.${postId}`, {
    method: 'DELETE',
    admin: true,
  });
}

// ── Admin: toggle pin ─────────────────────────────────────────

export async function togglePin(postId, isPinned) {
  return request(`/posts?id=eq.${postId}`, {
    method: 'PATCH',
    body: { is_pinned: !isPinned },
    admin: true,
  });
}

// ── Admin notes ───────────────────────────────────────────────

export async function getAdminNotes(postId) {
  return request(`/admin_notes?post_id=eq.${postId}&order=created_at.desc`, {
    admin: true,
  });
}

export async function createAdminNote(postId, note) {
  return request('/admin_notes', {
    method: 'POST',
    body: { post_id: postId, note },
    admin: true,
  });
}

export async function updateAdminNote(noteId, note) {
  return request(`/admin_notes?id=eq.${noteId}`, {
    method: 'PATCH',
    body: { note },
    admin: true,
  });
}

// ── Public: developer response (admin note visible to all) ────

export async function getDevResponse(postId) {
  return request(`/admin_notes?post_id=eq.${postId}&order=created_at.desc&limit=1`);
}

// ── Upvotes ──────────────────────────────────────────────────

export async function upvotePost(postId, fingerprint) {
  try {
    await request('/upvotes', {
      method: 'POST',
      body: { post_id: postId, voter_fingerprint: fingerprint },
    });
    return true;
  } catch (err) {
    if (err.status === 409) return false;
    throw err;
  }
}

export async function hasUpvoted(postId, fingerprint) {
  const data = await request(
    `/upvotes?post_id=eq.${postId}&voter_fingerprint=eq.${fingerprint}&select=id`
  );
  return data.length > 0;
}

// ── Polls ────────────────────────────────────────────────────

export async function getPollForPost(postId) {
  const polls = await request(
    `/polls?post_id=eq.${postId}&select=*,poll_options(*)&poll_options.order=sort_order.asc`
  );
  return polls?.[0] || null;
}

export async function votePoll(optionId, fingerprint) {
  try {
    await request('/poll_votes', {
      method: 'POST',
      body: { poll_option_id: optionId, voter_fingerprint: fingerprint },
    });
    return true;
  } catch (err) {
    if (err.status === 409) return false;
    throw err;
  }
}

// ── Changelog (completed posts) ──────────────────────────────

export async function getChangelog({ appId } = {}) {
  const params = new URLSearchParams();
  params.append('status', 'eq.done');
  params.append('completed_at', 'not.is.null');
  params.append('order', 'completed_at.desc');
  if (appId) params.append('app_id', `eq.${appId}`);
  return request(`/posts?${params.toString()}`);
}

// ── Roadmap (non-new, non-declined posts) ────────────────────

export async function getRoadmap({ appId } = {}) {
  const params = new URLSearchParams();
  params.append('status', 'in.(reviewing,planned,in_progress,done)');
  params.append('order', 'upvote_count.desc');
  if (appId) params.append('app_id', `eq.${appId}`);
  return request(`/posts?${params.toString()}`);
}

// ── Image upload (to R2 via Worker endpoint) ────────────────

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    // No Content-Type header — browser sets multipart boundary
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Upload failed');
  }

  const data = await res.json();
  return data.url;
}

// ── Fingerprint (simple browser fingerprint for dedup) ────────

export function getFingerprint() {
  let fp = sessionStorage.getItem('feedback_fp');
  if (fp) return fp;

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || '',
  ].join('|');

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  fp = 'fp_' + Math.abs(hash).toString(36);
  sessionStorage.setItem('feedback_fp', fp);
  return fp;
}

// ── Export all as a namespace ─────────────────────────────────

export const api = {
  getApps,
  getPosts,
  getPost,
  createPost,
  updatePostStatus,
  deletePost,
  togglePin,
  getAdminNotes,
  createAdminNote,
  updateAdminNote,
  getDevResponse,
  upvotePost,
  hasUpvoted,
  getPollForPost,
  votePoll,
  getChangelog,
  getRoadmap,
  uploadImage,
  getFingerprint,
};

export default api;
