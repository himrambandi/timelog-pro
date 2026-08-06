import sites from "@/config/sites.json";
import type { Site } from "@/types";

const all = sites as Site[];

export const siteService = {
  async getSites(): Promise<Site[]> {
    return all;
  },
  getSiteName(id: string): string {
    return all.find((site) => site.id === id)?.name ?? id;
  },
};
