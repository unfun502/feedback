# CLAUDE.md — Feedback App

## What Is This Project

Feedback is a self-hosted bug report and feature request app for devlab502 projects. Users of my apps (Arsenal Report, FLW Map, Countdown) visit Feedback to submit bugs, request features, upvote existing posts, and vote in polls. I (the admin) use a single dashboard to triage feedback across all apps.

This is NOT a social platform. No comments, no threads, no user profiles, no signup required. It's a one-way feedback funnel: users submit → I review and act.

## Tech Stack

- **Frontend**: Vite + React (single-page app)
- **Hosting**: Cloudflare **Workers** (NOT Pages) — deploys via `wrangler deploy`
- **Domain**: https://feedback.devlab502.net
- **API**: PostgREST v12 at https://api.devlab502.net (auto-generates REST API from Postgres schema)
- **Database**: PostgreSQL 16 on KVM VPS (107.172.92.103)
- **Reverse Proxy**: Caddy (auto-HTTPS via Let's Encrypt)
- **Image Storage**: Cloudflare R2 bucket "devlab502-uploads", served via cdn.devlab502.net
- **Email Notifications**: Resend (100/day free)
- **Secrets**: Doppler (not .env files in production)
- **CI/CD**: GitHub Actions using `cloudflare/wrangler-action@v3`
- **Source Control**: github.com/unfun502/feedback, `main` branch = production

## Local Path

```
C:\Users\sandersh.REACH\OneDrive - Reach of Louisville\devlab502\feedback
```

## API Details

- **Base URL**: `https://api.devlab502.net`
- **API Style**: PostgREST — query syntax uses `?column=eq.value`, `?order=column.desc`, `?or=(col.ilike.*search*,col2.ilike.*search*)`
- **Auth**: No auth for public reads and anonymous post creation. Admin operations (status changes, deletions) require JWT in Authorization header.
- **CORS**: Locked to `https://feedback.devlab502.net` in production Caddyfile.
- An `api.js` client module exists with all the fetch helpers. Use it — don't write raw fetch calls in components.

### Key API Patterns

```javascript
// Read posts with filters
GET /posts?app_id=eq.UUID&status=eq.new&order=created_at.desc&limit=50

// Search
GET /posts?or=(title.ilike.*search*,body.ilike.*search*)

// Create post (anonymous — column-restricted)
POST /posts { app_id, type, title, body, author_name, author_email, tags, images }

// Upvote (returns 409 if already voted — handle as "already upvoted")
POST /upvotes { post_id, voter_fingerprint }

// Admin: change status (requires JWT)
PATCH /posts?id=eq.UUID  Authorization: Bearer <JWT>  { status: "planned" }
```

## Database Schema

Tables: `apps`, `posts`, `upvotes`, `polls`, `poll_options`, `poll_votes`, `admin_notes`, `notification_settings`, `notification_log`

Key columns on `posts`:
- `id` UUID (PK), `app_id` UUID (FK → apps), `type` enum (bug/feature/general), `status` enum (new/reviewing/planned/in_progress/done/declined)
- `title`, `body`, `author_name`, `author_email`, `upvote_count` (auto-incremented by trigger), `is_pinned`, `tags` TEXT[], `images` TEXT[]
- `created_at`, `updated_at` (auto-trigger), `completed_at` (auto-set when status → done, auto-cleared when moved away from done)

Roles:
- `anon` — public users. Can SELECT apps/posts/polls/poll_options. Can INSERT posts (restricted columns), upvotes, poll_votes.
- `feedback_admin` — full access to everything including admin_notes, notification_settings.

Schema file: `server/init/01-schema.sql`

## Design System

### Typography
- **Headings**: Fraunces (variable serif, optical size 9-144). Used for: app title "Feedback", page headers, card titles, section headers.
- **Body**: DM Sans. Used for: all UI text, labels, descriptions, buttons.
- **Numbers**: IBM Plex Mono. Used for: all numeric values — upvote counts, stats, poll percentages, vote totals, result counts.

Font import: `https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap`

### Color Palette — Warm Stone

The palette is based on Tailwind's Stone scale. NOT pure black/white. Warm undertones throughout. **Dark mode is the default.**

**Dark mode** (default):
- Background: #0c0a09 (stone-950)
- Cards: #1c1917 (stone-900)
- Text: #fafaf9 (stone-50)
- Text secondary: #d6d3d1 (stone-300)
- Borders: #2e2a27
- Primary button: #fafaf9 bg, #0c0a09 text

**Light mode**:
- Background: #f5f5f4 (stone-100)
- Cards: #fff
- Text: #1c1917 (stone-900)
- Text secondary: #44403c (stone-700)
- Borders: #e7e5e4 (stone-200)
- Primary button: #1c1917 bg, #fff text

**App accent colors**:
- Arsenal Report: #ef4444 (red) 📊
- FLW Map: #10b981 (emerald) 🗺️
- Countdown: #f59e0b (amber) ⏱️

**Status colors**:
- New: #3b82f6 (blue)
- Reviewing: #f59e0b (amber)
- Planned: #8b5cf6 (violet)
- In Progress: #f97316 (orange)
- Done: #10b981 (green)
- Declined: #94a3b8 (slate)

### Theme System
- ThemeContext provides `{ mode, toggle, t }` where `t` is the active theme token object
- 40+ theme tokens: backgrounds, borders, text colors, shadows, sidebar states
- All components use `useTheme()` hook — never hardcode colors
- 0.4s transitions on theme changes
- Default: dark mode

### UI Patterns
- Border radius: 12-16px on cards and modals, 10-12px on inputs and buttons, 20px on badges/pills
- Shadows (dark): `0 1px 3px rgba(0,0,0,0.2)` default, `0 12px 40px rgba(0,0,0,0.4)` hover
- Card hover: translateY(-4px) with shadow increase and colored top bar reveal
- Animations: staggered `cardIn` (opacity + translateY), `fadeIn`, `modalIn` (scale + translateY)
- Sidebar: dark bg (#1c1917) in both themes, collapsible to 60px icon-only mode

## Views

1. **Board** (default) — Card grid with search, type/status/sort filters, dashboard stats row
2. **Roadmap** — Kanban columns: Reviewing → Planned → In Progress → Done. Cards sorted by votes within each column.
3. **Changelog** — Timeline view of completed items with completion dates and app badges.

Switcher: pill-style toggle in header (Board / Roadmap / Changelog)

## Features

- Multi-app sidebar with "All Apps" aggregate view
- Card grid with hover-expand (shows more body text, tags, polls)
- Click-to-open modal with full post details
- Image attachments: drop zone in form, compact thumbnails on cards, lightbox gallery in modal
- Polls: interactive voting with animated percentage bars
- Upvote button with fingerprint-based dedup
- Anonymous posting form (no signup required)
- Email notification opt-in: checkbox appears when user provides email, notifies on status changes
- Dashboard stats row (total, bugs, features, new, top votes)
- Search across title and body
- Filter by type, status, sort by newest/oldest/top voted
- Dark mode default with light mode toggle

## Bot Protection

Layered approach prioritizing zero user friction:
- **Layer 1**: Honeypot hidden field + 3-second minimum submit time + rate limiting
- **Layer 2** (ready): Cloudflare Turnstile — code structure ready, uncomment when site key is provisioned
- **Layer 3**: Content signals — URL count check, title/body duplicate detection

## Project Structure

```
feedback/
├── CLAUDE.md
├── package.json
├── vite.config.js
├── wrangler.toml
├── worker.js                   # Cloudflare Worker entry point (security headers + SPA)
├── index.html
├── public/
│   └── _headers
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api.js                  # API client (already built)
│   ├── theme.js                # THEMES object, ThemeContext, useTheme
│   ├── constants.js            # APPS, STATUSES, STATUS_COLORS, etc.
│   ├── utils.js                # timeAgo, formatDate, font constants
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── ViewSwitcher.jsx
│   │   ├── DashboardStats.jsx
│   │   ├── FilterBar.jsx
│   │   ├── FeedbackCard.jsx
│   │   ├── PostModal.jsx
│   │   ├── NewPostForm.jsx
│   │   ├── ImageDropZone.jsx
│   │   ├── ImageGallery.jsx
│   │   ├── PollDisplay.jsx
│   │   ├── UpvoteButton.jsx
│   │   ├── StatusBadge.jsx
│   │   └── TypeBadge.jsx
│   └── views/
│       ├── BoardView.jsx
│       ├── RoadmapView.jsx
│       └── ChangelogView.jsx
├── .github/
│   └── workflows/
│       └── deploy.yml
└── server/                     # VPS deployment files (reference, not deployed via Workers)
    ├── docker-compose.yml
    ├── Caddyfile
    ├── .env.example
    ├── DEPLOY.md
    └── init/
        └── 01-schema.sql
```

## Code Conventions

- Inline styles (no CSS modules or styled-components) — deliberate choice, acceptable at this scale
- All colors come from theme tokens via `useTheme()`, never hardcoded
- Numeric values always use `fontFamily: NUM` (IBM Plex Mono)
- Headings always use `fontFamily: HEADING` (Fraunces)
- Body text always uses `fontFamily: BODY` (DM Sans)
- Hover states use `onMouseEnter` / `onMouseLeave` with inline style mutations
- Animations use CSS `@keyframes` injected via `<style>` tag in App component
- No external state management (React state + context is sufficient)
- No React Router — single-page app with view switching via state

## VPS Details

- **Provider**: RackNerd KVM VPS
- **IP**: 107.172.92.103
- **OS**: Ubuntu 24.04 LTS
- **User**: daniel (sudo privileges), also has root access
- **Docker**: Docker Engine + Compose V2 plugin installed
- **Firewall (UFW)**: Ports 22, 80, 443, 3000 open
- **Swap**: 2 GB configured
- **Stack**: PostgreSQL 16 + PostgREST v12 + Caddy via Docker Compose
- **Data directory**: ~/feedback/

## Commands

```bash
# Dev server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
wrangler deploy

# Connect to VPS database
ssh daniel@107.172.92.103
cd ~/feedback && docker compose exec db psql -U feedback_admin -d feedback

# View VPS logs
ssh daniel@107.172.92.103
cd ~/feedback && docker compose logs -f

# Backup database
ssh daniel@107.172.92.103
cd ~/feedback && docker compose exec -T db pg_dump -U feedback_admin feedback > backup_$(date +%Y%m%d).sql
```

## Environment Variables

### Frontend (.env.local for dev, Cloudflare Worker vars for prod)
```
VITE_API_URL=https://api.devlab502.net
VITE_ADMIN_JWT=<generated JWT for admin operations>
```

### VPS (.env for Docker Compose)
```
POSTGRES_DB=feedback
POSTGRES_USER=feedback_admin
POSTGRES_PASSWORD=<generated>
POSTGREST_ANON_ROLE=anon
JWT_SECRET=<generated, min 32 chars>
API_DOMAIN=api.devlab502.net
CORS_ORIGIN=https://feedback.devlab502.net
```

### GitHub Actions Secrets
```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

## Decision Log

| Decision | Reasoning |
|----------|-----------|
| PostgREST instead of custom backend | Zero backend code. Schema = API. |
| No user accounts | Lowest friction. Fingerprint-based dedup for upvotes. |
| No comment threads | Keeps the tool focused on feedback collection, not discussion. |
| Warm stone palette | Editorial aesthetic. Avoids cold grays and generic SaaS blue. |
| IBM Plex Mono for numbers | Data-dashboard feel. Contrast with serif headings makes numbers pop. |
| Inline styles | Prototype speed. Acceptable at this component count. |
| Cloudflare Workers (not Pages) | Matches all other devlab502 apps. |
| api.devlab502.net (shared) | One PostgREST instance serves only Feedback. No need for dedicated subdomain. |
| Caddy for reverse proxy | Auto-HTTPS with zero config. Simpler than nginx for a single-service proxy. |
| Cloudflare R2 for images | Zero egress fees. 10 GB free. Already using Cloudflare for DNS/CDN. |
| Dark mode default | Matches the editorial aesthetic and personal preference. |
