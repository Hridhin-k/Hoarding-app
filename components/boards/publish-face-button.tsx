"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishFaceAction } from "@/lib/boards/actions";
import { Button } from "@/components/ui/button";

export function PublishFaceButton({
  faceId,
  visible,
  canPublish = true,
}: {
  faceId: string;
  visible: boolean;
  canPublish?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = !visible && !canPublish;
  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant={visible ? "outline" : "default"}
        disabled={pending || blocked}
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await publishFaceAction(faceId, !visible);
          setPending(false);
          if (result.error) setError(result.error);
          else router.refresh();
        }}
      >
        {visible ? "Unpublish" : blocked ? "Fix checklist to publish" : "Publish"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
