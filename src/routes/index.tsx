import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

function IndexRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
}


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
