"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { lookupBoardQrAction } from "@/lib/field/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function ScanInner() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preset = searchParams.get("code");
    if (preset) {
      void lookupBoardQrAction(preset).then((lookup) => {
        if (lookup.error) setError(lookup.error);
        else if (lookup.board) {
          setResult(`${lookup.board.board_code} · ${lookup.board.name} · ${lookup.board.locality}`);
        }
      });
    }
  }, [searchParams]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode("h360-qr-reader");
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: 220 },
          async (decoded) => {
            const code = decoded.includes("code=")
              ? decoded.split("code=")[1]?.split("&")[0]
              : decoded;
            if (!code) return;
            const lookup = await lookupBoardQrAction(code.trim());
            if (lookup.error) setError(lookup.error);
            else if (lookup.board) {
              setResult(`${lookup.board.board_code} · ${lookup.board.name} · ${lookup.board.locality}`);
              setError(null);
            }
          },
          () => undefined,
        );
      } catch {
        if (!cancelled) setError("Camera permission is required to scan board QR codes.");
      }
      stop = () => {
        scanner.stop().catch(() => undefined);
      };
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Scan board QR</h1>
      <p className="text-sm text-neutral-600">
        QR identifies the outdoor asset so you confirm you are at the right board. It is not authentication and does
        not grant access.
      </p>
      <div id="h360-qr-reader" className="overflow-hidden rounded-2xl bg-black" aria-label="Camera QR scanner" />
      {result ? <p className="rounded-2xl bg-white p-4 text-sm font-medium shadow-sm">{result}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
      <form
        className="space-y-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const lookup = await lookupBoardQrAction(String(data.get("code") || "").trim());
          if (lookup.error) setError(lookup.error);
          else if (lookup.board) {
            setResult(`${lookup.board.board_code} · ${lookup.board.name}`);
            setError(null);
          }
        }}
      >
        <Label htmlFor="qr-code-manual">Or enter code</Label>
        <input
          id="qr-code-manual"
          name="code"
          placeholder="Board QR code"
          className="h-12 w-full rounded-2xl border px-3"
          autoComplete="off"
        />
        <Button type="submit" className="h-12 w-full rounded-2xl">
          Look up
        </Button>
      </form>
    </div>
  );
}

export default function FieldScanPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-600">Loading scanner…</p>}>
      <ScanInner />
    </Suspense>
  );
}
