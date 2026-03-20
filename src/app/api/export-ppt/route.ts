import { NextResponse } from "next/server";
import type { ChatMessageDTO } from "@/lib/chat-types";

export const runtime = "nodejs";

type Body = { messages?: ChatMessageDTO[] };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const pptxgen = (await import("pptxgenjs")).default;
    const pptx = new pptxgen();
    pptx.author = "CP Prompt-X";
    pptx.title = "CP Prompt-X — AI Sales Assistant Demo";

    const slideTitle = pptx.addSlide();
    slideTitle.addText("CP Prompt-X", {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 1,
      fontSize: 36,
      bold: true,
      color: "4A3728",
    });
    slideTitle.addText("AI Sales Assistant — Kitchen Cabinets", {
      x: 0.5,
      y: 2.3,
      w: 9,
      h: 0.6,
      fontSize: 20,
      color: "6B5A4A",
    });
    slideTitle.addText("Cursor Auto + OpenAI — Hackathon demo deck", {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: "888888",
    });

    const slideDef = pptx.addSlide();
    slideDef.addText("Definition", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: "4A3728",
    });
    slideDef.addText(
      "Conversational AI sales assistant for kitchen cabinetry.\n\nGuides discovery → qualification → proposal → objection → upsell → close using Q1–Q15 playbook.\n\nStack: Next.js 14, Tailwind, shadcn/ui, Zustand, OpenAI API (server routes).",
      { x: 0.5, y: 1.3, w: 9, h: 4, fontSize: 16, color: "333333" }
    );

    const slideDemo = pptx.addSlide();
    slideDemo.addText("Demo screenshots", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: "4A3728",
    });
    slideDemo.addText(
      "Insert screenshots: landing page, /chat with question picker, quote calculator, comparison table.",
      { x: 0.5, y: 1.3, w: 9, h: 2, fontSize: 16, color: "333333" }
    );
    slideDemo.addText(
      "Tip: After capturing screenshots, paste them into this slide in PowerPoint / Google Slides.",
      {
        x: 0.5,
        y: 3.4,
        w: 9,
        h: 1.2,
        fontSize: 13,
        color: "666666",
        italic: true,
      }
    );

    const slideCheck = pptx.addSlide();
    slideCheck.addText("Submission checklist", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: "4A3728",
    });
    slideCheck.addText(
      "☐ Repo builds on Vercel\n☐ OPENAI_API_KEY set in Vercel env\n☐ Video: Q1 → Q15 full flow\n☐ This PPT: title, definition, screenshots, checklist\n☐ Note Cursor Auto-assisted generation in submission",
      { x: 0.5, y: 1.2, w: 9, h: 4, fontSize: 16, color: "333333" }
    );

    const slideTranscript = pptx.addSlide();
    slideTranscript.addText("Conversation export (snapshot)", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: "4A3728",
    });
    const snippet = messages
      .slice(-12)
      .map(
        (m) =>
          `${m.role === "user" ? "Prospect" : "Rep"}: ${m.content.slice(0, 220)}${m.content.length > 220 ? "…" : ""}`
      )
      .join("\n\n");
    slideTranscript.addText(
      snippet || "(No messages yet — chat first, then export.)",
      {
        x: 0.5,
        y: 1.2,
        w: 9,
        h: 4.5,
        fontSize: 11,
        color: "333333",
        valign: "top",
      }
    );

    const buffer = (await pptx.write({
      outputType: "nodebuffer",
    })) as Buffer;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="CP-Prompt-X-Demo.pptx"',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
