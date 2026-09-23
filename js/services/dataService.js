import { DATA_PATHS } from "../config.js";

const cache = new Map();

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  const data = await response.json();
  cache.set(path, data);
  return data;
}

export function getNews() {
  return fetchJSON(DATA_PATHS.news);
}

export function getCountries() {
  return fetchJSON(DATA_PATHS.countries);
}

export function getCategories() {
  return fetchJSON(DATA_PATHS.categories);
}

export function getOrganizations() {
  return fetchJSON(DATA_PATHS.organizations);
}

export function getOfferTypes() {
  return fetchJSON(DATA_PATHS.offerTypes);
}

export function getImageCredits() {
  return fetchJSON(DATA_PATHS.imageCredits);
}

export async function getImageCredit(imagePath) {
  if (!imagePath) return null;
  const credits = await getImageCredits();
  const filename = imagePath.split("/").pop();
  return credits[filename] || null;
}

export async function getNewsById(id) {
  const news = await getNews();
  return news.find((item) => String(item.id) === String(id));
}

export async function getCountryByCode(code) {
  const countries = await getCountries();
  return countries.find((country) => country.code === code);
}

export async function getNewsByCountryCode(code) {
  const news = await getNews();
  return news.filter((item) => item.countryCode === code);
}

export async function getCategoryMap() {
  const categories = await getCategories();
  return new Map(categories.map((category) => [category.id, category]));
}
