export function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncate(text, maxLength = 140) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return "Unknown";
  const n = Number(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} million`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")} thousand`;
  return `${n}`;
}
