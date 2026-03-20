"use client";

import { Bot, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  role: "user" | "assistant";
  content: string;
  questionId?: number;
};

export function ChatBubble({ role, content, questionId }: Props) {
  const isUser = role === "user";
  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-background",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-emerald-600 text-white dark:bg-emerald-700"
        )}
        aria-hidden
      >
        {isUser ? (
          <UserRound className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Bot className="h-4 w-4" strokeWidth={2} />
        )}
      </div>
      <div
        className={cn(
          "max-w-[min(100%,28rem)] space-y-1",
          isUser ? "items-end text-right" : "items-start text-left"
        )}
      >
        <div
          className={cn(
            "inline-flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
            isUser && "flex-row-reverse"
          )}
        >
          <span>{isUser ? "You · sales rep" : "AI sales coach"}</span>
          {isUser && questionId != null && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary dark:bg-primary/25 dark:text-primary">
              Q{questionId}
            </span>
          )}
        </div>
        <div
          className={cn(
            "rounded-xl px-3 py-2 text-sm leading-snug shadow-sm",
            isUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border border-border/80 bg-card text-card-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    </div>
  );
}
