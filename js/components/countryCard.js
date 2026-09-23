import { truncate } from "../utils/format.js";
import { needColor, needLabel } from "../utils/needColor.js";
import { HTML_DIR, ROOT } from "../utils/basePath.js";

export function countryCard(country) {
  return `
    <a class="card" href="${HTML_DIR}country.html?code=${country.code}">
      <div class="card-image" role="img" aria-label="Photo of ${country.name}" style="background-image: url('${ROOT}${country.image}')"></div>
      <div class="card-body">
        <div class="card-meta">
          <span class="tag">${country.region}</span>
          <span class="tag" style="background:${needColor(country.needIndex)}">${needLabel(country.needIndex, { short: true })}</span>
        </div>
        <h3>${country.name}</h3>
        <p>${truncate(country.summary, 110)}</p>
      </div>
    </a>
  `;
}
