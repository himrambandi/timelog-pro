import { listTimeEntries, saveTimeEntry } from "@/lib/timeEntries.functions";
import { localStorageRepository, type TimeEntryRepository } from "./storageService";
import type { TimeEntry } from "@/types";

/**
 * Cloud-backed repository. Entries live in the shared database so every device
 * (and the admin portal) sees the same data. The offline queue stays local:
 * entries saved without a connection are flushed to the cloud on reconnect.
 */
export const cloudRepository: TimeEntryRepository = {
  async listEntries(): Promise<TimeEntry[]> {
    return listTimeEntries();
  },
  async saveEntry(entry) {
    await saveTimeEntry({
      data: {
        id: entry.id,
        employeeId: entry.employeeId,
        siteId: entry.siteId,
        date: entry.date,
        durationMinutes: entry.durationMinutes,
        workDescription: entry.workDescription,
        ...(entry.note ? { note: entry.note } : {}),
        billable: entry.billable,
        createdAt: entry.createdAt,
        ...(entry.updatedAt ? { updatedAt: entry.updatedAt } : {}),
      },
    });
    return entry;
  },
  listPending: localStorageRepository.listPending,
  savePending: localStorageRepository.savePending,
  removePending: localStorageRepository.removePending,
};
