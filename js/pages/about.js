import { qs } from "../utils/dom.js";
import { getCountries, getImageCredits } from "../services/dataService.js";
import { SITE } from "../config.js";

const FEEDBACK_KEY = "mtg_feedback";
const FEEDBACK_SENDS_KEY = "mtg_feedback_sends";
const DAILY_LIMIT = 3;
const LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function recentSendTimestamps() {
  try {
    const sends = JSON.parse(localStorage.getItem(FEEDBACK_SENDS_KEY) || "[]");
    const cutoff = Date.now() - LIMIT_WINDOW_MS;
    return sends.filter((timestamp) => timestamp > cutoff);
  } catch {
    return [];
  }
}

function recordSend() {
  const recent = recentSendTimestamps();
  recent.push(Date.now());
  localStorage.setItem(FEEDBACK_SENDS_KEY, JSON.stringify(recent));
}

function initFeedbackForm() {
  const form = qs("#feedback-form");
  const status = qs("#feedback-status");
  const submitBtn = qs("#feedback-submit");
  const nextField = qs("#feedback-next");
  if (!form) return;

  updateLimitState();
  showThankYouIfRedirected();

  form.addEventListener("submit", (event) => {
    if (recentSendTimestamps().length >= DAILY_LIMIT) {
      event.preventDefault();
      updateLimitState();
      return;
    }

    const messageField = qs("#feedback-message");
    const contactField = qs("#feedback-contact");
    const entry = {
      message: messageField.value.trim(),
      contact: contactField.value.trim(),
      submittedAt: new Date().toISOString(),
    };
    const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
    saved.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(saved));

    const redirectUrl = new URL(window.location.href);
    redirectUrl.searchParams.set("sent", "true");
    nextField.value = redirectUrl.toString();

    recordSend();
    updateLimitState();
    // No preventDefault here — the form submits for real, POSTing to FormSubmit.
  });

  function updateLimitState() {
    const remaining = DAILY_LIMIT - recentSendTimestamps().length;
    submitBtn.disabled = remaining <= 0;
    if (remaining <= 0 && status) {
      status.textContent = `You've reached the limit of ${DAILY_LIMIT} messages per 24 hours on this device. Please try again later.`;
    }
  }

  function showThankYouIfRedirected() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sent") !== "true") return;

    if (status) status.textContent = "Thanks — your message was sent.";
    params.delete("sent");
    const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
  }
}

async function initPhotoCredits() {
  const list = qs("#photo-credits");
  if (!list) return;

  try {
    const [countries, credits] = await Promise.all([getCountries(), getImageCredits()]);
    const nameByFilename = new Map(countries.map((country) => [country.image.split("/").pop(), country.name]));

    list.innerHTML = Object.entries(credits)
      .map(([filename, credit]) => {
        const label = nameByFilename.get(filename) || filename;
        return `<li>${label} &mdash; <a href="${credit.url}" target="_blank" rel="noopener">${credit.photographer}</a> via ${credit.source}</li>`;
      })
      .join("");
  } catch (error) {
    list.innerHTML = `<li class="state-message">Could not load photo credits right now.</li>`;
    console.error(error);
  }
}

initFeedbackForm();
initPhotoCredits();
