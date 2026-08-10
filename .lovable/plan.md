# Admin-managed employees and sites

Right now employees and sites are fixed lists in config files, so nobody can add a new employee or job site from the app. This moves both lists into the shared cloud database and gives the admin portal forms to manage them. Anything the admin adds shows up immediately in the employee time-entry dropdowns and in the admin filters.

## What the admin gets

New "Employees" and "Sites" management sections in the admin portal (tabs on the Admin page, so admins still only see the Admin tab):

- **Employees**: form to add a name, plus a table of all employees with their status and an Active/Inactive toggle. Only active employees appear in the time-entry dropdown.
- **Sites**: form to add a site name, plus a table of all sites with a rename option.
- Validation: name required, max 100 characters, duplicate names rejected with a clear message.
- Records are never hard-deleted (existing time entries keep referencing them); employees are deactivated instead, and sites are kept for history.

## What employees see

The Log Time form loads sites and employees from the database, so newly added ones appear in the dropdowns right away. Existing entries continue to display the correct names.

## Data migration

The four current employees (Raghu, Vinayak, Ashi, Kevin) and four sites (BOSTICK, Ballenger, Horizon, Presbyterian Church) are seeded into the new tables with their existing IDs, so all existing time entries keep resolving to the right names.

## Technical notes

- Migration creates `public.employees` (name, active) and `public.sites` (name), each with `created_at`/`updated_at` and an updated_at trigger, GRANTs, RLS enabled, and seed INSERTs using the current IDs (`EMP001…`, `SITE001…`). New rows get generated ids. Case-insensitive unique index on name for both tables.
- New `src/lib/directory.functions.ts` server functions: `listEmployees`, `createEmployee`, `setEmployeeActive`, `listSites`, `createSite`, `renameSite` — same pattern as `timeEntries.functions.ts` (Zod validation, admin client loaded inside the handler).
- `employeeService`/`siteService` switch to the server functions and keep their async `getEmployees`/`getSites`/`getActiveEmployees` API. `getEmployeeName`/`getSiteName` currently resolve names synchronously from JSON, so they become cache-backed lookups populated by the list calls, with the id as fallback — consumers (`EntriesTable`, `AppShell`, `excelService`) keep working unchanged.
- Admin page gains `EmployeeManager` and `SiteManager` components under `src/components/admin/`, wired into `AdminDashboard.tsx` as a tabbed section; lists refetch after each mutation.
- Config JSON files are removed once the tables are seeded.
