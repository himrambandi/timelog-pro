# Time & Activity Tracker

A mobile-first, installable PWA for field engineers to log the time they spend on
sites/projects, plus an admin portal for reporting and Excel export.

## Getting started

```bash
npm install
npm run dev       # local development
npm run build     # production build
npm run preview   # preview the production build (service worker active here)
```

## Prototype credentials

| Username | Password | Role     |
| -------- | -------- | -------- |
| raghu    | demo123  | employee |
| vinayak  | demo123  | employee |
| admin    | admin123 | admin    |

> These live in `src/config/users.json` and are **demo data only**. A plaintext
> credential file in the client bundle is not production authentication. Every
> caller goes through `authService`, so it can be replaced by a real identity
> provider (Lovable Cloud, OIDC, …) without touching any page or component.

## Routes

| Route                        | Access             |
| ---------------------------- | ------------------ |
| `/login`                     | public             |
| `/dashboard`                 | authenticated      |
| `/time-entry`                | authenticated      |
| `/my-entries`                | authenticated      |
| `/admin`                     | `role = admin`     |
| `/admin/employee/:id`        | `role = admin`     |

## Architecture

```text
React UI (src/pages, src/components)
        ↓
Service layer (src/services/*Service.ts)
        ↓
Storage repository (TimeEntryRepository)
        ↓
Data store (browser localStorage for the prototype)
```

- Configuration (`sites`, `employees`, `users`) is loaded from `src/config/*.json`
  through `siteService` / `employeeService` / `authService`. No values are
  hard-coded in components.
- Time entries go through `timeEntryService`. Swap the data store by calling
  `setTimeEntryRepository(myRepository)` with another `TimeEntryRepository`
  implementation (Supabase, Firebase, serverless API, …). No page changes needed.
- Durations are stored as **integer minutes** (`08:30 → 510`). `src/utils/timeUtils.ts`
  provides `minutesToHHMM`, `hhmmToMinutes`, `addDurations`, `calculateTotalHours`.
  No floating-point hour math anywhere.
- Every entry gets a unique id (`crypto.randomUUID()` where available) plus
  `createdAt` / `updatedAt` ISO timestamps. Existing entries are never overwritten.

## Offline behaviour

- The app shell is precached by a generated service worker (`vite-plugin-pwa`,
  `generateSW`). HTML navigations use `NetworkFirst`, static assets `CacheFirst`.
- The worker is registered only in production, outside iframes/preview hosts, and
  never when `?sw=off` is present (`src/lib/registerServiceWorker.ts`).
- Entries submitted while offline are queued locally, shown with a
  **Pending sync** badge, and flushed by `timeEntryService.syncPending()` when
  connectivity returns. A submitted entry is never silently lost.

## Excel

- Admins can export the currently filtered report to `.xlsx`
  (`src/services/excelService.ts`, columns: Date, Employee Name, Site Name, Hours,
  Work Description, Note, Billable, Created Date).
- Excel is an interchange format only — never the live transactional database.
- **No GitHub write credentials in the frontend.** Do not add `GITHUB_TOKEN` or any
  write token to client code. If GitHub-backed storage is needed later, do the
  writes in a server function / serverless endpoint behind a secret.
