import { useSyncExternalStore } from "react";
import { listEmployees, listSites } from "@/lib/directory.functions";
import type { Employee, Site } from "@/types";

/**
 * Name caches for the employee and site directories. Time entries store ids, and
 * several views need a name synchronously while rendering, so the lists are cached
 * here and every refresh bumps a version that subscribed components observe.
 */
const employeeNames = new Map<string, string>();
const siteNames = new Map<string, string>();

let version = 0;
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function emit() {
  version += 1;
  for (const listener of listeners) listener();
}

let employees: Employee[] = [];
let sites: Site[] = [];

async function refresh(): Promise<void> {
  const [employeeList, siteList] = await Promise.all([listEmployees(), listSites()]);
  employees = employeeList;
  sites = siteList;
  employeeNames.clear();
  siteNames.clear();
  for (const employee of employeeList) employeeNames.set(employee.id, employee.name);
  for (const site of siteList) siteNames.set(site.id, site.name);
  emit();
}

/** Loads the directory once; subsequent calls reuse the cached lists. */
export async function ensureDirectory(): Promise<void> {
  if (employeeNames.size > 0 || siteNames.size > 0) return;
  inflight ??= refresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Refetches both lists, e.g. after an admin adds an employee or site. */
export async function reloadDirectory(): Promise<void> {
  await refresh();
}

export function getCachedEmployees(): Employee[] {
  return employees;
}

export function getCachedSites(): Site[] {
  return sites;
}

export function lookupEmployeeName(id: string): string {
  return employeeNames.get(id) ?? id;
}

export function lookupSiteName(id: string): string {
  return siteNames.get(id) ?? id;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void ensureDirectory();
  return () => listeners.delete(listener);
}

/** Re-renders the caller whenever the cached directory changes. */
export function useDirectoryVersion(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}
