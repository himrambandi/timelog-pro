import type { TimeEntry } from "@/types";
import { employeeService } from "./employeeService";
import { siteService } from "./siteService";
import { minutesToHHMM } from "@/utils/timeUtils";

/**
 * Excel export/import helpers.
 *
 * Excel is an interchange format only — never the live transactional store.
 * Writes always go through timeEntryService / the storage repository.
 */
export async function exportEntriesToExcel(entries: TimeEntry[], fileName?: string): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = entries.map((entry) => ({
    Date: entry.date,
    "Employee Name": employeeService.getEmployeeName(entry.employeeId),
    "Site Name": siteService.getSiteName(entry.siteId),
    Hours: minutesToHHMM(entry.durationMinutes),
    "Work Description": entry.workDescription,
    Note: entry.note ?? "",
    Billable: entry.billable ? "Billable" : "Non-Billable",
    "Created Date": entry.createdAt,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 8 },
    { wch: 44 },
    { wch: 30 },
    { wch: 14 },
    { wch: 24 },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Engineer Timesheet");
  XLSX.writeFile(book, fileName ?? `time-tracking-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
