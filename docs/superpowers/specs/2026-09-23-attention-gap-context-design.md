# Attention Gap Context Design

## Goal
Help users understand when a country is recognized by an external source as a neglected displacement crisis, while keeping that attention lens separate from Mind the Gap's own need index and action flow.

## Product behavior
- Country detail pages show an "Attention gap" block when the curated country data contains an external recognition record.
- The block attributes the claim to the Norwegian Refugee Council (NRC), names the list scope and edition, shows the rank, and links to the original source.
- Country detail pages without a recognition record show an explicit unknown state: the country was not ranked in this edition, which is not evidence that its crisis is not neglected.
- Existing need-index, crisis-estimate, related-news, and take-action content remains unchanged.
- The feature does not combine NRC rank with `needIndex`, sort countries, or label a country as more deserving of aid.

## Data contract
`externalRecognition` is an optional curated object on each country:

```json
{
  "source": "Norwegian Refugee Council",
  "title": "The World's Most Neglected Displacement Crises in 2025",
  "edition": "10th edition",
  "scope": "displacement crises",
  "rank": 1,
  "url": "https://...",
  "checkedAt": "2026-09-16"
}
```

The pipeline owns this curated metadata alongside the crisis estimates and copies it into generated country records. Missing metadata remains absent rather than being inferred as a negative result. Existing records are migrated from the current combined source string without changing the current ranks or URLs.

## Rendering and accessibility
- Render the block in the existing country detail content, near the current crisis indicators where the distinction between measures is already explained.
- Use a heading and plain text, not a rank-only badge or color encoding.
- Use one external source link with `target="_blank"` and `rel="noopener"`.
- Make the unknown state equally visible and explanatory.
- Escape or constrain curated values using the existing static-data conventions; no user-supplied HTML is introduced.

## Testing
- Add focused unit tests for recognition rendering: ranked, missing, and incomplete records.
- Add pipeline tests or a deterministic helper test proving the curated recognition fields survive country generation and are copied without mutation.
- Run the existing unit suite and browser action-flow test to ensure PR #12 behavior remains intact.

## Out of scope
- A Countries-page filter or new leaderboard.
- A composite attention/need score.
- Live NRC or ReliefWeb ingestion.
- Changes to the homepage map prioritization.
- Production-grade localization, CMS editing, or funding recommendations.
