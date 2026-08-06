/**
 * All durations are handled as integer minutes. Never use floating point hours.
 */

const HHMM_PATTERN = /^(\d{1,3}):([0-5]\d)$/;

export function isValidHHMM(value: string): boolean {
  return HHMM_PATTERN.test(value.trim());
}

/** "08:30" -> 510. Returns null when the value is not a valid HH:MM duration. */
export function hhmmToMinutes(value: string): number | null {
  const match = HHMM_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 510 -> "08:30" */
export function minutesToHHMM(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** addDurations("01:30", "02:45") -> "04:15" */
export function addDurations(...values: string[]): string {
  const total = values.reduce((sum, value) => sum + (hhmmToMinutes(value) ?? 0), 0);
  return minutesToHHMM(total);
}

export function calculateTotalHours(entries: { durationMinutes: number }[]): number {
  return entries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
}
