import { Inbox } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="card-surface space-y-3 p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="space-y-2">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function BillableBadge({ billable }: { billable: boolean }) {
  return (
    <span
      className={
        billable
          ? "inline-flex items-center rounded-full bg-billable px-2.5 py-0.5 text-xs font-semibold text-billable-foreground"
          : "inline-flex items-center rounded-full bg-nonbillable px-2.5 py-0.5 text-xs font-semibold text-nonbillable-foreground"
      }
    >
      {billable ? "Billable" : "Non-Billable"}
    </span>
  );
}

export function PendingBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-warning px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
      Pending sync
    </span>
  );
}
