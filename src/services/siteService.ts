import { ensureDirectory, getCachedSites, lookupSiteName, reloadDirectory } from "./directoryCache";
import { createSite as createSiteFn, renameSite as renameSiteFn } from "@/lib/directory.functions";
import type { Site } from "@/types";

export const siteService = {
  async getSites(): Promise<Site[]> {
    await ensureDirectory();
    return getCachedSites();
  },
  /** Resolves a cached name; falls back to the id until the directory has loaded. */
  getSiteName(id: string): string {
    void ensureDirectory();
    return lookupSiteName(id);
  },
  async addSite(name: string): Promise<void> {
    await createSiteFn({ data: { name } });
    await reloadDirectory();
  },
  async renameSite(id: string, name: string): Promise<void> {
    await renameSiteFn({ data: { id, name } });
    await reloadDirectory();
  },
};
