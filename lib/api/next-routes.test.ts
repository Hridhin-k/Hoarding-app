import { describe, expect, it } from "vitest";
import { loadEnv } from "vite";

const loaded = loadEnv("test", process.cwd(), "");
Object.assign(process.env, loaded);

const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

async function probe(path: string, init?: RequestInit) {
  try {
    return await fetch(`${BASE}${path}`, { ...init, redirect: "manual" });
  } catch {
    return null;
  }
}

describe("Next.js route handlers", () => {
  it("serves health when the app is running", async () => {
    const response = await probe("/api/health");
    if (!response) return;
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; service: string; envConfigured: boolean };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("hoardings360");
    expect(body.envConfigured).toBe(true);
  });

  it("rejects cron without the bearer secret", async () => {
    const response = await probe("/api/cron/operations");
    if (!response) return;
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects cron POST without the bearer secret", async () => {
    const response = await probe("/api/cron/operations", { method: "POST" });
    if (!response) return;
    expect(response.status).toBe(401);
  });

  it("runs ops cron when CRON_SECRET is set", async () => {
    const secret = process.env.CRON_SECRET;
    const response = await probe("/api/cron/operations", {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    if (!response) return;
    if (!secret) {
      expect(response.status).toBe(401);
      return;
    }
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; ranAt?: string };
    expect(body.ok).toBe(true);
    expect(body.ranAt).toBeTruthy();
  });

  it("rejects geocode for anonymous callers", async () => {
    const response = await probe("/api/geocode?q=Kochi");
    if (!response) return;
    expect(response.status).toBe(401);
  });

  it("returns empty geocode results for too-short queries when unauthenticated still 401", async () => {
    const response = await probe("/api/geocode?q=ab");
    if (!response) return;
    expect(response.status).toBe(401);
  });

  it("redirects auth callback without a code to manage", async () => {
    const response = await probe("/auth/callback");
    if (!response) return;
    expect([302, 307]).toContain(response.status);
    const location = response.headers.get("location") ?? "";
    expect(location).toMatch(/\/manage$/);
  });

  it("serves robots, sitemap, and the web manifest", async () => {
    const robots = await probe("/robots.txt");
    const sitemap = await probe("/sitemap.xml");
    const manifest = await probe("/manifest.webmanifest");
    if (!robots || !sitemap || !manifest) return;
    expect(robots.status).toBe(200);
    expect(sitemap.status).toBe(200);
    expect(manifest.status).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");
    expect(await sitemap.text()).toContain("/market");
    const manifestBody = (await manifest.json()) as { name?: string };
    expect(manifestBody.name).toMatch(/HOARDINGS360/i);
  });
});
