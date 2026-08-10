import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, LoadingState } from "@/components/common/States";
import { employeeService } from "@/services/employeeService";
import type { Employee } from "@/types";

export function EmployeeManager({ onChanged }: { onChanged?: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const list = await employeeService.getEmployees();
    setEmployees(list);
    setIsLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter an employee name.");
      return;
    }
    if (trimmed.length > 100) {
      toast.error("Employee name must be 100 characters or fewer.");
      return;
    }
    setIsSaving(true);
    try {
      await employeeService.addEmployee(trimmed);
      setName("");
      await load();
      onChanged?.();
      toast.success(`${trimmed} added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add the employee.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (employee: Employee) => {
    setBusyId(employee.id);
    try {
      await employeeService.setActive(employee.id, !employee.active);
      await load();
      onChanged?.();
    } catch {
      toast.error("Unable to update the employee.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="card-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <Label htmlFor="new-employee">Employee name</Label>
            <Input
              id="new-employee"
              className="mt-1.5 h-11"
              placeholder="e.g. Priya Sharma"
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
            Add employee
          </Button>
        </div>
      </form>

      {isLoading ? (
        <LoadingState label="Loading employees…" />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet." description="Add your first employee above." />
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{employee.name}</td>
                  <td className="tabular px-4 py-3 text-muted-foreground">{employee.id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        employee.active
                          ? "rounded-full bg-billable px-2.5 py-1 text-xs font-medium text-billable-foreground"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {employee.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === employee.id}
                      onClick={() => void handleToggle(employee)}
                    >
                      {busyId === employee.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : employee.active ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </Button>
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
