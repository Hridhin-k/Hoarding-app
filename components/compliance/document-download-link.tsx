"use client";

import { useState } from "react";
import { getDocumentSignedUrlAction } from "@/lib/compliance/actions";
import { Button } from "@/components/ui/button";

export function DocumentDownloadLink({ documentId, fileName }: { documentId: string; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const result = await getDocumentSignedUrlAction(documentId);
          setLoading(false);
          if (result.error || !result.url) {
            setError(result.error ?? "Download unavailable.");
            return;
          }
          window.open(result.url, "_blank", "noopener,noreferrer");
        }}
      >
        {loading ? "Preparing…" : "Download"}
      </Button>
      <span className="text-muted-foreground">{fileName}</span>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
