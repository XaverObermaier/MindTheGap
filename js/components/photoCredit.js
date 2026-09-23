export function photoCreditNote(credit) {
  if (!credit) return "";
  return `<p class="source-note photo-credit">Photo: <a href="${credit.url}" target="_blank" rel="noopener">${credit.photographer}</a> via ${credit.source}</p>`;
}
