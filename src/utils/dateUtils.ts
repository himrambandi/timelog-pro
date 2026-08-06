/** Date helpers. Dates are stored as YYYY-MM-DD strings. */

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

/** Monday-based start of the week for the given date. */
export function startOfWeek(date = new Date()): string {
  const clone = new Date(date);
  const day = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - day);
  return toISODate(clone);
}

export function startOfMonth(date = new Date()): string {
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function formatDisplayDate(value: string): string {
  if (!isValidISODate(value)) return value;
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTimestamp(value?: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
