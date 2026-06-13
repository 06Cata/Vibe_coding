const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ParsedImageDataUrl = {
  mimeType: string;
  base64: string;
  bytes: Uint8Array;
};

export function parseImageDataUrl(
  value: string,
  options?: {
    maxBytes?: number;
  },
): ParsedImageDataUrl {
  const trimmed = value.trim();
  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);

  if (!match) {
    throw new Error("圖片格式不合法，只接受 base64 data URL。");
  }

  const mimeType = match[1].toLowerCase();
  const base64 = match[2].replace(/\s+/g, "");

  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error("圖片格式只接受 PNG、JPG、JPEG、WebP。");
  }

  const buffer = Buffer.from(base64, "base64");
  const maxBytes = options?.maxBytes ?? MAX_IMAGE_BYTES;

  if (!buffer.byteLength) {
    throw new Error("圖片內容為空。");
  }

  if (buffer.byteLength > maxBytes) {
    throw new Error(`圖片大小不可超過 ${Math.floor(maxBytes / 1024 / 1024)}MB。`);
  }

  return {
    mimeType,
    base64,
    bytes: new Uint8Array(buffer),
  };
}

export function imageDataUrlToFile(dataUrl: string, filename: string) {
  const parsed = parseImageDataUrl(dataUrl);

  return new File([Buffer.from(parsed.base64, "base64")], filename, {
    type: parsed.mimeType,
  });
}
