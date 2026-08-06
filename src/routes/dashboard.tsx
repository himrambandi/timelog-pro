import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/common/RequireAuth";
import { DashboardPage } from "@/pages/Dashboard";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Time & Activity Tracker" },
      {
        name: "description",
        content: "Today, weekly and monthly hours with your most recent time entries.",
      },
      { property: "og:title", content: "Dashboard — Time & Activity Tracker" },
      {
        property: "og:description",
        content: "Today, weekly and monthly hours with your most recent time entries.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});
