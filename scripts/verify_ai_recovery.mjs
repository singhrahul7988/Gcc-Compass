import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { conductResearch } from '../server/research-engine.mjs';
import { report, question } from './fixtures/ai-research-report.mjs';

const scenarios = {};
for (const name of ['repaired', 'partial', 'failed', 'recovered-table']) {
  const events = [];
  let attempts = 0;
  await conductResearch({
    question, emit: event => events.push(event),
    search: async query => Array.from({ length: 6 }, (_, i) => ({ type: 'web', kind: 'google-result', title: 'Public market research', url: 'https://publisher' + i + '.org/' + encodeURIComponent(query), detail: 'Hyderabad and Delhi research', facts: {}, sourceIds: [] })),
    pageReader: async () => ({ content: 'Article passages on Hyderabad and Delhi NCR data teams.', format: 'article' }),
    model: async (_prompt, task) => {
      if ('interpretation' in task.schema.properties) return JSON.stringify({ interpretation: '', queries: ['Hyderabad Delhi talent', 'Hyderabad Delhi office'] });
      if ('sufficient' in task.schema.properties) return JSON.stringify({ sufficient: true, queries: [] });
      attempts++;
      if (name === 'recovered-table') return JSON.stringify({
        ...report, comparison: null,
        summary: report.summary + ' Compare salaries using the same role seniority and reporting year, and request matching office specifications. Confirm these assumptions before committing to either location.',
        sections: [
          { title: 'Talent fit', paragraphs: [{ text: 'Match the first leadership hire and specialised analyst roles to the work your parent company needs.', citations: [1, 2] }], bullets: [
            { text: 'Hyderabad: Engineering and analytics are documented strengths.', citations: [1] },
            { text: 'Delhi NCR: Finance and business operations are documented strengths.', citations: [2] },
          ] },
          { title: 'Location and setup risk', paragraphs: [{ text: 'Choose the office cluster before comparing commutes, hiring needs and policy eligibility. Precise cost benchmarks still require comparable current sources.', citations: [1, 2] }], bullets: [
            { text: 'Hyderabad: Validate the office cluster and senior hiring plan.', citations: [1] },
            { text: 'Delhi NCR: Distinguish Gurugram from Noida before checking eligibility.', citations: [2] },
          ] },
        ],
      });
      if (name === 'failed') return '{"title":';
      if (name === 'partial' || attempts === 1) return JSON.stringify({ ...report, comparison: null, findings: [], next: '', caveat: '' });
      return JSON.stringify({ comparison: report.comparison });
    },
  });
  scenarios[name] = events;
}
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true });
const base = process.env.APP_URL || 'http://127.0.0.1:5175';
const errors = [];
try {
  for (const [name, events] of Object.entries(scenarios)) {
    const page = await browser.newPage({ viewport: { width: 1554, height: 1024 } });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/ai/status', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ configured: true, provider: 'gemini', model: 'gemini-3.1-flash-lite', searchConfigured: true, saved: [] }) }));
    await page.addInitScript(({ events, repaired }) => {
      let calls = 0;
      const originalFetch = window.fetch.bind(window);
      window.fetch = (url, options) => {
        if (String(url) !== '/api/ai/research') return originalFetch(url, options);
        const sequence = ++calls === 1 ? events : repaired;
        const stream = new ReadableStream({
          async start(controller) {
            for (const event of sequence) {
              if (options?.signal?.aborted) { controller.error(new DOMException('Aborted', 'AbortError')); return; }
              controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + '\n'));
              await new Promise(resolve => setTimeout(resolve, event.stage === 'repairing' ? 500 : 30));
            }
            controller.close();
          },
        });
        return Promise.resolve(new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } }));
      };
    }, { events, repaired: scenarios.repaired });
    await page.goto(base + '/#analyst', { waitUntil: 'networkidle' });
    await page.getByLabel('Ask the AI Analyst a question').fill(question);
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.getByText('Completing the missing details...').waitFor();
    if (name === 'failed') {
      await page.getByRole('alert').waitFor();
      assert.match(await page.getByRole('alert').innerText(), /invalid or incomplete JSON/);
      assert.equal(await page.locator('.analyst-report-summary').count(), 0);
    } else {
      await page.getByRole('heading', { name: report.title }).waitFor();
      assert.equal(await page.locator('.analyst-report-section').count(), name === 'recovered-table' ? 2 : 3);
      assert.equal(await page.locator('.analyst-report-table tbody tr').count(), name === 'repaired' ? 6 : name === 'recovered-table' ? 2 : 0);
      if (name !== 'recovered-table') assert.equal(await page.locator('.analyst-next,.analyst-caveat').count(), 0);
      if (name === 'partial' || name === 'recovered-table') {
        await page.getByRole('alert').waitFor();
        assert.match(await page.getByRole('alert').innerText(), /could not be completed/);
        assert.equal(await page.locator('.analyst-report-verdict').count(), 0);
        await page.getByRole('button', { name: 'Copy answer', exact: true }).click();
        await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        assert.match(copied, /^Partial analysis/);
        if (name === 'recovered-table') assert.match(copied, /Compiled from the cited findings/);
      }
    }
    if (name === 'recovered-table') {
      assert.match(await page.locator('.analyst-table-note').innerText(), /Compiled from the cited findings/);
      assert.equal(await page.locator('.analyst-report-section li').count(), 0);
      assert.equal(await page.locator('.analyst-report-prose p').count() > 1, true);
      const formatted = await page.evaluate(async () => {
        const { reportParagraphs } = await import('/src/components/reportFormat.ts');
        const original = 'A salary of INR 3.5 lakh is an illustrative number. '.repeat(30) + 'This is an assumption, not a verified benchmark.';
        return { original, output: reportParagraphs(original).join(' ') };
      });
      assert.equal(formatted.output.replace(/\s+/g, ' ').trim(), formatted.original.replace(/\s+/g, ' ').trim());
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
      const tableText = await page.locator('.analyst-report-table').innerText();
      assert.match(tableText, /Engineering and analytics/);
      await page.screenshot({ path: 'artifacts/ai-recovery-formatted-mobile.png', fullPage: true });
      await page.setViewportSize({ width: 1554, height: 1024 });
    }
    assert.equal(await page.locator('.analyst-snapshot-city').count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: 'artifacts/ai-recovery-' + name + '.png', fullPage: true });
    if (name !== 'repaired') {
      await page.getByRole('button', { name: 'Retry research', exact: true }).click();
      await page.locator('.analyst-report-table tbody tr').first().waitFor();
      await page.getByRole('alert').waitFor({ state: 'detached' });
      assert.equal(await page.getByRole('alert').count(), 0);
      assert.equal(await page.locator('.analyst-report-table tbody tr').count(), 6);
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ repaired: true, partialPreserved: true, invalidJson: true, retry: true, copiedPartialLabel: true, recoveredTable: true, losslessParagraphs: true, errors }));
} finally { await browser.close(); }
