import { getCountryByCode, getNewsByCountryCode, getCategoryMap } from "../services/dataService.js";
import { newsCard } from "../components/newsCard.js";
import { needColor } from "../utils/needColor.js";
import { qs } from "../utils/dom.js";
import { HTML_DIR } from "../utils/basePath.js";

async function initCountryDetail() {
  const container = qs("#country-detail");
  const relatedGrid = qs("#related-issues");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    container.innerHTML = `<p class="state-message">No country was specified.</p>`;
    return;
  }

  try {
    const [country, categoryMap] = await Promise.all([getCountryByCode(code), getCategoryMap()]);
    if (!country) {
      container.innerHTML = `<p class="state-message">This country profile could not be found.</p>`;
      return;
    }

    document.title = `${country.name} — Mind the Gap`;

    const categoryTags = country.categories
      .map((id) => {
        const category = categoryMap.get(id);
        return `<span class="tag" style="background:${category?.color || ""};color:#fff">${category?.label || id}</span>`;
      })
      .join(" ");

    container.innerHTML = `
      <div class="detail-image" style="background-image: url('${country.image}')"></div>
      <div class="card-meta">
        <span class="tag">${country.region}</span>
        <span class="tag" style="background:${needColor(country.needIndex)}">Need level ${country.needIndex}/5</span>
      </div>
      <h1>${country.name}</h1>
      <div class="card-meta"><span>Population: ${country.population}</span></div>
      <div class="detail-body">
        <p>${country.summary}</p>
        <div>${categoryTags}</div>
        <a class="btn btn-primary" href="${HTML_DIR}take-action.html">See ways to help</a>
      </div>
    `;

    const relatedNews = await getNewsByCountryCode(code);
    if (relatedGrid) {
      relatedGrid.innerHTML = relatedNews.length
        ? relatedNews.map((item) => newsCard(item, categoryMap)).join("")
        : `<p class="state-message">No related news yet.</p>`;
    }
  } catch (error) {
    container.innerHTML = `<p class="state-message">Could not load this country right now.</p>`;
    console.error(error);
  }
}

initCountryDetail();
