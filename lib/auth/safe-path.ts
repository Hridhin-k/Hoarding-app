/**
 * Safe internal redirect paths only — blocks open redirects and protocol-relative URLs.
 */
export function safeInternalPath(next: string | null | undefined, fallback = "/manage"): string {
  if (!next) return fallback;
  let value = next.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.includes("@")) return fallback;
  // Disallow control characters / whitespace injection.
  if (/[\s\0]/.test(value)) return fallback;
  return value;
}
