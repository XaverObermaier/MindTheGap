import { getNews, getCategoryMap } from "../services/dataService.js";
import { newsCard } from "../components/newsCard.js";
import { qs } from "../utils/dom.js";

let allNews = [];
let categoryMap = new Map();

async function initIssues() {
  const grid = qs("#issues-grid");
  const filterBar = qs("#category-filter");
  if (!grid) return;

  try {
    const [news, catMap] = await Promise.all([getNews(), getCategoryMap()]);
    allNews = news;
    categoryMap = catMap;
    renderFilters(filterBar);
    renderGrid(grid, allNews);
  } catch (error) {
    grid.innerHTML = `<p class="state-message">Could not load news right now.</p>`;
    console.error(error);
  }
}

function renderFilters(filterBar) {
  if (!filterBar) return;
  const options = [{ id: "all", label: "All" }, ...categoryMap.values()];
  filterBar.innerHTML = options
    .map(
      (option) =>
        `<button type="button" data-category="${option.id}" class="${option.id === "all" ? "is-active" : ""}" aria-pressed="${option.id === "all"}">${option.label}</button>`
    )
    .join("");

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;

    filterBar.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("is-active");
      btn.setAttribute("aria-pressed", "false");
    });
    button.classList.add("is-active");
    button.setAttribute("aria-pressed", "true");

    const category = button.dataset.category;
    const filtered = category === "all" ? allNews : allNews.filter((item) => item.category === category);
    renderGrid(qs("#issues-grid"), filtered);
  });
}

function renderGrid(grid, news) {
  grid.innerHTML = news.length
    ? news.map((item) => newsCard(item, categoryMap)).join("")
    : `<p class="state-message">No news matches this filter yet.</p>`;
}

initIssues();
