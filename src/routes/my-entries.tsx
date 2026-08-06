import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/common/RequireAuth";
import { MyEntriesPage } from "@/pages/MyEntries";

export const Route = createFileRoute("/my-entries")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My entries — Time & Activity Tracker" },
      { name: "description", content: "Review and filter every time entry you have submitted." },
      { property: "og:title", content: "My entries — Time & Activity Tracker" },
      {
        property: "og:description",
        content: "Review and filter every time entry you have submitted.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyEntriesPage />
    </RequireAuth>
  ),
});
