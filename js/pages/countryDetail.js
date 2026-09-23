import { getCountryByCode, getNewsByCountryCode, getCategoryMap, getImageCredit } from "../services/dataService.js";
import { photoCreditNote } from "../components/photoCredit.js";
import { newsCard } from "../components/newsCard.js";
import { needColor, needLabel } from "../utils/needColor.js";
import { formatCount } from "../utils/format.js";
import { qs } from "../utils/dom.js";
import { HTML_DIR, ROOT } from "../utils/basePath.js";

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
    const imageCredit = await getImageCredit(country.image);

    const categoryTags = country.categories
      .map((id) => {
        const category = categoryMap.get(id);
        return `<span class="tag" style="background:${category?.color || ""};color:#fff">${category?.label || id}</span>`;
      })
      .join(" ");

    container.innerHTML = `
      <div class="detail-image" role="img" aria-label="Photo of ${country.name}" style="background-image: url('${ROOT}${country.image}')"></div>
      ${photoCreditNote(imageCredit)}
      <div class="card-meta">
        <span class="tag">${country.region}</span>
        <span class="tag" style="background:${needColor(country.needIndex)}">${needLabel(country.needIndex)}</span>
        <a class="need-info-link" href="${HTML_DIR}about.html#need-index-methodology">How this is calculated</a>
        ${renderExternalRecognition(country.externalRecognition)}
      </div>
      <h1>${country.name}</h1>
      <div class="card-meta"><span>Population: ${country.population}</span></div>
      <div class="detail-body">
        <p>${country.summary}</p>
        <div>${categoryTags}</div>
        ${renderIndicators(country.indicators)}
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

function renderExternalRecognition(externalRecognition) {
  if (!externalRecognition) return "";
  return `
    <a class="tag tag-recognition" href="${externalRecognition.url}" target="_blank" rel="noopener">
      Ranked #${externalRecognition.rank} most neglected displacement crisis &mdash; NRC 2025
    </a>
  `;
}

function renderIndicators(indicators) {
  if (!indicators) return "";

  const crisis = indicators.currentCrisis;
  const crisisBlock = crisis
    ? `
      <div class="indicator-crisis">
        <h3>Current crisis</h3>
        <p>
          <strong>${formatCount(crisis.affected)} people</strong> — ${crisis.measured}
          (as of ${crisis.asOf}). This is the figure the map's need level is based on, not the
          structural indicators below — see why in
          <a href="${HTML_DIR}about.html">About</a>.
        </p>
        <p class="source-note">Source: <a href="${crisis.sourceUrl}" target="_blank" rel="noopener">${crisis.source}</a></p>
        ${crisis.note ? `<p class="source-note">${crisis.note}</p>` : ""}
      </div>
    `
    : "";

  const stats = [
    indicators.giniIndex && {
      label: "Gini index",
      value: indicators.giniIndex.value != null ? indicators.giniIndex.value : "No recent data",
      year: indicators.giniIndex.year,
      source: indicators.giniIndex.source,
      sourceUrl: indicators.giniIndex.sourceUrl,
    },
    indicators.povertyRate3 && {
      label: indicators.povertyRate3.label,
      value: indicators.povertyRate3.value != null ? `${indicators.povertyRate3.value}%` : "No recent data",
      year: indicators.povertyRate3.year,
      source: indicators.povertyRate3.source,
      sourceUrl: indicators.povertyRate3.sourceUrl,
    },
    indicators.undernourishment && {
      label: indicators.undernourishment.label,
      value: indicators.undernourishment.value != null ? `${indicators.undernourishment.value}%` : "No recent data",
      year: indicators.undernourishment.year,
      source: indicators.undernourishment.source,
      sourceUrl: indicators.undernourishment.sourceUrl,
    },
    indicators.nationalStat && {
      label: indicators.nationalStat.label,
      value: `${indicators.nationalStat.value}${indicators.nationalStat.unit || ""}`,
      year: indicators.nationalStat.year,
      source: indicators.nationalStat.source,
      sourceUrl: indicators.nationalStat.sourceUrl,
    },
  ].filter(Boolean);

  const statsGrid = stats.length
    ? `
      <div class="indicator-grid">
        ${stats
          .map(
            (stat) => `
              <div class="indicator">
                <span class="indicator-value">${stat.value}</span>
                <span class="indicator-label">${stat.label}${stat.year ? ` (${stat.year})` : ""}</span>
                <a class="indicator-source" href="${stat.sourceUrl}" target="_blank" rel="noopener">${stat.source}</a>
              </div>
            `
          )
          .join("")}
      </div>
    `
    : "";

  if (!crisisBlock && !statsGrid) return "";

  return `
    <div class="indicators-section">
      ${crisisBlock}
      ${statsGrid ? `<h3>Structural indicators</h3>${statsGrid}` : ""}
    </div>
  `;
}

initCountryDetail();
