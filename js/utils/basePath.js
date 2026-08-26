function isNestedPage() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments.length > 1 && segments[segments.length - 2] === "html";
}

const nested = isNestedPage();

// Prefix to reach the project root (for data/css/partials fetches, and the home link).
export const ROOT = nested ? "../" : "";

// Prefix to reach the html/ folder from wherever the current page lives.
export const HTML_DIR = nested ? "" : "html/";
