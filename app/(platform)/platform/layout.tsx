import type { Metadata } from "next";
import { PlatformSidebar } from "@/components/platform/sidebar";
import { requirePlatformStaff } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Platform",
  description: "HOARDINGS360 staff console for tenant operations.",
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePlatformStaff();
  return (
    <div className="flex min-h-dvh bg-background">
      <PlatformSidebar staff={staff} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
