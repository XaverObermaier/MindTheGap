import { getCountries, getNews } from "./dataService.js";
import { WORLD_GEOJSON_URL } from "../config.js";
import { needColor, needLabel } from "../utils/needColor.js";
import { HTML_DIR } from "../utils/basePath.js";

export async function createDiscoverMap(elementId, { categoryMap }) {
  const map = L.map(elementId, { minZoom: 2, worldCopyJump: true }).setView([12, 20], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: "abc",
  }).addTo(map);

  const [countries, news, worldGeoJson] = await Promise.all([
    getCountries(),
    getNews(),
    fetch(WORLD_GEOJSON_URL).then((response) => response.json()),
  ]);

  addChoropleth(map, countries, worldGeoJson);
  const clusterGroup = L.markerClusterGroup();
  map.addLayer(clusterGroup);

  function renderMarkers(category) {
    clusterGroup.clearLayers();
    news
      .filter((item) => category === "all" || item.category === category)
      .forEach((item) => {
        if (item.lat == null || item.lng == null) return;
        clusterGroup.addLayer(createNewsMarker(item, categoryMap));
      });
  }

  renderMarkers("all");

  return {
    setCategoryFilter: renderMarkers,
    invalidate: () => map.invalidateSize(),
  };
}

function addChoropleth(map, countries, worldGeoJson) {
  const countryByName = new Map(countries.map((country) => [country.name, country]));

  L.geoJSON(worldGeoJson, {
    style: (feature) => {
      const country = countryByName.get(feature.properties.name);
      return {
        fillColor: needColor(country?.needIndex),
        fillOpacity: country ? 0.75 : 0.2,
        color: "#ffffff",
        weight: 1,
      };
    },
    onEachFeature: (feature, layer) => {
      const country = countryByName.get(feature.properties.name);
      if (!country) return;
      layer.bindTooltip(`${country.name} — ${needLabel(country.needIndex, { short: true }).toLowerCase()}`);
      layer.on({
        mouseover: () => layer.setStyle({ weight: 2, color: "#1b2a4a" }),
        mouseout: () => layer.setStyle({ weight: 1, color: "#ffffff" }),
        click: () => {
          window.location.href = `${HTML_DIR}country.html?code=${country.code}`;
        },
      });
    },
  }).addTo(map);
}

function createNewsMarker(item, categoryMap) {
  const color = categoryMap.get(item.category)?.color || "#1b2a4a";
  const icon = L.divIcon({
    className: "category-marker",
    html: `<span style="background:${color}"></span>`,
    iconSize: [16, 16],
  });

  return L.marker([item.lat, item.lng], { icon }).bindPopup(
    `<strong>${item.title}</strong><br>${item.country}<br><a href="${HTML_DIR}issue.html?id=${item.id}">Read more</a>`
  );
}
