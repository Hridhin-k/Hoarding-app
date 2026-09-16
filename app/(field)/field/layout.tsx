import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth/session";
import { can } from "@/lib/permissions/catalog";
import { FieldShell } from "@/components/field/field-shell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1f4b99",
};

export const metadata: Metadata = {
  title: "Field",
  description: "Technician jobs, QR scan, and proof of display.",
  applicationName: "H360 Field",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "H360 Field",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function FieldLayout({ children }: LayoutProps<"/field">) {
  const ctx = await requireTenant();
  if (!can(ctx, "field.view")) redirect("/manage");
  return (
    <FieldShell name={ctx.fullName} tenantName={ctx.tenantName}>
      {children}
    </FieldShell>
  );
}
