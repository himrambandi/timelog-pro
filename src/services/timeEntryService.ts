import { storageService, type TimeEntryRepository } from "./storageService";
import type {
  EntryFilters,
  EntrySummary,
  PendingTimeEntry,
  TimeEntry,
  TimeEntryDraft,
} from "@/types";

let repository: TimeEntryRepository = storageService;

/** Swap the underlying data store (Supabase, serverless API, ...) without UI changes. */
export function setTimeEntryRepository(next: TimeEntryRepository): void {
  repository = next;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `TE-${crypto.randomUUID()}`;
  }
  return `TE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function sortByDateDesc(entries: TimeEntry[]): TimeEntry[] {
  return [...entries].sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
  );
}

export function matchesFilters(entry: TimeEntry, filters: EntryFilters = {}): boolean {
  if (filters.employeeId && entry.employeeId !== filters.employeeId) return false;
  if (filters.siteId && entry.siteId !== filters.siteId) return false;
  if (filters.fromDate && entry.date < filters.fromDate) return false;
  if (filters.toDate && entry.date > filters.toDate) return false;
  if (filters.billable !== undefined && entry.billable !== filters.billable) return false;
  return true;
}

export function summarize(entries: TimeEntry[]): EntrySummary {
  return entries.reduce<EntrySummary>(
    (summary, entry) => ({
      totalMinutes: summary.totalMinutes + entry.durationMinutes,
      billableMinutes: summary.billableMinutes + (entry.billable ? entry.durationMinutes : 0),
      nonBillableMinutes: summary.nonBillableMinutes + (entry.billable ? 0 : entry.durationMinutes),
      entryCount: summary.entryCount + 1,
    }),
    { totalMinutes: 0, billableMinutes: 0, nonBillableMinutes: 0, entryCount: 0 },
  );
}

export const timeEntryService = {
  /**
   * Creates an entry. When offline the entry is queued locally and flushed by
   * syncPending() once connectivity returns — a submission is never lost.
   */
  async createEntry(draft: TimeEntryDraft): Promise<{ entry: TimeEntry; queued: boolean }> {
    const entry: TimeEntry = {
      ...draft,
      note: draft.note?.trim() ? draft.note.trim() : undefined,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    if (!isOnline()) {
      await repository.savePending(entry);
      return { entry, queued: true };
    }
    try {
      await repository.saveEntry(entry);
      return { entry, queued: false };
    } catch {
      await repository.savePending(entry);
      return { entry, queued: true };
    }
  },

  async getEntries(filters: EntryFilters = {}): Promise<TimeEntry[]> {
    const [entries, pending] = await Promise.all([
      repository.listEntries(),
      repository.listPending(),
    ]);
    return sortByDateDesc(
      [...entries, ...pending].filter((entry) => matchesFilters(entry, filters)),
    );
  },

  async getEmployeeEntries(employeeId: string, filters: EntryFilters = {}): Promise<TimeEntry[]> {
    return this.getEntries({ ...filters, employeeId });
  },

  async getEntriesByDate(date: string): Promise<TimeEntry[]> {
    return this.getEntries({ fromDate: date, toDate: date });
  },

  async getPendingEntries(): Promise<PendingTimeEntry[]> {
    return repository.listPending();
  },

  /** Flush locally queued entries into the data store. */
  async syncPending(): Promise<number> {
    if (!isOnline()) return 0;
    const pending = await repository.listPending();
    let synced = 0;
    for (const item of pending) {
      const { pending: _pending, ...entry } = item;
      try {
        await repository.saveEntry({ ...entry, updatedAt: new Date().toISOString() });
        await repository.removePending(entry.id);
        synced += 1;
      } catch {
        break;
      }
    }
    return synced;
  },

  async getSummary(filters: EntryFilters = {}): Promise<EntrySummary> {
    return summarize(await this.getEntries(filters));
  },
};
