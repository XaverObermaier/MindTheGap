# AI Explainer Design

## Goal

Give readers a clear, source-grounded explanation of each humanitarian issue
without exposing an API key, requiring a runtime backend, or presenting model
output as independently verified fact.

## Chosen approach

Use an offline generation workflow and deploy reviewed explanation records as
static JSON with the existing GitHub Pages site. Azure OpenAI or a local Ollama
model may generate drafts during development, but the public website never
calls the model directly. This keeps the live site free, reproducible, and
compatible with the repository's no-build architecture.

The browser provides an explicit "Explain this issue" action. The existing
article summary remains visible as the trusted fallback, while the generated
explanation is displayed only after it has been validated and loaded.

## User experience

On an issue detail page, readers see:

- An `Explain this issue` button.
- A short plain-language AI summary.
- A `Why this matters` section that separates context from sourced facts.
- An `Uncertainty` section that states missing coverage, time limits, or
  measurement limits.
- A source list built from the trusted article record, not from model-created
  URLs.
- A visible disclosure that the explanation is AI-assisted and reviewed.

The button has loading, success, unavailable, and retry states. The existing
article summary remains usable when JavaScript is unavailable, the explanation
record is missing, or validation fails.

## Data contract

`data/explanations.json` is keyed by the string article ID and contains only
validated records:

```json
{
  "1": {
    "summary": "...",
    "whyItMatters": "...",
    "uncertainty": "...",
    "generatedAt": "2026-09-24",
    "model": "documented-generation-model",
    "reviewed": true
  }
}
```

The explanation does not store source URLs. The renderer resolves sources from
the matching `data/news.json` article, so the model cannot invent or replace a
citation. Missing article IDs, missing fields, invalid dates, overlong text,
or `reviewed: false` records are treated as unavailable.

## Generation and validation

Add a dependency-light generation command under `pipeline/` that:

1. Reads the trusted article records from `data/news.json`.
2. Sends only the article title, summary, country, category, date, and source
   metadata to the configured model provider.
3. Requests JSON with exactly `summary`, `whyItMatters`, and `uncertainty`.
4. Validates lengths, required fields, and safe plain-text content.
5. Writes `data/explanations.json` only after all records pass validation.

The command supports Azure configuration through environment variables and must
fail with a clear setup message when credentials are absent. It must never
write credentials, raw model prompts, or model responses containing secrets to
the repository. Generation is optional for ordinary site development; checked-
in explanation data is the runtime source.

## Safety and trust boundaries

- Model output is untrusted text and is escaped or rendered with `textContent`.
- The model receives no arbitrary user prompt and no arbitrary remote URL.
- Source names, URLs, and dates always come from `data/news.json`.
- The UI states that generated context is AI-assisted and reviewed.
- The explanation must not claim that the model independently verified the
  article or imply a causal conclusion unsupported by the supplied record.
- Existing action links and need levels remain unchanged.

## Testing

Add focused tests for:

- Valid explanation lookup and article/source association.
- Missing, incomplete, unreviewed, oversized, and malformed records.
- Plain-text/XSS-safe rendering of model-like hostile strings.
- Fallback to the trusted article summary when explanations are unavailable.
- Browser button, loading, successful result, unavailable state, retry, and
  keyboard accessibility.
- Generation validation without making a live model request.

Run the existing Node unit suite and browser action-flow suite after the new
tests. The generation validator must be deterministic and dependency-free in
tests.

## Out of scope

- A public live AI endpoint or general-purpose chatbot.
- Runtime Azure Functions deployment in this repository.
- Automatic browsing or fetching of article source pages.
- User-generated prompts, accounts, personalization, or model fine-tuning.
- Replacing the existing article summaries or action-matching behavior.