export async function includeHTML(selector, path) {
  const target = document.querySelector(selector);
  if (!target) return;
  const response = await fetch(path);
  target.innerHTML = await response.text();
}
