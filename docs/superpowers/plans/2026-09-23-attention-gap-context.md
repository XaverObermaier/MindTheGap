# Attention Gap Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native execution in this session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transparent, source-attributed attention-gap context block to country detail pages without changing the site's need ranking or action flow.

**Architecture:** Move the country-detail recognition markup into a pure `attentionGap` component. Extend the curated pipeline input with explicit NRC source metadata and copy it into generated country records, preserving missing records as unknown. Render the component next to the existing country indicators and cover its states with unit and browser tests.

**Tech Stack:** Vanilla HTML/CSS/ES modules, Node's built-in `node:test`, Python standard-library `unittest`, Chrome CDP browser test.

**Spec:** `docs/superpowers/specs/2026-09-23-attention-gap-context-design.md`

## Global Constraints

- Do not combine `externalRecognition.rank` with `needIndex` or reorder countries.
- Attribute the claim to the NRC list and its displacement-crisis scope.
- Missing recognition data means unknown, never “not neglected.”
- Keep the existing map, country directory, crisis figures, and action-matching behavior unchanged.
- Use the repository's no-build, dependency-free test conventions.

## Review Focus

- A country without an NRC record must still render an explicit unknown explanation: `tests/attentionGap.test.mjs`.
- Partial or malformed recognition metadata must not render a misleading rank: `tests/attentionGap.test.mjs`.
- Pipeline regeneration must retain the curated recognition object: `pipeline/test_fetch_worldbank_data.py`.
- The source link must be external, attributed, and keyboard reachable: `tests/actionFlow.browser.mjs`.
- Existing PR-12 country CTA/action matching must remain intact: existing unit and browser suites.

---

### Task 1: Add and test the recognition data contract

**Files:**
- Modify: `pipeline/fetch_worldbank_data.py`
- Create: `pipeline/test_fetch_worldbank_data.py`
- Modify: `data/countries.json`

**Interfaces:**
- Produces `EXTERNAL_RECOGNITION`, keyed by ISO3 code, with `source`, `title`, `edition`, `scope`, `rank`, `url`, and `checkedAt`.
- `build_countries()` copies a complete record as `externalRecognition` only when one exists.

- [ ] **Step 1: Write the failing Python tests**

Add standard-library tests that import the pipeline module and assert:

