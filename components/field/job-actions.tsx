"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeJobAction,
  completeJobWithProofAction,
  startJobAction,
  verifyJobQrAction,
} from "@/lib/field/actions";
import { flushProofQueue, queueProof } from "@/lib/field/offline-queue";
import { Button } from "@/components/ui/button";
import type { FieldJobStatus, FieldJobType } from "@/lib/types/enums";

function gpsDeniedMessage(error: GeolocationPositionError | Error) {
  if ("code" in error) {
    if (error.code === error.PERMISSION_DENIED) {
      return "Location permission is required for proof of display. Enable GPS for this site in your browser settings, then try again. We use coordinates to verify you were at the board.";
    }
    if (error.code === error.POSITION_UNAVAILABLE) {
      return "GPS is unavailable right now. Move outdoors or wait for a satellite fix, then try again.";
    }
    if (error.code === error.TIMEOUT) {
      return "GPS timed out. Stay still outdoors for a few seconds and try again.";
    }
  }
  return "Could not capture GPS. Enable location services and try again.";
}

export function JobActions({
  jobId,
  status,
  jobType,
  mapsUrl,
  qrVerified,
}: {
  jobId: string;
  status: FieldJobStatus;
  jobType: FieldJobType;
  mapsUrl: string | null;
  qrVerified: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  async function startScanner() {
    setScanning(true);
    setError(null);
    setMessage(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("h360-job-qr");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: 220 },
        async (decoded) => {
          const code = decoded.includes("code=") ? decoded.split("code=")[1]?.split("&")[0] : decoded;
          if (!code) return;
          await scanner.stop().catch(() => undefined);
          scannerRef.current = null;
          setScanning(false);
          const result = await verifyJobQrAction(jobId, code.trim());
          if (result.error) setError(result.error);
          else {
            setMessage(`QR verified · ${result.boardCode}`);
            router.refresh();
          }
        },
        () => undefined,
      );
    } catch {
      setScanning(false);
      setError("Camera permission is required to scan the board QR.");
    }
  }

  async function captureProof(file: File) {
    setError(null);
    let position: GeolocationPosition;
    try {
      position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      });
    } catch (geoError) {
      setError(gpsDeniedMessage(geoError as GeolocationPositionError));
      return;
    }

    const capturedAt = new Date().toISOString();
    const form = new FormData();
    form.set("jobId", jobId);
    form.set("photo", file);
    form.set("capturedAt", capturedAt);
    form.set("latitude", String(position.coords.latitude));
    form.set("longitude", String(position.coords.longitude));
    form.set("accuracy", String(position.coords.accuracy));

    const queued = {
      jobId,
      file,
      capturedAt,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    if (!navigator.onLine) {
      await queueProof(queued);
      setMessage("Saved offline. Proof will upload when you reconnect — it will not be lost.");
      return;
    }

    const result = await completeJobWithProofAction(form);
    if (result.error) {
      await queueProof(queued);
      setMessage(`${result.error} Proof queued for retry.`);
      return;
    }
    setMessage("Proof uploaded and job completed.");
    router.refresh();
  }

  const closed = status === "completed" || status === "cancelled";
  const needsProof = jobType === "proof_capture";

  return (
    <div className="space-y-2">
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl bg-white px-4 py-3.5 text-center text-sm font-semibold shadow-sm"
        >
          Navigate
        </a>
      ) : null}

      {!closed && status !== "in_progress" ? (
        <Button
          className="h-12 w-full rounded-2xl text-base"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await startJobAction(jobId);
            setPending(false);
            if (result.error) setError(result.error);
            else {
              setMessage("Job started.");
              router.refresh();
            }
          }}
        >
          Start job
        </Button>
      ) : null}

      {!closed ? (
        <>
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl text-base"
            onClick={() => {
              if (scanning) {
                void scannerRef.current?.stop().catch(() => undefined);
                scannerRef.current = null;
                setScanning(false);
                return;
              }
              void startScanner();
            }}
          >
            {scanning ? "Stop scanner" : qrVerified ? "Scan QR again" : "Scan QR"}
          </Button>
          {scanning ? (
            <div id="h360-job-qr" className="overflow-hidden rounded-2xl bg-black" aria-label="Camera QR scanner" />
          ) : null}
          <form
            className="flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const code = String(new FormData(event.currentTarget).get("code") || "").trim();
              if (!code) return;
              setPending(true);
              const result = await verifyJobQrAction(jobId, code);
              setPending(false);
              if (result.error) setError(result.error);
              else {
                setMessage(`QR verified · ${result.boardCode}`);
                router.refresh();
              }
            }}
          >
            <label className="sr-only" htmlFor={`qr-code-${jobId}`}>
              QR code
            </label>
            <input
              id={`qr-code-${jobId}`}
              name="code"
              placeholder="Or enter QR code"
              className="h-12 flex-1 rounded-2xl border bg-white px-3 text-sm"
              autoComplete="off"
            />
            <Button type="submit" variant="secondary" className="h-12 rounded-2xl" disabled={pending}>
              Confirm
            </Button>
          </form>
          {qrVerified ? (
            <p className="text-center text-xs font-medium text-emerald-700">Board QR verified for this visit.</p>
          ) : (
            <p className="text-center text-[11px] text-neutral-500">
              QR identifies the board only — it is not a login.
            </p>
          )}
        </>
      ) : null}

      {!closed && needsProof ? (
        <label className="block">
          <span className="mb-0 block rounded-full bg-primary px-4 py-3.5 text-center text-sm font-medium text-primary-foreground">
            Capture photo & complete
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={pending}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setPending(true);
              await captureProof(file);
              await flushProofQueue();
              setPending(false);
              event.target.value = "";
            }}
          />
        </label>
      ) : null}

      {!closed && !needsProof ? (
        <Button
          className="h-12 w-full rounded-2xl text-base"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            const result = await completeJobAction(jobId);
            setPending(false);
            if (result.error) setError(result.error);
            else {
              setMessage("Job completed.");
              router.refresh();
            }
          }}
        >
          Complete job
        </Button>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="rounded-2xl bg-white px-3 py-2 text-center text-sm">{message}</p> : null}
    </div>
  );
}
