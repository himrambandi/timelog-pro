# Admin-only navigation + shared cloud storage

Two changes: admins see only the Admin portal, and all time entries move from each device's local storage into a free shared Lovable Cloud database (with Excel export kept as-is).

## 1. Admin sees only the Admin tab

- Navigation (sidebar + mobile bottom bar) becomes role-aware:
  - Admin: `Admin` only — no Dashboard, no Log Time, no My Entries.
  - Employee: Dashboard, Log Time, My Entries (unchanged).
- Admin login redirects to `/admin`. Employee login keeps going to `/dashboard`.
- If an admin opens `/dashboard`, `/time-entry`, or `/my-entries` directly (or hits `/`), they are redirected to `/admin`.
- Admin portal itself stays as it is: summary cards, filters, tracking table, employee details, Excel export.

## 2. Shared storage in Lovable Cloud (free)

Today entries live in browser local storage, so each device sees only its own data — an admin can never see what employees logged. Enabling Lovable Cloud gives a real database at no extra cost.

- Enable Lovable Cloud and create a `time_entries` table matching the existing `TimeEntry` shape (employee id, site id, date, duration in minutes, work description, note, billable, timestamps).
- Add a Cloud-backed implementation of the existing `TimeEntryRepository` interface, so pages and forms need no changes.
- Existing offline behaviour is preserved: when offline, entries queue locally and sync to the database when the connection returns (the pending banner keeps working).
- Excel export continues to export whatever the admin has filtered, now sourced from the shared database.
- Employees, sites and login credentials stay in the JSON config files — no change to how people sign in.

## Technical notes

- Nav filtering: replace the `adminOnly` flag in `AppShell`'s `NAV` list with a `roles` field and filter by `user.role`; add an admin redirect in `RequireAuth` (employee-only routes) and in the login/index redirect logic.
- Storage: new `supabaseTimeEntryRepository` registered via the existing `setTimeEntryRepository()` seam; reads/writes go through TanStack `createServerFn` server functions so no database keys reach the browser. Because sign-in uses the JSON credential file rather than Cloud auth, the table gets no public `anon` access — all access is through those server functions. Note: that means the endpoints are not user-authenticated; if you later want per-user database security, moving login to Lovable Cloud auth is the follow-up.
- Seed data currently injected by `storageService` is dropped for the cloud path so the admin report reflects only real submissions.
