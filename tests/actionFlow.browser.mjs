import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:5500';
// Run against a separate Chrome profile, as documented in README.md.
const debug = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9222';
const target = await (await fetch(`${debug}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = ({data}) => {
  const msg = JSON.parse(data);
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
  if (pending.has(msg.id)) {
    const {resolve,reject} = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? reject(msg.error) : resolve(msg.result);
  }
};
function cdp(method, params = {}) {
  return new Promise((resolve,reject) => { const key = ++id; pending.set(key,{resolve,reject}); ws.send(JSON.stringify({id:key,method,params})); });
}
async function evaluate(expression) {
  const r = await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function waitFor(expression) {
  for (let i=0;i<100;i++) {
    if(await evaluate(expression)) return;
    await new Promise(r=>setTimeout(r,50));
  }
  throw Error('Timed out: '+expression);
}
async function visit(path, ready) {
  await cdp('Page.navigate',{url:base+path});
  await waitFor(`location.href === ${JSON.stringify(base+path)} && document.readyState === 'complete' && (${ready})`);
}
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const order = () => evaluate(`[...document.querySelectorAll('.org-card')].map(el=>el.id)`);
const best = () => evaluate(`document.querySelector('.org-card-best')?.id || null`);
try {
await cdp('Runtime.enable');
await cdp('Network.enable');
await cdp('Network.setCacheDisabled', {cacheDisabled: true});
await cdp('Page.enable');
await visit('/html/country.html?code=SDN', `document.querySelector('#country-detail .btn')`);
assert.equal(await evaluate(`document.querySelector('#country-detail .btn').getAttribute('href')`), 'take-action.html?country=SDN');
await evaluate(`localStorage.removeItem('mtg_offers'); localStorage.removeItem('mtg_supporter')`);
await click('#country-detail .btn');
await waitFor(`document.querySelectorAll('.org-card').length === 5`);
assert.match(await evaluate(`document.querySelector('#action-context').textContent`), /Sudan.*Hunger.*War/);
assert.match(await evaluate(`document.querySelector('#action-context a').href`), /country.html\?code=SDN$/);
assert.deepEqual(await order(), ['org-card-oxfam','org-card-wfp','org-card-unhcr','org-card-redcross','org-card-who']);
await click('[data-offer="translation"]');
await click('#supporter-toggle');
assert.equal(await best(),'org-card-unhcr');
await click('[data-offer="translation"]');
assert.equal(await best(), null);
assert.match(await evaluate(`document.querySelector('#supporter-status').textContent`), /Select something/);
await click('[data-offer="logistics"]');
assert.equal(await best(),'org-card-wfp');
assert.match(await evaluate(`document.querySelector('#supporter-status').textContent`), /World Food Programme/);
assert.equal(await evaluate(`document.querySelector('[data-offer="logistics"]').getAttribute('aria-pressed')`),'true');
await click('#supporter-toggle');
assert.equal(await best(), null);
await click('#supporter-toggle');
assert.equal(await best(), 'org-card-wfp');
await visit('/html/take-action.html?country=SDN', `document.querySelectorAll('.org-card').length === 5`);
assert.equal(await best(), 'org-card-wfp', 'saved offers and supporter state survive a reload');
await visit('/html/take-action.html?country=KEN', `document.querySelectorAll('.org-card').length === 5`);
assert.match(await evaluate(`document.querySelector('#action-context').textContent`), /Kenya.*Climate.*Hunger/);
assert.equal((await order())[0],'org-card-wfp');
await visit('/html/take-action.html?country=SDN&category=health', `document.querySelectorAll('.org-card').length === 5`);
assert.equal(await evaluate(`document.querySelector('#action-context').hidden`),true);
assert.match(await evaluate(`document.querySelector('#orgs-heading').textContent`), /Health/);
assert.deepEqual((await order()).slice(0,2),['org-card-oxfam','org-card-who']);
await visit('/html/take-action.html?category=health', `document.querySelectorAll('.org-card').length === 5`);
assert.match(await evaluate(`document.querySelector('#orgs-heading').textContent`), /Health/);
await visit('/html/take-action.html?country=unknown', `document.querySelectorAll('.org-card').length === 5`);
assert.equal(await evaluate(`document.querySelector('#action-context').hidden`),true);
assert.equal(await evaluate(`document.querySelector('#orgs-heading').textContent`),'Organizations you can support');
await visit('/html/take-action.html', `document.querySelectorAll('.org-card').length === 5`);
assert.equal(await evaluate(`document.querySelector('#action-context').hidden`),true);
await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await visit('/html/take-action.html?country=SDN', `document.querySelectorAll('.org-card').length === 5`);
await evaluate('window.scrollTo(0,0)');
assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
// A valid category ignores country context, including unavailable country data.
await cdp('Network.setBlockedURLs', {urls: ['*countries.json']});
await visit('/html/take-action.html?category=health&country=SDN',
  `document.querySelectorAll('.org-card').length === 5 || document.querySelector('#orgs-grid .state-message')?.textContent.includes('Could not load')`);
assert.equal(await evaluate(`document.querySelectorAll('.org-card').length`), 5,
  'a valid category must still show organizations when the ignored country data is unavailable');
assert.match(await evaluate(`document.querySelector('#orgs-heading').textContent`), /Health/);
assert.equal(await evaluate(`document.querySelector('#action-context').hidden`), true);
assert.deepEqual((await order()).slice(0,2), ['org-card-oxfam', 'org-card-who']);
await cdp('Network.setBlockedURLs', {urls: []});
await visit('/html/take-action.html?category=unknown&country=KEN', `document.querySelectorAll('.org-card').length === 5`);
assert.match(await evaluate(`document.querySelector('#action-context').textContent`), /Kenya/);
assert.deepEqual(errors, []);
console.log('PASS: country CTA, contexts, matching, supporter edits/clearing/toggling/reload, route precedence/fallbacks, unavailable ignored country data, mobile layout; no JS exceptions.');
} finally {
  await cdp('Network.setBlockedURLs', {urls: []});
  ws.close();
  await fetch(`${debug}/json/close/${target.id}`);
}
