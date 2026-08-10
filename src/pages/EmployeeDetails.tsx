import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, LoadingState } from "@/components/common/States";
import { EntriesTable } from "@/components/tables/EntriesTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { employeeService } from "@/services/employeeService";
import { useDirectoryVersion } from "@/services/directoryCache";
import { exportEntriesToExcel } from "@/services/excelService";
import { summarize, timeEntryService } from "@/services/timeEntryService";
import type { TimeEntry } from "@/types";
import { minutesToHHMM } from "@/utils/timeUtils";

export function EmployeeDetailsPage({ employeeId }: { employeeId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  useDirectoryVersion();
  const name = employeeService.getEmployeeName(employeeId);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      const data = await timeEntryService.getEmployeeEntries(employeeId);
      if (cancelled) return;
      setEntries(data);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const summary = summarize(entries);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportEntriesToExcel(entries, `${name.toLowerCase()}-timesheet.xlsx`);
      toast.success("Excel export downloaded.");
    } catch {
      toast.error("Unable to export the report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title={name}
      description="Employee tracking details"
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
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/admin">
          <ArrowLeft className="mr-2 size-4" /> Back to admin portal
        </Link>
      </Button>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total hours" value={minutesToHHMM(summary.totalMinutes)} tone="primary" />
        <StatCard label="Billable hours" value={minutesToHHMM(summary.billableMinutes)} tone="billable" />
        <StatCard
          label="Non-billable hours"
          value={minutesToHHMM(summary.nonBillableMinutes)}
          tone="nonbillable"
        />
        <StatCard label="Entries" value={summary.entryCount} />
      </div>

      <section className="mt-6">
        {isLoading ? (
          <LoadingState label="Loading employee entries…" />
        ) : entries.length === 0 ? (
          <EmptyState title="No time entries found for this employee." />
        ) : (
          <EntriesTable entries={entries} showEmployee={false} />
        )}
      </section>
    </AppShell>
  );
}
