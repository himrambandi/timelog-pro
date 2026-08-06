import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, LoadingState } from "@/components/common/States";
import { EntriesTable } from "@/components/tables/EntriesTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { siteService } from "@/services/siteService";
import { summarize, timeEntryService } from "@/services/timeEntryService";
import type { Site, TimeEntry } from "@/types";
import { minutesToHHMM } from "@/utils/timeUtils";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

export function MyEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState("");
  const [siteId, setSiteId] = useState("");
  const [billable, setBillable] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      const [data, siteList] = await Promise.all([
        user?.employeeId
          ? timeEntryService.getEmployeeEntries(user.employeeId)
          : timeEntryService.getEntries(),
        siteService.getSites(),
      ]);
      if (cancelled) return;
      setEntries(data);
      setSites(siteList);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.employeeId]);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (date && entry.date !== date) return false;
        if (siteId && entry.siteId !== siteId) return false;
        if (billable && String(entry.billable) !== billable) return false;
        return true;
      }),
    [entries, date, siteId, billable],
  );

  const summary = summarize(filtered);
  const hasFilters = Boolean(date || siteId || billable);

  return (
    <AppShell title="My entries" description="Every time entry you have submitted">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total hours" value={minutesToHHMM(summary.totalMinutes)} tone="primary" />
        <StatCard label="Billable" value={minutesToHHMM(summary.billableMinutes)} tone="billable" />
        <StatCard
          label="Non-billable"
          value={minutesToHHMM(summary.nonBillableMinutes)}
          tone="nonbillable"
        />
        <StatCard label="Entries" value={summary.entryCount} />
      </div>

      <div className="card-surface mt-6 grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
        <div>
          <Label htmlFor="filter-date">Date</Label>
          <Input
            id="filter-date"
            type="date"
            className="mt-1.5 h-11"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="filter-site">Site</Label>
          <select
            id="filter-site"
            className={`${selectClass} mt-1.5`}
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
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
          <Label htmlFor="filter-billable">Billable status</Label>
          <select
            id="filter-billable"
            className={`${selectClass} mt-1.5`}
            value={billable}
            onChange={(event) => setBillable(event.target.value)}
          >
            <option value="">All</option>
            <option value="true">Billable</option>
            <option value="false">Non-Billable</option>
          </select>
        </div>
        {hasFilters ? (
          <div className="sm:col-span-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDate("");
                setSiteId("");
                setBillable("");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingState label="Loading your entries…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No entries match the selected filters." : "No time entries found."}
            description={
              hasFilters ? "Try clearing one or more filters." : "Submit an entry from the Log Time page."
            }
          />
        ) : (
          <EntriesTable entries={filtered} showEmployee={false} />
        )}
      </div>
    </AppShell>
  );
}
