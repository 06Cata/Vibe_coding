import OpenAI from "openai";
import { NextResponse } from "next/server";

type RequestBody = {
  prompt?: unknown;
};

type AdvisorSections = {
  automations: string;
  workflow: string;
  timeSaved: string;
  difficulty: string;
  firstStep: string;
};

const SYSTEM_PROMPT = `你是一位 n8n 自動化專家，
專門幫台灣的小商家規劃行銷自動化流程。
你熟悉以下整合：
- Gmail / Google Sheets
- LINE Notify
- Instagram / Facebook
- Shopify / 91APP
- Notion

當用戶描述他們的業務，你要：
1. 分析目前哪些流程可以自動化
2. 設計 n8n workflow 步驟
3. 估算可以節省多少時間
4. 說明實作難度（簡單/中等/複雜）

回覆格式要清楚，用條列式。

請務必嚴格使用以下標題與順序：
【可自動化流程】
【workflow 步驟】
【節省時間】
【難度】
【馬上可以開始做】

每個區塊都要有內容，不要省略。`;

function extractSection(text: string, heading: string, nextHeadings: string[]) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nextPattern = nextHeadings
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const pattern = nextPattern
    ? new RegExp(`【${escapedHeading}】\\s*([\\s\\S]*?)(?=【(?:${nextPattern})】|$)`)
    : new RegExp(`【${escapedHeading}】\\s*([\\s\\S]*?)$`);

  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function parseSections(text: string): AdvisorSections {
  const headings = ["可自動化流程", "workflow 步驟", "節省時間", "難度", "馬上可以開始做"] as const;

  return {
    automations: extractSection(text, headings[0], headings.slice(1) as unknown as string[]),
    workflow: extractSection(text, headings[1], headings.slice(2) as unknown as string[]),
    timeSaved: extractSection(text, headings[2], headings.slice(3) as unknown as string[]),
    difficulty: extractSection(text, headings[3], headings.slice(4) as unknown as string[]),
    firstStep: extractSection(text, headings[4], []),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required." }, { status: 400 });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const result = response.output_text?.trim();

    if (!result) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      result,
      sections: parseSections(result),
    });
  } catch (error) {
    console.error("n8n advisor API error:", error);

    return NextResponse.json(
      { error: "Failed to get n8n advisor response." },
      { status: 500 },
    );
  }
}
