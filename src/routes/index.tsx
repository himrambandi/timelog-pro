import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Time & Activity Tracker — Site time logging for engineers" },
      {
        name: "description",
        content:
          "Log hours against sites, separate billable from non-billable work, and review team timesheets.",
      },
      { property: "og:title", content: "Time & Activity Tracker" },
      {
        property: "og:description",
        content: "Log hours against sites and review team timesheets from any device.",
      },
    ],
  }),
  component: () => <Navigate to="/dashboard" replace />,
});
