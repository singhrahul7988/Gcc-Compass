import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'artifacts/header-navigation';
await mkdir(output, { recursive: true });
const chromePath = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const url = process.env.APP_URL || 'http://127.0.0.1:5173';
const menu = page.locator('.topbar > nav');
const openPage = name => menu.getByRole('button', { name, exact: true }).click();

const measureHeader = async () => {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  return page.locator('.topbar').evaluate(header => {
    const nav = header.querySelector('nav');
    const elements = [header, ...header.querySelectorAll('.brand, .brand strong, .brand small, nav, nav > button, .topbar-tools, .global-search, .global-search input, .nav-icon-button, .avatar-button')];
    return elements.map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      // Tab clicks may scroll the menu on small screens; compare its content coordinates.
      const x = rect.x + (element.parentElement === nav ? nav.scrollLeft : 0);
      return {
        element: element.tagName + (element.parentElement === nav ? `:${element.textContent}` : `:${element.className}`),
        x: Math.round(x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        display: style.display,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        gap: style.gap,
        padding: style.padding,
        flexDirection: style.flexDirection,
        justifyContent: style.justifyContent,
      };
    });
  });
};

const measureSidebar = () => page.locator('.ecosystem-sidebar').evaluate(sidebar => {
  const clone = sidebar.cloneNode(true);
  clone.querySelectorAll('button').forEach(button => {
    button.classList.remove('selected');
    button.removeAttribute('aria-current');
  });
  const selectors = '.ecosystem-nav-label, .ecosystem-sidebar-nav, .ecosystem-sidebar-bottom, .ecosystem-how, .ecosystem-claim';
  const elements = [sidebar, ...sidebar.querySelectorAll(selectors)];
  if (innerWidth > 760) elements.push(...sidebar.querySelectorAll('.ecosystem-sidebar-nav button'));
  return {
    markup: clone.innerHTML,
    layout: elements.map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        element: element.tagName,
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        fontSize: style.fontSize,
        padding: style.padding,
        gap: style.gap,
        background: element === sidebar ? style.backgroundColor : undefined,
      };
    }),
  };
});

try {
  const results = [];
  for (const width of [1920, 1536, 1505, 1321, 1280, 1180, 1024, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 1045 });
    await page.goto(url, { waitUntil: 'networkidle' });
    const baseline = await measureHeader();
    let sidebarBaseline;
    const verify = async name => {
      assert.deepEqual(await measureHeader(), baseline, `${name} changed the shared header at ${width}px`);
      assert.equal((await menu.locator('button.active').innerText()).trim(), name === 'Opportunities' || name === 'Explore partners' ? 'Ecosystem' : name);
      if (await page.locator('.ecosystem-screen').count()) {
        if (sidebarBaseline) assert.deepEqual(await measureSidebar(), sidebarBaseline, `Sidebar changed when opening ${name} at ${width}px`);
        const selectedSection = await page.locator('.opportunities-content').count() ? 'Opportunities' : 'Explore partners';
        assert.equal(await page.locator('.ecosystem-sidebar button[aria-current="page"]').innerText(), selectedSection);
        assert.equal(await page.locator('.ecosystem-sidebar button.selected').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'Ecosystem must not overflow the viewport');
        if (width > 760) {
          const layout = await page.evaluate(() => ({
            headerHeight: document.querySelector('.topbar').getBoundingClientRect().height,
            sidebarTop: parseFloat(getComputedStyle(document.querySelector('.ecosystem-sidebar')).top),
          }));
          assert.equal(layout.sidebarTop, layout.headerHeight, 'Sticky sidebar must sit below the shared header');
        }
      }
      if (width >= 1505) {
        assert.equal(await menu.evaluate(element => element.scrollWidth <= element.clientWidth), true, 'Desktop tabs must fit');
      }
    };

    await openPage('Ecosystem');
    await page.locator('.ecosystem-content').waitFor();
    assert.match(page.url(), /#ecosystem$/);
    await verify('Ecosystem');
    sidebarBaseline = await measureSidebar();
    await page.screenshot({ path: `${output}/ecosystem-${width}.png` });
    await page.getByRole('button', { name: 'Opportunities', exact: true }).click();
    await page.locator('.opportunities-content').waitFor();
    await verify('Opportunities');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.opportunities-content').waitFor();
    await verify('Opportunities');
    await openPage('Ecosystem');
    assert.match(page.url(), /#ecosystem\/opportunities$/);
    await verify('Opportunities');
    await page.getByRole('button', { name: 'Explore partners', exact: true }).click();
    await page.locator('.ecosystem-content').waitFor();
    await verify('Explore partners');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.ecosystem-content').waitFor();
    await verify('Ecosystem');

    for (const name of ['Overview', 'GCC Atlas', 'City Compare', 'Build vs Buy', 'AI Analyst', 'Ecosystem', 'Overview']) {
      await openPage(name);
      await verify(name);
      assert.equal(await page.locator('.ecosystem-screen').count(), name === 'Ecosystem' ? 1 : 0);
    }
    results.push({ width, headerHeight: baseline[0].height });
  }
  await openPage('Ecosystem');
  for (const width of [1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(() => {
      const header = document.querySelector('.topbar');
      const sidebar = document.querySelector('.ecosystem-sidebar');
      return parseFloat(getComputedStyle(sidebar).top) === header.getBoundingClientRect().height;
    });
  }
  assert.deepEqual(errors, [], 'Navigation must not cause runtime errors');
  console.log(JSON.stringify({ result: 'passed', checks: ['header position, dimensions and typography across every page', 'fixed sidebar layout, labels, icons and selected navigation', 'deep-link reloads', 'active tabs', 'desktop tab fit', 'sticky sidebar offsets and live resize', 'runtime errors'], results }, null, 2));
} finally {
  await browser.close();
}
