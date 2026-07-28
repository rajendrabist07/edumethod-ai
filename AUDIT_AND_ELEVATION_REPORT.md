# EduMethod AI Audit and Elevation Report

Date: 2026-07-29

## Phase 0 — Honest Audit

### Working Well

- The AI gateway centralizes Groq/Gemini routing, streaming, provider fallback, and telemetry logging instead of scattering model calls across the UI.
- Syllabus upload already chunks and embeds source material, and `/api/solve-doubt` retrieves pgvector context for cited answers when matching content exists.
- Clerk authentication is enforced on the main API routes, and server-side queries consistently scope records by `user_id`.
- Usage controls and rate limits exist for high-cost routes such as topic extraction, study path generation, quiz generation, and doubt solving.
- Flashcard review uses the SM-2 style spaced-repetition engine, and mastery scores are derived from repetitions/ease factor instead of static UI values.
- The core dashboard shell is responsive, uses the Prism component language, and has a mobile drawer layout.

### Broken or Fragile

- Repo-wide lint still fails because older files contain strict `no-explicit-any`, React Compiler hook warnings, and scratch-script issues.
- Next.js production builds require network access for Google Fonts through `next/font`; sandboxed offline builds fail unless fonts are cached or vendored.
- `/api/mastery-map` previously used random mastery values. This has been fixed to derive scores from flashcard review data.
- Monetization was previously UI-only and could mislead users. The fake Pro page and upgrade endpoint were removed.
- Teacher/cohort functionality depends on `role`, `cohorts`, and `cohort_members` database tables/policies being present in Supabase.
- Study Rooms use Supabase Realtime broadcast/presence and require Realtime to be enabled for the configured project.
- Background job route handlers exist for path and quiz generation, but QStash signature verification is still commented out and the main UI can still call synchronous generation paths.
- Browser voice mode depends on client Speech Recognition/Synthesis support and cannot be guaranteed on all browsers.

### Recommendations

- Fix now: Remove fake subscription surfaces. Completed, because monetization claims without payment infrastructure are product-risky.
- Fix now: Make mastery-map scoring deterministic. Completed, because random mastery values damage trust.
- Fix now: Keep transparent usage quotas. Completed, because AI cost controls are necessary before launch.
- Fix next: Resolve repo-wide lint debt. It is not blocking production build today, but it will slow future maintenance and CI adoption.
- Fix next: Vendor or self-host fonts. This removes network dependency from production builds and improves deployment repeatability.
- Fix next: Enable QStash signature verification and route heavy generation through the job endpoints consistently.
- Fix later: Full RBAC migrations and cohort analytics. The UI exists, but production readiness depends on database policies and teacher workflows.

## Phase 1 — Brand, Icons, Favicon

- Existing logo, icon components, favicon files, Apple touch icon, Android icons, and maskable icon are present.
- `public/manifest.json` now references 16x16, 32x32, 180x180, 192x192, 512x512, and maskable icons.
- Custom React icons exist under `components/icons/` for the requested navigation and learning surfaces.

Responsive check: icon assets are fixed-format and used through responsive containers. Build verified.

## Phase 2 — Responsive UI/UX Pass

- Removed the misleading pricing surface.
- Added tutor effort controls directly inside the Doubt Solver composer.
- Reworked Doubt Solver background away from heavy decorative blur layers.
- Sidebar navigation now exposes Mastery Map, Study Rooms, and Cohorts without hidden routes.
- Mastery Map uses graph view from tablet/desktop and list view below `md`, matching the prompt requirement.

Responsive check:
- 375px: Mastery Map collapses to list cards; sidebar closes on navigation.
- 768px: graph route uses the graph canvas only at `md` and above.
- 1280px+: graph and dashboard layouts have multi-column surfaces.

## Phase 3 — Backend Power-Up

- Existing RAG path is preserved: upload material is chunked/embedded and solve-doubt retrieves matching syllabus chunks.
- Existing cache layer is preserved for repeated study plan and quiz generations.
- Background job endpoints exist for path and quiz generation; production hardening still requires QStash signature verification.
- Usage metering remains visible through dashboard/sidebar quota UI.
- `/api/mastery-map` now calculates mastery from flashcards instead of random values.

Remaining risk: the formal Retriever → Strategist → Generator → Verifier → Logger pipeline is not fully split into separate modules yet.

## Phase 4 — New Capability

- Mastery Map route is implemented and connected in navigation.
- Study Rooms route exists using Supabase Realtime presence/broadcast.
- Onboarding route exists for first-time role selection.
- Cohort route exists behind `RoleGuard` for teacher/admin users.

Remaining risk: RBAC and cohort features require matching Supabase tables and RLS policies in the deployed database.

## Phase 5 — SEO and Social Presence

- Public metadata, robots, sitemap, manifest, and dynamic OG image route are present.
- Private dashboard routes are disallowed in robots.
- Pricing/subscription claims were removed from README and active app routes.

## Verification

- `npx vitest run`: passing.
- `npm run build`: passing with network access for Google Fonts.
- `npm run lint`: still failing on existing strict lint debt, mostly unrelated legacy `any` and React Compiler rules. Production TypeScript build passes.
