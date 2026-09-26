import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const chromePath = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
const base = (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '') + '/';
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
// Suggested answers stay local; never initiate live provider calls during navigation checks.
await page.route('**/api/ai/status', route => route.fulfill({ json: { configured: false, provider: null, model: null, saved: [], searchConfigured: false } }));
const screens = {
  Overview: '.overview-screen',
  'GCC Atlas': '.atlas-screen',
  'City Compare': '.city-compare-screen',
  'Build vs Buy': '.build-screen',
  'AI Analyst': '.analyst-screen',
  Ecosystem: '.ecosystem-content',
  Opportunities: '.opportunities-content',
};
const menu = page.getByRole('navigation', { name: 'Main navigation', exact: true });
const show = async (name, hash) => {
  await page.locator(screens[name]).waitFor();
  await page.waitForFunction(({ name, hash }) => {
    const current = document.querySelector('.topbar > nav button[aria-current="page"]');
    return location.hash === hash && current?.textContent.trim() === name;
  }, { name: name === 'Opportunities' ? 'Ecosystem' : name, hash });
  assert.equal(await menu.locator('button.active').count(), 1);
};
const reload = async (name, hash) => {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await show(name, hash);
};
const header = name => menu.getByRole('button', { name, exact: true }).click();
const cityNames = () => page.locator('.city-summary-grid h2').allTextContents();
const top = () => page.waitForFunction(() => window.scrollY === 0, null, { timeout: 5000 });

