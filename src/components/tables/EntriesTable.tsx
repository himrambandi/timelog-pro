import type { PendingTimeEntry, TimeEntry } from "@/types";
import { BillableBadge, PendingBadge } from "@/components/common/States";
import { employeeService } from "@/services/employeeService";
import { siteService } from "@/services/siteService";
import { useDirectoryVersion } from "@/services/directoryCache";
import { formatDisplayDate, formatTimestamp } from "@/utils/dateUtils";
import { minutesToHHMM } from "@/utils/timeUtils";

function isPending(entry: TimeEntry): boolean {
  return (entry as PendingTimeEntry).pending === true;
}

export function EntriesTable({
  entries,
  showEmployee = true,
  showCreatedAt = true,
}: {
  entries: TimeEntry[];
  showEmployee?: boolean;
  showCreatedAt?: boolean;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="card-surface hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Date</th>
              {showEmployee ? <th className="px-4 py-3 font-semibold">Employee</th> : null}
              <th className="px-4 py-3 font-semibold">Site</th>
              <th className="px-4 py-3 font-semibold">Hours</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Work Description</th>
              <th className="px-4 py-3 font-semibold">Note</th>
              {showCreatedAt ? <th className="px-4 py-3 font-semibold">Created</th> : null}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/60 last:border-0">
                <td className="tabular whitespace-nowrap px-4 py-3">{entry.date}</td>
                {showEmployee ? (
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {employeeService.getEmployeeName(entry.employeeId)}
                  </td>
                ) : null}
                <td className="whitespace-nowrap px-4 py-3">{siteService.getSiteName(entry.siteId)}</td>
                <td className="tabular whitespace-nowrap px-4 py-3 font-semibold">
                  {minutesToHHMM(entry.durationMinutes)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BillableBadge billable={entry.billable} />
                    {isPending(entry) ? <PendingBadge /> : null}
                  </div>
                </td>
                <td className="max-w-[22rem] px-4 py-3 text-muted-foreground">
                  {entry.workDescription}
                </td>
                <td className="max-w-[16rem] px-4 py-3 text-muted-foreground">{entry.note ?? "—"}</td>
                {showCreatedAt ? (
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTimestamp(entry.createdAt)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {entries.map((entry) => (
          <article key={entry.id} className="card-surface p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {siteService.getSiteName(entry.siteId)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDisplayDate(entry.date)}</p>
              </div>
              <p className="tabular shrink-0 text-lg font-semibold text-primary">
                {minutesToHHMM(entry.durationMinutes)}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BillableBadge billable={entry.billable} />
              {isPending(entry) ? <PendingBadge /> : null}
              {showEmployee ? (
                <span className="text-xs font-medium text-muted-foreground">
                  {employeeService.getEmployeeName(entry.employeeId)}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-foreground">{entry.workDescription}</p>
            {entry.note ? (
              <p className="mt-1 text-xs text-muted-foreground">Note: {entry.note}</p>
            ) : null}
            {showCreatedAt ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Created {formatTimestamp(entry.createdAt)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
