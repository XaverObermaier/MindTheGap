import { getOrganizations, getCategoryMap, getOfferTypes } from "../services/dataService.js";
import { qs } from "../utils/dom.js";

const SUPPORTER_KEY = "mtg_supporter";
const OFFERS_KEY = "mtg_offers";

let allOrganizations = [];
let offerTypeMap = new Map();
let selectedOffers = new Set();
let activeCategory = null;
let bestMatchOrgId = null;

async function initTakeAction() {
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
    setupSupporterWidget();
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
        `<button type="button" data-offer="${offer.id}" class="${selectedOffers.has(offer.id) ? "is-active" : ""}" aria-pressed="${selectedOffers.has(offer.id)}">${offer.label}</button>`
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
    button.setAttribute("aria-pressed", String(selectedOffers.has(offerId)));
    saveOffers();
    renderOrgs(qs("#orgs-grid"));
    updateSupporterButtonState();
  });
}

function matchScore(org) {
  const categoryMatch = activeCategory && org.categories.includes(activeCategory) ? 10 : 0;
  const offerOverlap = org.needs.filter((need) => selectedOffers.has(need)).length;
  return categoryMatch + offerOverlap;
}

function sortedOrganizations() {
  return [...allOrganizations].sort((a, b) => matchScore(b) - matchScore(a));
}

function renderOrgs(grid) {
  grid.innerHTML = sortedOrganizations()
    .map((org) => orgCard(org))
    .join("");
}

function orgCard(org) {
  const categoryMatch = Boolean(activeCategory) && org.categories.includes(activeCategory);
  const matchedOffers = org.needs.filter((need) => selectedOffers.has(need));
  const isMatch = categoryMatch || matchedOffers.length > 0;
  const isBest = org.id === bestMatchOrgId;

  const offerNote = matchedOffers.length
    ? `<p class="source-note">You match what they're looking for: ${matchedOffers
        .map((id) => offerTypeMap.get(id)?.label || id)
        .join(", ")}</p>`
    : "";

  return `
    <div class="card org-card ${isMatch ? "org-card-match" : ""} ${isBest ? "org-card-best" : ""}" id="org-card-${org.id}">
      <div class="card-body">
        ${isBest ? `<span class="tag tag-recognition">Best match for you</span>` : ""}
        <h3>${org.name}</h3>
        <p>${org.description}</p>
        ${offerNote}
        <a class="btn btn-primary" href="${org.url}" target="_blank" rel="noopener">Visit ${org.name}</a>
      </div>
    </div>
  `;
}

function updateSupporterButtonState() {
  const toggle = qs("#supporter-toggle");
  const status = qs("#supporter-status");
  if (!toggle) return;

  const isSupporter = localStorage.getItem(SUPPORTER_KEY) === "true";
  if (isSupporter) return; // don't overwrite the confirmation message while already active

  const hasOffers = selectedOffers.size > 0;
  toggle.disabled = !hasOffers;
  if (status) {
    status.textContent = hasOffers
      ? ""
      : "Select at least one thing you can offer above to become a supporter.";
  }
}

function setupSupporterWidget() {
  const toggle = qs("#supporter-toggle");
  const frame = qs("#avatar-frame");
  const status = qs("#supporter-status");
  if (!toggle || !frame) return;

  updateSupporterButtonState();
  applyState(localStorage.getItem(SUPPORTER_KEY) === "true");

  toggle.addEventListener("click", () => {
    if (toggle.disabled) return;
    const next = localStorage.getItem(SUPPORTER_KEY) !== "true";
    localStorage.setItem(SUPPORTER_KEY, String(next));
    applyState(next);
  });

  function applyState(active) {
    frame.classList.toggle("is-supporter", active);
    toggle.textContent = active ? "You're a Supporter" : "Become a Supporter";
    toggle.setAttribute("aria-pressed", String(active));
    toggle.disabled = false;

    if (!active) {
      bestMatchOrgId = null;
      renderOrgs(qs("#orgs-grid"));
      updateSupporterButtonState();
      return;
    }

    const offerLabels = [...selectedOffers].map((id) => offerTypeMap.get(id)?.label || id);
    const best = sortedOrganizations()[0];
    bestMatchOrgId = best?.id || null;
    renderOrgs(qs("#orgs-grid"));

    if (status) {
      status.textContent = best
        ? `You're supporting Mind the Gap with: ${offerLabels.join(", ")}. Best place to start: ${best.name}, highlighted below.`
        : `You're supporting Mind the Gap with: ${offerLabels.join(", ")}.`;
    }

    if (best) {
      const card = qs(`#org-card-${best.id}`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

initTakeAction();
