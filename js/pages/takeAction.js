import { getOrganizations, getCategoryMap, getOfferTypes } from "../services/dataService.js";
import { qs } from "../utils/dom.js";

const SUPPORTER_KEY = "mtg_supporter";
const OFFERS_KEY = "mtg_offers";

let allOrganizations = [];
let offerTypeMap = new Map();
let selectedOffers = new Set();
let activeCategory = null;

async function initTakeAction() {
  setupSupporterWidget();

  const grid = qs("#orgs-grid");
  const heading = qs("#orgs-heading");
  const offerBar = qs("#offer-filter");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  activeCategory = params.get("category");

  try {
    const [organizations, categoryMap, offerTypes] = await Promise.all([
      getOrganizations(),
      getCategoryMap(),
      getOfferTypes(),
    ]);

    allOrganizations = organizations;
    offerTypeMap = new Map(offerTypes.map((offer) => [offer.id, offer]));
    selectedOffers = loadSavedOffers(offerTypeMap);

    if (activeCategory && categoryMap.has(activeCategory) && heading) {
      heading.textContent = `Organizations helping with ${categoryMap.get(activeCategory).label}`;
    }

    renderOfferBar(offerBar, offerTypes);
    renderOrgs(grid);
  } catch (error) {
    grid.innerHTML = `<p class="state-message">Could not load organizations right now.</p>`;
    console.error(error);
  }
}

function loadSavedOffers(offerTypeMap) {
  try {
    const saved = JSON.parse(localStorage.getItem(OFFERS_KEY) || "[]");
    return new Set(saved.filter((id) => offerTypeMap.has(id)));
  } catch {
    return new Set();
  }
}

function saveOffers() {
  localStorage.setItem(OFFERS_KEY, JSON.stringify([...selectedOffers]));
}

function renderOfferBar(offerBar, offerTypes) {
  if (!offerBar) return;

  offerBar.innerHTML = offerTypes
    .map(
      (offer) =>
        `<button type="button" data-offer="${offer.id}" class="${selectedOffers.has(offer.id) ? "is-active" : ""}">${offer.label}</button>`
    )
    .join("");

  offerBar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-offer]");
    if (!button) return;

    const offerId = button.dataset.offer;
    if (selectedOffers.has(offerId)) {
      selectedOffers.delete(offerId);
    } else {
      selectedOffers.add(offerId);
    }
    button.classList.toggle("is-active");
    saveOffers();
    renderOrgs(qs("#orgs-grid"));
  });
}

function matchScore(org) {
  const categoryMatch = activeCategory && org.categories.includes(activeCategory) ? 10 : 0;
  const offerOverlap = org.needs.filter((need) => selectedOffers.has(need)).length;
  return categoryMatch + offerOverlap;
}

function renderOrgs(grid) {
  const sorted = [...allOrganizations].sort((a, b) => matchScore(b) - matchScore(a));
  grid.innerHTML = sorted.map((org) => orgCard(org)).join("");
}

function orgCard(org) {
  const categoryMatch = Boolean(activeCategory) && org.categories.includes(activeCategory);
  const matchedOffers = org.needs.filter((need) => selectedOffers.has(need));
  const isMatch = categoryMatch || matchedOffers.length > 0;

  const offerNote = matchedOffers.length
    ? `<p class="source-note">You match what they're looking for: ${matchedOffers
        .map((id) => offerTypeMap.get(id)?.label || id)
        .join(", ")}</p>`
    : "";

  return `
    <div class="card org-card ${isMatch ? "org-card-match" : ""}">
      <div class="card-body">
        <h3>${org.name}</h3>
        <p>${org.description}</p>
        ${offerNote}
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
