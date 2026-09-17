import type { Metadata } from "next";
import { PlatformChrome } from "@/components/platform/sidebar";
import { requirePlatformStaff } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Platform",
  description: "HOARDINGS360 staff console for tenant operations.",
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePlatformStaff();
  return (
    <PlatformChrome staff={staff}>
      <main className="h360-page">{children}</main>
    </PlatformChrome>
  );
}
