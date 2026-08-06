import { AppShell } from "@/components/layout/AppShell";
import { TimeEntryForm } from "@/components/forms/TimeEntryForm";

export function TimeEntryPage() {
  return (
    <AppShell title="Log time" description="Record the work you performed on site">
      <div className="mx-auto max-w-3xl">
        <TimeEntryForm />
      </div>
    </AppShell>
  );
}
