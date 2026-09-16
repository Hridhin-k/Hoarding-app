/** MapLibre aborts in-flight tile fetches on map.remove(); Next.js surfaces those as unhandled AbortErrors. */

export function isAbortError(reason: unknown) {
  if (!reason || typeof reason !== "object") return false;
  return "name" in reason && (reason as { name: string }).name === "AbortError";
}

export function whileSuppressingAbortErrors(run: () => void) {
  if (typeof window === "undefined") {
    run();
    return;
  }
  const onRejection = (event: PromiseRejectionEvent) => {
    if (isAbortError(event.reason)) event.preventDefault();
  };
  window.addEventListener("unhandledrejection", onRejection);
  try {
    run();
  } finally {
    // Tile abort rejections can land after the current task; keep the guard briefly.
    window.setTimeout(() => window.removeEventListener("unhandledrejection", onRejection), 250);
  }
}
