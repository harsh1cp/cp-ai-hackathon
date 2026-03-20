"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { ChatMessage } from "@/store/chat";
import { cn } from "@/lib/utils";

type Props = {
  messages: ChatMessage[];
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export function DemoPptExport({
  messages,
  className,
  variant = "secondary",
}: Props) {
  const [busy, setBusy] = useState(false);

  const onExport = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/export-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "CP-Prompt-X-Demo.pptx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }, [messages]);

  return (
    <Button
      type="button"
      variant={variant}
      disabled={busy}
      onClick={onExport}
      className={cn("gap-1.5", className)}
      size="sm"
    >
      <Download className="h-4 w-4 shrink-0" />
      {busy ? "Building…" : "Export PPT"}
    </Button>
  );
}
