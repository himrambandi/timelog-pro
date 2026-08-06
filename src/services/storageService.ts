import type { PendingTimeEntry, TimeEntry } from "@/types";

/**
 * Storage repository contract. The UI never talks to this directly — services do.
 * Swapping localStorage for Supabase / Firebase / a serverless API means providing
 * another implementation of this interface and nothing else.
 */
export interface TimeEntryRepository {
  listEntries(): Promise<TimeEntry[]>;
  saveEntry(entry: TimeEntry): Promise<TimeEntry>;
  listPending(): Promise<PendingTimeEntry[]>;
  savePending(entry: TimeEntry): Promise<PendingTimeEntry>;
  removePending(id: string): Promise<void>;
}

const ENTRIES_KEY = "tat.timeEntries.v1";
const PENDING_KEY = "tat.pendingEntries.v1";
const SEEDED_KEY = "tat.seeded.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function seedEntries(): TimeEntry[] {
  const day = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toISOString().slice(0, 10);
  };
  const stamp = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return date.toISOString();
  };
  const seeds: Array<[string, string, number, number, string, boolean, string?]> = [
    ["EMP001", "SITE001", 0, 510, "AHU troubleshooting and BMS programming", true, "Checked supply temperature sensor"],
    ["EMP001", "SITE003", 1, 180, "Internal troubleshooting of controller network", false],
    ["EMP001", "SITE002", 3, 465, "VAV box commissioning and point verification", true],
    ["EMP002", "SITE004", 1, 240, "Chiller plant graphics update", true, "Awaiting client sign-off"],
    ["EMP002", "SITE001", 4, 300, "Site survey and panel audit", true],
    ["EMP003", "SITE003", 2, 150, "Alarm review and trend setup", false],
    ["EMP003", "SITE002", 5, 480, "Rooftop unit sequence testing", true],
    ["EMP004", "SITE004", 2, 390, "Network switch replacement and integration", true],
    ["EMP004", "SITE001", 6, 120, "Documentation and as-built updates", false],
  ];
  return seeds.map(([employeeId, siteId, offset, durationMinutes, workDescription, billable, note], index) => ({
    id: `TE-${String(index + 1).padStart(6, "0")}`,
    employeeId,
    siteId,
    date: day(offset),
    durationMinutes,
    workDescription,
    note,
    billable,
    createdAt: stamp(offset),
  }));
}

async function fetchEntriesFromServer(): Promise<TimeEntry[]> {
  try {
    const response = await fetch("/api/time-entries", { method: "GET" });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as TimeEntry[];
  } catch {
    return [];
  }
}

async function saveEntryToServer(entry: TimeEntry): Promise<TimeEntry> {
  const response = await fetch("/api/time-entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    throw new Error("Unable to save entry to remote repository.");
  }

  const result = await response.json();
  return (result?.entry as TimeEntry) ?? entry;
}

export const serverRepository: TimeEntryRepository = {
  async listEntries() {
    return fetchEntriesFromServer();
  },
  async saveEntry(entry) {
    return saveEntryToServer(entry);
  },
  async listPending() {
    return read<PendingTimeEntry>(PENDING_KEY);
  },
  async savePending(entry) {
    const pending = read<PendingTimeEntry>(PENDING_KEY);
    const record: PendingTimeEntry = { ...entry, pending: true };
    pending.push(record);
    write(PENDING_KEY, pending);
    return record;
  },
  async removePending(id) {
    write(
      PENDING_KEY,
      read<PendingTimeEntry>(PENDING_KEY).filter((entry) => entry.id !== id),
    );
  },
};

export const localStorageRepository: TimeEntryRepository = {
  async listEntries() {
    if (isBrowser() && !window.localStorage.getItem(SEEDED_KEY)) {
      window.localStorage.setItem(SEEDED_KEY, "true");
      write(ENTRIES_KEY, seedEntries());
    }
    return read<TimeEntry>(ENTRIES_KEY);
  },
  async saveEntry(entry) {
    const entries = read<TimeEntry>(ENTRIES_KEY);
    // Never overwrite history: existing IDs are preserved, new ones appended.
    if (!entries.some((item) => item.id === entry.id)) {
      entries.push(entry);
      write(ENTRIES_KEY, entries);
    }
    return entry;
  },
  async listPending() {
    return read<PendingTimeEntry>(PENDING_KEY);
  },
  async savePending(entry) {
    const pending = read<PendingTimeEntry>(PENDING_KEY);
    const record: PendingTimeEntry = { ...entry, pending: true };
    pending.push(record);
    write(PENDING_KEY, pending);
    return record;
  },
  async removePending(id) {
    write(
      PENDING_KEY,
      read<PendingTimeEntry>(PENDING_KEY).filter((entry) => entry.id !== id),
    );
  },
};

export const storageService = serverRepository;
