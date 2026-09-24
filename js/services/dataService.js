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

export function rankRelatedIssues(news, issue, limit = 3) {
  if (!issue) return [];

  const currentId = Number(issue.id);
  const currentCountry = issue.countryCode || issue.country;
  const currentCategory = issue.category;

  return news
    .filter((item) => Number(item.id) !== currentId)
    .map((item) => {
      let score = 0;
      if (item.countryCode && currentCountry && item.countryCode === currentCountry) score += 3;
      if (item.category && currentCategory && item.category === currentCategory) score += 2;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.item.date) - new Date(a.item.date);
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export async function getRelatedIssues(issue, limit = 3) {
  return rankRelatedIssues(await getNews(), issue, limit);
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
