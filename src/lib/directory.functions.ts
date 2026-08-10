import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required").max(100, "Name is too long");

function newId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${Date.now().toString(36).toUpperCase()}${random}`;
}

const DUPLICATE = "23505";

/** Lists every employee, active first then alphabetically. */
export const listEmployees = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("id, name, active")
    .order("active", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, active: row.active }));
});

/** Adds a new employee. Duplicate names (case-insensitive) are rejected. */
export const createEmployee = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ name: nameSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("employees")
      .insert({ id: newId("EMP"), name: data.name, active: true });
    if (error) {
      throw new Error(
        error.code === DUPLICATE ? "An employee with that name already exists." : error.message,
      );
    }
    return { ok: true as const };
  });

/** Activates or deactivates an employee. Inactive employees stay out of the dropdowns. */
export const setEmployeeActive = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1).max(80), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("employees")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Lists every site alphabetically. */
export const listSites = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("sites")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ id: row.id, name: row.name }));
});

/** Adds a new site. Duplicate names (case-insensitive) are rejected. */
export const createSite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ name: nameSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").insert({ id: newId("SITE"), name: data.name });
    if (error) {
      throw new Error(
        error.code === DUPLICATE ? "A site with that name already exists." : error.message,
      );
    }
    return { ok: true as const };
  });

/** Renames an existing site. Existing time entries keep pointing at it. */
export const renameSite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().min(1).max(80), name: nameSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sites").update({ name: data.name }).eq("id", data.id);
    if (error) {
      throw new Error(
        error.code === DUPLICATE ? "A site with that name already exists." : error.message,
      );
    }
    return { ok: true as const };
  });
