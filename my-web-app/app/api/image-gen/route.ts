import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

type StyleOption = "realistic" | "cartoon" | "minimalist" | "watercolor";
type ProviderOption = "gpt" | "gemini";

type RequestBody = {
  prompt?: unknown;
  style?: unknown;
  productImage?: unknown;
  size?: unknown;
  provider?: unknown;
};

const STYLE_PREFIXES: Record<StyleOption, string> = {
  realistic: "Create a realistic, detailed image.",
  cartoon: "Create a playful cartoon-style illustration.",
  minimalist: "Create a clean minimalist composition with simple shapes and restrained detail.",
  watercolor: "Create a soft watercolor painting with organic brush textures.",
};

const ALLOWED_STYLES: StyleOption[] = [
  "realistic",
  "cartoon",
  "minimalist",
  "watercolor",
];
const ALLOWED_PROVIDERS: ProviderOption[] = ["gpt", "gemini"];
const DEFAULT_GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

function normalizeGeminiError(message: string) {
  if (message.includes("[429 Too Many Requests]")) {
    return {
      message: "Gemini 圖片生成功能目前沒有可用配額，請稍後再試或檢查 billing / quota。",
      status: 429,
    };
  }

  if (message.includes("[503 Service Unavailable]")) {
    return {
      message: "Gemini 圖片服務目前忙碌，請稍後再試。",
      status: 503,
    };
  }

  if (message.includes("[404 Not Found]")) {
    return {
      message: "Gemini 圖片模型目前不可用，請更換模型設定後再試。",
      status: 404,
    };
  }

  return {
    message,
    status: 500,
  };
}

async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], filename, {
    type: blob.type || "image/png",
  });
}

export async function POST(request: Request) {
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
  const style = typeof body.style === "string" ? body.style.trim() : "";
  const productImage =
    typeof body.productImage === "string" ? body.productImage.trim() : "";
  const size = typeof body.size === "string" ? body.size.trim() : "";
  const provider =
    typeof body.provider === "string" ? body.provider.trim() : "gpt";

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt is required." },
      { status: 400 },
    );
  }

  if (!ALLOWED_STYLES.includes(style as StyleOption)) {
    return NextResponse.json(
      { error: "style must be one of: realistic, cartoon, minimalist, watercolor." },
      { status: 400 },
    );
  }

  if (!ALLOWED_PROVIDERS.includes(provider as ProviderOption)) {
    return NextResponse.json(
      { error: "provider must be one of: gpt, gemini." },
      { status: 400 },
    );
  }

  if (!/^\d+x\d+$/.test(size)) {
    return NextResponse.json(
      { error: "size must be in WIDTHxHEIGHT format." },
      { status: 400 },
    );
  }

  try {
    const styledPrompt = `${STYLE_PREFIXES[style as StyleOption]} ${prompt}`;
    let imageUrl = "";

    if (provider === "gpt") {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENAI_API_KEY is not configured." },
          { status: 500 },
        );
      }

      const client = new OpenAI({ apiKey });
      const response = productImage
        ? await client.images.edit({
            model: "gpt-image-1",
            image: await dataUrlToFile(productImage, "product-image.png"),
            prompt: `${styledPrompt} Keep the uploaded product as the primary subject and preserve its key design details.`,
            size,
            quality: "medium",
            input_fidelity: "high",
          })
        : await client.images.generate({
            model: "gpt-image-1",
            prompt: styledPrompt,
            size,
            quality: "medium",
          });

      const imageBase64 = response.data?.[0]?.b64_json?.trim();

      if (!imageBase64) {
        return NextResponse.json(
          { error: "OpenAI returned an empty image payload." },
          { status: 502 },
        );
      }

      imageUrl = `data:image/png;base64,${imageBase64}`;
    } else {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY is not configured." },
          { status: 500 },
        );
      }

      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({
        model: DEFAULT_GEMINI_IMAGE_MODEL,
      });

      const parts: Part[] = [{ text: `${styledPrompt}. Target image size: ${size}.` }];

      if (productImage) {
        const [header, base64] = productImage.split(",", 2);
        const mimeMatch = header?.match(/^data:(.+);base64$/);

        if (!base64 || !mimeMatch?.[1]) {
          return NextResponse.json(
            { error: "Invalid product image format." },
            { status: 400 },
          );
        }

        parts.push({
          inlineData: {
            mimeType: mimeMatch[1],
            data: base64,
          },
        });
      }

      const response = await model.generateContent(parts);
      const responseParts = response.response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = responseParts.find((part) => "inlineData" in part && part.inlineData);
      const imageBase64 = imagePart && "inlineData" in imagePart ? imagePart.inlineData?.data?.trim() : "";
      const mimeType = imagePart && "inlineData" in imagePart ? imagePart.inlineData?.mimeType || "image/png" : "image/png";

      if (!imageBase64) {
        return NextResponse.json(
          { error: "Gemini returned an empty image payload." },
          { status: 502 },
        );
      }

      imageUrl = `data:${mimeType};base64,${imageBase64}`;
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Image generation API error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate image.";

    if (provider === "gemini") {
      const normalized = normalizeGeminiError(message);

      return NextResponse.json(
        { error: normalized.message },
        { status: normalized.status },
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
