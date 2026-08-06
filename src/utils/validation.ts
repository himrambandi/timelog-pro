import { isValidISODate } from "./dateUtils";
import { hhmmToMinutes, isValidHHMM } from "./timeUtils";

export interface TimeEntryFormValues {
  siteId: string;
  employeeId: string;
  hours: string;
  workDescription: string;
  note: string;
  billable: "billable" | "non-billable" | "";
  date: string;
}

export type FieldErrors = Partial<Record<keyof TimeEntryFormValues, string>>;

export function validateTimeEntryForm(values: TimeEntryFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.siteId) errors.siteId = "Site name is required.";
  if (!values.employeeId) errors.employeeId = "Employee name is required.";

  const hours = values.hours.trim();
  if (!hours) {
    errors.hours = "Hours are required.";
  } else if (!isValidHHMM(hours)) {
    errors.hours = "Enter hours as HH:MM (e.g. 08:30). Minutes must be 00–59.";
  } else if ((hhmmToMinutes(hours) ?? 0) <= 0) {
    errors.hours = "Duration must be greater than 00:00.";
  }

  const description = values.workDescription.trim();
  if (!description) {
    errors.workDescription = "Work description is required.";
  } else if (description.length > 1000) {
    errors.workDescription = "Work description must be under 1000 characters.";
  }

  if (values.note.trim().length > 1000) {
    errors.note = "Note must be under 1000 characters.";
  }

  if (!values.billable) errors.billable = "Select billable or non-billable.";

  if (!values.date) {
    errors.date = "Date is required.";
  } else if (!isValidISODate(values.date)) {
    errors.date = "Enter a valid date.";
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
