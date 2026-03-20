import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, LogIn, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-background to-amber-50/40 dark:from-stone-950 dark:via-background dark:to-stone-900/40">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          CP Prompt-X · The AI Vibe Coding Hackathon
        </p>
        <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          AI Sales Call Analyzer
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-muted-foreground">
          PostgreSQL-backed analyzer with master / rep roles, Whisper transcription,
          AI dashboards, multi-upload with live progress, CSV &amp; PPT export.
          Assisted with Cursor Auto.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-muted-foreground">
          <a
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
            href="https://gamma.app/docs/CP-Prompt-X-The-AI-Vibe-Coding-Hackathon-fbvuafc2us3jw5o?mode=doc"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hackathon brief (Gamma)
          </a>
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login">
              <LogIn className="h-5 w-5" />
              Sign in
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="gap-2">
            <Link href="/dashboard">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/chat">
              <MessageSquare className="h-5 w-5" />
              Sales chat
            </Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deploy on Vercel</CardTitle>
              <CardDescription>
                Set <code className="text-xs">SCA_DATABASE_URL</code>,{" "}
                <code className="text-xs">AUTH_SECRET</code>,{" "}
                <code className="text-xs">OPENAI_API_KEY</code> in project env.
                Optional: <code className="text-xs">BLOB_READ_WRITE_TOKEN</code> for
                audio replay.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Local database</CardTitle>
              <CardDescription>
                <code className="text-xs">npx prisma db push</code> then{" "}
                <code className="text-xs">npm run db:seed</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use Neon or Vercel Postgres for production.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
