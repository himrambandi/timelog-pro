import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { InvalidCredentialsError } from "@/services/authService";

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  type LoginErrors = { username?: string | undefined; password?: string | undefined; form?: string | undefined };
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      void navigate({ to: user.role === "admin" ? "/admin" : "/dashboard", replace: true });
    }
  }, [isLoading, user, navigate]);

  if (!isLoading && user)
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors: LoginErrors = {};
    if (!username.trim()) nextErrors.username = "Username is required.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const signedIn = await login(username, password);
      await navigate({ to: signedIn.role === "admin" ? "/admin" : "/dashboard", replace: true });
    } catch (error) {
      setErrors({
        form:
          error instanceof InvalidCredentialsError
            ? "Invalid username or password."
            : "Unable to sign in right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Clock className="size-5" />
          </span>
          <p className="text-sm font-semibold">Time &amp; Activity Tracker</p>
        </div>
        <div className="max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight">
            Accurate site hours, captured in the field.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Log time against BMS sites and projects, keep billable and non-billable work separated,
            and give administrators a single reporting view.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Works offline · Installable app</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Clock className="size-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">Time &amp; Activity Tracker</p>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your employee credentials to continue.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                autoCapitalize="none"
                className="mt-1.5 h-12 text-base"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
              />
              {errors.username ? (
                <p className="mt-1 text-xs font-medium text-destructive">{errors.username}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1.5 h-12 text-base"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
              {errors.password ? (
                <p className="mt-1 text-xs font-medium text-destructive">{errors.password}</p>
              ) : null}
            </div>

            {errors.form ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                {errors.form}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-border bg-muted/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Prototype credentials</p>
            <p className="mt-1">Employee: raghu / demo123</p>
            <p>Administrator: admin / admin123</p>
            <p className="mt-2">
              Demo accounts only — this prototype login is not production-grade authentication.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
