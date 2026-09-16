"use client";

import { useEffect } from "react";

/**
 * Older Field builds (and other localhost:3000 apps) register a SW at `/`.
 * That plus chunked Supabase cookies is a common cause of HTTP 431.
 */
export function ClearRootServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        const path = new URL(registration.scope).pathname;
        if (path === "/" || path === "") {
          void registration.unregister();
        }
      }
    });
  }, []);
  return null;
}
