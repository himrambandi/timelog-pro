import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Clock, LayoutDashboard, ListChecks, LogOut, PlusCircle, ShieldCheck, WifiOff, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { employeeService } from "@/services/employeeService";
import { useDirectoryVersion } from "@/services/directoryCache";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Clock;
  /** Roles allowed to see this item. Admins only ever see the admin portal. */
  roles: Array<"employee" | "admin">;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["employee"] },
  { to: "/time-entry", label: "Log Time", icon: PlusCircle, roles: ["employee"] },
  { to: "/my-entries", label: "My Entries", icon: ListChecks, roles: ["employee"] },
  { to: "/admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
];

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  useDirectoryVersion();
  const { isOnline, pendingCount } = useOnlineStatus();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const items = NAV.filter((item) => (user ? item.roles.includes(user.role) : false));

  const displayName = user?.employeeId
    ? employeeService.getEmployeeName(user.employeeId)
    : (user?.username ?? "");

  const handleLogout = () => {
    logout();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Clock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Time &amp; Activity</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Tracker</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-3 py-4">
          <div className="px-2 pb-3">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
              {user?.role} account
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:py-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
              {description ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
          {(!isOnline || pendingCount > 0) && (
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-medium sm:px-6",
                isOnline
                  ? "bg-warning text-warning-foreground"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {isOnline ? <RefreshCw className="size-3.5" /> : <WifiOff className="size-3.5" />}
              <span className="min-w-0">
                {isOnline
                  ? `${pendingCount} entr${pendingCount === 1 ? "y" : "ies"} pending sync.`
                  : "You are offline. Entries are saved locally and will sync when the connection returns."}
              </span>
            </div>
          )}
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
