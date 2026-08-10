import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, LoadingState } from "@/components/common/States";
import { siteService } from "@/services/siteService";
import type { Site } from "@/types";

export function SiteManager({ onChanged }: { onChanged?: () => void }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const list = await siteService.getSites();
    setSites(list);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const validate = (value: string) => {
    if (!value) {
      toast.error("Enter a site name.");
      return false;
    }
    if (value.length > 100) {
      toast.error("Site name must be 100 characters or fewer.");
      return false;
    }
    return true;
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!validate(trimmed)) return;
    setIsSaving(true);
    try {
      await siteService.addSite(trimmed);
      setName("");
      await load();
      onChanged?.();
      toast.success(`${trimmed} added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add the site.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRename = async (site: Site) => {
    const trimmed = editingName.trim();
    if (!validate(trimmed)) return;
    setBusyId(site.id);
    try {
      await siteService.renameSite(site.id, trimmed);
      setEditingId(null);
      await load();
      onChanged?.();
      toast.success("Site renamed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to rename the site.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="card-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <Label htmlFor="new-site">Site name</Label>
            <Input
              id="new-site"
              className="mt-1.5 h-11"
              placeholder="e.g. Riverside Plaza"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button type="submit" className="h-11" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Add site
          </Button>
        </div>
      </form>

      {isLoading ? (
        <LoadingState label="Loading sites…" />
      ) : sites.length === 0 ? (
        <EmptyState title="No sites yet." description="Add your first site above." />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {editingId === site.id ? (
                      <Input
                        className="h-10"
                        maxLength={100}
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    ) : (
                      site.name
                    )}
                  </td>
                  <td className="tabular px-4 py-3 text-muted-foreground">{site.id}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === site.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === site.id}
                          onClick={() => void handleRename(site)}
                        >
                          {busyId === site.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(site.id);
                          setEditingName(site.name);
                        }}
                      >
                        <Pencil className="mr-2 size-4" /> Rename
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
