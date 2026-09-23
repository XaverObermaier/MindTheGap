import { ROOT } from "./utils/basePath.js";

const nested = ROOT !== "";

export const DATA_PATHS = {
  news: `${ROOT}data/news.json`,
  countries: `${ROOT}data/countries.json`,
  categories: `${ROOT}data/categories.json`,
  organizations: `${ROOT}data/organizations.json`,
  offerTypes: `${ROOT}data/offerTypes.json`,
  imageCredits: `${ROOT}data/imageCredits.json`,
};

export const WORLD_GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json";

export const PARTIALS = {
  header: `${ROOT}partials/${nested ? "header-nested.html" : "header.html"}`,
  footer: `${ROOT}partials/${nested ? "footer-nested.html" : "footer.html"}`,
};

export const SITE = {
  name: "Mind the Gap",
};
