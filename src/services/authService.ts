import users from "@/config/users.json";
import type { CredentialRecord, User } from "@/types";

const SESSION_KEY = "tat.session.v1";

/**
 * Prototype authentication.
 *
 * The credentials in src/config/users.json are demo data only — a client-side
 * JSON file is NOT secure authentication. Every consumer goes through this
 * service, so it can be replaced with a real identity provider (Lovable Cloud,
 * OIDC, etc.) without touching any page or component.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid username or password.");
    this.name = "InvalidCredentialsError";
  }
}

const credentials = users as CredentialRecord[];

function toUser(record: CredentialRecord): User {
  return {
    id: record.id,
    username: record.username,
    employeeId: record.employeeId,
    role: record.role,
  };
}

export const authService = {
  async login(username: string, password: string): Promise<User> {
    // Simulated latency so loading states are exercised realistically.
    await new Promise((resolve) => setTimeout(resolve, 350));
    const match = credentials.find(
      (record) =>
        record.username.toLowerCase() === username.trim().toLowerCase() &&
        record.password === password,
    );
    if (!match) throw new InvalidCredentialsError();
    const user = toUser(match);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    return user;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      return parsed && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  },
};
