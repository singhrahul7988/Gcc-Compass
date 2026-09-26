import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { question, report } from './fixtures/ai-research-report.mjs';

const base = process.env.APP_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
const local = [
  { number: 1, type: 'local', kind: 'city', title: 'Hyderabad', detail: 'Engineering, analytics and data teams', url: 'https://flexiple.com/gcc/india', sourceIds: ['LOCAL'], confidence: 80, checked: '2026-09-25', facts: {} },
  { number: 2, type: 'local', kind: 'city', title: 'Delhi NCR', detail: 'BFSI, operations, professional services', url: 'https://flexiple.com/gcc/india', sourceIds: ['LOCAL'], confidence: 82, checked: '2026-09-25', facts: {} },
];
const web = [
  { number: 3, type: 'web', kind: 'google-result', title: 'Office market research', detail: 'Research of office locations and market conditions.', url: 'https://example.org/office-report', status: 'read', format: 'pdf', publishedAt: '2026-06-01', facts: {} },
  { number: 4, type: 'web', kind: 'google-result', title: 'Regional talent overview', detail: 'Technology workforce research preview.', url: 'https://example.org/talent', status: 'preview', reason: 'The publisher restricted access.', facts: {} },
];
const events = [
  { stage: 'local', total: 2, entities: ['Hyderabad', 'Delhi NCR'], results: local },
  { stage: 'planning' }, { stage: 'searching-web' }, { stage: 'web', results: web },
  { stage: 'reading', completed: 1, total: 2 }, { stage: 'checking' }, { stage: 'searching-more' },
  { stage: 'analyzing' }, { stage: 'answer', analysis: report }, { stage: 'done' },
];
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
async function install(page) {
  page.on('pageerror', error => errors.push(String(error)));
  await page.route('**/api/ai/status', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ configured: true, provider: 'gemini', model: 'fixture-model', saved: [], searchConfigured: true }) }));
  await page.addInitScript(({ events }) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, options) => {
      if (String(input) !== '/api/ai/research') return originalFetch(input, options);
      const controllerSignal = options?.signal;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for (const event of events) {
              if (controllerSignal?.aborted) { controller.error(new DOMException('Aborted', 'AbortError')); return; }
              controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + '\n'));
              await new Promise(resolve => setTimeout(resolve, event.stage === 'reading' ? 350 : 60));
            }
            controller.close();
          } catch (error) { controller.error(error); }
        },
      });
      return Promise.resolve(new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } }));
    };
  }, { events });
}
try {
  const page = await browser.newPage({ viewport: { width: 1554, height: 1024 }, deviceScaleFactor: 1 });
  await install(page);
  await page.goto(base + '/#analyst', { waitUntil: 'networkidle' });
  await page.getByLabel('Ask the AI Analyst a question').fill(question);
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.getByText('Reading sources · 1 of 2...').waitFor();
  await page.screenshot({ path: 'artifacts/ai-insights-loading.png', fullPage: true });
  await page.getByRole('heading', { name: report.title }).waitFor();
  assert.equal(await page.locator('.analyst-report-table tbody tr').count(), 6);
  assert.equal(await page.locator('.analyst-report-section').count(), 3);
  assert.equal(await page.locator('.analyst-report-verdict').count(), 1);
  assert.equal(await page.locator('.analyst-snapshot-city').count(), 2);
  assert.equal(await page.locator('.analyst-snapshot-city img').count(), 2);
  assert.match(await page.locator('.analyst-snapshot').innerText(), /299/);
  assert.match(await page.locator('.analyst-snapshot').innerText(), /305/);
  assert.equal(await page.locator('.analyst-source-list').count(), 0);
  assert.equal(await page.locator('.analyst-research-findings').count(), 0);
  assert.equal(await page.locator('.analyst-mode-button,.analyst-research-progress').count(), 0);
  await noOverflow(page);
  await page.screenshot({ path: 'artifacts/ai-insights-desktop-review.png', fullPage: true });

  await page.getByRole('button', { name: 'View citation 2', exact: true }).first().click();
  await page.locator('#research-source-2.active').waitFor();
  assert.equal(await page.locator('.analyst-source-list li').count(), 4);
  assert.match(await page.locator('.analyst-source-list').innerText(), /PDF report read/);
  assert.match(await page.locator('.analyst-source-list').innerText(), /Search preview only/);
  await page.getByRole('button', { name: 'Sources used 4' }).click();
  await page.getByRole('button', { name: 'Copy answer', exact: true }).click();
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
  await page.getByRole('button', { name: report.followUps[0], exact: true }).click();
  assert.equal(await page.getByLabel('Ask the AI Analyst a question').inputValue(), report.followUps[0]);
  await page.getByRole('heading', { name: report.title }).waitFor();
  // Connected suggested questions use the same deeper research path.
  await page.getByRole('button', { name: 'Bengaluru vs Hyderabad for a 50-person AI team?', exact: true }).click();
  await page.getByRole('heading', { name: report.title }).waitFor();
  await page.getByLabel('Ask the AI Analyst a question').fill(question);
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.getByRole('heading', { name: report.title }).waitFor();
  await page.screenshot({ path: 'artifacts/ai-insights-desktop-final.png', fullPage: true });

  await page.setViewportSize({ width: 1280, height: 900 });
  await noOverflow(page);
  await page.screenshot({ path: 'artifacts/ai-insights-laptop-final.png', fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await install(mobile);
  await mobile.goto(base + '/#analyst', { waitUntil: 'networkidle' });
  await mobile.getByLabel('Ask the AI Analyst a question').fill(question);
  await mobile.getByRole('button', { name: 'Ask', exact: true }).click();
  await mobile.getByRole('heading', { name: report.title }).waitFor();
  await noOverflow(mobile);
  assert.equal(await mobile.locator('.analyst-report-table tbody tr').count(), 6);
  await mobile.screenshot({ path: 'artifacts/ai-insights-mobile-review.png', fullPage: true });
  // Inspect the lower report separately at readable resolution.
  await mobile.locator('.analyst-report-verdict').scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: 'artifacts/ai-insights-mobile-detail.png' });
  await mobile.close();

  const offline = await browser.newPage({ viewport: { width: 1554, height: 1024 } });
  await offline.goto(base + '/#analyst', { waitUntil: 'networkidle' });
  const titles = [];
  for (const button of await offline.locator('.analyst-question-list button').all()) {
    await button.click();
    titles.push(await offline.locator('.analyst-section-heading').innerText());
  }
  assert.equal(new Set(titles).size, 7);
  await offline.getByLabel('Ask the AI Analyst a question').fill(question);
  await offline.getByRole('button', { name: 'Ask', exact: true }).click();
  await offline.getByText('Connect an AI model in settings to synthesize these sources.').waitFor();
  assert.equal(await offline.locator('.analyst-snapshot-city').count(), 2);
  await offline.getByRole('button', { name: /Sources used/ }).click();
  assert.equal(await offline.locator('.analyst-source-list li').count(), 2);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ comparison: true, sections: 3, citations: true, followUps: true, suggestedResearch: true, offlineDistinctAnswers: 7, desktopOverflow: false, mobileOverflow: false, errors }));
} finally { await browser.close(); }
