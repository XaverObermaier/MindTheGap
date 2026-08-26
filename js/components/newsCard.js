import { formatDate, truncate } from "../utils/format.js";
import { HTML_DIR } from "../utils/basePath.js";

export function newsCard(item, categoryMap) {
  const category = categoryMap?.get(item.category);
  const tagStyle = category ? `style="background:${category.color};color:#fff"` : "";
  const categoryLabel = category ? category.label : item.category;

  return `
    <a class="card" href="${HTML_DIR}issue.html?id=${item.id}">
      <div class="card-image" style="background-image: url('${item.image}')"></div>
      <div class="card-body">
        <span class="tag" ${tagStyle}>${categoryLabel}</span>
        <h3>${item.title}</h3>
        <p>${truncate(item.summary, 110)}</p>
        <div class="card-meta">
          <span>${item.country}</span>
          <span>&middot;</span>
          <span>${formatDate(item.date)}</span>
        </div>
      </div>
    </a>
  `;
}
