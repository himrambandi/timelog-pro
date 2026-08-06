import { useEffect, useState } from "react";
import { timeEntryService } from "@/services/timeEntryService";

/** Tracks connectivity and the local pending-sync queue. */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refreshPending = async () => {
      const pending = await timeEntryService.getPendingEntries();
      if (!cancelled) setPendingCount(pending.length);
    };

    const goOnline = async () => {
      setIsOnline(true);
      await timeEntryService.syncPending();
      await refreshPending();
    };
    const goOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine !== false);
    void goOnline();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const interval = window.setInterval(refreshPending, 8000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}
