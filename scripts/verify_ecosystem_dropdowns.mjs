import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'artifacts/ecosystem-dropdowns';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.APP_URL || 'http://127.0.0.1:5173';
const results = [];
try {
  for (const [screen, route, labels] of [
    ['partners', '#ecosystem', ['Stakeholder type', 'City', 'Service', 'Evidence status']],
    ['opportunities', '#ecosystem/opportunities', ['Function', 'Team size', 'Industry', 'Location preference', 'Reported in']],
  ]) {
    for (const [viewport, width, height] of [['desktop', 1536, 1024], ['mobile', 390, 844], ['small-mobile', 320, 740]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}/${route}`, { waitUntil: 'networkidle' });
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await page.getByRole('combobox').count(), labels.length);
      assert.equal(await page.locator('.ecosystem-screen select').count(), 0);
      for (const label of labels) {
        const trigger = page.getByRole('combobox', { name: label, exact: true });
        await trigger.click();
        const menu = page.getByRole('listbox', { name: label, exact: true });
        assert.equal(await menu.count(), 1);
        assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
        const layout = await menu.evaluate(element => {
          const rect = element.getBoundingClientRect();
          const options = [...element.children];
          const rows = options.map(option => {
            const box = option.getBoundingClientRect();
            const range = document.createRange(); range.selectNodeContents(option.querySelector('span'));
            const text = range.getBoundingClientRect();
            return { height: box.height, font: getComputedStyle(option).fontSize, padding: getComputedStyle(option).paddingTop, fits: text.left >= box.left && text.right <= box.right && text.top >= box.top && text.bottom <= box.bottom };
          });
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight, gap: getComputedStyle(element).gap, scrollable: element.scrollHeight > element.clientHeight, rows };
        });
        assert.ok(layout.left >= 11 && layout.right <= width - 11, `${screen}/${viewport}/${label}: menu must fit horizontally`);
        assert.ok(layout.top >= 11 && layout.bottom <= height - 11, `${screen}/${viewport}/${label}: menu must fit vertically`);
        assert.equal(layout.gap, '4px');
        assert.ok(layout.rows.every(row => row.height >= 44 && row.font === '14px' && row.padding === '11px' && row.fits), `${label}: options need spacing and uncut text`);
        if (label === 'City' || label === 'Location preference' || label === 'Evidence status') {
          await page.screenshot({ path: `${output}/${screen}-${viewport}-${label.toLowerCase().replaceAll(' ', '-')}.png` });
          if (viewport !== 'small-mobile') await page.screenshot({ path: `${output}/${screen}-${viewport}-${label.toLowerCase().replaceAll(' ', '-')}.jpg`, type: 'jpeg', quality: 82 });
        }
        await page.keyboard.press('End');
        const last = menu.getByRole('option').last();
        const lastLabel = await last.locator('span').innerText();
        assert.equal(await trigger.getAttribute('aria-activedescendant'), await last.getAttribute('id'));
        const lastBounds = await last.boundingBox(), menuBounds = await menu.boundingBox();
        assert.ok(lastBounds.y + lastBounds.height <= menuBounds.y + menuBounds.height + 1, `${label}: keyboard navigation must scroll the active row into view`);
        await page.keyboard.press('Enter');
        assert.equal(await menu.count(), 0);
        assert.equal(await trigger.locator('.ecosystem-dropdown-value').innerText(), lastLabel);
        assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
        await trigger.click();
        assert.equal(await menu.getByRole('option', { selected: true }).locator('span').innerText(), lastLabel);
        await page.keyboard.press('Home');
        await page.keyboard.press('Enter');
        results.push({ screen, viewport, label, options: layout.rows.length, scrollable: layout.scrollable });
      }
      await page.getByRole('combobox', { name: labels[0], exact: true }).click();
      await page.getByRole('combobox', { name: labels[1], exact: true }).click();
      assert.equal(await page.getByRole('listbox').count(), 1, 'Only one menu may stay open');
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('listbox').count(), 0);
      await page.getByRole('combobox', { name: labels[0], exact: true }).click();
      await page.locator('.topbar').click({ position: { x: 5, y: 5 } });
      assert.equal(await page.getByRole('listbox').count(), 0, 'Outside click must dismiss');
      const city = page.getByRole('combobox', { name: labels.includes('City') ? 'City' : 'Location preference', exact: true });
      await city.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.type('Hyderabad');
      await page.keyboard.press('Enter');
      assert.equal(await city.locator('.ecosystem-dropdown-value').innerText(), 'Hyderabad');
      await city.click();
      await page.keyboard.press('Tab');
      assert.equal(await page.getByRole('listbox').count(), 0, 'Tab must dismiss without trapping focus');
      assert.equal(await city.evaluate(element => element === document.activeElement), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'passed', checks: ['all nine filters', 'padded options', 'long labels', 'viewport bounds', 'scrolling', 'keyboard selection and typeahead', 'selected checkmark', 'single open menu', 'Escape and outside dismissal', 'Tab focus', 'runtime errors'], results }, null, 2));
} finally { await browser.close(); }
