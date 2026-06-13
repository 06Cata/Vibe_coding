import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getSafeServerErrorMessage } from "@/lib/security/error-messages";
import { checkRateLimit } from "@/lib/security/rate-limit";

type RequestBody = {
  prompt?: unknown;
};

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "gemini-route", 20, 60_000);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "請求過於頻繁，請稍後再試。" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
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

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt is required." },
      { status: 400 },
    );
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const response = await model.generateContent(prompt);
    const result = response.response.text().trim();

    if (!result) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Gemini API error:", error);

    return NextResponse.json(
      { error: getSafeServerErrorMessage(error, "Failed to get Gemini response.") },
      { status: 500 },
    );
  }
}
