import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, LoadingState } from "@/components/common/States";
import { EntriesTable } from "@/components/tables/EntriesTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employeeService } from "@/services/employeeService";
import { siteService } from "@/services/siteService";
import { exportEntriesToExcel } from "@/services/excelService";
import { summarize, timeEntryService } from "@/services/timeEntryService";
import type { Employee, EntryFilters, Site, TimeEntry } from "@/types";
import { minutesToHHMM } from "@/utils/timeUtils";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

interface DraftFilters {
  employeeId: string;
  siteId: string;
  fromDate: string;
  toDate: string;
  billable: string;
}

const EMPTY_FILTERS: DraftFilters = {
  employeeId: "",
  siteId: "",
  fromDate: "",
  toDate: "",
  billable: "",
};

function toEntryFilters(draft: DraftFilters): EntryFilters {
  const filters: EntryFilters = {};
  if (draft.employeeId) filters.employeeId = draft.employeeId;
  if (draft.siteId) filters.siteId = draft.siteId;
  if (draft.fromDate) filters.fromDate = draft.fromDate;
  if (draft.toDate) filters.toDate = draft.toDate;
  if (draft.billable) filters.billable = draft.billable === "true";
  return filters;
}

type AdminTab = "report" | "employees" | "sites";

const TABS: ReadonlyArray<readonly [AdminTab, string]> = [
  ["report", "Tracking report"],
  ["employees", "Employees"],
  ["sites", "Sites"],
];

export function AdminDashboardPage() {
  const [tab, setTab] = useState<AdminTab>("report");
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [draft, setDraft] = useState<DraftFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<DraftFilters>(EMPTY_FILTERS);


  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      const [entries, employeeList, siteList] = await Promise.all([
        timeEntryService.getEntries(),
        employeeService.getActiveEmployees(),
        siteService.getSites(),
      ]);
      if (cancelled) return;
      setAllEntries(entries);
      setEmployees(employeeList);
      setSites(siteList);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filters = useMemo(() => toEntryFilters(applied), [applied]);

  const filtered = useMemo(
    () =>
      allEntries.filter((entry) => {
        if (filters.employeeId && entry.employeeId !== filters.employeeId) return false;
        if (filters.siteId && entry.siteId !== filters.siteId) return false;
        if (filters.fromDate && entry.date < filters.fromDate) return false;
        if (filters.toDate && entry.date > filters.toDate) return false;
        if (filters.billable !== undefined && entry.billable !== filters.billable) return false;
        return true;
      }),
    [allEntries, filters],
  );

  const summary = summarize(filtered);
  const selectedEmployee = employees.find((employee) => employee.id === applied.employeeId);
  const employeeCount = new Set(allEntries.map((entry) => entry.employeeId)).size;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportEntriesToExcel(filtered);
      toast.success("Excel export downloaded.");
    } catch {
      toast.error("Unable to export the report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title="Admin portal"
      description="Employee time tracking and billable reporting"
      actions={
        <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting || isLoading}>
          {isExporting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Export
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total employees" value={employees.length} icon={Users} hint={`${employeeCount} with entries`} />
        <StatCard label="Total hours" value={minutesToHHMM(summary.totalMinutes)} tone="primary" />
        <StatCard label="Billable hours" value={minutesToHHMM(summary.billableMinutes)} tone="billable" />
        <StatCard
          label="Non-billable hours"
          value={minutesToHHMM(summary.nonBillableMinutes)}
          tone="nonbillable"
        />
        <StatCard label="Total entries" value={summary.entryCount} />
      </div>

      <div className="card-surface mt-6 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <Label htmlFor="admin-employee">Employee</Label>
            <select
              id="admin-employee"
              className={`${selectClass} mt-1.5`}
              value={draft.employeeId}
              onChange={(event) => setDraft((prev) => ({ ...prev, employeeId: event.target.value }))}
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="admin-site">Site</Label>
            <select
              id="admin-site"
              className={`${selectClass} mt-1.5`}
              value={draft.siteId}
              onChange={(event) => setDraft((prev) => ({ ...prev, siteId: event.target.value }))}
            >
              <option value="">All sites</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="admin-from">From date</Label>
            <Input
              id="admin-from"
              type="date"
              className="mt-1.5 h-11"
              value={draft.fromDate}
              onChange={(event) => setDraft((prev) => ({ ...prev, fromDate: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="admin-to">To date</Label>
            <Input
              id="admin-to"
              type="date"
              className="mt-1.5 h-11"
              value={draft.toDate}
              onChange={(event) => setDraft((prev) => ({ ...prev, toDate: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="admin-billable">Billable status</Label>
            <select
              id="admin-billable"
              className={`${selectClass} mt-1.5`}
              value={draft.billable}
              onChange={(event) => setDraft((prev) => ({ ...prev, billable: event.target.value }))}
            >
              <option value="">All</option>
              <option value="true">Billable</option>
              <option value="false">Non-Billable</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setApplied(draft)}>
            Apply filters
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              setApplied(EMPTY_FILTERS);
            }}
          >
            Clear filters
          </Button>
        </div>
      </div>

      {selectedEmployee ? (
        <div className="card-surface mt-6 p-4 sm:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-base font-semibold text-foreground">
              Employee: {selectedEmployee.name}
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/employee/$employeeId" params={{ employeeId: selectedEmployee.id }}>
                Open details
              </Link>
            </Button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total hours</dt>
              <dd className="tabular mt-1 text-lg font-semibold">
                {minutesToHHMM(summary.totalMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Billable</dt>
              <dd className="tabular mt-1 text-lg font-semibold text-billable-foreground">
                {minutesToHHMM(summary.billableMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Non-billable</dt>
              <dd className="tabular mt-1 text-lg font-semibold">
                {minutesToHHMM(summary.nonBillableMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Entries</dt>
              <dd className="tabular mt-1 text-lg font-semibold">{summary.entryCount}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-foreground">Tracking details</h2>
        {isLoading ? (
          <LoadingState label="Loading admin report…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No entries match the selected filters."
            description="Adjust the filters above or clear them to see all records."
          />
        ) : (
          <EntriesTable entries={filtered} />
        )}
      </section>
    </AppShell>
  );
}
