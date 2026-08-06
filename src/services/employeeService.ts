import employees from "@/config/employees.json";
import type { Employee } from "@/types";

const all = employees as Employee[];

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    return all;
  },
  async getActiveEmployees(): Promise<Employee[]> {
    return all.filter((employee) => employee.active);
  },
  getEmployeeName(id: string): string {
    return all.find((employee) => employee.id === id)?.name ?? id;
  },
};
