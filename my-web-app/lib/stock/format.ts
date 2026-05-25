export function formatRocDate(date: string) {
  const [year, month, day] = date.split("/").map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return `${year + 1911}/${String(month).padStart(2, "0")}/${String(day).padStart(
    2,
    "0",
  )}`;
}

export function getTaipeiDateParam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("-", "");
}

export function parseNumber(value: string) {
  return Number(value.replaceAll(",", ""));
}
