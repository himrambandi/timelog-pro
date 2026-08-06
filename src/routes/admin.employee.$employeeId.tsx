import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/common/RequireAuth";
import { EmployeeDetailsPage } from "@/pages/EmployeeDetails";

export const Route = createFileRoute("/admin/employee/$employeeId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Employee timesheet — Time & Activity Tracker" },
      { name: "description", content: "Detailed time tracking records for a single employee." },
      { property: "og:title", content: "Employee timesheet — Time & Activity Tracker" },
      {
        property: "og:description",
        content: "Detailed time tracking records for a single employee.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmployeeDetailsRoute,
});

function EmployeeDetailsRoute() {
  const { employeeId } = Route.useParams();
  return (
    <RequireAuth adminOnly>
      <EmployeeDetailsPage employeeId={employeeId} />
    </RequireAuth>
  );
}
