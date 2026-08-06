import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/common/RequireAuth";
import { AdminDashboardPage } from "@/pages/AdminDashboard";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin portal — Time & Activity Tracker" },
      {
        name: "description",
        content: "Filter and export employee time tracking data across sites and date ranges.",
      },
      { property: "og:title", content: "Admin portal — Time & Activity Tracker" },
      {
        property: "og:description",
        content: "Filter and export employee time tracking data across sites and date ranges.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth adminOnly>
      <AdminDashboardPage />
    </RequireAuth>
  ),
});
