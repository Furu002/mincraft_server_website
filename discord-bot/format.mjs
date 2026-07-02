export function formatNumber(value, digits = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(number);
}

export function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: Number.isInteger(number) ? 0 : 2,
  }).format(number);
}

export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  const sign = number > 0 ? "+" : "";
  return `${sign}${formatNumber(number, 2)}%`;
}

export function formatSignedMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  const sign = number > 0 ? "+" : "";
  return `${sign}${formatMoney(number)}`;
}

export function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let next = bytes;
  let unit = 0;
  while (next >= 1024 && unit < units.length - 1) {
    next /= 1024;
    unit += 1;
  }
  return `${formatNumber(next, unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${rest}초`;
  return `${rest}초`;
}

export function findStock(marketPayload, query) {
  const needle = String(query || "").trim().toLowerCase();
  return (marketPayload?.stocks || []).find((stock) => {
    const symbol = String(stock.symbol || stock.code || "").toLowerCase();
    const name = String(stock.name || "").toLowerCase();
    return symbol === needle || name === needle || name.includes(needle);
  });
}

export function stockDisplayName(stock) {
  const symbol = stock?.symbol || stock?.code || "";
  const name = stock?.name || symbol || "알 수 없는 종목";
  return symbol ? `${name} (${symbol})` : name;
}

export function asList(values, empty = "없음") {
  const filtered = values.filter(Boolean);
  return filtered.length ? filtered.join("\n") : empty;
}
