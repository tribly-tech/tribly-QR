import { NextRequest, NextResponse } from "next/server";

const formatCategoryForPrompt = (category: string): string => {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = typeof body?.category === "string" ? body.category.trim() : null;

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
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

    const formattedCategory = formatCategoryForPrompt(category);

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
            content: `You suggest business services for a given business category. Return only a JSON array of 10-12 short service names (2-4 words each) that businesses in this category commonly offer. No numbering, no explanation, just the array. Example: ["Personal Training","Group Classes","Yoga"]`,
          },
          {
            role: "user",
            content: `Suggest services for a ${formattedCategory} business. Return a JSON array of 10-12 service names only.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", response.status, err);
      return NextResponse.json(
        { error: "AI suggestion failed" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    // Parse JSON array from response (handle markdown code blocks)
    let services: string[] = [];
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        services = JSON.parse(jsonMatch[0]);
      } catch {
        // fallback: split by comma and clean
        services = content
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((s: string) => s.replace(/^["'\s]+|["'\s]+$/g, "").trim())
          .filter(Boolean);
      }
    }

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      services: services.slice(0, 12).map((s) => String(s).trim()),
    });
  } catch (error) {
    console.error("AI suggest-services error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
