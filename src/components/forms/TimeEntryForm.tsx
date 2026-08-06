import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { employeeService } from "@/services/employeeService";
import { siteService } from "@/services/siteService";
import { timeEntryService } from "@/services/timeEntryService";
import type { Employee, Site } from "@/types";
import { today } from "@/utils/dateUtils";
import { hhmmToMinutes } from "@/utils/timeUtils";
import {
  hasErrors,
  validateTimeEntryForm,
  type FieldErrors,
  type TimeEntryFormValues,
} from "@/utils/validation";

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{message}</p>;
}


export function TimeEntryForm({ onSaved }: { onSaved?: () => void }) {
  const { user, isAdmin } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [values, setValues] = useState<TimeEntryFormValues>({
    siteId: "",
    employeeId: "",
    hours: "",
    workDescription: "",
    note: "",
    billable: "billable",
    date: today(),
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [siteList, employeeList] = await Promise.all([
        siteService.getSites(),
        employeeService.getActiveEmployees(),
      ]);
      if (cancelled) return;
      setSites(siteList);
      setEmployees(employeeList);
      setIsLoadingConfig(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Employees are locked to their own record; admins may pick any employee.
  useEffect(() => {
    if (!isAdmin && user?.employeeId) {
      setValues((prev) => ({ ...prev, employeeId: user.employeeId as string }));
    }
  }, [isAdmin, user?.employeeId]);

  const lockEmployee = useMemo(() => !isAdmin && Boolean(user?.employeeId), [isAdmin, user]);

  const set = <K extends keyof TimeEntryFormValues>(key: K, value: TimeEntryFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    const validation = validateTimeEntryForm(values);
    setErrors(validation);
    if (hasErrors(validation)) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setIsSaving(true);
    try {
      const { queued } = await timeEntryService.createEntry({
        employeeId: values.employeeId,
        siteId: values.siteId,
        date: values.date,
        durationMinutes: hhmmToMinutes(values.hours) ?? 0,
        workDescription: values.workDescription.trim(),
        note: values.note.trim() || undefined,
        billable: values.billable === "billable",
      });

      if (queued) {
        toast.warning(
          "You are currently offline. Your entry has been saved locally and will sync when the connection is restored.",
        );
      } else {
        toast.success("Time entry saved.");
      }

      setValues((prev) => ({
        ...prev,
        siteId: "",
        hours: "",
        workDescription: "",
        note: "",
        billable: "billable",
      }));
      onSaved?.();
    } catch {
      toast.error("Unable to save your time entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectClass =
    "h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="card-surface space-y-5 p-4 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="siteId">
              Site name <span className="text-destructive">*</span>
            </Label>
            <select
              id="siteId"
              className={`${selectClass} mt-1.5`}
              value={values.siteId}
              disabled={isLoadingConfig}
              onChange={(event) => set("siteId", event.target.value)}
            >
              <option value="">{isLoadingConfig ? "Loading sites…" : "Select a site"}</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.siteId} />
          </div>

          <div>
            <Label htmlFor="employeeId">
              Employee name <span className="text-destructive">*</span>
            </Label>
            <select
              id="employeeId"
              className={`${selectClass} mt-1.5`}
              value={values.employeeId}
              disabled={isLoadingConfig || lockEmployee}
              onChange={(event) => set("employeeId", event.target.value)}
            >
              <option value="">{isLoadingConfig ? "Loading employees…" : "Select an employee"}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            {lockEmployee ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Locked to your employee record.
              </p>
            ) : null}
            <FieldError message={errors.employeeId} />
          </div>

          <div>
            <Label htmlFor="date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              className="mt-1.5 h-12 text-base"
              value={values.date}
              onChange={(event) => set("date", event.target.value)}
            />
            <FieldError message={errors.date} />
          </div>

          <div>
            <Label htmlFor="hours">
              Hours (HH:MM) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hours"
              inputMode="numeric"
              placeholder="08:30"
              className="tabular mt-1.5 h-12 text-base"
              value={values.hours}
              onChange={(event) => set("hours", event.target.value)}
            />
            <FieldError message={errors.hours} />
          </div>
        </div>

        <div>
          <Label htmlFor="workDescription">
            Work description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="workDescription"
            rows={3}
            placeholder="AHU troubleshooting and BMS programming"
            className="mt-1.5 text-base"
            value={values.workDescription}
            onChange={(event) => set("workDescription", event.target.value)}
          />
          <FieldError message={errors.workDescription} />
        </div>

        <div>
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            rows={2}
            placeholder="Additional comments"
            className="mt-1.5 text-base"
            value={values.note}
            onChange={(event) => set("note", event.target.value)}
          />
          <FieldError message={errors.note} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-foreground">
            Billable status <span className="text-destructive">*</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["billable", "Billable"],
                ["non-billable", "Non-Billable"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm font-medium transition ${
                  values.billable === value
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-input bg-card text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="billable"
                  className="size-4 accent-[var(--primary)]"
                  value={value}
                  checked={values.billable === value}
                  onChange={() => set("billable", value)}
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError message={errors.billable} />
        </fieldset>
      </div>

      <div className="sticky bottom-20 z-10 lg:static lg:bottom-auto">
        <Button type="submit" size="lg" className="h-12 w-full text-base lg:w-auto" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save time entry"
          )}
        </Button>
      </div>
    </form>
  );
}
