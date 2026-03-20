import Link from "next/link";
import { readFile } from "fs/promises";
import path from "path";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Management brief | CP Prompt-X",
  description: "Stakeholder summary, Cursor Auto delivery notes, and prompt library.",
};

export default async function ManagementBriefPage() {
  const file = path.join(process.cwd(), "docs/PROMPT-X-Management-Brief.md");
  const md = await readFile(file, "utf8");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-background dark:from-stone-950 dark:to-background">
      <header className="sticky top-0 z-10 border-b bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Source: <code className="rounded bg-muted px-1">docs/PROMPT-X-Management-Brief.md</code>
          </p>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-4 py-8">
        <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground">
          {md}
        </pre>
      </article>
    </div>
  );
}
