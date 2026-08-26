const listeners = new Set();
let activeCategory = "all";

export function getActiveCategory() {
  return activeCategory;
}

export function setActiveCategory(categoryId) {
  activeCategory = categoryId;
  listeners.forEach((listener) => listener(activeCategory));
}

export function onCategoryChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
