# Mind the Gap

An AI-assisted platform making global inequality, humanitarian crises and development issues easier to understand — and turning awareness into action. See [PROJECT.md](PROJECT.md) for the full mission, SDG alignment, and project background.

## Live site

**https://xaverobermaier.github.io/MindTheGap/**

(Only live once GitHub Pages is enabled for this repo — see below.)

## Running it locally

This is a plain HTML/CSS/JS site (no build step), but it uses ES modules and `fetch()` to load shared partials and JSON data. Browsers block that over a `file://` URL, so **you can't just double-click `index.html`** — it needs to be served over `http://`.

Easiest option, from the project root:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500/index.html`.

No Python? VS Code's **Live Server** extension does the same thing — right-click `index.html` → "Open with Live Server".

## Project structure

```
index.html          Homepage (map + news) — stays at the project root
html/                All other pages (news, issue detail, countries, country detail, take action, about)
css/                 base (tokens/reset), layout, components
js/
  components/        Reusable render functions (news card, country card)
  services/          Data fetching (dataService.js), map (mapService.js), AI summary stub (aiService.js)
  pages/             One entry module per page
  state/             Shared filter state (map ↔ news list)
  utils/             Formatting, colors, path helpers
data/                Static JSON (news, countries, categories, organizations) — stand-in for a future AI data pipeline
partials/            Shared header/footer, injected at runtime
```

## Deploying / enabling GitHub Pages

1. Push the current work to `main` on GitHub.
2. In the repo on GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `(root)`** → Save.
3. GitHub will publish the site at `https://xaverobermaier.github.io/MindTheGap/` within a minute or two.

No further setup needed — the site was built to work correctly whether it's served from a domain root or from a GitHub Pages project subpath like this one.
