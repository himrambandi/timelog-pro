import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import type { TimeEntry } from "./types";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main";
const GITHUB_ENTRIES_PATH = process.env.GITHUB_ENTRIES_PATH ?? "time-entries.json";

function getGithubRepo() {
  if (!GITHUB_REPOSITORY) {
    throw new Error(
      "GITHUB_REPOSITORY is not configured. Set it as owner/repo in the server environment.",
    );
  }

  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY must be set in owner/repo format.");
  }

  return { owner, repo };
}

function githubHeaders(): Headers {
  const headers = new Headers({ "accept": "application/vnd.github+json" });
  if (GITHUB_TOKEN) {
    headers.set("authorization", `Bearer ${GITHUB_TOKEN}`);
  }
  return headers;
}

async function githubApi(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...Object.fromEntries(githubHeaders().entries()),
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  return { response, json, text };
}

async function fetchTimeEntriesFile() {
  const { owner, repo } = getGithubRepo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    GITHUB_ENTRIES_PATH,
  )}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const { response, json } = await githubApi(url);

  if (response.status === 404) {
    return { content: "[]", sha: undefined };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub request failed ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  if (!json || typeof json !== "object" || !("content" in json) || !("sha" in json)) {
    throw new Error("Unexpected GitHub response while reading time entries file.");
  }

  const content = Buffer.from((json as { content: string }).content, "base64").toString(
    "utf8",
  );
  return { content, sha: (json as { sha: string }).sha };
}

async function writeTimeEntriesFile(entries: TimeEntry[], sha?: string) {
  const { owner, repo } = getGithubRepo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    GITHUB_ENTRIES_PATH,
  )}`;
  const body = {
    message: `Update shared time entries ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(entries, null, 2), "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
    sha,
  } as Record<string, unknown>;

  const { response, json } = await githubApi(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub write failed ${response.status}: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

async function getSharedEntries(): Promise<TimeEntry[]> {
  const { content } = await fetchTimeEntriesFile();
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? (parsed as TimeEntry[]) : [];
}

async function saveSharedEntry(entry: TimeEntry): Promise<TimeEntry> {
  const { content, sha } = await fetchTimeEntriesFile();
  const existingEntries = Array.isArray(JSON.parse(content))
    ? (JSON.parse(content) as TimeEntry[])
    : ([] as TimeEntry[]);

  const nextEntries = [...existingEntries];
  const index = nextEntries.findIndex((item) => item.id === entry.id);

  if (index >= 0) {
    nextEntries[index] = { ...nextEntries[index], ...entry };
  } else {
    nextEntries.push(entry);
  }

  try {
    await writeTimeEntriesFile(nextEntries, sha);
  } catch (error) {
    if (error instanceof Error && /sha|conflict/i.test(error.message)) {
      const retry = await fetchTimeEntriesFile();
      const baseEntries = Array.isArray(JSON.parse(retry.content))
        ? (JSON.parse(retry.content) as TimeEntry[])
        : ([] as TimeEntry[]);
      const merged = [...baseEntries];
      const mergedIndex = merged.findIndex((item) => item.id === entry.id);
      if (mergedIndex >= 0) {
        merged[mergedIndex] = { ...merged[mergedIndex], ...entry };
      } else {
        merged.push(entry);
      }
      await writeTimeEntriesFile(merged, retry.sha);
    } else {
      throw error;
    }
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
