import { getOrganizations, getCategoryMap, getOfferTypes, getCountries } from "../services/dataService.js";
import { qs } from "../utils/dom.js";
import { HTML_DIR } from "../utils/basePath.js";
import { actionContext, rankOrganizations } from "../utils/actionMatching.js";

const SUPPORTER_KEY = "mtg_supporter";
const OFFERS_KEY = "mtg_offers";

let allOrganizations = [];
let offerTypeMap = new Map();
let selectedOffers = new Set();
let activeCategories = [];
let categoryMap = new Map();
let bestMatchOrgId = null;

async function initTakeAction() {
  const grid = qs("#orgs-grid");
  const heading = qs("#orgs-heading");
  const offerBar = qs("#offer-filter");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);

  try {
    const [organizations, categories, offerTypes, countries] = await Promise.all([
      getOrganizations(),
      getCategoryMap(),
      getOfferTypes(),
      params.has("country") ? getCountries() : Promise.resolve([]),
    ]);

    categoryMap = categories;
    const context = actionContext(params, countries, categoryMap);
    activeCategories = context.categories;
    allOrganizations = organizations;
    offerTypeMap = new Map(offerTypes.map((offer) => [offer.id, offer]));
    selectedOffers = loadSavedOffers(offerTypeMap);

    if (context.country) {
      if (heading) heading.textContent = `Organizations matching issues in ${context.country.name}`;
      const contextEl = qs("#action-context");
      if (contextEl) {
        const labels = activeCategories.map((id) => categoryMap.get(id).label).join(", ");
        contextEl.hidden = false;
        contextEl.textContent = `Exploring ways to help after reading about ${context.country.name}: ${labels}. Matches reflect issue focus, not confirmed programs in this country. `;
        const backLink = document.createElement("a");
        backLink.href = `${HTML_DIR}country.html?code=${encodeURIComponent(context.country.code)}`;
        backLink.textContent = `Back to ${context.country.name}`;
        contextEl.append(backLink);
      }
    } else if (activeCategories.length && heading) {
      heading.textContent = `Organizations helping with ${categoryMap.get(activeCategories[0]).label}`;
    }

    renderOfferBar(offerBar, offerTypes);
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

function sortedOrganizations() {
  return rankOrganizations(allOrganizations, activeCategories, selectedOffers);
}

function renderOrgs(grid) {
  const ranked = sortedOrganizations();
  const isSupporter = localStorage.getItem(SUPPORTER_KEY) === "true";
  const best = isSupporter && selectedOffers.size ? ranked[0] : null;
  bestMatchOrgId = best?.id || null;
  grid.innerHTML = ranked.map(orgCard).join("");

  if (isSupporter) {
    const status = qs("#supporter-status");
    const offerLabels = [...selectedOffers].map((id) => offerTypeMap.get(id).label);
    if (status) {
      status.textContent = !selectedOffers.size
        ? "Select something you can offer to see a suggested organization."
        : `You're supporting Mind the Gap with: ${offerLabels.join(", ")}.${best ? ` Best place to start: ${best.name}, highlighted below.` : ""}`;
    }
  }
}

function orgCard(org) {
  const matchedCategories = activeCategories.filter((id) => org.categories.includes(id));
  const matchedOffers = org.needs.filter((need) => selectedOffers.has(need));
  const isMatch = matchedCategories.length > 0 || matchedOffers.length > 0;
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
        ${matchedCategories.length ? `<p class="source-note">Relevant issues: ${matchedCategories.map((id) => categoryMap.get(id).label).join(", ")}</p>` : ""}
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

    renderOrgs(qs("#orgs-grid"));

    if (bestMatchOrgId) {
      const card = qs(`#org-card-${bestMatchOrgId}`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

initTakeAction();
