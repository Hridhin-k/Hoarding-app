import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "*.supabase.co" },
];

if (process.env.NODE_ENV !== "production") {
  remotePatterns.push({ protocol: "http", hostname: "127.0.0.1" });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