```python
class ExternalRecognitionTests(unittest.TestCase):
    def test_records_have_explicit_scope_and_provenance(self):
        for code, record in pipeline.EXTERNAL_RECOGNITION.items():
            self.assertEqual(record["source"], "Norwegian Refugee Council")
            self.assertEqual(record["scope"], "displacement crises")
            self.assertRegex(record["checkedAt"], r"^2026-\d{2}-\d{2}$")
            self.assertIsInstance(record["rank"], int)
            self.assertTrue(record["url"].startswith("https://"))

    def test_unranked_country_is_absent_not_negative(self):
        self.assertNotIn("KEN", pipeline.EXTERNAL_RECOGNITION)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `python3 -m unittest pipeline.test_fetch_worldbank_data -v`

Expected: FAIL because `EXTERNAL_RECOGNITION` is not defined.

- [ ] **Step 3: Add curated metadata and pipeline copying**

Add the explicit NRC records for the currently ranked countries, keep Kenya, Haiti, and Nigeria absent unless the checked-in data already provides a verified record, and add this output field in `build_countries()`:

```python
"externalRecognition": EXTERNAL_RECOGNITION[code]
if code in EXTERNAL_RECOGNITION
else None,
```

Omit `None` from the serialized object so the frontend can distinguish absence from a malformed record. Update the module documentation and README pipeline description to state that the recognition metadata is curated and independently dated.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `python3 -m unittest pipeline.test_fetch_worldbank_data -v`

Expected: PASS.

- [ ] **Step 5: Add checked-in JSON metadata without live regeneration**

Update only the existing ranked records in `data/countries.json` to the explicit contract, retaining the current ranks and URLs. Do not run the live World Bank fetch as part of this task.

- [ ] **Step 6: Run schema checks**

Run: `python3 -m unittest pipeline.test_fetch_worldbank_data -v && node --test tests/*.test.mjs`

Expected: PASS with the existing action-matching tests unchanged.

- [ ] **Step 7: Commit**

```bash
git add pipeline/fetch_worldbank_data.py pipeline/test_fetch_worldbank_data.py data/countries.json README.md
git commit -m "feat: preserve attributed attention gap data"
```

### Task 2: Build the pure attention-gap renderer

**Files:**
- Create: `js/components/attentionGap.js`
- Create: `tests/attentionGap.test.mjs`

**Interfaces:**
- Produces `attentionGap(externalRecognition)` returning an HTML string.
- A valid record renders a heading, rank, source/scope/edition copy, and one external link.
- Missing or incomplete records render the unknown explanation and no misleading rank.

- [ ] **Step 1: Write the failing unit tests**

Cover these cases:

```js
test('renders an attributed ranked attention gap', () => {
  const html = attentionGap(validRecord);
  assert.match(html, /Attention gap/);
  assert.match(html, /ranked #1/);
  assert.match(html, /NRC/);
  assert.match(html, /displacement crises/);
  assert.match(html, /target="_blank"/);
});

test('explains that a missing ranking is unknown', () => {
  const html = attentionGap(null);
  assert.match(html, /not ranked in this edition/);
  assert.match(html, /does not mean the crisis is not neglected/);
  assert.doesNotMatch(html, /ranked #/);
});

test('does not present incomplete metadata as a ranking', () => {
  const html = attentionGap({ rank: 1, url: 'https://example.com' });
  assert.match(html, /not ranked in this edition/);
  assert.doesNotMatch(html, /ranked #1/);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/attentionGap.test.mjs`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the minimal pure renderer**

Create `attentionGap(externalRecognition)` with a complete-record guard requiring `source`, `title`, `edition`, `scope`, positive integer `rank`, `url`, and `checkedAt`. Render the recognized and unknown states with semantic section/heading markup and an external source link. Keep text attribution explicit and do not render a combined score.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test tests/attentionGap.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/components/attentionGap.js tests/attentionGap.test.mjs
git commit -m "feat: add attention gap renderer"
```

### Task 3: Integrate the context into country pages and verify the user path

**Files:**
- Modify: `js/pages/countryDetail.js`
- Modify: `css/components.css`
- Modify: `tests/actionFlow.browser.mjs`

**Interfaces:**
- `countryDetail.js` imports `attentionGap` and renders it once per country profile.
- Existing `renderIndicators()` remains responsible for crisis/structural metrics.

- [ ] **Step 1: Extend the browser regression test**

After visiting `/html/country.html?code=SDN`, assert that the page contains one attention-gap block, an NRC source link, rank text, and no `needIndex`/combined-score wording. Visit `/html/country.html?code=KEN` and assert the unknown explanation and no rank text. Assert both source links are keyboard-focusable anchors by checking `tagName === 'A'`, `href`, and `target`.

- [ ] **Step 2: Run the browser test and verify the new assertions fail**

Start the documented server and Chrome debug profile, then run:

```bash
python3 -m http.server 5500 >/tmp/mindthegap-server.log 2>&1 &
node tests/actionFlow.browser.mjs http://127.0.0.1:5500
```

Expected: FAIL on the new attention-gap assertions while the existing action-flow assertions continue to run.

- [ ] **Step 3: Integrate the component**

Import `attentionGap` in `countryDetail.js` and insert `${attentionGap(country.externalRecognition)}` in `.detail-body` before the current indicators. Keep the current crisis and action CTA order otherwise unchanged.

- [ ] **Step 4: Add focused styles**

Add an `.attention-gap` block using existing tokens, border, spacing, and readable source-note/link styles. Ensure the unknown state has the same visual weight as the ranked state and does not depend on color alone. Add a visible hover/focus treatment for its source link if the existing global styles do not cover it.

- [ ] **Step 5: Run the browser test and verify it passes**

Run the same server/browser command from Step 2.

Expected: PASS with no JavaScript exceptions, including the existing mobile-width action-flow checks.

- [ ] **Step 6: Commit**

```bash
git add js/pages/countryDetail.js css/components.css tests/actionFlow.browser.mjs
git commit -m "feat: show attention gap context on country pages"
```

### Task 4: Full verification and branch review

**Files:**
- No new product files; inspect the complete branch diff.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
python3 -m unittest pipeline.test_fetch_worldbank_data -v
node --test tests/*.test.mjs
python3 -m http.server 5500 >/tmp/mindthegap-server.log 2>&1 &
node tests/actionFlow.browser.mjs http://127.0.0.1:5500
```

Expected: all Python and Node tests pass, browser regression prints its PASS summary, and no console exceptions are reported.

- [ ] **Step 2: Review the diff and branch scope**

Run:

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git status --short --branch
```

Confirm the branch contains only the spec, plan, focused data/rendering changes, tests, and documentation required for this feature.

- [ ] **Step 3: Request independent review**

Ask a fresh read-only reviewer to inspect the final diff for data overclaiming, accessibility, regressions, and PR size. Address only findings that are in scope, rerunning the affected focused test after each change.

- [ ] **Step 4: Commit any review fixes separately**

```bash
git add <reviewed files>
git commit -m "fix: address attention gap review findings"
```
