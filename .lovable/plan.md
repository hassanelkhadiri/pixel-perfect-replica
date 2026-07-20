
# Creative Agency OS — MVP Plan

Scope for this build: Modules 1–4 (Dashboard, Project Creation, Workflow Engine, Review Gates). Later modules (revisions, asset library, knowledge base, QC, delivery, analytics, career growth) are deferred to follow-up rounds.

## Design direction

Dark, premium, Linear/Framer/Raycast inspired:
- Near-black background (`oklch(0.15 0.01 260)`), elevated surfaces at `oklch(0.19 0.01 260)`, hairline borders at 8% white.
- Accent: cool electric indigo `oklch(0.68 0.19 265)`; success/warn/danger tokens for review states.
- Typography: Inter (body) + Instrument Serif for module titles/hero — via `<link>` in `__root.tsx`.
- Rounded-2xl cards, subtle glass on top bar, smooth 150–250ms transitions, generous spacing.
- Persistent left sidebar (collapsible) + top bar with breadcrumbs + `⌘K` command palette stub.

All colors as semantic tokens in `src/styles.css` (`--background`, `--surface`, `--surface-2`, `--accent`, `--success`, `--warning`, `--danger`, etc.).

## Backend (Lovable Cloud)

Enable Lovable Cloud with email/password + Google auth.

**Schema (migration):**
- `profiles` (id → auth.users, display_name, avatar_url) + auto-create trigger.
- `app_role` enum: `director`, `designer`, `editor`.
- `user_roles` (user_id, role) + `has_role()` security-definer helper.
- `projects` (id, client, brand, campaign, platform, deliverables[], deadline, priority, objective, audience, brief, notes, discipline `designer|editor`, current_stage, status, created_by, assigned_to, created_at).
- `project_stages` (id, project_id, stage_key, order, status `locked|active|in_review|approved|rejected|revision`, started_at, submitted_at, decided_at, notes).
- `stage_checklist_items` (id, stage_id, label, done).
- `reviews` (id, stage_id, reviewer_id, action `approve|reject|revision|comment`, comment, priority, created_at).
- `ai_briefs` (id, project_id, summary, risks[], questions[], suggested_timeline, suggested_workflow).

**RLS:**
- Directors: full read/write on projects, stages, reviews.
- Designers/Editors: read/write their assigned projects + stages; can submit stages for review, cannot approve.
- Roles in `user_roles` only (never on profiles). Use `has_role()` in policies.

**Server functions (`src/lib/*.functions.ts`):**
- `createProject` — inserts project + generates stages for the chosen discipline (designer or editor workflow from the spec).
- `submitStageForReview`, `decideReview` (director-only via `has_role`), `updateChecklistItem`, `advanceStage` (enforces locked progression; unlocks next only after approval).
- `generateBriefInsights` — Lovable AI (`google/gemini-3.5-flash`) with structured output → risks, questions, timeline, deliverables, workflow suggestions.

## Routes

```text
/                       Public landing (marketing hero → "Sign in")
/auth                   Email/password + Google
/_authenticated/dashboard        Module 1 — Dashboard (default post-login)
/_authenticated/projects/new     Module 2 — Project Creation wizard + AI brief
/_authenticated/projects/$id     Module 3 — Workflow Engine (stage timeline + active stage panel)
/_authenticated/projects/$id/review/$stageId   Module 4 — Review Gate (director)
```

`src/routes/index.tsx` becomes the real landing (replacing placeholder).

## Module details

**1. Dashboard**
- Active projects, waiting-for-review queue (directors), today's tasks (active stages assigned to me), upcoming deadlines, recent feedback, weekly progress bar, streak + personal score (derived from approved-stage count), notifications feed.
- Quick actions: New Project, Continue Project, AI Assistant (opens ⌘K), Knowledge Base (stub link).

**2. Project Creation**
- Multi-section form (Client/Brand/Campaign/Platform, Deliverables tags, Deadline+Priority, Objective+Audience, References URLs, Brief textarea, Notes).
- On submit → create project → call `generateBriefInsights` → show AI summary panel (risks, questions, timeline, workflow) → confirm to seed stages.

**3. Workflow Engine**
- Left rail: stage list with lock/active/review/approved icons.
- Main panel for active stage: objective, deliverables, time estimate, checklist (interactive), required files (upload placeholder), common mistakes, senior tips, AI coach (inline chat via server fn), examples.
- "Submit for Review" button (only when checklist complete). Locked progression enforced server-side.

**4. Review Gates**
- Director view: side-by-side of stage submission + comment thread.
- Actions: Approve, Reject, Needs Revision (+ priority + comment). Approve unlocks next stage; Reject/Revision returns stage to designer with feedback.
- Voice notes: UI-only placeholder button.

## Technical notes

- TanStack Start file-based routes; protected routes under `_authenticated/` (integration-managed gate).
- TanStack Query loaders + `useSuspenseQuery` for reads; `useMutation` + invalidation for writes.
- AI: Lovable AI Gateway via `createLovableAiGatewayProvider` in `src/lib/ai-gateway.server.ts`; server fn `summarizeBrief` returns structured object via `Output.object`.
- Sample content: seed a demo Director role for the first user who signs up (role assignment UI in a later round; for MVP, first user = director, subsequent = designer by default; changeable via DB).
- No localStorage persistence — all state in Cloud.

## Out of scope for this round

Revision version history, asset library, knowledge base lessons/quizzes, quality-control export gating, delivery packaging, analytics dashboards, career growth levels. These can each be a follow-up build once the core loop is validated.
