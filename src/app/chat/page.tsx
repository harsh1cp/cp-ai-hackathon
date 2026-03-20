import Link from "next/link";
import { SalesChat } from "@/components/sales-chat";
import { QuoteCalculator } from "@/components/quote-calculator";
import { QuoteComparisonTable } from "@/components/quote-comparison-table";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-session";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Chat | CP Prompt-X",
  description: "AI sales assistant for kitchen cabinets — Q1–Q15 playbook.",
};

export default async function ChatPage() {
  const session = await getSession();
  const landingHref = session ? "/dashboard" : "/login";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              CP Prompt-X
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              AI sales assistant — kitchen cabinets
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Live-style sales desk below: Q1–Q15 playbook, AI coach replies, and
              suggested next questions. Quote tools use kitchen size × budget;
              comparison table stays in sync.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={landingHref}>
              <ArrowLeft className="h-4 w-4" />
              Landing
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <SalesChat />
        <div className="grid gap-8 lg:grid-cols-2">
          <QuoteCalculator />
          <QuoteComparisonTable />
        </div>
      </main>
    </div>
  );
}
