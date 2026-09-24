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
  if (!form) return;

  updateLimitState();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (recentSendTimestamps().length >= DAILY_LIMIT) {
      updateLimitState();
      return;
    }

    const messageField = qs("#feedback-message");
    const contactField = qs("#feedback-contact");
    const message = messageField.value.trim();
    const contact = contactField.value.trim();
    if (!message) return;

    submitBtn.disabled = true;
    status.textContent = "Sending...";

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: SITE.web3FormsAccessKey,
          subject: "Mind the Gap feedback",
          message,
          contact: contact || "Not provided",
        }),
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.message || "Send failed");

      const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      saved.push({ message, contact, submittedAt: new Date().toISOString() });
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(saved));

      recordSend();
      form.reset();
      status.textContent = `Thanks — sent to ${SITE.feedbackEmail}.`;
    } catch (error) {
      status.textContent = "Couldn't send that right now — please try again in a moment.";
      console.error(error);
    } finally {
      updateLimitState();
    }
  });

  function updateLimitState() {
    const remaining = DAILY_LIMIT - recentSendTimestamps().length;
    submitBtn.disabled = remaining <= 0;
    if (remaining <= 0) {
      status.textContent = `You've reached the limit of ${DAILY_LIMIT} messages per 24 hours on this device. Please try again later.`;
    }
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
