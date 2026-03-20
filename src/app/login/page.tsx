"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Login failed");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-100 via-background to-amber-50/40 px-4 dark:from-stone-950 dark:via-background dark:to-stone-900/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sales Call Analyzer</CardTitle>
          <CardDescription>
            Sign in to upload calls, view dashboards, and export CSV / PPT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
          <p className="mt-6 rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
            Demo seed (run <code className="rounded bg-muted px-1">npm run db:seed</code>
            ):<br />
            <strong>Master</strong> master@demo.local / demo-master-123 — sees all child calls.
            <br />
            <strong>Child</strong> child@demo.local / demo-child-123 — own calls only.
            <br />
            <br />
            Ensure <code className="rounded bg-muted px-1">SCA_DATABASE_URL=file:./prisma/dev.db</code>{" "}
            in <code className="rounded bg-muted px-1">.env.local</code>, then{" "}
            <code className="rounded bg-muted px-1">npx prisma db push</code> &{" "}
            <code className="rounded bg-muted px-1">npm run db:seed</code>. Restart dev after
            changing env.
          </p>
          <Button asChild variant="link" className="mt-4 h-auto p-0 text-sm">
            <Link href="/">← Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
