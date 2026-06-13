import OpenAI from "openai";
import { NextResponse } from "next/server";
import { imageDataUrlToFile } from "@/lib/security/data-url";
import { getSafeServerErrorMessage } from "@/lib/security/error-messages";
import { checkRateLimit } from "@/lib/security/rate-limit";

type RequestBody = {
  imageBase64?: unknown;
  editPrompt?: unknown;
};

const ANALYSIS_KEYWORDS = [
  "分析",
  "建議",
  "描述",
  "analyze",
  "analyse",
  "suggest",
  "describe",
];

function shouldAnalyze(editPrompt: string) {
  const lowerPrompt = editPrompt.toLowerCase();

  return ANALYSIS_KEYWORDS.some((keyword) =>
    lowerPrompt.includes(keyword.toLowerCase()),
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "image-edit-route", 10, 60_000);

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

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const imageBase64 =
    typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
  const editPrompt =
    typeof body.editPrompt === "string" ? body.editPrompt.trim() : "";

  if (!imageBase64) {
    return NextResponse.json(
      { error: "imageBase64 is required." },
      { status: 400 },
    );
  }

  if (!editPrompt) {
    return NextResponse.json(
      { error: "editPrompt is required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({ apiKey });

    if (shouldAnalyze(editPrompt)) {
      const response = await client.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `請分析這張圖片，並根據以下需求提出具體修改建議：${editPrompt}`,
              },
              {
                type: "input_image",
                image_url: imageBase64,
                detail: "auto",
              },
            ],
          },
        ],
      });

      const result = response.output_text?.trim();

      if (!result) {
        return NextResponse.json(
          { error: "OpenAI returned an empty analysis result." },
          { status: 502 },
        );
      }

      return NextResponse.json({ result });
    }

    const editedImage = await client.images.edit({
      model: "gpt-image-1",
      image: imageDataUrlToFile(imageBase64, "image-to-edit.png"),
      prompt: editPrompt,
      size: "1024x1024",
      quality: "medium",
      input_fidelity: "high",
    });

    const imageBase64Result = editedImage.data?.[0]?.b64_json?.trim();

    if (!imageBase64Result) {
      return NextResponse.json(
        { error: "OpenAI returned an empty edited image payload." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64Result}`,
    });
  } catch (error) {
    console.error("Image edit API error:", error);

    return NextResponse.json(
      {
        error: getSafeServerErrorMessage(error, "Failed to process image editing request."),
      },
      { status: 500 },
    );
  }
}
