import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const texts =
      Array.isArray(body?.texts) && body.texts.every((t: unknown) => typeof t === "string")
        ? (body.texts as string[]).filter(Boolean)
        : null;

    if (!texts || texts.length === 0) {
      return NextResponse.json(
        { error: "At least one review text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const reviewBlock = texts.map((t, i) => `Review ${i + 1}: ${t}`).join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a concise business analyst. Given a list of customer reviews, write a short, professional summary (2–4 sentences) that captures:
- Overall sentiment and common themes
- What customers praise most
- Any recurring concerns or areas for improvement (if present)

Keep the tone neutral and actionable. Write in plain text, no bullet points or headers.`,
          },
          {
            role: "user",
            content: `Summarize these customer reviews:\n\n${reviewBlock}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 350,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", response.status, err);
      return NextResponse.json(
        { error: "AI summary failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("AI summarize-reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
