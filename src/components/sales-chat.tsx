"use client";

import { useEffect, useRef, useState } from "react";
import { SALES_QUESTIONS } from "@/lib/sales-questions";
import { useChatStore } from "@/store/chat";
import { useNextQuestionSuggestions } from "@/hooks/use-next-question-suggestions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionSelector } from "@/components/question-selector";
import { ChatBubble } from "@/components/chat-bubble";
import { DemoPptExport } from "@/components/demo-ppt-export";
import { cn } from "@/lib/utils";
import {
  Bot,
  Headphones,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  Wand2,
} from "lucide-react";

function TypingRow({ label }: { label: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-700 ring-2 ring-background dark:bg-emerald-500/20 dark:text-emerald-300">
        <Bot className="h-4 w-4" />
      </div>
      <div className="space-y-1 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          AI sales coach
        </p>
        <div className="inline-flex items-center gap-2 rounded-xl rounded-bl-md border border-border/80 bg-card px-3 py-2 shadow-sm">
          <div className="flex gap-1">
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-duration:0.55s]"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-duration:0.55s]"
              style={{ animationDelay: "120ms" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70 [animation-duration:0.55s]"
              style={{ animationDelay: "240ms" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function SalesChat() {
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const clear = useChatStore((s) => s.clear);
  const [selectedQ, setSelectedQ] = useState<string>("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiNextHint, setAiNextHint] = useState<{
    id: number;
    brief: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const suggestions = useNextQuestionSuggestions(messages);

  useEffect(() => {
    useChatStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, smartLoading]);

  async function send(content: string, questionId?: number) {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    setError(null);
    setAiNextHint(null);
    addMessage({ role: "user", content: trimmed, questionId });
    setNote("");
    setLoading(true);

    const nextMessages = [
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: trimmed },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          currentQuestionId: questionId,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        suggestedNextQuestionId?: number | null;
        suggestedNextBrief?: string | null;
      };
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }
      addMessage({ role: "assistant", content: data.reply as string });

      const nextId = data.suggestedNextQuestionId;
      if (typeof nextId === "number" && nextId >= 1 && nextId <= 15) {
        setSelectedQ(String(nextId));
        const nq = SALES_QUESTIONS.find((x) => x.id === nextId);
        const brief =
          data.suggestedNextBrief?.trim() || "Suggested follow-up for the rep";
        setAiNextHint({ id: nextId, brief });
        if (nq) {
          setNote(`${brief}\n\nI'd like to discuss: ${nq.text.trim()}`);
        } else {
          setNote(brief);
        }
      } else {
        setAiNextHint(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      addMessage({
        role: "assistant",
        content:
          "I hit a snag reaching our AI sales coach. Double-check `OPENAI_API_KEY` in `.env.local`, then try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function runSmartNext() {
    if (loading || smartLoading) return;
    setError(null);
    setSmartLoading(true);
    try {
      const transcript = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      const res = await fetch("/api/smart-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: transcript }),
      });
      const data = (await res.json()) as {
        suggestedQuestionId?: number;
        rationale?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Smart Next failed");
      }
      const id = data.suggestedQuestionId;
      if (id == null) throw new Error("No suggestion returned");
      setSelectedQ(String(id));
      const q = SALES_QUESTIONS.find((x) => x.id === id);
      const why =
        data.rationale?.trim() ||
        "Here’s where I’d steer the conversation next.";
      setNote(
        q ? `(${why}) — ${q.text.trim()}` : `(${why})`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Smart Next failed";
      setError(msg);
    } finally {
      setSmartLoading(false);
    }
  }

  function onSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    const q = selectedQ
      ? SALES_QUESTIONS.find((x) => String(x.id) === selectedQ)
      : undefined;
    const parts: string[] = [];
    if (q) parts.push(`Q${q.id} (${q.stage}): ${q.text.trim()}`);
    if (note.trim()) parts.push(note.trim());
    const body = parts.join("\n\n");
    if (!body.trim()) {
      setError(
        "Choose a sales question from the dropdown and/or type a message, then send."
      );
      return;
    }
    setError(null);
    void send(body, q?.id);
  }

  function applySuggested(id: number) {
    setSelectedQ(String(id));
    const q = SALES_QUESTIONS.find((x) => x.id === id);
    if (q) setNote(`I'd like to discuss: ${q.text.trim()}`);
  }

  const chatDisabled = loading || smartLoading;

  return (
    <div
      className={cn(
        // Fixed px height — avoid vh/min() here (SSR vs client viewport differs → hydration errors).
        "flex h-[550px] min-h-0 w-full flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-card shadow-md",
        "dark:border-stone-800"
      )}
    >
      {/* Live chat header — compact business strip */}
      <div className="relative shrink-0 border-b border-stone-200/80 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-3 py-2 text-white dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-2 ring-emerald-400/40">
                <Headphones className="h-4 w-4 text-emerald-300" />
              </div>
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-stone-900"
                title="Available"
                aria-label="Coach online"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm font-semibold tracking-tight">
                  Live sales desk
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-200">
                  Online
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-400">
                Premier kitchen · Q1–Q15 playbook · Real-time replies
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              disabled={chatDisabled}
              onClick={runSmartNext}
            >
              {smartLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span className="ml-1.5">Smart next</span>
            </Button>
            <DemoPptExport
              messages={messages}
              variant="ghost"
              className="h-8 border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              onClick={() => {
                clear();
                setError(null);
                setAiNextHint(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-1.5">Clear</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Conversation thread — fixed flex slice so layout stays compact */}
      <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-stone-100/90 to-stone-50/80 dark:from-stone-950/80 dark:to-stone-950/40">
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-3 pb-4">
            {messages.length === 0 && (
              <div className="mx-auto max-w-md rounded-lg border border-dashed border-stone-300/80 bg-white/60 p-3 text-center dark:border-stone-700 dark:bg-stone-900/40">
                <MessageCircle className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-xs font-medium text-foreground">
                  Start the conversation
                </p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Optional Q from the list, add context, send. Coach suggests
                  next steps.
                </p>
              </div>
            )}

            {aiNextHint && (
              <div
                className="mx-auto max-w-lg rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40"
                role="status"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  Suggested next question
                </p>
                <p className="mt-1 text-foreground">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Q{aiNextHint.id}
                  </span>
                  {" — "}
                  {aiNextHint.brief}
                </p>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card/80 p-2 shadow-sm backdrop-blur-sm">
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick picks
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((id) => {
                    const q = SALES_QUESTIONS.find((x) => x.id === id);
                    if (!q) return null;
                    return (
                      <Button
                        key={id}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-auto max-w-full whitespace-normal border bg-background py-2 text-left text-xs font-normal"
                        onClick={() => applySuggested(id)}
                      >
                        Q{id}: {q.text.slice(0, 52)}
                        {q.text.length > 52 ? "…" : ""}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  questionId={m.questionId}
                />
              ))}
            </div>

            {loading && <TypingRow label="Drafting a reply…" />}
            {smartLoading && !loading && (
              <TypingRow label="Picking your next question…" />
            )}
            <div ref={bottomRef} className="h-px w-full shrink-0" />
          </div>
        </ScrollArea>
      </div>

      {/* Composer — compact business form */}
      <div className="shrink-0 border-t border-stone-200/80 bg-card p-3 dark:border-stone-800">
        {error && (
          <p
            className="mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        <form onSubmit={onSubmitForm} className="space-y-2">
          <QuestionSelector
            value={selectedQ}
            onValueChange={setSelectedQ}
            disabled={chatDisabled}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor="note" className="text-[11px] font-medium text-muted-foreground">
                Message
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey) return;
                  if (!(e.metaKey || e.ctrlKey)) return;
                  e.preventDefault();
                  if (!chatDisabled) {
                    (
                      e.currentTarget.form as HTMLFormElement | null
                    )?.requestSubmit();
                  }
                }}
                rows={2}
                disabled={chatDisabled}
                placeholder="Context… Ctrl+Enter to send"
                className="flex min-h-[52px] w-full resize-none rounded-lg border border-input bg-background px-2.5 py-2 text-sm shadow-sm transition-[box-shadow] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              disabled={chatDisabled}
              size="default"
              className="h-9 w-full shrink-0 gap-1.5 rounded-lg px-4 sm:w-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
