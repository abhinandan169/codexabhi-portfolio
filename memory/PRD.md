# Abhinandan Kumar — Portfolio (Product Requirements Document)

## Original Problem Statement
Create a modern, professional, premium, fully responsive Software Engineer portfolio for Abhinandan Kumar with a full admin dashboard for content management.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + Recharts + Sonner + Lucide + react-type-animation
- **Backend**: FastAPI + Motor + JWT + bcrypt + aiofiles
- **Storage**: MongoDB + local `/app/backend/uploads/` served via `/api/uploads/{fname}`
- **Routes**: `/` (public), `/admin/login`, `/admin` (dashboard)

## Sessions Completed

### Session 1 (2026-07-08) — MVP
Hero (typing animation, 5 CTAs), About, Skills (animated bars), Projects (featured), Certificates, Education, Resume, Hire Me, Contact form, Floating buttons, Navbar w/ smooth scroll, full Admin dashboard v1 with CRUD tabs, file upload, JWT auth, SEO meta base.

### Session 2 (2026-07-10) — Extended Admin v1
Overview tab (stat cards + recent activity), Appearance (theme customizer with 6 presets + light/dark), Settings (email/password w/ token invalidation), Backup & Restore (JSON), Activity Log (audit trail). Global CSS-variable-driven theming.

### Session 12 (2026-07-22) — Social Links Mobile Responsiveness
- Applied the same responsive-table pattern to `SocialTab.jsx`: table wrapped in `<div className='overflow-x-auto'>` with `min-w-[520px]`; Platform + Actions cells use `whitespace-nowrap`; URL cell uses `max-w-[220px] sm:max-w-md truncate` so long URLs ellipsize instead of pushing action buttons off-screen.
- Verified: iteration_15.json — frontend 100%, no page-level overflow, edit/delete buttons reachable via inner scroll, add/edit form usable on 390px, desktop layout unchanged, 15-tab regression clean.

### Session 11 (2026-07-22) — Admin Dashboard Mobile Responsiveness
- **Skills tab**: table wrapped in `<div className='overflow-x-auto'>` with `min-w-[560px]` — Actions column no longer clipped on <640px; page never overflows horizontally.
- **Activity Log**: same pattern with `min-w-[640px]`; Action cell restructured with a proper flex container; Date/Time cells use `whitespace-nowrap` so date+time never wrap mid-value.
- **Certificates**: title row now `flex-wrap` + h3 `min-w-0 break-words`; Draft badge stays inside the card even with very long titles; action row icons `flex-shrink-0` so edit/delete remain fully visible.
- Desktop layout unchanged (no horizontal scroll on 1440 for either table; card grid stays 3-col on lg).
- Tested: iteration_14.json — frontend 100%, 15 admin tabs regression clean, zero console errors.

### Session 10 (2026-07-22) — HireMe Heading Visibility Fix
- **Root cause**: global `h1..h6 { color: var(--text) }` set headings to the theme's primary text color. On the light theme that's `#111` — identical to the HireMe banner's `#111111` background — so the white heading text was invisible.
- **Fix (2 lines)**: (a) `index.css` — h1..h6 now use `color: inherit` so wrapper `text-white` cascades correctly; `body { color: var(--text) }` still applies theme text color to all normal sections through inheritance. (b) `HireMe.jsx` — removed the forced `<br className="hidden sm:block">`, added `text-wrap: balance` for natural balanced wrapping, wrapped the red accent in `whitespace-nowrap` so "quality code?" never breaks mid-phrase.
- Verified white heading at 360/390/640/768/1024/1440 viewports, zero horizontal overflow, dark-on-light headings preserved in all other sections. iteration_13.json — frontend 100%.

### Session 9 (2026-07-22) — Production Optimization Pass
- **SEO cleanup**: reset stale `site-seo` doc that had `TEST_desc` / `OG` / `example.com` from earlier iteration testing. Production values now applied (title, meta_description, og_title, canonical_url = deployed URL).
- **Sitemap fallback**: `/api/sitemap.xml` now falls back to `PUBLIC_APP_URL` env when canonical_url is empty or contains `example.com`, so the sitemap always advertises a valid URL to crawlers.
- **index.html**: added `<link rel="canonical">` and `<link rel="sitemap">` tags for better SEO discovery.
- **Lazy loading polish**: added `loading="lazy"` to remaining admin images (CertificatesTab, TestimonialsTab, ProjectsTab screenshots, FileUpload preview).
- Full CMS validation: iteration_11.json (backend 25/25, frontend 14/14 tabs, GlobalSearch verified) + iteration_12.json (SEO/sitemap retest 6/6). Zero console/runtime errors.

