import { useEffect, useState } from "react";

export type OfflineShellStatus = "checking" | "ready" | "unavailable";

export function useOfflineReadiness() {
  const supported = import.meta.env.PROD && "serviceWorker" in navigator;
  const [status, setStatus] = useState<OfflineShellStatus>(() =>
    supported ? "checking" : "unavailable",
  );

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;

    const checkCache = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const worker = registration.active ?? registration.waiting;
        if (!worker) throw new Error("Service worker is not active");

        const channel = new MessageChannel();
        const ready = await new Promise<boolean>((resolve, reject) => {
          const timeout = window.setTimeout(
            () => reject(new Error("Offline cache check timed out")),
            10000,
          );
          channel.port1.onmessage = (event) => {
            window.clearTimeout(timeout);
            resolve(event.data?.ready === true);
          };
          worker.postMessage({ type: "CHECK_OFFLINE_READY" }, [channel.port2]);
        });
        if (!cancelled) setStatus(ready ? "ready" : "unavailable");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    };

    void checkCache();
    const handleControllerChange = () => void checkCache();
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, [supported]);

  return status;
}
