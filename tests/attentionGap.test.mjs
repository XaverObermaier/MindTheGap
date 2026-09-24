import test from "node:test";
import assert from "node:assert/strict";
import { attentionGap } from "../js/components/attentionGap.js";

const validRecord = {
  source: "Norwegian Refugee Council",
  title: "The World's Most Neglected Displacement Crises in 2025",
  edition: "10th edition",
  scope: "displacement crises",
  rank: 1,
  url: "https://example.com/nrc",
  checkedAt: "2026-09-16",
};

test("renders an attributed ranked attention gap", () => {
  const html = attentionGap(validRecord);

  assert.match(html, /Attention gap/);
  assert.match(html, /ranked #1/);
  assert.match(html, /Norwegian Refugee Council/);
  assert.match(html, /displacement crises/);
  assert.match(html, /target="_blank"/);
});

test("explains that a missing ranking is unknown", () => {
  const html = attentionGap(null);

  assert.match(html, /not ranked in this edition/);
  assert.match(html, /does not mean the crisis is not neglected/);
  assert.doesNotMatch(html, /ranked #/);
});

test("does not present incomplete metadata as a ranking", () => {
  const html = attentionGap({ rank: 1, url: "https://example.com" });

  assert.match(html, /No complete recognition record is available/);
  assert.match(html, /ranking is unknown/);
  assert.doesNotMatch(html, /ranked #1/);
});

test("escapes curated recognition values before rendering", () => {
  const html = attentionGap({
    ...validRecord,
    source: "NRC <source>",
    url: "https://example.com/?a=1&b=2",
  });

  assert.match(html, /NRC &lt;source&gt;/);
  assert.match(html, /a=1&amp;b=2/);
  assert.doesNotMatch(html, /<source>/);
});