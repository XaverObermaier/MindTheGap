import { qs } from "../utils/dom.js";
import { getCountries, getImageCredits } from "../services/dataService.js";
import { SITE } from "../config.js";

const FEEDBACK_KEY = "mtg_feedback";

function initFeedbackForm() {
  const form = qs("#feedback-form");
  const status = qs("#feedback-status");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const messageField = qs("#feedback-message");
    const contactField = qs("#feedback-contact");
    const message = messageField.value.trim();
    if (!message) return;

    const contact = contactField.value.trim();
    const entry = { message, contact, submittedAt: new Date().toISOString() };

    const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
    saved.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(saved));

    const subject = encodeURIComponent("Mind the Gap feedback");
    const bodyLines = [message, "", contact ? `Contact: ${contact}` : ""].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join("\n"));
    window.location.href = `mailto:${SITE.feedbackEmail}?subject=${subject}&body=${body}`;

    form.reset();
    status.textContent = `Opening your email app to send this to ${SITE.feedbackEmail}. A copy is also saved on this device.`;
  });
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
