"use client";

import { useId, useRef } from "react";
import Link from "next/link";
import { signOutAction } from "@/lib/auth/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountMenu({
  name,
  roleLabel,
  profileHref,
  signOutNext,
}: {
  name: string;
  roleLabel: string;
  profileHref?: string;
  signOutNext?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-2 px-1.5")}>
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-muted text-[11px] font-medium">
            {initials(name)}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-[9rem] truncate text-xs font-medium leading-4">{name}</span>
            <span className="block max-w-[9rem] truncate text-[11px] leading-4 text-muted-foreground">{roleLabel}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {profileHref ? (
            <DropdownMenuItem render={<Link href={profileHref} />}>Profile</DropdownMenuItem>
          ) : null}
          {profileHref ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem variant="destructive" onClick={() => formRef.current?.requestSubmit()}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form id={formId} ref={formRef} action={signOutAction} className="hidden">
        {signOutNext ? <input type="hidden" name="next" value={signOutNext} /> : null}
      </form>
    </>
  );
}
