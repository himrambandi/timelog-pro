import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import type { TimeEntry } from "./types";
import { createClient } from "@supabase/supabase-js";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TIME_ENTRIES_TABLE ?? "time_entries";

function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.",
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function mapRowToEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    siteId: String(row.site_id),
    date: String(row.date),
    durationMinutes: Number(row.duration_minutes),
    workDescription: String(row.work_description),
    note: row.note == null ? undefined : String(row.note),
    billable: Boolean(row.billable),
    createdAt: String(row.created_at),
    updatedAt: row.updated_at == null ? undefined : String(row.updated_at),
  };
}

async function getSharedEntries(): Promise<TimeEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select(
      `id, employee_id, site_id, date, duration_minutes, work_description, note, billable, created_at, updated_at`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase fetch error: ${error.message}`);
  }

  return Array.isArray(data) ? data.map((row) => mapRowToEntry(row as Record<string, unknown>)) : [];
}

async function saveSharedEntry(entry: TimeEntry): Promise<TimeEntry> {
  const supabase = getSupabaseClient();
  const row = {
    id: entry.id,
    employee_id: entry.employeeId,
    site_id: entry.siteId,
    date: entry.date,
    duration_minutes: entry.durationMinutes,
    work_description: entry.workDescription,
    note: entry.note ?? null,
    billable: entry.billable,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt ?? entry.createdAt,
  };

  const { error } = await supabase.from(SUPABASE_TABLE).upsert(row, { onConflict: "id" });
  if (error) {
    throw new Error(`Supabase save error: ${error.message}`);
  }
  return entry;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/time-entries") {
        if (request.method === "OPTIONS") {
          return new Response(null, { status: 204 });
        }

        if (request.method === "GET") {
          const entries = await getSharedEntries();
          return new Response(JSON.stringify(entries), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        if (request.method === "POST") {
          const payload = await request.json();
          const entry = payload as TimeEntry;
          if (!entry || typeof entry.id !== "string") {
            return new Response(JSON.stringify({ error: "Invalid time entry payload." }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const saved = await saveSharedEntry(entry);
          return new Response(JSON.stringify({ entry: saved }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Method not allowed." }), {
          status: 405,
          headers: { "content-type": "application/json", Allow: "GET,POST,OPTIONS" },
        });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      if (request.url.includes("/api/time-entries")) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
