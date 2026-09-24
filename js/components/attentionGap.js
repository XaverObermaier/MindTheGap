const REQUIRED_FIELDS = ["source", "title", "edition", "scope", "url", "checkedAt"];

function isCompleteRecognition(record) {
  return (
    record &&
    REQUIRED_FIELDS.every((field) => typeof record[field] === "string" && record[field]) &&
    record.url.startsWith("https://") &&
    Number.isInteger(record.rank) &&
    record.rank > 0
  );
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function attentionGap(externalRecognition) {
  if (!externalRecognition) {
    return `
      <section class="attention-gap" aria-labelledby="attention-gap-heading">
        <h3 id="attention-gap-heading">Attention gap</h3>
        <p>This country was not ranked in this edition of the Norwegian Refugee Council's list of neglected displacement crises. That does not mean the crisis is not neglected.</p>
      </section>
    `;
  }

  if (!isCompleteRecognition(externalRecognition)) {
    return `
      <section class="attention-gap" aria-labelledby="attention-gap-heading">
        <h3 id="attention-gap-heading">Attention gap</h3>
        <p>No complete recognition record is available for this edition, so its ranking is unknown. This does not mean the crisis is not neglected.</p>
      </section>
    `;
  }

  const source = escapeHtml(externalRecognition.source);
  const title = escapeHtml(externalRecognition.title);
  const edition = escapeHtml(externalRecognition.edition);
  const scope = escapeHtml(externalRecognition.scope);
  const url = escapeHtml(externalRecognition.url);
  const checkedAt = escapeHtml(externalRecognition.checkedAt);

  return `
    <section class="attention-gap" aria-labelledby="attention-gap-heading">
      <h3 id="attention-gap-heading">Attention gap</h3>
      <p>This crisis is ranked #${externalRecognition.rank} in the ${edition} of ${title}, covering ${scope}.</p>
      <p class="source-note">Source: <a href="${url}" target="_blank" rel="noopener">${source}</a> (checked ${checkedAt})</p>
    </section>
  `;
}