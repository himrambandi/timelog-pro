export type Role = "employee" | "admin";

export interface User {
  id: string;
  username: string;
  employeeId: string | null;
  role: Role;
}

/** Prototype-only credential record loaded from src/config/users.json. */
export interface CredentialRecord extends User {
  password: string;
}

export interface Employee {
  id: string;
  name: string;
  active: boolean;
}

export interface Site {
  id: string;
  name: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  siteId: string;
  /** YYYY-MM-DD */
  date: string;
  durationMinutes: number;
  workDescription: string;
  note?: string;
  billable: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** A time entry created while offline and awaiting synchronization. */
export interface PendingTimeEntry extends TimeEntry {
  pending: true;
}

export type TimeEntryDraft = Omit<TimeEntry, "id" | "createdAt" | "updatedAt">;

export interface EntryFilters {
  employeeId?: string;
  siteId?: string;
  fromDate?: string;
  toDate?: string;
  billable?: boolean;
}

export interface EntrySummary {
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  entryCount: number;
}
