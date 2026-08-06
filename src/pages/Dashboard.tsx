import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, CalendarRange, Clock, PlusCircle, Receipt, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState, LoadingState } from "@/components/common/States";
import { EntriesTable } from "@/components/tables/EntriesTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { employeeService } from "@/services/employeeService";
import { summarize, timeEntryService } from "@/services/timeEntryService";
import type { TimeEntry } from "@/types";
import { startOfMonth, startOfWeek, today } from "@/utils/dateUtils";
import { minutesToHHMM } from "@/utils/timeUtils";

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      const filters = !isAdmin && user?.employeeId ? { employeeId: user.employeeId } : {};
      const data = await timeEntryService.getEntries(filters);
      if (cancelled) return;
      setEntries(data);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.employeeId]);

  const todayDate = today();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const todaySummary = summarize(entries.filter((entry) => entry.date === todayDate));
  const weekSummary = summarize(entries.filter((entry) => entry.date >= weekStart));
  const monthSummary = summarize(entries.filter((entry) => entry.date >= monthStart));

  const displayName = user?.employeeId
    ? employeeService.getEmployeeName(user.employeeId)
    : (user?.username ?? "");

  return (
    <AppShell
      title={`Welcome, ${displayName}`}
      description={isAdmin ? "Organisation-wide activity overview" : "Your time tracking overview"}
      actions={
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link to="/time-entry">
            <PlusCircle className="mr-2 size-4" /> Log time
          </Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Today's hours"
          value={minutesToHHMM(todaySummary.totalMinutes)}
          icon={Clock}
          tone="primary"
        />
        <StatCard
          label="This week"
          value={minutesToHHMM(weekSummary.totalMinutes)}
          icon={CalendarDays}
          hint={`${weekSummary.entryCount} entries`}
        />
        <StatCard
          label="This month"
          value={minutesToHHMM(monthSummary.totalMinutes)}
          icon={CalendarRange}
          hint={`${monthSummary.entryCount} entries`}
        />
        <StatCard
          label="Billable (month)"
          value={minutesToHHMM(monthSummary.billableMinutes)}
          icon={Wallet}
          tone="billable"
        />
        <StatCard
          label="Non-billable (month)"
          value={minutesToHHMM(monthSummary.nonBillableMinutes)}
          icon={Receipt}
          tone="nonbillable"
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Recent entries</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/my-entries">View all</Link>
          </Button>
        </div>
        {isLoading ? (
          <LoadingState label="Loading your time entries…" />
        ) : entries.length === 0 ? (
          <EmptyState
            title="No time entries yet"
            description="Log your first entry to start building your timesheet."
          />
        ) : (
          <EntriesTable entries={entries.slice(0, 8)} showEmployee={isAdmin} showCreatedAt={false} />
        )}
      </section>
    </AppShell>
  );
}
