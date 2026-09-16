import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/field",
    name: "HOARDINGS360 Field",
    short_name: "H360 Field",
    description: "Technician jobs, QR scan, GPS proof of display, and offline upload.",
    start_url: "/field",
    scope: "/field",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f9fa",
    theme_color: "#1a73e8",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
