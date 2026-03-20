import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { SALES_QUESTIONS } from "@/lib/sales-questions";

const PLAYBOOK = SALES_QUESTIONS.map(
  (q) => `Q${q.id}: ${q.text.trim()} [${q.stage}]`
).join("\n");

type Body = {
  messages: { role: "user" | "assistant"; content: string }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const incoming = Array.isArray(body.messages) ? body.messages : [];

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a sales flow coach for kitchen cabinet consultations.
Given the conversation transcript, pick the SINGLE best next question ID (1-15) from this playbook:
${PLAYBOOK}

Rules:
- Prefer the next unanswered logical step (discovery → qualification → proposal → objection → upsell → close).
- If the buyer raised a new objection or topic, prioritize addressing it with the best-matching question.
- Return strict JSON: {"suggestedQuestionId": <number 1-15>, "rationale": "<one short sentence>"}`,
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

    let parsed: { suggestedQuestionId?: number; rationale?: string };
    try {
      parsed = JSON.parse(raw) as {
        suggestedQuestionId?: number;
        rationale?: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Model returned non-JSON" },
        { status: 502 }
      );
    }
    const id = parsed.suggestedQuestionId;
    if (
      typeof id !== "number" ||
      id < 1 ||
      id > SALES_QUESTIONS.length ||
      !Number.isInteger(id)
    ) {
      return NextResponse.json(
        { error: "Invalid suggestion format" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      suggestedQuestionId: id,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Smart next failed";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("API key")
        ? 500
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
