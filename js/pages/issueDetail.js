import { getNewsById, getCategoryMap } from "../services/dataService.js";
import { getSummary } from "../services/aiService.js";
import { formatDate } from "../utils/format.js";
import { qs } from "../utils/dom.js";
import { HTML_DIR } from "../utils/basePath.js";

async function initIssueDetail() {
  const container = qs("#issue-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML = `<p class="state-message">No issue was specified.</p>`;
    return;
  }

  try {
    const [item, categoryMap] = await Promise.all([getNewsById(id), getCategoryMap()]);
    if (!item) {
      container.innerHTML = `<p class="state-message">This issue could not be found.</p>`;
      return;
    }

    const category = categoryMap.get(item.category);
    const summary = await getSummary(item);
    document.title = `${item.title} — Mind the Gap`;

    container.innerHTML = `
      <div class="detail-image" style="background-image: url('${item.image}')"></div>
      <span class="tag tag-primary" style="background:${category?.color || ""}">${category?.label || item.category}</span>
      <h1>${item.title}</h1>
      <div class="card-meta">
        <span>${item.country}</span>
        <span>&middot;</span>
        <span>${formatDate(item.date)}</span>
      </div>
      <div class="detail-body">
        <p>${summary}</p>
        <p class="source-note">Source: <a href="${item.sourceUrl}" target="_blank" rel="noopener">${item.source}</a></p>
        <a class="btn btn-primary" href="${HTML_DIR}take-action.html?category=${item.category}">See ways to help</a>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<p class="state-message">Could not load this issue right now.</p>`;
    console.error(error);
  }
}

initIssueDetail();
