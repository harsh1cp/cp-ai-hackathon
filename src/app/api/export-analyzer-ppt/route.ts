import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { getSession } from "@/lib/auth-session";
import { getCallIfAccessible, visibleCallsWhere } from "@/lib/call-access";
import { parseAnalysisJson } from "@/lib/db-json";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const INK = "2A2419";
const INK_MUTED = "5C5346";
const PAPER = "FAF8F5";
const RULE = "D4CFC6";
const ACCENT = "6B5A3D";

function chunkParagraphs(text: string, maxChars: number): string[] {
  const t = text.trim();
  if (!t) return [];
  const parts: string[] = [];
  let i = 0;
  while (i < t.length) {
    let end = Math.min(i + maxChars, t.length);
    if (end < t.length) {
      const cut = t.lastIndexOf("\n\n", end);
      const cut2 = t.lastIndexOf(". ", end);
      const best = Math.max(cut, cut2);
      if (best > i + 80) end = best + 1;
    }
    parts.push(t.slice(i, end).trim());
    i = end;
  }
  return parts.filter(Boolean);
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const callId = searchParams.get("callId");

  const calls = await prisma.call.findMany({
    where: visibleCallsWhere(session),
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true } } },
  });

  let scoreSum = 0;
  let n = 0;
  let durSum = 0;
  let actions = 0;
  for (const c of calls) {
    const a = parseAnalysisJson(c.analysis);
    scoreSum += a.overallScore;
    durSum += c.durationSeconds;
    actions += a.actionItems.length;
    n += 1;
  }
  const avgScore = n ? Math.round((scoreSum / n) * 10) / 10 : 0;
  const avgDur = n ? Math.round(durSum / n) : 0;

  type Row = (typeof calls)[number];
  let demo: Row | null = calls[0] ?? null;
  if (callId) {
    const one = await getCallIfAccessible(callId, session);
    if (one) {
      demo = { ...one, user: one.user } as Row;
    }
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "CP Prompt-X";
  pptx.company = "CP Prompt-X";
  pptx.title = "Sales call intelligence — briefing";
  pptx.subject = "Whisper transcription & AI analysis export";

  const hdr = (slide: PptxGenJS.Slide, title: string, subtitle?: string) => {
    slide.background = { color: PAPER };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 1.05,
      fill: { color: INK },
      line: { type: "none" },
    });
    slide.addText(title, {
      x: 0.55,
      y: 0.32,
      w: 9,
      fontSize: 22,
      bold: true,
      color: "FFFFFF",
      fontFace: "Calibri",
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.55,
        y: 0.92,
        w: 9,
        fontSize: 11,
        color: "CCCCCC",
        fontFace: "Calibri",
      });
    }
  };

  // ----- Slide 1 -----
  const s1 = pptx.addSlide();
  hdr(s1, "Sales call intelligence", "CP Prompt-X · confidential briefing");
  s1.addText("AI-powered quality & coaching overview", {
    x: 0.55,
    y: 1.45,
    w: 8.8,
    fontSize: 15,
    color: INK_MUTED,
    fontFace: "Calibri",
  });
  s1.addText(
    [
      "• OpenAI Whisper — verbatim transcripts with timed segments",
      "• Structured analysis — sentiment, rubric scores, questionnaire heat map",
      "• Role-based visibility — master vs. rep access to team calls",
      "",
      "Export companion: CSV download includes full transcripts for every call in view.",
    ].join("\n"),
    {
      x: 0.55,
      y: 2.15,
      w: 8.8,
      h: 2.8,
      fontSize: 13,
      color: INK,
      fontFace: "Calibri",
      valign: "top",
    }
  );
  s1.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 4.95,
    w: 8.9,
    h: 0,
    line: { color: RULE, width: 1 },
  });
  s1.addText(
    `${new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })} · Viewer: ${session.role}`,
    { x: 0.55, y: 5.1, w: 9, fontSize: 10, color: INK_MUTED, fontFace: "Calibri" }
  );

  // ----- Slide 2 — KPI table -----
  const s2 = pptx.addSlide();
  hdr(s2, "Portfolio snapshot", "Aggregates over visible calls in your account");
  const th = { bold: true, fill: { color: "E8E4DD" }, color: INK, fontSize: 12 };
  const td = { color: INK, fontSize: 12 };
  s2.addTable(
    [
      [
        { text: "Metric", options: th },
        { text: "Value", options: th },
      ],
      [
        { text: "Calls in scope", options: td },
        { text: String(n), options: td },
      ],
      [
        { text: "Average quality score (0–10)", options: td },
        { text: String(avgScore), options: td },
      ],
      [
        { text: "Average duration (seconds)", options: td },
        { text: String(avgDur), options: td },
      ],
      [
        { text: "Total action items (summed)", options: td },
        { text: String(actions), options: td },
      ],
      [
        { text: "Access level", options: td },
        { text: session.role === "MASTER" ? "Master — team scope" : "Rep — own calls", options: td },
      ],
    ],
    {
      x: 0.55,
      y: 1.35,
      w: 8.9,
      colW: [5.4, 3.5],
      border: { type: "solid", color: RULE, pt: 0.75 },
      fontFace: "Calibri",
      align: "left",
      valign: "middle",
    }
  );
  s2.addText("Figures reflect the same filters as your dashboard list.", {
    x: 0.55,
    y: 4.55,
    w: 8.8,
    fontSize: 10,
    color: INK_MUTED,
    italic: true,
    fontFace: "Calibri",
  });

  // ----- Slide 3 — Methodology -----
  const s3 = pptx.addSlide();
  hdr(s3, "Analysis pipeline", "From raw audio to actionable dashboards");
  s3.addText(
    [
      "1. Ingest — secure multi-file upload; optional cloud blob storage.",
      "2. Transcribe — Whisper produces speaker-ready text + segment timing.",
      "3. Analyze — LLM emits JSON: sentiment split, agent rubric, topics, follow-ups.",
      "4. Deliver — per-call deep dive (radar, questionnaire, playback) + CSV export.",
    ].join("\n"),
    {
      x: 0.55,
      y: 1.35,
      w: 8.8,
      h: 3.5,
      fontSize: 13,
      color: INK,
      fontFace: "Calibri",
      valign: "top",
      bullet: { type: "number", indent: 18 },
    }
  );

  // ----- Slide 4+ — Featured call -----
  if (demo) {
    const a = parseAnalysisJson(demo.analysis);
    const s4 = pptx.addSlide();
    hdr(
      s4,
      "Featured call",
      `${demo.user.email} · ${new Date(demo.createdAt).toLocaleString()}`
    );
    s4.addText(
      [
        `Overall score: ${a.overallScore.toFixed(1)} / 10`,
        `Customer score: ${a.customerSatisfactionScore.toFixed(1)} / 10`,
        `Sentiment: ${a.sentiment.overall} · Rep talk: ${Math.round(a.talkRatioRepPct)}%`,
        `Duration: ${Math.round(demo.durationSeconds)}s`,
        demo.fileName ? `File: ${demo.fileName}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      {
        x: 0.55,
        y: 1.28,
        w: 8.8,
        fontSize: 12,
        color: INK,
        fontFace: "Calibri",
      }
    );
    s4.addText("Executive summary", {
      x: 0.55,
      y: 2.5,
      w: 8.8,
      fontSize: 13,
      bold: true,
      color: ACCENT,
      fontFace: "Calibri",
    });
    const summaryParts = chunkParagraphs(a.summary, 700);
    s4.addText(summaryParts[0] ?? "—", {
      x: 0.55,
      y: 2.85,
      w: 8.8,
      h: 2.35,
      fontSize: 11,
      color: INK,
      fontFace: "Calibri",
      valign: "top",
    });
    if (summaryParts.length > 1) {
      const s4b = pptx.addSlide();
      hdr(s4b, "Featured call — summary (continued)", demo.user.email);
      s4b.addText(summaryParts.slice(1).join("\n\n"), {
        x: 0.55,
        y: 1.35,
        w: 8.8,
        h: 4.2,
        fontSize: 11,
        color: INK,
        fontFace: "Calibri",
        valign: "top",
      });
    }

    const s5 = pptx.addSlide();
    hdr(s5, "Coaching & follow-up", demo.user.email);
    const ai = a.actionItems.slice(0, 12);
    const pos = a.coachingNotes.positiveObservations.slice(0, 5);
    const neg = a.coachingNotes.negativeObservations.slice(0, 5);
    s5.addText("Action items", {
      x: 0.55,
      y: 1.25,
      w: 4.1,
      fontSize: 12,
      bold: true,
      color: ACCENT,
      fontFace: "Calibri",
    });
    s5.addText(ai.length ? ai.map((x) => `• ${x}`).join("\n") : "—", {
      x: 0.55,
      y: 1.55,
      w: 4.1,
      h: 2.4,
      fontSize: 10,
      color: INK,
      fontFace: "Calibri",
      valign: "top",
    });
    s5.addText("Strengths", {
      x: 4.75,
      y: 1.25,
      w: 4.6,
      fontSize: 12,
      bold: true,
      color: ACCENT,
      fontFace: "Calibri",
    });
    s5.addText(pos.length ? pos.map((x) => `• ${x}`).join("\n") : "—", {
      x: 4.75,
      y: 1.55,
      w: 4.6,
      h: 1.85,
      fontSize: 10,
      color: INK,
      fontFace: "Calibri",
      valign: "top",
    });
    s5.addText("Development areas", {
      x: 4.75,
      y: 3.45,
      w: 4.6,
      fontSize: 12,
      bold: true,
      color: ACCENT,
      fontFace: "Calibri",
    });
    s5.addText(neg.length ? neg.map((x) => `• ${x}`).join("\n") : "—", {
      x: 4.75,
      y: 3.75,
      w: 4.6,
      h: 1.9,
      fontSize: 10,
      color: INK,
      fontFace: "Calibri",
      valign: "top",
    });
    s5.addText("Full verbatim transcript is included in the CSV export for this workspace.", {
      x: 0.55,
      y: 5.05,
      w: 8.8,
      fontSize: 9,
      color: INK_MUTED,
      italic: true,
      fontFace: "Calibri",
    });
  } else {
    const sx = pptx.addSlide();
    hdr(sx, "Featured call", "No data yet");
    sx.addText("Upload at least one call from the dashboard to populate this section.", {
      x: 0.55,
      y: 1.5,
      w: 8.5,
      fontSize: 14,
      color: INK_MUTED,
      fontFace: "Calibri",
    });
  }

  const buf = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="sales-intelligence-briefing-${Date.now()}.pptx"`,
    },
  });
}
