"use client";

import { useEffect, useState } from "react";
import { flushProofQueue, getQueuedProofCount } from "@/lib/field/offline-queue";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const sync = async () => {
      setOffline(!navigator.onLine);
      try {
        setQueued(await getQueuedProofCount());
      } catch {
        setQueued(0);
      }
    };
    void sync();
    const onOnline = () => {
      void flushProofQueue().then((result) => setQueued(result.remaining));
      setOffline(false);
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const timer = window.setInterval(() => {
      void getQueuedProofCount().then(setQueued).catch(() => undefined);
    }, 8000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(timer);
    };
  }, []);

  if (!offline && queued === 0) return null;
  return (
    <div className="bg-amber-400 px-4 py-2 text-center text-xs font-medium text-amber-950">
      {offline
        ? "You are offline. Captured proof stays queued until you reconnect."
        : `${queued} proof${queued === 1 ? "" : "s"} waiting to upload.`}
    </div>
  );
}
