import { useCallback, useEffect, useState } from "react";
import { getQueuedEvaluations, OUTBOX_CHANGE_EVENT } from "../Utils/offlineDb";
import { syncEvaluationOutbox } from "../Utils/offlineSync";

export function useEvaluationSync() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSyncedCount, setLastSyncedCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    setPendingCount((await getQueuedEvaluations()).length);
  }, []);

  const synchronize = useCallback(async () => {
    if (!navigator.onLine) { await refreshPendingCount(); return; }
    setSyncing(true);
    setSyncError("");
    try {
      const result = await syncEvaluationOutbox();
      setPendingCount(result.remaining);
      setLastSyncedCount(result.synced);
      setSyncError(result.lastError ?? "");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "No se pudo sincronizar.");
      await refreshPendingCount();
    } finally {
      setSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); void synchronize(); };
    const handleOffline = () => setOnline(false);
    const handleOutboxChange = () => { void refreshPendingCount(); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OUTBOX_CHANGE_EVENT, handleOutboxChange);
    // Initial reads synchronize this hook with external IndexedDB/network state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPendingCount();
    if (navigator.onLine) void synchronize();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OUTBOX_CHANGE_EVENT, handleOutboxChange);
    };
  }, [refreshPendingCount, synchronize]);

  return { online, pendingCount, syncing, syncError, lastSyncedCount, synchronize };
}
