import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'artifacts/ecosystem';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1505, height: 1045 } });
const errors = [];
const chooseFilter = async (label, value) => {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  const option = page.getByRole('option').filter({ has: page.locator('span') });
  const values = await option.evaluateAll(elements => elements.map(element => element.dataset.value));
  const index = values.indexOf(value);
  assert.ok(index >= 0, `Missing ${label} option: ${value}`);
  await option.nth(index).click();
};

page.on('pageerror', error => errors.push(error.message));
const cards = page.locator('.ecosystem-partner-card');
const url = (process.env.APP_URL || 'http://127.0.0.1:5173') + '/#ecosystem';
try {
  await page.goto(url.replace('/#ecosystem', '/'), { waitUntil: 'networkidle' });
  await page.locator('.topbar > nav').getByRole('button', { name: 'Ecosystem', exact: true }).click();
  assert.match(page.url(), /#ecosystem$/);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.ecosystem-logo img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await cards.count(), 6);
  assert.deepEqual(await cards.locator('h2').allTextContents(), ['EY India GCC Advisory', 'CBRE India', 'Nasscom', 'KPMG India', 'Zinnov', 'T-Hub (Telangana)']);
  assert.equal(await page.locator('.topbar > nav').evaluate(el => el.scrollWidth <= el.clientWidth), true, 'Desktop tabs must fit');
  await page.screenshot({ path: `${output}/explore-partners-desktop.png`, fullPage: true });
  await page.screenshot({ path: `${output}/explore-partners-desktop.jpg`, type: 'jpeg', quality: 80 });

  await page.getByRole('button', { name: 'Next partner page', exact: true }).click();
  assert.match(await page.locator('.ecosystem-footer > p').innerText(), /Showing 7–12/);
  assert.equal(await cards.count(), 6);
  await page.getByLabel('Search partners', { exact: true }).fill('  kpmg  ');
  assert.equal(await cards.count(), 1);
  assert.equal(await cards.locator('h2').innerText(), 'KPMG India');
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await chooseFilter('Stakeholder type', 'Advisory / Consulting');
  assert.equal(await cards.count(), 2);
  await chooseFilter('Evidence status', 'source');
  assert.equal(await cards.count(), 1);
  assert.equal(await cards.locator('h2').innerText(), 'KPMG India');
  await chooseFilter('City', 'Hyderabad');
  assert.equal(await cards.count(), 1);
  await chooseFilter('Service', 'GCC strategy');
  assert.equal(await cards.count(), 0);
  assert.equal(await page.getByRole('heading', { name: 'No partners found' }).count(), 1);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'See all 6 cities for EY India GCC Advisory' }).click();
  const dialog = page.getByRole('dialog');
  assert.equal(await dialog.getByRole('heading', { name: 'EY India GCC Advisory' }).count(), 1);
  assert.match(await dialog.innerText(), /Chennai/);
  await page.screenshot({ path: `${output}/partner-profile.png` });
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(), 0);
  await page.locator('.ecosystem-banner').getByRole('button', { name: 'Claim your profile', exact: true }).click();
  await dialog.getByLabel('Organization', { exact: true }).fill('Example Partner');
  await dialog.getByLabel('Your name', { exact: true }).fill('Review User');
  await dialog.getByLabel('Work email', { exact: true }).fill('review@example.com');
  await dialog.getByRole('button', { name: 'Save claim draft' }).click();
  assert.match(await dialog.getByRole('status').innerText(), /draft has been saved/);
  await page.keyboard.press('Escape');
  await page.locator('.ecosystem-sidebar-bottom').getByRole('button', { name: 'Claim your profile', exact: true }).click();
  assert.equal(await dialog.getByLabel('Organization', { exact: true }).inputValue(), 'Example Partner');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Dismiss profile claim banner' }).click();
  assert.equal(await page.locator('.ecosystem-banner').count(), 0);
  await page.reload({ waitUntil: 'networkidle' });

  const layoutResults = [];
  for (const [name, width, height] of [['laptop', 1280, 900], ['tablet', 1024, 900], ['mobile', 390, 844], ['small-mobile', 320, 740]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `${output}/explore-partners-${name}.png`, fullPage: true });
    await page.screenshot({ path: `${output}/explore-partners-${name}.jpg`, fullPage: true, type: 'jpeg', quality: 75 });
    const layout = await page.evaluate(() => {
      const collisions = [...document.querySelectorAll('.ecosystem-partner-card')].flatMap(card => {
        const title = card.querySelector('h2');
        const badge = card.querySelector('.ecosystem-evidence-badge');
        const range = document.createRange(); range.selectNodeContents(title);
        const a = range.getBoundingClientRect(), b = badge.getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top ? [title.textContent] : [];
      });
      return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, collisions };
    });
    assert.equal(layout.documentWidth, width, `${name} must not scroll horizontally`);
    assert.deepEqual(layout.collisions, [], `${name} title and badge must not overlap`);
    layoutResults.push({ name, ...layout });
  }
  await page.locator('.ecosystem-partner-card').first().getByRole('button', { name: 'View profile' }).click();
  await page.screenshot({ path: `${output}/partner-profile-mobile.png` });
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'passed', checks: ['navigation and reload', 'featured card order', 'search and page reset', 'combined filters', 'empty state', 'profile cities', 'Escape dismissal', 'claim draft persistence', 'banner dismissal', 'responsive overflow', 'badge overlap', 'runtime errors'], layoutResults }, null, 2));
} finally {
  await browser.close();
}
