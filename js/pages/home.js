import { getNews, getCategoryMap } from "../services/dataService.js";
import { newsCard } from "../components/newsCard.js";
import { createDiscoverMap } from "../services/mapService.js";
import { onCategoryChange, setActiveCategory } from "../state/filterState.js";
import { qs, qsa } from "../utils/dom.js";

let allNews = [];
let categoryMap = new Map();

async function initHome() {
  const feedEl = qs("#news-feed");
  const filterBar = qs("#category-filter");
  if (!qs("#discover-map")) return;

  try {
    const [news, catMap] = await Promise.all([getNews(), getCategoryMap()]);
    allNews = news;
    categoryMap = catMap;

    renderFilterBar(filterBar);
    renderFeed(feedEl, allNews);
    renderLegend(categoryMap);

    const discoverMap = await createDiscoverMap("discover-map", { categoryMap });
    setupViewToggle(discoverMap);

    onCategoryChange((category) => {
      discoverMap.setCategoryFilter(category);
      renderFeed(feedEl, filterByCategory(allNews, category));
    });
  } catch (error) {
    if (feedEl) feedEl.innerHTML = `<p class="state-message">Could not load news right now.</p>`;
    console.error(error);
  }
}

function filterByCategory(news, category) {
  return category === "all" ? news : news.filter((item) => item.category === category);
}

function renderFeed(container, news) {
  if (!container) return;
  container.innerHTML = news.length
    ? news.map((item) => newsCard(item, categoryMap)).join("")
    : `<p class="state-message">No news for this category yet.</p>`;
}

function renderFilterBar(container) {
  if (!container) return;
  const options = [{ id: "all", label: "All" }, ...categoryMap.values()];
  container.innerHTML = options
    .map(
      (option) =>
        `<button type="button" data-category="${option.id}" class="${option.id === "all" ? "is-active" : ""}" aria-pressed="${option.id === "all"}">${option.label}</button>`
    )
    .join("");

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    container.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("is-active");
      btn.setAttribute("aria-pressed", "false");
    });
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");
    setActiveCategory(button.dataset.category);
  });
}

function renderLegend(catMap) {
  const legend = qs("#map-legend");
  if (!legend) return;
  legend.innerHTML = Array.from(catMap.values())
    .map(
      (category) =>
        `<span><span class="legend-swatch" style="background:${category.color}"></span>${category.label}</span>`
    )
    .join("");
}

function setupViewToggle(discoverMap) {
  const layout = qs("#discover-layout");
  if (!layout) return;
  const buttons = qsa("[data-view-btn]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      layout.dataset.view = button.dataset.viewBtn;
      buttons.forEach((btn) => btn.setAttribute("aria-pressed", String(btn === button)));
      if (button.dataset.viewBtn === "map") discoverMap.invalidate();
    });
  });
}

initHome();
