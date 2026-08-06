/**
 * Guarded service-worker registration.
 *
 * Never registers in dev, inside an iframe, in Lovable preview hosts, or when
 * ?sw=off is present — in those contexts any matching registration is removed.
 */
const SW_URL = "/sw.js";

function isBlockedHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const url =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL ??
          "";
        return url.endsWith(SW_URL);
      })
      .map((registration) => registration.unregister()),
  );
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const inIframe = window.self !== window.top;
  const swOff = new URLSearchParams(window.location.search).get("sw") === "off";
  const refused =
    !import.meta.env.PROD || inIframe || swOff || isBlockedHost(window.location.hostname);

  if (refused) {
    void unregisterAppWorkers();
    return;
  }

  void navigator.serviceWorker.register(SW_URL).catch(() => {
    /* offline shell is a progressive enhancement */
  });
}
