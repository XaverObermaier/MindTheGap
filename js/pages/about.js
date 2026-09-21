import { qs } from "../utils/dom.js";

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

    const entry = {
      message,
      contact: contactField.value.trim(),
      submittedAt: new Date().toISOString(),
    };

    const saved = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
    saved.push(entry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(saved));

    form.reset();
    status.textContent =
      "Thanks — saved on this device for now. This form isn't connected to a live inbox yet, so our team won't see it until that's built.";
  });
}

initFeedbackForm();
