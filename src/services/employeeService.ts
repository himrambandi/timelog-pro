import {
  ensureDirectory,
  getCachedEmployees,
  lookupEmployeeName,
  reloadDirectory,
} from "./directoryCache";
import {
  createEmployee as createEmployeeFn,
  setEmployeeActive as setEmployeeActiveFn,
} from "@/lib/directory.functions";
import type { Employee } from "@/types";

export const employeeService = {
  async getEmployees(): Promise<Employee[]> {
    await ensureDirectory();
    return getCachedEmployees();
  },
  async getActiveEmployees(): Promise<Employee[]> {
    await ensureDirectory();
    return getCachedEmployees().filter((employee) => employee.active);
  },
  /** Resolves a cached name; falls back to the id until the directory has loaded. */
  getEmployeeName(id: string): string {
    void ensureDirectory();
    return lookupEmployeeName(id);
  },
  async addEmployee(name: string): Promise<void> {
    await createEmployeeFn({ data: { name } });
    await reloadDirectory();
  },
  async setActive(id: string, active: boolean): Promise<void> {
    await setEmployeeActiveFn({ data: { id, active } });
    await reloadDirectory();
  },
};
