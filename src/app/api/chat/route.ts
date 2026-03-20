import { NextResponse } from "next/server";
import { getOpenAI, parseSalesChatModelJson } from "@/lib/openai";
import { buildSalesChatSystemPrompt } from "@/lib/sales-chat-prompt";

type Body = {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  currentQuestionId?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.75,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSalesChatSystemPrompt(body.currentQuestionId),
        },
        ...incoming.filter((m) => m.role === "user" || m.role === "assistant"),
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Empty model response" },
        { status: 502 }
      );
    }

    const parsed = parseSalesChatModelJson(raw);
    if (parsed) {
      return NextResponse.json({
        reply: parsed.reply,
        suggestedNextQuestionId: parsed.suggestedNextQuestionId,
        suggestedNextBrief: parsed.suggestedNextBrief ?? null,
      });
    }

    return NextResponse.json({
      reply: raw,
      suggestedNextQuestionId: null,
      suggestedNextBrief: null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat failed";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("API key")
        ? 500
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