### Session 8 (2026-07-22) — UI/UX Polish (No Redesign)
- **Focus-visible accent ring**: global `:focus-visible` rule adds a 2px accent-color outline (with 2px offset) on every interactive element (a, button, [role=button/switch/tab/menuitem], summary, select, textarea, inputs). Mouse users see no ring; keyboard/AT users get a clear indicator on every control on both portfolio + admin. `.input-x` opts out to preserve its existing glow.
- **Reduced motion (a11y)**: new `@media (prefers-reduced-motion: reduce)` block mirrors the existing admin toggle — animations/transitions drop to 0.001s, `.reveal` items become instantly visible, `.animate-spin` slows to 3s so loaders stay meaningful, `.animate-ping` disabled.
- **Button pressed state**: added `.btn-primary:active` + `.btn-secondary:active` — buttons visibly "press" (translateY(0) with tighter shadow) for a responsive feel; disabled state shadow suppressed.
- **Card shadow depth**: layered two-shadow at rest + hover (crisper edge + softer ambient). `theme.jsx` `shadowMap` also updated to layered values so runtime theme intensity respects the polish (was flattening it before).
- **Skeleton utility**: added `.skeleton` class with subtle pulse — available for future loading states.
- Tested: iteration_9.json (comprehensive) + iteration_10.json (targeted shadow retest) — frontend 100%.

### Session 7 (2026-07-22) — Draft/Publish, Auto-save & Forgot Password
- **Draft/Publish**: added `status: "published" | "draft"` field to Projects, Certificates, Experience, Education, Skills, Testimonials models. Public GET endpoints filter out drafts unless the request carries a valid admin JWT (`is_admin_request` helper). Admin dashboard fetches include drafts automatically because the axios client always attaches the admin token.
- **Publish/Unpublish**: new `StatusPill` component + row-level toggle button on all 6 admin tabs. Draft badge on list items; pill toggle in the edit form. No data loss when switching state.
- **Auto-save**: new `useAutoSave` hook (1.5s idle debounce) wired to each of the 6 edit forms. `AutoSaveStatus` renders Saving… / Saved / error next to the existing Save button (Save button unchanged).
- **Forgot Password**: new `/admin/forgot-password` + `/admin/reset/:token` pages, "Forgot password?" link on login. Backend endpoints `POST /api/auth/forgot-password`, `GET /api/auth/reset/{token}`, `POST /api/auth/reset-password`. Token stored in Mongo `password_resets` with expiry (`RESET_TOKEN_TTL_MINUTES` env, default 30), single-use, invalidates all other pending tokens for the same email on success, bumps `token_version` to invalidate existing JWT sessions. Sends via Resend when `RESEND_API_KEY` is real; falls back to returning `debug_reset_url` inline + logs to Activity when the API key is a placeholder — recovery still works.
- New dependency: `resend>=2.0.0`.
- Tested: iteration_8.json — backend 10/10, frontend 100%.

### Session 6 (2026-07-22) — Social Icon Mapping Bug Fix
- **Shared brand icon map**: new `/app/frontend/src/lib/socialIcons.js` centralises platform → brand icon mapping using `lucide-react` + `react-icons/si`. Covers GitHub, LinkedIn, X/Twitter, HackerRank, Codeforces, LeetCode, CodeChef, GeeksforGeeks, HackerEarth, Kaggle, Stack Overflow, WhatsApp, Telegram, Discord, Instagram, Facebook, YouTube, Twitch, Reddit, Medium, Dev.to, Substack, Dribbble, Behance, Figma, Notion, Google Scholar, Play Store, Spotify, Threads, Mastodon, Snapchat, TikTok, Pinterest, GitLab, Bitbucket, Email, Website — generic fallback for unknown.
- **Footer**, **CodingProfiles**, and **FloatingButtons** all now consume the shared map — Footer no longer shows the generic message-circle for HackerRank/Codeforces/LeetCode/etc.
- Added dependency `react-icons@5.7.0`.
- Tested: iteration_7.json — frontend 100%, no regressions, footer↔coding-profiles icon parity confirmed byte-for-byte.

