import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const entrySchema = z.object({
  id: z.string().min(1).max(80),
  employeeId: z.string().min(1).max(40),
  siteId: z.string().min(1).max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().positive().max(24 * 60),
  workDescription: z.string().min(1).max(2000),
  note: z.string().max(2000).optional(),
  billable: z.boolean(),
  createdAt: z.string().min(1).max(40),
  updatedAt: z.string().min(1).max(40).optional(),
});

/** Reads every stored time entry, newest first. */
export const listTimeEntries = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("time_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    siteId: row.site_id,
    date: row.entry_date,
    durationMinutes: row.duration_minutes,
    workDescription: row.work_description,
    note: row.note ?? undefined,
    billable: row.billable,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }));
});

/** Stores a time entry. Existing ids are never overwritten. */
export const saveTimeEntry = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => entrySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("time_entries").upsert(
      {
        id: data.id,
        employee_id: data.employeeId,
        site_id: data.siteId,
        entry_date: data.date,
        duration_minutes: data.durationMinutes,
        work_description: data.workDescription,
        note: data.note ?? null,
        billable: data.billable,
        created_at: data.createdAt,
        updated_at: data.updatedAt ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
