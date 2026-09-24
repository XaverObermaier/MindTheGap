import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rankRelatedIssues } from '../js/services/dataService.js';
import { actionContext, rankOrganizations } from '../js/utils/actionMatching.js';

const load = async (name) => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url)));
const countries = await load('countries');
const organizations = await load('organizations');
const categoryMap = new Map((await load('categories')).map((category) => [category.id, category]));
const context = (query) => actionContext(new URLSearchParams(query), countries, categoryMap);
const ids = (items) => items.map((item) => item.id);

test('country links retain all issues, while valid category links take precedence', () => {
  assert.equal(context('country=SDN').country.name, 'Sudan');
  assert.deepEqual(context('country=SDN').categories, ['hunger', 'war']);
  assert.deepEqual(context('country=KEN').categories, ['climate', 'hunger']);
  assert.deepEqual(context('country=SDN&category=health'), { country: null, categories: ['health'] });
});

test('unknown URL values fall back to a valid country or the general directory', () => {
  assert.deepEqual(context('category=unknown&country=KEN').categories, ['climate', 'hunger']);
  for (const query of ['', 'country=unknown', 'country=<script>&category=unknown']) {
    assert.deepEqual(context(query), { country: null, categories: [] });
  }
});

test('country issues prioritize relevant organizations; offers break ties', () => {
  const before = ids(organizations);
  const ranked = rankOrganizations(organizations, context('country=SDN').categories, new Set(['translation']));
  assert.deepEqual(ids(ranked), ['unhcr', 'oxfam', 'wfp', 'redcross', 'who']);
  assert.deepEqual(ids(organizations), before, 'ranking must not mutate the cached data');
  assert.deepEqual(ids(rankOrganizations(organizations, context('country=KEN').categories, new Set(['logistics']))),
    ['wfp', 'oxfam', 'redcross', 'unhcr', 'who']);
});

test('matching more country issues does not outrank a better offer match', () => {
  const ranked = rankOrganizations([
    { id: 'broad', categories: ['hunger', 'war'], needs: [] },
    { id: 'specific', categories: ['war'], needs: ['translation'] },
  ], ['hunger', 'war'], new Set(['translation']));
  assert.deepEqual(ids(ranked), ['specific', 'broad']);
});

test('general and category links retain existing offer-based recommendations', () => {
  assert.equal(rankOrganizations(organizations, [], new Set(['translation']))[0].id, 'unhcr');
  assert.equal(rankOrganizations(organizations, ['health'], new Set(['medical']))[0].id, 'who');
  assert.deepEqual(rankOrganizations([], ['war'], new Set()), []);
});

test('issue detail pages surface relevant related stories without repeating the current issue', async () => {
  const news = await load('news');
  const related = rankRelatedIssues(news, { id: 1, countryCode: 'SDN', category: 'hunger' }, 2);
  assert.deepEqual(related.map((item) => item.id), [2, 5]);
  assert.ok(related.every((item) => item.id !== 1));
});
