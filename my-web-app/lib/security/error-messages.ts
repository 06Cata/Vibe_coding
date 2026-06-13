export function getSafeServerErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message;

  if (
    message.includes("[429 Too Many Requests]") ||
    /quota|rate limit/i.test(message)
  ) {
    return "目前請求過多，請稍後再試。";
  }

  if (message.includes("[503 Service Unavailable]")) {
    return "服務目前忙碌中，請稍後再試。";
  }

  if (message.includes("[404 Not Found]")) {
    return "模型或資源目前不可用，請稍後再試。";
  }

  return fallback;
}
