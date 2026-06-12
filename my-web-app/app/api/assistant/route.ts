import OpenAI from "openai";
import { NextResponse } from "next/server";

type RequestBody = {
  prompt?: unknown;
};

type WeatherLookupResult = {
  city: string;
  latitude: number;
  longitude: number;
};

const OPENAI_CHAT_MODEL = "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = "gpt-image-1";

async function getCurrentTime() {
  return new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
  });
}

async function getWeather(city: string) {
  const geocodeResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
    { cache: "no-store" },
  );

  if (!geocodeResponse.ok) {
    throw new Error("取得城市座標失敗。");
  }

  const geocodePayload = (await geocodeResponse.json()) as {
    results?: WeatherLookupResult[];
  };

  const location = geocodePayload.results?.[0];

  if (!location) {
    return `找不到「${city}」的地點資料。`;
  }

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FTaipei`,
    { cache: "no-store" },
  );

  if (!weatherResponse.ok) {
    throw new Error("取得天氣資料失敗。");
  }

  const weatherPayload = (await weatherResponse.json()) as {
    current?: {
      temperature_2m?: number;
      apparent_temperature?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
  };

  const current = weatherPayload.current;

  if (!current) {
    throw new Error("天氣資料為空。");
  }

  return [
    `城市：${location.city}`,
    `溫度：${current.temperature_2m ?? "未知"}°C`,
    `體感：${current.apparent_temperature ?? "未知"}°C`,
    `天氣代碼：${current.weather_code ?? "未知"}`,
    `風速：${current.wind_speed_10m ?? "未知"} km/h`,
  ].join("\n");
}

async function generateImage(client: OpenAI, prompt: string) {
  const response = await client.images.generate({
    model: OPENAI_IMAGE_MODEL,
    prompt,
    size: "1024x1024",
    quality: "medium",
  });

  const imageBase64 = response.data?.[0]?.b64_json?.trim();

  if (!imageBase64) {
    throw new Error("圖片生成結果為空。");
  }

  return `data:image/png;base64,${imageBase64}`;
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

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt is required." },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    let generatedImageUrl = "";

    const initialResponse = await client.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "你是一個會使用工具的 AI 助手。當問題需要即時資訊、時間或圖片生成時，請主動使用工具。最終回覆請使用繁體中文，並清楚整合工具結果。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "getWeather",
            description: "取得指定城市的天氣",
            parameters: {
              type: "object",
              properties: {
                city: {
                  type: "string",
                  description: "城市名稱，例如台北、東京、London",
                },
              },
              required: ["city"],
              additionalProperties: false,
            },
          },
        },
        {
          type: "function",
          function: {
            name: "generateImage",
            description: "根據描述生成圖片",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "要生成的圖片描述",
                },
              },
              required: ["prompt"],
              additionalProperties: false,
            },
          },
        },
        {
          type: "function",
          function: {
            name: "getCurrentTime",
            description: "取得現在時間",
            parameters: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const assistantMessage = initialResponse.choices[0]?.message;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "OpenAI returned an empty response." },
        { status: 502 },
      );
    }

    if (!assistantMessage.tool_calls?.length) {
      return NextResponse.json({
        result: assistantMessage.content?.trim() || "沒有可用回覆。",
      });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "你是一個會使用工具的 AI 助手。最終回覆請使用繁體中文，並清楚整合工具結果。如果有圖片生成成功，請在回覆中說明圖片已生成。",
      },
      {
        role: "user",
        content: prompt,
      },
      assistantMessage,
    ];

    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
      let toolResult = "";

      if (toolCall.function.name === "getWeather") {
        toolResult = await getWeather(String(args.city || ""));
      } else if (toolCall.function.name === "generateImage") {
        generatedImageUrl = await generateImage(client, String(args.prompt || ""));
        toolResult = JSON.stringify({
          imageUrl: generatedImageUrl,
          note: "圖片已成功生成，可直接提供給使用者下載或預覽。",
        });
      } else if (toolCall.function.name === "getCurrentTime") {
        toolResult = await getCurrentTime();
      } else {
        toolResult = "未知工具。";
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResult,
      });
    }

    const finalResponse = await client.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages,
    });

    const result = finalResponse.choices[0]?.message?.content?.trim();

    if (!result) {
      return NextResponse.json(
        { error: "OpenAI returned an empty final response." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      generatedImageUrl
        ? { result, imageUrl: generatedImageUrl }
        : { result },
    );
  } catch (error) {
    console.error("Assistant API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get assistant response.",
      },
      { status: 500 },
    );
  }
}
