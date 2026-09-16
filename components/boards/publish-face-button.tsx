"use client";

import { useState } from "react";
import { publishFaceAction } from "@/lib/boards/actions";
import { Button } from "@/components/ui/button";

export function PublishFaceButton({ faceId, visible }: { faceId: string; visible: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant={visible ? "outline" : "default"}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await publishFaceAction(faceId, !visible);
          setPending(false);
          if (result.error) setError(result.error);
        }}
      >
        {visible ? "Unpublish from marketplace" : "Publish to marketplace"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