### Session 5 (2026-07-18) — GitHub/LiveInfo Bug Fixes
- **GitHub Stats + Top Languages**: replaced flaky external SVG services with native rendering via public GitHub API (`api.github.com`). Stats card shows avatar, name, and 5 tiles (repos, stars, followers, following, gists). Top Languages aggregates non-fork repo languages into a horizontal bar + legend with authentic GitHub language colors.
- **Contribution Calendar**: rewritten as native SVG using `github-contributions-api.jogruber.de/v4`. Uses official GitHub green scale (light: `#ebedf0`→`#216e39`, dark: `#161b22`→`#39d353`). Empty cells have a subtle 1px border for visibility. Includes month + weekday labels, hover tooltips, and Less→More legend.
- **Section Visibility**: added `GitHub Activity` and `Live Info Card` toggles under a new "Widgets" sub-section. Save writes to both `/admin/sections` and `/admin/widgets` atomically.
- **LiveInfo Manager**: exposed `show_on_mobile` and `dismissible` toggles (backend defaults added). Card now respects mobile visibility and can hide its close button per admin choice.
- Tested: iteration_6.json — backend 100%, frontend 100%.

### Session 4 (2026-07-18) — Widget Managers
- **GitHub Activity Manager** (admin tab under "Widgets"): connect/disconnect GitHub username with live verification against GitHub API, enable/disable section, auto-refresh toggle, manual "Refresh now" (updates `last_sync`), and per-sub-widget toggles (Calendar, Stats, Streak, Top Languages). Portfolio `GitHubActivity` component consumes `/api/widgets`.
- **Live Info Card Manager** (admin tab under "Widgets"): enable/disable floating card, choose Bottom Left/Right position, pulse animation toggle, refresh interval selector (10/15/30/60s), and per-metric visibility toggles (Online / Visitors / Views / Last Updated). Portfolio `LiveInfo` component consumes `/api/widgets`.
- Backend: new `site-widgets` MongoDB doc with `github` + `live_info` sub-configs, `GET /api/widgets` (public), `PUT /api/admin/widgets` (JWT), `POST /api/admin/github/sync` (JWT).
- Tested: iteration_5.json — backend 100% (5/5 pytest), frontend 100% (Playwright E2E).

### Session 3 (2026-07-10) — Extended Admin v2 (Professional Extensions)
- **Advanced Analytics**: /api/analytics/track (public) + /api/admin/analytics with Line/Bar/Pie charts (Recharts). Tracks total/today/week/month views, downloads, contact submissions, unique/returning visitors, devices, browsers, traffic sources, most-viewed project.
- **SEO Manager**: title, meta_title/description, keywords, canonical, og:*, twitter card, robots, google/bing verification, favicon. Auto-applies via meta tags on portfolio load. /api/robots.txt & /api/sitemap.xml endpoints.
- **Media Library**: List/grid/list view, drag & drop upload, delete, rename, copy URL, search, storage usage.
- **Section Visibility Manager**: Toggle switches for Hero/About/Counters/Skills/Projects/Experience/Certificates/Education/Testimonials/Resume/HireMe/Contact/Footer.
- **Project Category System**: 15 categories, pinned + hidden fields, homepage filter buttons, category filter/sort/visibility filter in admin, bulk-delete.
- **Testimonials CMS**: photo, name, company, role, rating, review, LinkedIn URL, order, featured. Portfolio shows animated carousel with dots + prev/next.
- **Experience CMS**: company, role, employment type, dates, currently_working, description, tech, logo. Portfolio shows professional timeline.
- **Achievement Counters**: 6 default counters, admin CRUD. Portfolio shows animated numbers (IntersectionObserver-triggered).
- **Notification Center**: badge on sidebar+bell, mark read/read all/delete/clear all. Auto-populated by contact, resume download, backup, password change, theme, project/certificate additions.
- **Global Search**: Cmd/Ctrl+K modal that searches projects, skills, certificates, education, experience, testimonials, social links, messages.
- **Security**: Login rate limiter (5 attempts / 5 minutes → 429), password change invalidates all sessions.
- **Performance**: Image lazy-loading on all portfolio & admin images.

## Core Features (all implemented + tested)
- Public portfolio with 13 sections + floating buttons
- Admin dashboard with 22 tabs across 5 groups (Dashboard, Content, Site, Widgets, System)
- Theme customization + dark mode + section visibility
- Full CRUD everywhere with confirm dialogs, toasts, validation, Cancel buttons
- Contact form with analytics + notifications
- Drag & drop uploads + Media Library
- SEO auto-applied
- Analytics tracking on views/projects/downloads/submits

## Test Status
- Backend: 33/34 tests passing (iter1 13/13 + iter2 15/16 + iter5 5/5) — login limiter bug from iter2 fixed post-report
- Frontend: 100% of tested flows (iter5 confirmed no regression across pre-existing tabs)

## Backlog / Future Enhancements
- Split server.py into routers (auth, content, admin_ops, media, analytics)
- Replace in-memory login limiter with Redis for multi-worker scale
- Mongo aggregation pipelines for analytics as event volume grows
- De-dup notifications by kind with cooldown
- Migrate to Supabase (user's stated preference)
- CSV export
- Blog section
