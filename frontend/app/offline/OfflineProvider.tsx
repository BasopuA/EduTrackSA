"use client";

import React, { useEffect, useState } from "react";
import { getOfflinePreference, getSyncQueue, setOfflinePreference } from "./offlineStorage";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface OfflineProviderProps {
  children: React.ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [dataSaving, setDataSaving] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration can fail in restricted browser contexts.
      });
    });
  }, []);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    getOfflinePreference("dataSaving").then((value) => setDataSaving(Boolean(value)));
  }, []);

  useEffect(() => {
    if (!isOnline) {
      getSyncQueue().then((queue) => setPendingSync(queue.length));
      return;
    }

    const flushQueue = async () => {
      const queue = await getSyncQueue();
      setPendingSync(queue.length);

      for (const item of queue) {
        try {
          const response = await fetch(`${API_URL}${item.url}`, {
            method: item.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.body),
          });

          if (response.ok) {
            await import("./offlineStorage").then((module) => module.clearSyncQueueItem(item.id));
          }
        } catch {
          break;
        }
      }

      const remaining = await getSyncQueue();
      setPendingSync(remaining.length);
    };

    flushQueue();
  }, [isOnline]);

  const toggleDataSaving = async () => {
    const next = !dataSaving;
    setDataSaving(next);
    await setOfflinePreference("dataSaving", next);
  };

  return (
    <OfflineContext.Provider value={{ isOnline, pendingSync, dataSaving, toggleDataSaving }}>
      {children}
    </OfflineContext.Provider>
  );
}

interface OfflineContextValue {
  isOnline: boolean;
  pendingSync: number;
  dataSaving: boolean;
  toggleDataSaving: () => Promise<void>;
}

const OfflineContext = React.createContext<OfflineContextValue>({
  isOnline: true,
  pendingSync: 0,
  dataSaving: false,
  toggleDataSaving: async () => undefined,
});

export function useOffline() {
  return React.useContext(OfflineContext);
}
