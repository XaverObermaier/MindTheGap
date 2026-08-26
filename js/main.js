import { includeHTML } from "./components/includeHTML.js";
import { PARTIALS } from "./config.js";
import { qs } from "./utils/dom.js";

async function initLayout() {
  await Promise.all([
    includeHTML("[data-include='header']", PARTIALS.header),
    includeHTML("[data-include='footer']", PARTIALS.footer),
  ]);

  highlightActiveNavLink();
  setupNavToggle();
  setFooterYear();
}

function highlightActiveNavLink() {
  const page = document.body.dataset.page;
  if (!page) return;
  const link = qs(`.site-nav a[data-nav="${page}"]`);
  if (link) link.setAttribute("aria-current", "page");
}

function setupNavToggle() {
  const toggle = qs(".nav-toggle");
  const nav = qs(".site-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function setFooterYear() {
  const yearEl = qs("#footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

initLayout();
