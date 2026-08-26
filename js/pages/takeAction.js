import { getOrganizations, getCategoryMap } from "../services/dataService.js";
import { qs } from "../utils/dom.js";

const SUPPORTER_KEY = "mtg_supporter";

async function initTakeAction() {
  setupSupporterWidget();

  const grid = qs("#orgs-grid");
  const heading = qs("#orgs-heading");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");

  try {
    const [organizations, categoryMap] = await Promise.all([getOrganizations(), getCategoryMap()]);

    if (category && categoryMap.has(category) && heading) {
      heading.textContent = `Organizations helping with ${categoryMap.get(category).label}`;
    }

    const sorted = category
      ? [...organizations].sort((a, b) => matchScore(b, category) - matchScore(a, category))
      : organizations;

    grid.innerHTML = sorted.map((org) => orgCard(org, category)).join("");
  } catch (error) {
    grid.innerHTML = `<p class="state-message">Could not load organizations right now.</p>`;
    console.error(error);
  }
}

function matchScore(org, category) {
  return org.categories.includes(category) ? 1 : 0;
}

function orgCard(org, activeCategory) {
  const isMatch = Boolean(activeCategory) && org.categories.includes(activeCategory);
  return `
    <div class="card org-card ${isMatch ? "org-card-match" : ""}">
      <div class="card-body">
        <h3>${org.name}</h3>
        <p>${org.description}</p>
        <a class="btn btn-primary" href="${org.url}" target="_blank" rel="noopener">Visit ${org.name}</a>
      </div>
    </div>
  `;
}

function setupSupporterWidget() {
  const toggle = qs("#supporter-toggle");
  const frame = qs("#avatar-frame");
  const status = qs("#supporter-status");
  if (!toggle || !frame) return;

  applyState(localStorage.getItem(SUPPORTER_KEY) === "true");

  toggle.addEventListener("click", () => {
    const next = localStorage.getItem(SUPPORTER_KEY) !== "true";
    localStorage.setItem(SUPPORTER_KEY, String(next));
    applyState(next);
  });

  function applyState(active) {
    frame.classList.toggle("is-supporter", active);
    toggle.textContent = active ? "You're a Supporter" : "Become a Supporter";
    if (status) {
      status.textContent = active
        ? "Thanks for supporting Mind the Gap. This badge is stored on this device only."
        : "";
    }
  }
}

initTakeAction();
