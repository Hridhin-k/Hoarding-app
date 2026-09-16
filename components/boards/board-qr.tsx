"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { useEffect } from "react";

export function BoardQr({ slug }: { slug: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    const url = `${window.location.origin}/field/scan?code=${slug}`;
    QRCode.toDataURL(url, { margin: 1, width: 180 }).then(setSrc);
  }, [slug]);
  if (!src) return <div className="h-[180px] w-[180px] rounded bg-muted" />;
  return (
    // QR is a generated data URL, not a remote asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`QR ${slug}`} width={180} height={180} />
  );
}
