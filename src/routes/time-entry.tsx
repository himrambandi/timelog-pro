import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/common/RequireAuth";
import { TimeEntryPage } from "@/pages/TimeEntry";

export const Route = createFileRoute("/time-entry")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Log time — Time & Activity Tracker" },
      { name: "description", content: "Record site hours, work performed and billable status." },
      { property: "og:title", content: "Log time — Time & Activity Tracker" },
      {
        property: "og:description",
        content: "Record site hours, work performed and billable status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <TimeEntryPage />
    </RequireAuth>
  ),
});
