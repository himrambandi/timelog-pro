import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/Login";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Time & Activity Tracker" },
      { name: "description", content: "Sign in to record and review your site time entries." },
      { property: "og:title", content: "Sign in — Time & Activity Tracker" },
      { property: "og:description", content: "Sign in to record and review your site time entries." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});