try {
  for (const link of ['Explore Cities', 'View all cities']) {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await show('Overview', '');
    const control = page.getByRole('link', { name: link, exact: true });
    assert.equal(await control.getAttribute('href'), '#cities');
    if (link === 'Explore Cities') await control.click();
    else { await control.focus(); await control.press('Enter'); }
    await show('City Compare', '#cities');
    await top();
    await reload('City Compare', '#cities');
    await page.goBack();
    await show('Overview', '');
    await page.goForward();
    await show('City Compare', '#cities');
    checks.push(link + ': click/keyboard, URL, highlight, reload, Back/Forward');
  }

  for (const [hash, name] of [
    ['#overview', 'Overview'], ['#atlas', 'GCC Atlas'], ['#cities', 'City Compare'],
    ['#build', 'Build vs Buy'], ['#analyst', 'AI Analyst'], ['#ecosystem', 'Ecosystem'],
    ['#ecosystem/opportunities', 'Opportunities'],
  ]) {
    await page.goto(base + hash, { waitUntil: 'domcontentloaded' });
    await show(name, hash);
    await reload(name, hash);
  }
  checks.push('All header pages and Opportunities: direct links and reload');

  for (const tab of ['Overview', 'Sources', 'Verification', 'Insights', 'Related']) {
    await header('GCC Atlas');
    await show('GCC Atlas', '#atlas');
    await page.locator('.atlas-tabs').getByRole('button', { name: new RegExp('^' + tab) }).click();
    await page.getByRole('button', { name: 'Open in AI Analyst', exact: true }).click();
    await show('AI Analyst', '#analyst');
    await top();
  }
  await reload('AI Analyst', '#analyst');
  await page.goBack();
  await show('GCC Atlas', '#atlas');
  await page.goForward();
  await show('AI Analyst', '#analyst');
  checks.push('GCC Atlas: Open in AI Analyst from every detail tab, reload and Back/Forward');

  await page.goto(base + '#cities=Hyderabad,Pune', { waitUntil: 'domcontentloaded' });
  await show('City Compare', '#cities=Hyderabad,Pune');
  assert.deepEqual(await cityNames(), ['Hyderabad', 'Pune']);
  await header('City Compare');
  assert.equal(new URL(page.url()).hash, '#cities=Hyderabad,Pune');
  await page.evaluate(() => { location.hash = '#cities=Bengaluru,Chennai'; });
  await show('City Compare', '#cities=Bengaluru,Chennai');
  assert.deepEqual(await cityNames(), ['Bengaluru', 'Chennai']);
  await page.goBack();
  await show('City Compare', '#cities=Hyderabad,Pune');
  assert.deepEqual(await cityNames(), ['Hyderabad', 'Pune']);
  await reload('City Compare', '#cities=Hyderabad,Pune');
  assert.deepEqual(await cityNames(), ['Hyderabad', 'Pune']);
  checks.push('Shared comparisons: city selection, same-page hash changes, Back and reload');

  await page.getByRole('button', { name: 'Ask AI Analyst', exact: true }).click();
  await show('AI Analyst', '#analyst');
  await page.getByRole('button', { name: 'Open City Compare', exact: true }).click();
  await show('City Compare', '#cities');
  await reload('City Compare', '#cities');
  await header('AI Analyst');
  await page.getByRole('button', { name: 'Go to City Compare', exact: true }).click();
  await show('City Compare', '#cities');
  await header('AI Analyst');
  await page.getByRole('button', { name: 'When should we choose BOT over a direct entity?', exact: true }).click();
  await page.getByRole('button', { name: 'Open Build vs Buy', exact: true }).click();
  await show('Build vs Buy', '#build');
  await reload('Build vs Buy', '#build');
  await header('AI Analyst');
  await page.getByRole('button', { name: 'When should we choose BOT over a direct entity?', exact: true }).click();
  await page.getByRole('button', { name: 'Go to Build vs Buy', exact: true }).click();
  await show('Build vs Buy', '#build');
  checks.push('City Compare and AI Analyst: every cross-page text and arrow CTA');

  await header('Overview');
  await page.getByRole('button', { name: 'View opportunities', exact: true }).click();
  await show('Opportunities', '#ecosystem/opportunities');
  await page.getByRole('button', { name: 'My profile', exact: true }).click();
  await page.getByRole('button', { name: 'Back to Explore partners', exact: true }).click();
  await show('Ecosystem', '#ecosystem');
  assert.equal(await page.locator('dialog[open]').count(), 0);
  await page.goBack();
  await show('Opportunities', '#ecosystem/opportunities');
  await header('Ecosystem');
  await show('Opportunities', '#ecosystem/opportunities');
  await page.getByRole('button', { name: 'Explore partners', exact: true }).click();
  await show('Ecosystem', '#ecosystem');
  await page.goBack();
  await show('Opportunities', '#ecosystem/opportunities');
  await page.goForward();
  await show('Ecosystem', '#ecosystem');
  checks.push('Development CTA, workspace return, preserved Ecosystem section and sidebar history');

  for (const [name, hash] of [
    ['GCC Atlas', '#atlas'], ['City Compare', '#cities'], ['Build vs Buy', '#build'],
    ['AI Analyst', '#analyst'], ['Ecosystem', '#ecosystem'], ['Overview', '#overview'],
  ]) { await header(name); await show(name, hash); }
  await header('GCC Atlas');
  await page.getByRole('button', { name: 'GCC Compass home', exact: true }).click();
  await show('Overview', '#overview');
  await page.goBack();
  await show('GCC Atlas', '#atlas');
  checks.push('Every header tab and brand home use real browser history');

  await page.setViewportSize({ width: 390, height: 844 });
  await header('GCC Atlas');
  await page.locator('.atlas-tabs').getByRole('button', { name: 'Insights', exact: true }).click();
  const atlasAnalyst = page.getByRole('button', { name: 'Open in AI Analyst', exact: true });
  await atlasAnalyst.focus();
  await atlasAnalyst.press('Enter');
  await show('AI Analyst', '#analyst');
  await top();
  checks.push('GCC Atlas: mobile and keyboard navigation to AI Analyst');
  await header('Overview');
  await page.getByRole('link', { name: 'Explore Cities', exact: true }).click();
  await show('City Compare', '#cities');
  await top();
  await page.getByRole('button', { name: 'Ask AI Analyst', exact: true }).click();
  await show('AI Analyst', '#analyst');
  await header('Overview');
  await page.getByRole('button', { name: 'View opportunities', exact: true }).click();
  await show('Opportunities', '#ecosystem/opportunities');
  await page.getByRole('button', { name: 'Explore partners', exact: true }).click();
  await show('Ecosystem', '#ecosystem');
  checks.push('Mobile navigation and top-of-page arrival');

  assert.deepEqual(errors, [], 'Navigation must not cause runtime errors');
  console.log(JSON.stringify({ result: 'passed', checks }, null, 2));
} finally { await browser.close(); }
