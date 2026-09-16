import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site}/market`, changeFrequency: "hourly", priority: 1 },
    { url: `${site}/login`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${site}/signup`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("marketplace_listings")
      .select("board_id")
      .limit(500);
    const boardIds = [...new Set((data ?? []).map((row) => String(row.board_id)))];
    return [
      ...staticEntries,
      ...boardIds.map((boardId) => ({
        url: `${site}/market/${boardId}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
