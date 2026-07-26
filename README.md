# KWASU Course Allocation System — Build Specification

This document is the single source of truth for building this system. It is written
for an AI coding agent. Do not invent pages, fields, libraries, or behavior that
aren't specified here. Where something is genuinely ambiguous, prefer the simplest
interpretation consistent with this document over adding new scope.

---

## 1. What this system is

A departmental course allocation system for a university department. It replaces an
informal, meeting-based process for assigning lecturers to courses with a
preference-based, algorithmic allocation engine (a capacity-aware adaptation of the
Gale-Shapley stable matching algorithm), reviewed and approved by a Head of
Department (HOD) before being finalized. It also includes light integration with the
student course-registration side (showing lecturer names once allocation is
finalized, and timetable clash detection).

**Four user roles:** `ADMIN`, `HOD`, `LECTURER`, `STUDENT`.

**Core principle:** the algorithm proposes, the HOD disposes. Nothing is
auto-finalized. Every allocation passes through a draft → review → approve
lifecycle.

---

## 2. Tech stack (exact)

This is a single **Next.js monorepo** — one app, frontend and backend together.
Do not split into separate frontend/backend projects or repos.

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Both pages (React Server/Client Components) and API live in one app. Use `app/` directory, not `pages/` directory. |
| Language | **TypeScript** | Strict mode on. No `.js` files in `app/`, `lib/`, `components/`. |
| Database | **PostgreSQL** | Assume a connection string is provided via `DATABASE_URL` env var. |
| ORM | **Prisma** | `prisma` + `@prisma/client`. Schema lives in `prisma/schema.prisma`. Use Prisma Migrate for schema changes, never hand-write SQL migrations. |
| Auth | **Custom JWT (stateless)** | `jsonwebtoken` for signing/verifying, `bcryptjs` for password hashing. Token stored in `localStorage` on the client, sent as `Authorization: Bearer <token>` header on every API call. **Do not use NextAuth/Auth.js** — it defaults to session/cookie patterns and would conflict with the stateless JWT requirement. |
| Styling | **TailwindCSS** | Utility classes only. No CSS Modules, no styled-components. |
| UI primitives | **shadcn/ui** (button, input, select, dialog, table, tabs, badge, toast/sonner, dropdown-menu, card) | Installed via the shadcn CLI, not npm — components get copied into `components/ui/`. Mention to the user when a shadcn component is used, per shadcn convention. |
| Forms | **react-hook-form** + **zod** (`@hookform/resolvers`) | Every form uses this combination. Validate on both client (zod schema) and server (same zod schema, re-imported). |
| Charts | **recharts** | Used for the HOD workload-balance visualization and the analytics dashboard. |
| Icons | **lucide-react** | |
| Dates | **date-fns** | For session labels, notification timestamps, timetable slot comparison. |
| PDF export | **@react-pdf/renderer** or a server-side HTML-to-PDF approach (`puppeteer` if available in the environment; otherwise generate a clean printable HTML report page and let the browser's print-to-PDF handle it) | Used for the exportable allocation report. If `puppeteer` isn't practical in the target environment, implement the printable-HTML-page fallback and note this clearly in code comments — do not silently skip the feature. |
| CSV export | Plain string-building (no library needed) | Simple enough not to need `papaparse` on the server side. |
| Notifications (in-app) | Custom `Notification` DB model + polling or simple refetch-on-navigation | No websockets required. Poll every 30s on relevant pages, or refetch on mount — either is acceptable. |
| Email | **Mocked** — see Section 8 | No real SMTP/Nodemailer integration. |
| AI teaching guide | **Mocked** — see Section 8 | No real LLM API call. |
| Testing | **Vitest** for unit tests (algorithm), **Playwright** (optional, if time allows) for a couple of end-to-end smoke tests | The algorithm unit tests are the non-negotiable minimum — see Section 10. |

**Version pinning — do not use "latest" blindly.** Run
`npx create-next-app@14` (not `@latest`) to avoid pulling in Next.js 15 or a
Tailwind v4 pre-release, both of which have breaking changes relative to the
patterns described in this document (Tailwind v4's config format differs from v3,
and shadcn/ui's setup instructions differ between the two). Target: **Next.js
14.x, React 18.x, TailwindCSS 3.x, Prisma 5.x**. If any of these majors are
unavailable in the build environment, note the substitution explicitly in a
`VERSIONS.md` file rather than silently upgrading and hoping the rest of this
document's instructions still apply unchanged.

**UI/UX principle (applies to every page in Section 7):** every screen should be
reachable in as few clicks as possible, use shadcn defaults rather than custom
one-off styling, and never expose the allocation algorithm's internal complexity
(scoring, proposal/rejection mechanics) to HOD or lecturer users — they see inputs
(preferences, weights) and outputs (a draft table, a workload chart), never the
algorithm's intermediate steps. This is a stated non-functional requirement, not a
suggestion — the write-up (Section 2.2.2 / 4.2.5) commits to this explicitly.

### Color palette (exact — flat, no gradients anywhere)

Brand color is institutional green, reflecting KWASU's official identity as
"the Green University." All colors are flat/solid — never use gradients,
drop shadows, or glow effects anywhere in the UI.

**Primary — brand green** (buttons, active nav, links, primary CTAs)
| Stop | Hex | Use |
|---|---|---|
| 50 | `#EAF3EA` | Subtle backgrounds, hover fills |
| 100 | `#CCE3CD` | Light badges/tags |
| 200 | `#A3CCA6` | Borders on light green surfaces |
| 300 | `#74B078` | Secondary accents |
| 400 | `#4B934F` | Icons, secondary buttons |
| **500** | **`#2E7830`** | **Primary brand color — main buttons, active states, links** |
| 600 | `#256226` | Hover/pressed state for primary buttons |
| 700 | `#1D4D1F` | Text on light green backgrounds |
| 800 | `#163A17` | Dark mode surfaces |
| 900 | `#0F280F` | Darkest — rarely used |

**Neutral — warm gray** (all body text, borders, card backgrounds — never blue-gray)
| Stop | Hex |
|---|---|
| 50 | `#F7F8F5` |
| 100 | `#EDEFE9` |
| 200 | `#DBDFD3` |
| 300 | `#C0C6B5` |
| 400 | `#9CA491` |
| 500 | `#767F6C` |
| 600 | `#58604F` |
| 700 | `#40463A` |
| 800 | `#2A2E26` |
| 900 | `#171913` |

**Accent — gold** (sparing use only: active tab underline, "featured" badges — do not use as a second primary color)
| Stop | Hex |
|---|---|
| 500 | `#C99A2E` |
| 600 | `#A67D1F` |
| 700 | `#7D5E17` |

**Status colors** (allocation states — deliberately distinct from brand green so "Approved" doesn't visually blend into the rest of the UI)
| State | Hex |
|---|---|
| Draft | `#4A6FA5` |
| Approved | `#256226` |
| Flagged | `#C2740A` |
| Conflict | `#B3261E` |


**Rule for the agent:** use `primary` for brand elements, `neutral` for text/
borders/surfaces, `accent` sparingly (never as a second CTA color), and
`status` colors only for allocation status badges/indicators — never
substitute `primary`-green for a status badge, since "Approved" already
uses green and everything else needs to read as visually distinct from it.
---

## 3. Folder structure (exact)

```
kwasu-course-allocation/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing page (public)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── admin/
│   │   ├── layout.tsx                    # Admin shell (sidebar), guards role=ADMIN
│   │   ├── dashboard/page.tsx
│   │   ├── departments/page.tsx
│   │   ├── courses/page.tsx
│   │   ├── courses/new/page.tsx
│   │   ├── courses/[id]/edit/page.tsx
│   │   ├── lecturers/page.tsx
│   │   ├── lecturers/[id]/page.tsx
│   │   ├── sessions/page.tsx
│   │   ├── settings/page.tsx
│   │   └── audit-log/page.tsx
│   ├── hod/
│   │   ├── layout.tsx                    # HOD shell, guards role=HOD
│   │   ├── dashboard/page.tsx
│   │   ├── allocation/run/page.tsx
│   │   ├── allocation/review/page.tsx
│   │   ├── allocation/history/page.tsx
│   │   ├── reports/page.tsx
│   │   └── analytics/page.tsx
│   ├── lecturer/
│   │   ├── layout.tsx                    # Lecturer shell, guards role=LECTURER
│   │   ├── dashboard/page.tsx
│   │   ├── preferences/page.tsx
│   │   ├── allocations/page.tsx
│   │   ├── allocations/[id]/teaching-guide/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── profile/page.tsx
│   ├── student/
│   │   ├── layout.tsx                    # Student shell, guards role=STUDENT
│   │   ├── dashboard/page.tsx
│   │   ├── courses/page.tsx
│   │   ├── register/page.tsx
│   │   └── my-courses/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   └── me/route.ts
│       ├── departments/route.ts
│       ├── departments/[id]/route.ts
│       ├── courses/route.ts
│       ├── courses/[id]/route.ts
│       ├── lecturers/route.ts
│       ├── lecturers/[id]/route.ts
│       ├── lecturers/[id]/approve/route.ts
│       ├── sessions/route.ts
│       ├── sessions/[id]/activate/route.ts
│       ├── preferences/route.ts
│       ├── allocation/run/route.ts
│       ├── allocation/draft/route.ts
│       ├── allocation/[id]/route.ts
│       ├── allocation/[id]/approve/route.ts
│       ├── allocation/[id]/flag/route.ts
│       ├── allocation/conflicts/route.ts
│       ├── settings/route.ts             # allocation weight config (SystemConfig) — see Section 7.2
│       ├── notifications/route.ts
│       ├── notifications/[id]/read/route.ts
│       ├── notifications/send-reminders/route.ts
│       ├── teaching-guide/[allocationId]/route.ts
│       ├── audit-logs/route.ts
│       ├── reports/export/route.ts
│       ├── student/registrations/route.ts
│       ├── student/registrations/[id]/route.ts
│       └── analytics/route.ts
├── components/
│   ├── ui/                               # shadcn components live here
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── role-guard.tsx
│   ├── allocation/
│   │   ├── workload-bar-chart.tsx
│   │   ├── draft-allocation-table.tsx
│   │   ├── conflict-badge.tsx
│   │   └── allocation-status-badge.tsx
│   ├── forms/
│   │   ├── course-form.tsx
│   │   ├── lecturer-preference-form.tsx
│   │   └── login-form.tsx
│   └── notifications/
│       └── notification-bell.tsx
├── lib/
│   ├── auth/
│   │   ├── jwt.ts                        # sign/verify helpers
│   │   ├── password.ts                   # bcrypt hash/compare helpers
│   │   └── session.ts                    # getCurrentUser(req) helper for API routes
│   ├── allocation/
│   │   ├── scoring.ts                    # weighted course-side preference scoring
│   │   ├── galeShapley.ts                # the matching algorithm itself
│   │   ├── conflicts.ts                  # post-processing conflict detection
│   │   └── __tests__/
│   │       └── galeShapley.test.ts
│   ├── mock/
│   │   ├── teachingGuide.ts              # mocked teaching-guide generator
│   │   └── email.ts                      # mocked email "sender" (logs + stores)
│   ├── prisma.ts                         # Prisma client singleton
│   ├── validation/                       # zod schemas, one file per resource
│   │   ├── course.ts
│   │   ├── lecturer.ts
│   │   ├── preference.ts
│   │   └── auth.ts
│   └── utils.ts
├── middleware.ts                         # route protection at the edge (checks JWT presence, not full verification)
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Database schema (Prisma — exact)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  HOD
  LECTURER
  STUDENT
}

enum AllocationStatus {
  DRAFT
  APPROVED
  FLAGGED
  RESOLVED
}

enum FlagStatus {
  OPEN
  RESOLVED
  DISMISSED
}

model Department {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  createdAt DateTime @default(now())

  users   User[]
  courses Course[]
}

model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         Role
  level        Int?                          // STUDENT only: 100/200/300/400. Null for other roles.
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  isApproved   Boolean  @default(false)   // lecturers/HODs require admin approval before login works
  createdAt    DateTime @default(now())

  lecturerProfile      LecturerProfile?
  studentRegistrations StudentRegistration[]
  notifications        Notification[]
  auditLogs            AuditLog[]           @relation("ActorLogs")
  approvedAllocations  Allocation[]         @relation("ApprovedBy")
}

model SystemConfig {
  key   String @id   // e.g. "allocation_weight_w1"
  value String       // stored as string, parse to number/JSON as needed on read
}

model LecturerProfile {
  id             String  @id @default(uuid())
  userId         String  @unique
  user           User    @relation(fields: [userId], references: [id])
  specialization String                     // free-text tag, matched against Course.specializationTag
  seniorityRank  Int     @default(1)        // 1 = lowest, higher = more senior; used in scoring
  maxLoadUnits   Int     @default(12)        // default max course-units per session

  preferences LecturerPreference[]
  allocations Allocation[]
  flags       AllocationFlag[]
}

model AcademicSession {
  id        String   @id @default(uuid())
  label     String                          // e.g. "2024/2025"
  semester  String                          // "First Semester" | "Second Semester"
  isActive  Boolean  @default(false)         // only one session should be active at a time
  createdAt DateTime @default(now())

  preferences   LecturerPreference[]
  allocations   Allocation[]
  registrations StudentRegistration[]
}

model Course {
  id                 String  @id @default(uuid())
  code               String                  // e.g. "CSC 401"
  title              String
  units              Int
  level              Int                     // 100, 200, 300, 400
  semester            String                  // "First Semester" | "Second Semester" — must match the
                                               // active AcademicSession.semester for a course to be shown
                                               // to students; see Section 7.5 note.
  departmentId       String
  department         Department @relation(fields: [departmentId], references: [id])
  specializationTag  String                  // used for scoring against LecturerProfile.specialization
  capacity           Int     @default(1)     // number of lecturer slots (usually 1)
  timeSlot           String?                 // free-text or structured e.g. "Mon 10:00-12:00" — see note below
  createdAt          DateTime @default(now())

  @@unique([code, departmentId])

  preferences   LecturerPreference[]
  allocations   Allocation[]
  registrations StudentRegistration[]
}

// DELETION POLICY (applies to Course and LecturerProfile deletion in the API,
// enforce in application code, not via Prisma onDelete, since the correct
// behavior is to BLOCK deletion rather than cascade or silently null out
// historical records):
// - DELETE /api/courses/[id] must first check for any existing LecturerPreference,
//   Allocation, or StudentRegistration rows referencing this course, and return a
//   409 error ("Cannot delete a course with existing preferences/allocations/
//   registrations") rather than attempting the delete. Deleting historical
//   allocation data would break the audit trail.
// - The same block-rather-than-cascade rule applies to deleting a LecturerProfile
//   that has any Allocation or LecturerPreference rows.
// - Admin/HOD accounts have no delete UI at all in this system's scope (see
//   Section 5, note on account lifecycle) — only lecturer approval is supported.

model LecturerPreference {
  id         String   @id @default(uuid())
  lecturerId String
  lecturer   LecturerProfile @relation(fields: [lecturerId], references: [id])
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id])
  sessionId  String
  session    AcademicSession @relation(fields: [sessionId], references: [id])
  rank       Int                          // 1 = most preferred
  createdAt  DateTime @default(now())

  @@unique([lecturerId, courseId, sessionId])
}

model Allocation {
  id         String   @id @default(uuid())
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id])
  lecturerId String
  lecturer   LecturerProfile @relation(fields: [lecturerId], references: [id])
  sessionId  String
  session    AcademicSession @relation(fields: [sessionId], references: [id])
  status     AllocationStatus @default(DRAFT)
  hasConflict Boolean @default(false)
  allocatedAt DateTime @default(now())
  approvedById String?
  approvedBy   User?  @relation("ApprovedBy", fields: [approvedById], references: [id])
  approvedAt   DateTime?
  checklistState String? @db.Text            // JSON-stringified boolean array for the lecturer's teaching checklist (see Section 7.4)

  @@unique([courseId, lecturerId, sessionId])

  flags          AllocationFlag[]
  teachingGuide  TeachingGuide?
  notifications  Notification[]
}

model AllocationFlag {
  id           String   @id @default(uuid())
  allocationId String
  allocation   Allocation @relation(fields: [allocationId], references: [id])
  raisedById   String
  raisedBy     LecturerProfile @relation(fields: [raisedById], references: [id])
  reason       String
  status       FlagStatus @default(OPEN)
  createdAt    DateTime @default(now())
}

model StudentRegistration {
  id        String   @id @default(uuid())
  studentId String
  student   User     @relation(fields: [studentId], references: [id])
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
  sessionId String
  session   AcademicSession @relation(fields: [sessionId], references: [id])
  createdAt DateTime @default(now())

  @@unique([studentId, courseId, sessionId])
}

model TeachingGuide {
  id           String   @id @default(uuid())
  allocationId String   @unique
  allocation   Allocation @relation(fields: [allocationId], references: [id])
  content      String   @db.Text            // mocked generated content, stored as markdown/plain text
  generatedAt  DateTime @default(now())
}

model Notification {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  allocationId String?
  allocation   Allocation? @relation(fields: [allocationId], references: [id])
  type         String                        // "ALLOCATION_ASSIGNED" | "CLASS_REMINDER" | "FLAG_RESOLVED" | etc.
  message      String
  read         Boolean  @default(false)
  createdAt    DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String
  actor      User     @relation("ActorLogs", fields: [actorId], references: [id])
  action     String                          // "COURSE_CREATED" | "ALLOCATION_APPROVED" | "PREFERENCE_SUBMITTED" | etc.
  entityType String                          // "Course" | "Allocation" | "User" | etc.
  entityId   String
  details    String?  @db.Text               // optional JSON-stringified extra context
  createdAt  DateTime @default(now())
}
```

**Note on `Course.timeSlot`:** for this project's scope, a single free-text field
(e.g. `"Mon 10:00-12:00"`) is sufficient for conflict detection (Section 6) and
student-side clash detection. Do not build a full recurring-timetable/calendar
system — that is out of scope. Parse the string into day + start/end time only when
actually checking for overlaps.

**Seed data (`prisma/seed.ts`):** create one Department ("Computer Science"), one
ADMIN user, one HOD user, 4-6 LECTURER users with varied specializations/seniority,
8-12 Courses across levels 100-400 with varied specialization tags and time slots,
and 3-4 STUDENT users (give students varied `level` values matching the seeded
courses' levels, since `/student/courses` filters by this field — see Section 4's
`User.level` field). This is required so the app is demoable immediately after
`prisma db seed`.

**Use these exact seed credentials** (all passwords hashed with bcrypt at seed
time, plain-text below is what to type into the login form when testing):

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@kwasu.test | Admin@123 |
| HOD | hod@kwasu.test | Hod@12345 |
| LECTURER (example) | lecturer1@kwasu.test | Lecturer@123 |
| STUDENT (example) | student1@kwasu.test | Student@123 |

Seed all LECTURER and STUDENT accounts with `isApproved: true` directly (skip the
approval flow for seed data only — the approval gate in Section 5 still applies to
anyone who self-registers afterward through `/register`).

**Accepted limitation — account lifecycle:** this system provides no in-app way to
create additional ADMIN or HOD accounts, or to delete/deactivate any account. ADMIN
and HOD accounts exist only via seeding. This is a deliberate scope boundary, not an
oversight — do not build a "create admin/HOD" page or a user-deletion feature.

---

## 5. Authentication (exact flow)

1. **Registration** (`POST /api/auth/register`) — used by lecturers and students to
   self-register. Fields: fullName, email, password, role (LECTURER or STUDENT only
   — ADMIN/HOD accounts are seeded, not self-registered), departmentId, and for
   LECTURER role also specialization + seniorityRank. Password is hashed with
   `bcryptjs` before storage. New LECTURER accounts are created with
   `isApproved: false` and cannot log in until an Admin approves them via
   `/admin/lecturers`. STUDENT accounts are `isApproved: true` immediately (no
   approval gate needed for students).

2. **Login** (`POST /api/auth/login`) — validates email/password against the hashed
   password, checks `isApproved`, and on success returns a signed JWT containing
   `{ userId, role, departmentId }` with a reasonable expiry (7 days). The client
   stores this in `localStorage` under the key `kwasu_auth_token`.

   **Documented tradeoff:** storing a JWT in `localStorage` (rather than an
   httpOnly cookie) is a deliberate choice for this project, made explicitly by the
   project owner, and trades some XSS exposure for simplicity of a stateless
   client-side auth flow. This is a known, accepted limitation — do not "fix" it by
   switching to cookies/sessions, and mention it as a conscious design decision (not
   an oversight) if asked about it during the project defense.

3. **Every subsequent API request** attaches `Authorization: Bearer <token>`. Each
   API route handler calls `getCurrentUser(request)` from
   `lib/auth/session.ts`, which verifies the JWT and returns the decoded payload or
   throws a 401. Route handlers then check the role is permitted for that endpoint
   (e.g. only ADMIN can hit `/api/departments` POST).

4. **`middleware.ts`** performs a lightweight check (JWT cookie or header presence —
   since this is stateless JWT in localStorage, middleware mainly protects page
   routes by checking for the token on the client side via a top-level auth
   provider/context, not via middleware cookie inspection). Implement an
   `AuthProvider` React context that reads the token from localStorage on mount,
   decodes it (without needing to re-verify signature client-side — that's the
   server's job), and redirects to `/login` if missing or expired. Each role's
   `layout.tsx` (e.g. `app/admin/layout.tsx`) wraps its pages in a `RoleGuard`
   component that checks the decoded role matches the expected role for that
   section, redirecting elsewhere if not.

5. **`GET /api/auth/me`** — returns the current user's profile, used by the
   frontend to populate the top bar and confirm the token is still valid.

### 5.6 API response conventions (apply to every route in this document, no exceptions)

- Success responses: `{ "data": <payload> }` — a single object or array under
  the `data` key, never a bare array/object at the top level.
- Error responses: `{ "error": { "message": string, "code"?: string } }` with
  an appropriate HTTP status (400 validation, 401 unauthenticated, 403
  wrong role, 404 not found, 409 conflict — e.g. the course-deletion block in
  Section 4, 500 unexpected).
- Validation errors from zod: flatten into `{ "error": { "message": "Validation
  failed", "fields": { [fieldName]: string } } }` so react-hook-form can map
  field-level errors directly.
- Every mutation (POST/PATCH/DELETE) that succeeds triggers a shadcn/sonner
  toast on the client using the response; every error response also triggers a
  toast with `error.message`. Do not invent a different convention per page.

---

## 6. The allocation algorithm (implement exactly as specified)

This is the centerpiece of the system. Do not simplify it into a plain sort-and-assign.

### 6.1 Step 1 — Course-side scoring (`lib/allocation/scoring.ts`)

For every (course, lecturer) pair within the same department and active session,
compute:

```ts
score(course, lecturer) =
    w1 * specializationMatch(course, lecturer)   // 1 if specializationTag matches lecturer.specialization (case-insensitive substring match), else 0
  + w2 * normalizedSeniority(lecturer)            // lecturer.seniorityRank / MAX_SENIORITY_IN_DEPARTMENT
  + w3 * (1 - currentLoadRatio(lecturer))         // 1 - (units already tentatively assigned / lecturer.maxLoadUnits), clamped to [0,1]
  + w4 * mutualPreferenceBonus(course, lecturer)  // 1 if lecturer ranked this course in their top 3 preferences, else 0

// Default weights (store in a config table or .env, expose as editable in
// /admin/settings — do NOT hardcode without making them editable):
w1 = 0.4, w2 = 0.2, w3 = 0.25, w4 = 0.15
```

Sort lecturers descending by score to build each course's preference list.

**Critical correctness rule — read before implementing 6.2:** every preference
list (both `lecturer.preferenceList` and `course.preferenceList`) is computed
**once, before the algorithm runs, and must not change while it runs.** Gale-Shapley's
stable-matching guarantee depends on both sides' rankings staying fixed for the
duration of the run — only *which slots are currently filled* changes during the
loop, never the rankings themselves. Concretely: `currentLoadRatio(lecturer)` in the
formula above is evaluated exactly once, using zero prior load (since no allocation
exists yet before the run starts), to produce the course's ranked list — do NOT
re-score or re-sort any preference list mid-loop in Section 6.2. If you find
yourself wanting to recompute a score inside the `while` loop, stop — that is a sign
the fixed-list invariant is being violated.

### 6.2 Step 2 — Capacity-aware Gale-Shapley (`lib/allocation/galeShapley.ts`)

```ts
interface MatchInput {
  lecturers: { id: string; preferenceList: string[] /* course ids, ranked */; maxLoadUnits: number }[];
  courses: { id: string; preferenceList: string[] /* lecturer ids, ranked */; capacity: number; units: number }[];
}

function runGaleShapley(input: MatchInput): Map<string, string[]> {
  // returns Map<courseId, lecturerId[]>

  const matching = new Map<string, string[]>();       // courseId -> lecturerId[]
  const nextProposalIndex = new Map<string, number>(); // lecturerId -> index into their preference list
  const remainingCapacityUnits = new Map<string, number>(); // lecturerId -> units left before hitting maxLoadUnits

  // initialize
  for (const l of input.lecturers) {
    nextProposalIndex.set(l.id, 0);
    remainingCapacityUnits.set(l.id, l.maxLoadUnits);
  }
  for (const c of input.courses) matching.set(c.id, []);

  const freeQueue: string[] = input.lecturers.map(l => l.id); // lecturerIds still able to propose

  while (freeQueue.length > 0) {
    const lecturerId = freeQueue.shift()!;
    const lecturer = input.lecturers.find(l => l.id === lecturerId)!;
    const idx = nextProposalIndex.get(lecturerId)!;

    if (idx >= lecturer.preferenceList.length) continue; // exhausted their list

    const courseId = lecturer.preferenceList[idx];
    nextProposalIndex.set(lecturerId, idx + 1);
    const course = input.courses.find(c => c.id === courseId)!;
    const current = matching.get(courseId)!;

    if (current.length < course.capacity) {
      current.push(lecturerId);
      const remaining = remainingCapacityUnits.get(lecturerId)! - course.units;
      remainingCapacityUnits.set(lecturerId, remaining);
      if (remaining > 0) freeQueue.push(lecturerId); // can still take more courses
    } else {
      // course is full — compare against weakest current match using course.preferenceList order
      const weakest = current.reduce((worst, id) =>
        course.preferenceList.indexOf(id) > course.preferenceList.indexOf(worst) ? id : worst
      );
      if (course.preferenceList.indexOf(lecturerId) < course.preferenceList.indexOf(weakest)) {
        // lecturerId is preferred over weakest — swap
        const i = current.indexOf(weakest);
        current[i] = lecturerId;
        // return capacity to the bumped lecturer, they go back in the queue
        const bumpedRemaining = remainingCapacityUnits.get(weakest)! + course.units;
        remainingCapacityUnits.set(weakest, bumpedRemaining);
        freeQueue.push(weakest);

        const remaining = remainingCapacityUnits.get(lecturerId)! - course.units;
        remainingCapacityUnits.set(lecturerId, remaining);
        if (remaining > 0) freeQueue.push(lecturerId);
      } else {
        freeQueue.push(lecturerId); // stays free, will try next course on their list
      }
    }
  }

  return matching;
}
```

The pseudocode above is directly translatable to TypeScript as written — implement
it as-is, including the mutation of `current` (the array held in the `matching` Map)
in place, so `matching.get(courseId)` always reflects the latest state.

### 6.3 Step 3 — Post-processing (`lib/allocation/conflicts.ts`)

After `runGaleShapley` returns:

1. For each lecturer, collect all their matched courses' `timeSlot` values, parse
   day + time range, and check pairwise overlap. If any two overlap, set
   `hasConflict: true` on both resulting Allocation rows.
2. Any course with `matching.get(course.id).length < course.capacity` → create the
   Allocation row(s) that do exist, and separately surface this course in the
   review UI as "unallocated" (no Allocation row needed for the unfilled slot —
   just query for it: courses in the active session with fewer allocations than
   capacity).
3. Any lecturer who never got matched at all, or is significantly under their
   `maxLoadUnits`, gets surfaced in the HOD review UI's workload chart as
   under-allocated — this is informational only, not a blocking error.

### 6.4 Step 4 — Persisting the draft

`POST /api/allocation/run` orchestrates: fetch active session + department lecturers
+ courses → build scoring inputs (6.1) → run `runGaleShapley` (6.2) → run conflict
detection (6.3) → write `Allocation` rows with `status: DRAFT` (delete any previous
DRAFT rows for this session first, so re-running doesn't duplicate) → write an
`AuditLog` entry (`action: "ALLOCATION_DRAFT_GENERATED"`).

### 6.5 HOD review and override

`GET /api/allocation/draft` returns all DRAFT allocations for the active session,
joined with course/lecturer info, plus per-lecturer aggregate load (for the
workload chart) and the list of flagged conflicts/unallocated courses.

`PATCH /api/allocation/[id]` lets the HOD manually reassign a single Allocation.
This is a direct field update — `UPDATE` the existing row's `lecturerId` in place
via `prisma.allocation.update({ where: { id }, data: { lecturerId: newLecturerId,
hasConflict: false } })`. Do **not** delete and recreate the row — the `id` must
stay stable so notifications, flags, and audit history tied to it remain linked.
After any manual edit, re-run **only** the conflict-detection pass (6.3) against
the updated set — do not re-run the full Gale-Shapley matching. If the edited
allocation had an `OPEN` `AllocationFlag`, set that flag's status to `RESOLVED` as
part of the same request.

`POST /api/allocation/[id]/approve` — **implement per-allocation approval**
(simpler, more granular, lets the HOD approve the parts that are ready while still
working on flagged ones). This endpoint touches four tables and **must be wrapped
in a single `prisma.$transaction([...])`** so a failure partway through (e.g. the
notification write fails) cannot leave an allocation marked `APPROVED` without its
corresponding notification and teaching guide. Inside the transaction: set
`status: APPROVED`, `approvedById`, `approvedAt` on the Allocation; create a
`Notification` (type `ALLOCATION_ASSIGNED`) for the lecturer; call the mocked
teaching-guide generator (Section 8) and store its output in `TeachingGuide`; write
an `AuditLog` entry. Apply the same `$transaction` requirement to
`POST /api/allocation/run` (Section 6.4) — deleting old DRAFT rows and inserting
the new draft set should be one atomic operation.

**Accepted limitation — concurrency:** this system does not handle two HODs (or one
HOD in two browser tabs) editing the same draft allocation simultaneously; the
last write wins. This is acceptable at department scale and is not required to be
fixed — do not add optimistic locking or websocket-based collaborative editing.

### 6.6 Lecturer accept/flag

`POST /api/allocation/[id]/flag` — lecturer submits a reason string. Creates an
`AllocationFlag` row (`status: OPEN`) and sets the parent Allocation's `status` to
`FLAGGED`. This surfaces in the HOD review dashboard as needing attention. The HOD
resolves it either by reassigning (6.5's PATCH, which should clear the flag back to
`RESOLVED`) or by dismissing the flag directly.

---

## 7. Page-by-page specification

For every page below: **Access** = which role(s) may view it (enforced by
`RoleGuard` client-side AND by the API route's own role check server-side — never
rely on the frontend guard alone). **Purpose**, **Key UI elements**, **API calls**.

### 7.1 Public

**`/` — Landing page**
- Access: public
- Purpose: brief system description, links to Login/Register
- UI: hero section, "Login" and "Register" buttons, no real data fetched

**`/login`**
- Access: public
- Purpose: single login form for all roles (role is determined server-side from the
  matched user record, not selected by the user)
- UI: email + password fields (react-hook-form + zod), submit button, link to
  `/register`, error toast on failure (invalid credentials, or "pending approval"
  message if `isApproved: false`)
- API: `POST /api/auth/login`. On success, store token, fetch `/api/auth/me`,
  redirect to `/{role-lowercase}/dashboard`.

**`/register`**
- Access: public
- Purpose: self-registration for LECTURER or STUDENT roles
- UI: role toggle (Lecturer / Student), fullName, email, password, confirmPassword,
  department select; if role=Lecturer, additionally show specialization (text) and
  seniorityRank (number)
- API: `POST /api/auth/register`. On success, show a message: lecturers see
  "Pending admin approval," students are redirected straight to `/login`.

### 7.2 Admin (`/admin/*`)

**`/admin/dashboard`**
- Purpose: overview stats — total lecturers, total courses, active session, pending
  lecturer approvals count, allocation status summary (draft/approved/flagged counts)
- UI: stat cards (shadcn `Card`), quick links to Lecturers (if pending approvals > 0,
  highlight this card)
- API: a small aggregate endpoint is fine to build inline into this page's server
  component using Prisma directly (Next.js Server Components can query Prisma
  directly without going through `/api` — use this pattern for read-only dashboard
  aggregates to avoid unnecessary API round-trips)

**`/admin/departments`**
- Purpose: CRUD for departments
- UI: shadcn `Table` listing departments, "Add Department" dialog (name, code),
  edit/delete actions per row
- API: `GET/POST /api/departments`, `PATCH/DELETE /api/departments/[id]`

**`/admin/courses`**
- Purpose: list/manage all courses
- UI: table with code, title, units, level, semester, department, specializationTag,
  capacity, timeSlot columns; search/filter by department and level; "Add Course"
  button → `/admin/courses/new`; edit action → `/admin/courses/[id]/edit`; delete
  with confirm dialog
- API: `GET /api/courses` (supports `?departmentId=&level=` query params),
  `DELETE /api/courses/[id]`

**`/admin/courses/new`** and **`/admin/courses/[id]/edit`**
- Purpose: create/edit a course
- UI: form (course-form.tsx component, shared between new/edit) — code, title,
  units, level (select 100/200/300/400), semester (select), department (select),
  specializationTag (text), capacity (number, default 1), timeSlot (text input with
  helper text "e.g. Mon 10:00-12:00")
- API: `POST /api/courses` or `PATCH /api/courses/[id]`

**`/admin/lecturers`**
- Purpose: manage lecturer (and HOD) accounts, approve pending registrations
- UI: table of all LECTURER-role users with columns name, email, specialization,
  seniority, maxLoad, department, approval status; "Approve" button on pending rows;
  click a row → `/admin/lecturers/[id]`
- API: `GET /api/lecturers`, `POST /api/lecturers/[id]/approve`

**`/admin/lecturers/[id]`**
- Purpose: view/edit a single lecturer's profile (specialization, seniorityRank,
  maxLoadUnits) and see their allocation history across sessions
- UI: profile edit form + a read-only table of past Allocations for this lecturer
- API: `GET/PATCH /api/lecturers/[id]`

**`/admin/sessions`**
- Purpose: manage academic sessions (e.g. "2024/2025 First Semester")
- UI: table of sessions with an "Activate" action (sets `isActive: true` on the
  selected session and `false` on all others — only one active session at a time);
  "Add Session" dialog (label, semester)
- API: `GET/POST /api/sessions`, `POST /api/sessions/[id]/activate`

**`/admin/settings`**
- Purpose: edit the allocation scoring weights (w1-w4 from Section 6.1)
- UI: four number/slider inputs (must sum to 1.0 — validate client-side and
  server-side), save button
- API: `GET/PATCH /api/settings`, reading/writing the `SystemConfig` model
  (Section 4) as four rows keyed `allocation_weight_w1` through `_w4`. Use this
  in `scoring.ts` instead of hardcoded weights — `scoring.ts` should fetch current
  weights from `SystemConfig` at the start of each run, falling back to the
  Section 6.1 defaults if no rows exist yet (first run before any admin edit).

**`/admin/audit-log`**
- Purpose: read-only, filterable view of all AuditLog entries
- UI: table with actor, action, entityType, entityId, timestamp; filter by
  action type and date range
- API: `GET /api/audit-logs` (supports `?action=&from=&to=`)

### 7.3 HOD (`/hod/*`)

**`/hod/dashboard`**
- Purpose: department-scoped overview — active session, allocation status counts,
  pending flags count, quick link to run/review allocation
- UI: stat cards, "Run Allocation" CTA if no draft exists yet for the active session,
  and a "Send Class Reminders" button (enabled only when at least one APPROVED
  allocation exists for the active session) that calls the reminder endpoint and
  shows a toast confirming how many notifications were sent
- API: `POST /api/notifications/send-reminders` (new endpoint — add
  `app/api/notifications/send-reminders/route.ts`; not listed in Section 3's tree,
  add it there too) — creates one `CLASS_REMINDER` Notification per lecturer with an
  APPROVED allocation in the active session, via `sendMockEmail` (Section 8.1)

**`/hod/allocation/run`**
- Purpose: trigger the Gale-Shapley run
- UI: confirmation screen showing what will happen ("This will generate a draft
  allocation for {active session}. Existing draft allocations will be replaced.")
  with a "Run Allocation" button; loading state while processing; on success,
  redirect to `/hod/allocation/review`
- API: `POST /api/allocation/run`

**`/hod/allocation/review`** — the centerpiece screen
- Purpose: review, adjust, and approve the draft allocation
- UI:
  - `WorkloadBarChart` component (recharts horizontal bar chart) — one bar per
    lecturer, showing units allocated vs `maxLoadUnits`, colour-coded (green =
    balanced, amber = under-allocated, red = over-allocated/conflict)
  - `DraftAllocationTable` — one row per course: course code/title, assigned
    lecturer (editable — a select dropdown of all department lecturers, triggers
    the PATCH endpoint on change), status badge (Draft/Approved/Flagged),
    `ConflictBadge` if `hasConflict`, per-row "Approve" button
  - A separate "Unallocated Courses" section listing any course with no lecturer
    assigned, with a manual-assign dropdown
  - A separate "Flagged" section listing open `AllocationFlag`s with the lecturer's
    reason text and a "Resolve" / "Reassign" action
- API: `GET /api/allocation/draft`, `PATCH /api/allocation/[id]`,
  `POST /api/allocation/[id]/approve`, `GET /api/allocation/conflicts`

**`/hod/allocation/history`**
- Purpose: view finalized (APPROVED) allocations from past sessions
- UI: session selector dropdown, table of that session's approved allocations
- API: `GET /api/allocation/draft?sessionId=&status=APPROVED` (reuse the draft
  endpoint with query params rather than building a separate one)

**`/hod/reports`**
- Purpose: export allocation data
- UI: session selector, "Export PDF" and "Export CSV" buttons
- API: `GET /api/reports/export?sessionId=&format=pdf|csv`

**`/hod/analytics`**
- Purpose: trend view across sessions — chronically overloaded lecturers,
  most-contested courses (courses with the most lecturer preferences submitted
  against them)
- UI: two recharts panels — a bar chart of average load per lecturer across all
  sessions, and a bar chart of top 5 most-preferred courses
- API: `GET /api/analytics`

### 7.4 Lecturer (`/lecturer/*`)

**`/lecturer/dashboard`**
- Purpose: overview — current allocations, unread notification count, quick links
- UI: stat cards, recent notifications preview

**`/lecturer/preferences`**
- Purpose: submit ranked course preferences for the active session
- UI: a drag-to-reorder or numbered-select list of all courses in the lecturer's
  department (matching their specialization first, but all courses selectable), a
  max-load-units input (pre-filled from their profile, editable per-session), submit
  button. If preferences already submitted for this session, show them pre-filled
  and allow editing until the HOD has run the allocation for this session (lock the
  form after that, with a message explaining why).
- API: `GET/POST /api/preferences?sessionId=`

**`/lecturer/allocations`**
- Purpose: view current session's allocation(s) for this lecturer, accept or flag,
  and track a simple teaching checklist per course
- UI: card per allocated course showing course details, status badge; "Accept"
  button (purely cosmetic acknowledgement — sets nothing beyond marking the related
  notification read, since APPROVED is already the HOD's final word) and "Flag a
  Concern" button opening a dialog with a reason textarea. Each card also shows a
  small static checklist tied to that course's teaching guide sections — three
  checkboxes: "Reviewed teaching guide," "Prepared week 1-2 materials," "Confirmed
  timetable slot." Checklist state is per-allocation, stored client-side is NOT
  sufficient (it must survive a page refresh) — add a `checklistState` JSON field
  to the `Allocation` model (`String? @db.Text`, storing a JSON-stringified array
  of booleans) and a small `PATCH /api/allocation/[id]/checklist` endpoint to persist
  it. This is a deliberately simple, static checklist — do not build a
  general-purpose task/todo system.
- API: `GET /api/allocation/draft?lecturerId=me`, `POST /api/allocation/[id]/flag`,
  `PATCH /api/allocation/[id]/checklist`

**`/lecturer/allocations/[id]/teaching-guide`**
- Purpose: view the mocked AI-generated teaching guide for a specific allocation
- UI: rendered markdown/plain content in a card, clearly labeled
  "Auto-generated teaching guide (preview feature)" so it's honestly presented as
  a preview/demo feature, not implied to be a live AI call
- API: `GET /api/teaching-guide/[allocationId]`

**`/lecturer/notifications`**
- Purpose: full notification history
- UI: list, unread items highlighted, "Mark all read" action
- API: `GET /api/notifications`, `PATCH /api/notifications/[id]/read`

**`/lecturer/profile`**
- Purpose: view profile (specialization, seniority, maxLoad) — editable by the
  lecturer themself for specialization only; seniorityRank and maxLoadUnits require
  Admin approval to change (read-only here, with a note "Contact your Admin to
  change this")
- API: `GET /api/lecturers/[id]` (self), `PATCH` restricted to the specialization
  field only when called by the lecturer themself (enforce this restriction
  server-side, not just by hiding the field in the UI)

### 7.5 Student (`/student/*`)

**`/student/dashboard`**
- Purpose: overview — registered courses count, active session info

**`/student/courses`**
- Purpose: browse available courses for the active session
- UI: table/grid of courses filtered to (a) the student's `level` (from `User.level`,
  Section 4) AND (b) `Course.semester` matching the active `AcademicSession.semester`
  exactly — a course whose semester doesn't match the active session's semester must
  not appear at all, regardless of level. Showing lecturer name **only if** the
  course has an APPROVED allocation for the active session (otherwise show
  "Lecturer TBA" and disable registration for that course — this enforces the
  "registration gated on finalized allocation" rule from the write-up)
- API: `GET /api/courses?sessionId=&level=` (this endpoint must filter by both
  level and matching semester server-side, and join allocation status to only
  include lecturer name when APPROVED — do not rely on the client to filter by
  semester)

**`/student/register`**
- Purpose: register for courses
- UI: same course list as `/student/courses` but with checkboxes/"Register" buttons;
  before submitting, client-side checks the newly selected course's `timeSlot`
  against already-registered courses and warns on overlap (does not hard-block,
  matching how the real KWASU credit-cap rule works — a warning, with confirm-anyway)
- API: `POST /api/student/registrations`

**`/student/my-courses`**
- Purpose: view registered courses with lecturer info and any clash warnings
- UI: table, clash rows highlighted, "Drop" action per row
- API: `GET /api/student/registrations?studentId=me`,
  `DELETE /api/student/registrations/[id]`

---

## 8. Mocked features (implement exactly this way — do not build real integrations)

### 8.1 Mocked email (`lib/mock/email.ts`)

```ts
export async function sendMockEmail(to: string, subject: string, body: string) {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}\n${body}`);
  // Also store as a Notification row (type reflects the email's purpose) so it's
  // visible in-app — the Notification model IS the "inbox" for this system.
  // Do not attempt any real SMTP/Nodemailer call.
}
```

Call this alongside creating a `Notification` row whenever: an allocation is
approved (type `ALLOCATION_ASSIGNED`), and whenever the HOD clicks a "Send Class
Reminders" button on `/hod/dashboard` (type `CLASS_REMINDER`, one notification per
lecturer with an approved allocation, listing their upcoming course(s) and a prompt
to check their checklist — see Section 7.4). **This reminder feature is required,
not optional** — the write-up commits to it as a delivered feature. What is optional
is *automation*: the trigger is a manual HOD button, not a background job/cron (no
job scheduler is in scope for this project, per Section 11).

### 8.2 Mocked AI teaching guide (`lib/mock/teachingGuide.ts`)

```ts
export function generateMockTeachingGuide(course: { code: string; title: string; units: number; level: number }): string {
  // Return deterministic, template-based content — NOT a real LLM call.
  return `
# Teaching Guide: ${course.code} — ${course.title}

*This is an auto-generated preview guide. In a future version, this would be
generated by a live AI integration based on the course's uploaded outline.*

## Suggested Weekly Breakdown (${course.units}-unit course)
Week 1-2: Introduction & foundational concepts
Week 3-5: Core topic development
Week 6-8: Applied/practical sessions
Week 9-11: Advanced topics
Week 12-13: Review and assessment preparation

## Learning Objectives
- Understand the foundational principles of ${course.title}
- Apply core concepts through practical exercises
- Demonstrate competency through assessment

## Suggested Content
- Lecture slides covering weekly topics
- At least one practical/lab session per module
- A mid-semester assessment and end-of-semester examination
  `.trim();
}
```

Called once, when an allocation is approved (Section 6.5), and stored in the
`TeachingGuide` table — not regenerated on every view.

---

## 9. Step-by-step implementation order

Build in this order. Do not jump ahead — later phases depend on earlier ones being
solid.

1. **Project init**: `npx create-next-app@14` (see Section 2's version-pinning
   note — do not use `@latest`) with TypeScript + Tailwind + App Router. Install
   Prisma, initialize, write `schema.prisma` (Section 4), run first migration
   against a local/dev PostgreSQL instance.
2. **Seed script**: write and run `prisma/seed.ts` (Section 4's seed data spec).
3. **Auth**: implement `lib/auth/*`, `/api/auth/*` routes, `/login`, `/register`
   pages, the `AuthProvider` context, and `RoleGuard`. Verify you can register,
   get approved (manually flip `isApproved` in the DB for the first test), and log
   in as each of the four roles before building anything else.
4. **Admin CRUD**: departments, courses, lecturers (list + approve), sessions,
   settings, audit log. These are standard CRUD screens — get them fully working
   before touching the algorithm.
5. **Lecturer preferences**: `/lecturer/preferences` page + `/api/preferences`.
6. **The algorithm**: `lib/allocation/scoring.ts`, `galeShapley.ts`,
   `conflicts.ts`, and their unit tests (Section 10) — build and test this in
   isolation, with hand-written fake input data, before wiring it to real DB data.
7. **Wire the algorithm to the app**: `/api/allocation/run`, `/hod/allocation/run`,
   `/api/allocation/draft`, `/hod/allocation/review` (the centerpiece screen).
8. **Approve flow + mocks**: `/api/allocation/[id]/approve` triggering the mocked
   email/notification and mocked teaching guide; `/lecturer/allocations`,
   `/lecturer/allocations/[id]/teaching-guide`, `/lecturer/notifications`.
9. **Flag flow**: `/api/allocation/[id]/flag`, the flagged-section UI in
   `/hod/allocation/review`.
10. **Student side**: `/student/courses`, `/student/register`,
    `/student/my-courses`, with the lecturer-visibility gating and clash-warning
    logic.
11. **Reports & analytics**: `/hod/reports`, `/hod/analytics`,
    `/hod/allocation/history`.
12. **Polish pass**: loading states, empty states, toasts on every mutation,
    responsive check on mobile widths, and a final pass making sure every page
    listed in Section 7 actually exists and is reachable from its role's
    navigation sidebar.

---

## 10. Testing requirements (non-negotiable minimum)

Write unit tests for `lib/allocation/galeShapley.ts` in
`lib/allocation/__tests__/galeShapley.test.ts` covering at minimum:

1. A simple case with 2 lecturers, 2 courses, no capacity conflicts — verify the
   expected stable matching.
2. A case where a course receives more proposals than its capacity — verify the
   weaker-preference lecturer gets bumped and re-queued correctly.
3. A case where a lecturer's preference list is fully exhausted without a match —
   verify they end up correctly unmatched rather than causing an infinite loop.
4. A case with a lecturer who has capacity for 2 courses — verify they end up
   matched to both, respecting `maxLoadUnits`.
5. **A stability-verification test**: given the output matching, write a helper
   that checks no "blocking pair" exists (no lecturer-course pair where both would
   prefer each other over their current assignment) — this is the actual formal
   property the write-up claims the system guarantees, so it should be the one
   test that directly proves it, not just inferred from the other four passing.

Additionally, write one integration test (or a manual test step, documented in
comments, if integration test infra isn't set up) confirming that a failed
teaching-guide write during `POST /api/allocation/[id]/approve` rolls back the
Allocation's `status` change too — proving the `$transaction` wrapping from
Section 6.5 actually works, not just that it was added.

These tests double as the strongest possible evidence, for both your project
defense and any code review, that the algorithm actually implements a stable
matching rather than an arbitrary assignment — treat them as part of the
deliverable, not an afterthought.

---

## 11. Explicitly out of scope — do not build these

Do not implement any of the following, even if they seem like natural extensions.
They are deferred future work per the project write-up:

- Elective/limited-capacity course allocation fairness system for students
  (reusing the algorithm on the student side)
- A real, live AI integration for the teaching guide (must stay mocked, Section 8.2)
- Real email delivery (must stay mocked, Section 8.1)
- Inter-departmental or inter-institutional course sharing
- A full recurring-timetable/calendar UI (the `timeSlot` free-text field is
  sufficient, Section 4's note)
- Background job scheduling / cron (the "Send Class Reminders" action from
  Section 7.3 is a manual button, not an automated job)
- WebSocket-based real-time updates (polling/refetch is sufficient)
- Optimistic locking or collaborative-editing conflict resolution (accepted
  limitation, see Section 6.5)
- Any UI for creating, deleting, or promoting ADMIN/HOD accounts (accepted
  limitation, see Section 4's seed data note)
- A general-purpose task/todo system (the lecturer teaching checklist in Section
  7.4 is a fixed three-item checklist, not a user-extensible list)

---

## 12. Environment variables (`.env.example`)

```
DATABASE_URL="postgresql://user:password@localhost:5432/kwasu_allocation"
JWT_SECRET="replace-with-a-long-random-string"
JWT_EXPIRES_IN="7d"
```
