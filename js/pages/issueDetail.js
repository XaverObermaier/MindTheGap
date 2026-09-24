import { getNewsById, getCategoryMap, getImageCredit, getRelatedIssues } from "../services/dataService.js";
import { formatDate } from "../utils/format.js";
import { qs } from "../utils/dom.js";
import { HTML_DIR, ROOT } from "../utils/basePath.js";

function setText(node, text) {
  node.textContent = text;
}

function makeExternalLink(url, label) {
  const safeUrl = new URL(url, window.location.href);
  const anchor = document.createElement("a");
  anchor.href = safeUrl.href;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  setText(anchor, label);
  return anchor;
}

function renderRelatedStories(item, related) {
  if (!related || !related.length) return null;

  const section = document.createElement("section");
  section.className = "related-stories";

  const heading = document.createElement("h2");
  setText(heading, "Related stories");

  const list = document.createElement("ul");
  list.className = "related-list";

  related.forEach((relatedItem) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = `${HTML_DIR}issue.html?id=${relatedItem.id}`;
    setText(link, relatedItem.title);
    listItem.append(link);
    list.append(listItem);
  });

  section.append(heading, list);
  return section;
}

function renderIssueContent(item, category, summary, imageCredit, related) {
  const container = qs("#issue-detail");
  if (!container) return;

  container.replaceChildren();

  const image = document.createElement("div");
  image.className = "detail-image";
  image.setAttribute("role", "img");
  image.setAttribute("aria-label", `Photo illustrating: ${item.title}`);
  image.style.backgroundImage = `url('${ROOT}${item.image}')`;

  const photoNote = document.createElement("p");
  photoNote.className = "source-note photo-credit";
  if (imageCredit) {
    const label = document.createTextNode("Photo: ");
    const link = makeExternalLink(imageCredit.url, imageCredit.photographer);
    const via = document.createTextNode(` via ${imageCredit.source}`);
    photoNote.append(label, link, via);
  }

  const tag = document.createElement("span");
  tag.className = "tag tag-primary";
  tag.style.background = category?.color || "";
  setText(tag, category?.label || item.category);

  const heading = document.createElement("h1");
  setText(heading, item.title);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const country = document.createElement("span");
  setText(country, item.country);
  const dot = document.createElement("span");
  setText(dot, "\u00B7");
  const date = document.createElement("span");
  setText(date, formatDate(item.date));
  meta.append(country, dot, date);

  const body = document.createElement("div");
  body.className = "detail-body";

  const summaryText = document.createElement("p");
  setText(summaryText, summary);

  const source = document.createElement("p");
  source.className = "source-note";
  source.append(document.createTextNode("Source: "));
  source.append(makeExternalLink(item.sourceUrl, item.source));

  const action = document.createElement("a");
  action.className = "btn btn-primary";
  action.href = `${HTML_DIR}take-action.html?category=${item.category}`;
  setText(action, "See ways to help");

  body.append(summaryText, source, action);
  container.append(image, photoNote, tag, heading, meta, body);

  const relatedSection = renderRelatedStories(item, related);
  if (relatedSection) container.append(relatedSection);
}

async function initIssueDetail() {
  const container = qs("#issue-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    const message = document.createElement("p");
    message.className = "state-message";
    setText(message, "No issue was specified.");
    container.replaceChildren(message);
    return;
  }

  try {
    const [item, categoryMap] = await Promise.all([getNewsById(id), getCategoryMap()]);
    if (!item) {
      const message = document.createElement("p");
      message.className = "state-message";
      setText(message, "This issue could not be found.");
      container.replaceChildren(message);
      return;
    }

    const category = categoryMap.get(item.category);
    const summary = item.summary;
    const imageCredit = await getImageCredit(item.image);
    const related = await getRelatedIssues(item, 3);
    document.title = `${item.title} — Mind the Gap`;
    renderIssueContent(item, category, summary, imageCredit, related);
  } catch (error) {
    const message = document.createElement("p");
    message.className = "state-message";
    setText(message, "Could not load this issue right now.");
    container.replaceChildren(message);
    console.error(error);
  }
}

initIssueDetail();
