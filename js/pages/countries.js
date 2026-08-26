import { getCountries } from "../services/dataService.js";
import { countryCard } from "../components/countryCard.js";
import { qs } from "../utils/dom.js";

async function initCountries() {
  const grid = qs("#countries-grid");
  if (!grid) return;

  try {
    const countries = await getCountries();
    grid.innerHTML = countries.map(countryCard).join("");
  } catch (error) {
    grid.innerHTML = `<p class="state-message">Could not load countries right now.</p>`;
    console.error(error);
  }
}

initCountries();
