import OpenAI from "openai";
import { NextResponse } from "next/server";

type Tone = "活潑" | "專業" | "溫暖";
type Platform = "Instagram" | "Facebook" | "LinkedIn";
type Language = "繁體中文" | "English" | "日本語";

type RequestBody = {
  service?: unknown;
  description?: unknown;
  tone?: unknown;
  platform?: unknown;
  language?: unknown;
};

const BASE_SYSTEM_PROMPT = `你是一位專為台灣小商家服務的行銷文案師。
你擅長撰寫 Instagram 和 Facebook 貼文。
風格特點：
- 親切有溫度，像朋友在說話
- 善用 emoji 增加活潑感
- 每篇貼文結尾必須有行動呼籲
- 加上 3-5 個相關 hashtag
- 字數控制在 150 字以內

你不做的事：
- 不寫假評價或誇大不實的內容
- 不使用過度推銷的語氣`;

const ALLOWED_TONES: Tone[] = ["活潑", "專業", "溫暖"];
const ALLOWED_PLATFORMS: Platform[] = ["Instagram", "Facebook", "LinkedIn"];
const ALLOWED_LANGUAGES: Language[] = ["繁體中文", "English", "日本語"];

function getLanguageInstruction(language: Language) {
  switch (language) {
    case "English":
      return "輸出語言必須為自然、流暢的 English。";
    case "日本語":
      return "輸出語言必須為自然、流暢的日本語。";
    case "繁體中文":
    default:
      return "輸出語言必須為繁體中文。";
  }
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
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const service = typeof body.service === "string" ? body.service.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const tone = typeof body.tone === "string" ? body.tone.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform.trim() : "";
  const language = typeof body.language === "string" ? body.language.trim() : "";

  if (!service) {
    return NextResponse.json(
      { error: "service is required." },
      { status: 400 },
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: "description is required." },
      { status: 400 },
    );
  }

  if (!ALLOWED_TONES.includes(tone as Tone)) {
    return NextResponse.json(
      { error: "tone must be one of: 活潑、專業、溫暖。" },
      { status: 400 },
    );
  }

  if (!ALLOWED_PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json(
      { error: "platform must be one of: Instagram、Facebook、LinkedIn。" },
      { status: 400 },
    );
  }

  if (!ALLOWED_LANGUAGES.includes(language as Language)) {
    return NextResponse.json(
      { error: "language must be one of: 繁體中文、English、日本語。" },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    const userPrompt = [
      `服務類型：${service}`,
      `服務描述：${description}`,
      `指定語氣：${tone}`,
      `發布平台：${platform}`,
      `輸出語言：${language}`,
      "請直接輸出完整貼文內容。",
    ].join("\n");

    const systemPrompt = [
      BASE_SYSTEM_PROMPT,
      getLanguageInstruction(language as Language),
    ].join("\n");

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
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

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Copywriter API error:", error);

    return NextResponse.json(
      { error: "Failed to generate copywriting content." },
      { status: 500 },
    );
  }
}
