"use client";

import { useState } from "react";
import { publishVacancyListingAction } from "@/lib/occupancy/actions";
import { Button } from "@/components/ui/button";

export function PublishVacancyButton({ faceId, availableFrom }: { faceId: string; availableFrom: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending || done}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await publishVacancyListingAction(faceId);
          setPending(false);
          if (result.error) setError(result.error);
          else setDone(true);
        }}
      >
        {done ? "Listed from vacancy date" : pending ? "Publishing…" : `Publish from ${availableFrom}`}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
