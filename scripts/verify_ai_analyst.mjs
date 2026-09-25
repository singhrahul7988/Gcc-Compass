import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.APP_URL || 'http://127.0.0.1:5175';
const questions = [
  'Bengaluru vs Hyderabad for a 50-person AI team?',
  'Best city for a 20-person engineering GCC?',
  'Hyderabad vs Pune for fintech operations?',
  'When should we choose BOT over a direct entity?',
  'Which cities have the strongest AI/ML talent depth?',
  'What are the setup risks in Bengaluru?',
  'Show policy support for Telangana vs Karnataka',
];
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1554, height: 1024 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
try {
  await page.goto(base + '/#analyst', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/ai-analyst-final.png', fullPage: true });
  const local = [];
  for (const question of questions) {
    await page.getByRole('button', { name: question, exact: true }).click();
    local.push({
      question,
      title: await page.locator('.analyst-section-heading').innerText(),
      summary: await page.locator('.analyst-takeaway p').innerText(),
      evidence: await page.locator('.analyst-evidence-card').count(),
    });
  }
  assert.equal(new Set(local.map(item => item.title)).size, 7, 'each suggestion needs its own title');
  assert.equal(new Set(local.map(item => item.summary)).size, 7, 'each suggestion needs its own summary');
  assert.equal(local[6].evidence, 0, 'missing policy evidence must be explicit');
  await page.getByRole('button', { name: 'Trace citations' }).click();
  assert.match(await page.locator('.analyst-source-records').innerText(), /No source record/);
  await page.getByRole('button', { name: questions[3], exact: true }).click();
  await page.getByRole('button', { name: 'Open Build vs Buy' }).click();
  assert.equal(await page.locator('.build-screen').count(), 1);
  await page.getByRole('button', { name: 'AI Analyst', exact: true }).click();

  await page.getByRole('button', { name: 'User profile' }).click();
  assert.equal(await page.getByRole('menuitem', { name: /Manage API keys/ }).count(), 1);
  await page.getByRole('menuitem', { name: /Manage API keys/ }).click();
  await page.screenshot({ path: 'artifacts/ai-settings-final.png', fullPage: true });
  await page.getByLabel('API key').fill('short');
  await page.getByRole('button', { name: 'Save and test key' }).click();
  assert.match(await page.getByRole('alert').innerText(), /valid OpenAI API key/);

  const requests = [];
  let failNext = false;
  await page.route('**/api/ai/settings', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(route.request().method() === 'DELETE' ? { configured: false, provider: null, model: null } : { configured: true, provider: 'openai', model: 'gpt-4o-mini' }) }));
  let rejectKey = true;
  await page.route('**/api/ai/test', route => route.fulfill(rejectKey
    ? { status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OpenAI rejected this API key. Update it in AI settings.' }) }
    : { status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, model: 'gpt-4o-mini' }) }));
  await page.route('**/api/ai/analyze', route => {
    const body = route.request().postDataJSON();
    requests.push(body);
    if (failNext) {
      failNext = false;
      return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'OpenAI rate limit or quota reached.' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      model: 'gpt-4o-mini',
      analysis: {
        title: 'Live: ' + body.question,
        summary: 'Live answer for ' + body.question,
        findings: [{ text: 'This analysis uses the supplied context.', citations: body.context.evidence.length ? [1] : [] }],
        next: 'Validate the proposed next step.',
        caveat: 'Use the cited records as directional evidence.',
      },
    }) });
  });
  await page.getByLabel('API key').fill('sk-rejected-12345678901234567890');
  await page.getByRole('button', { name: 'Save and test key' }).click();
  assert.match(await page.getByRole('alert').innerText(), /rejected key was removed/);
  assert.match(await page.locator('.ai-settings-status').innerText(), /Using local evidence answers/);
  rejectKey = false;
  await page.getByLabel('API key').fill('sk-test-12345678901234567890');
  await page.getByRole('button', { name: 'Save and test key' }).click();
  assert.match(await page.getByRole('status').innerText(), /connection verified/);
  await page.getByRole('button', { name: 'Close AI settings' }).click();

  for (const question of questions) {
    await page.getByRole('button', { name: question, exact: true }).click();
    await page.getByText('Live AI analysis', { exact: true }).waitFor();
    assert.equal(await page.locator('.analyst-section-heading').innerText(), 'Live: ' + question);
    if (question === questions[0]) {
      await page.screenshot({ path: 'artifacts/ai-analyst-live-final.png', fullPage: true });
      await page.getByRole('button', { name: 'View citation 1' }).first().click();
      assert.match(await page.locator('.analyst-source-records').innerText(), /Bengaluru/);
    }
  }
  assert.equal(requests.length, 7, 'each suggested question should request live analysis');
  assert.equal(new Set(requests.map(item => item.question)).size, 7);
  assert.equal(requests[6].context.evidence.length, 0);
  await page.getByLabel('Ask the AI Analyst a question').fill('Compare Hyderabad and Pune for a 30-person analytics team');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.getByText('Live AI analysis', { exact: true }).waitFor();
  assert.equal(requests.at(-1).question, 'Compare Hyderabad and Pune for a 30-person analytics team');
  failNext = true;
  await page.getByRole('button', { name: questions[0], exact: true }).click();
  assert.match(await page.getByRole('alert').innerText(), /rate limit/);
  assert.equal(await page.locator('.analyst-section-heading').innerText(), local[0].title);
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.getByText('Live AI analysis', { exact: true }).waitFor();

  await page.getByRole('button', { name: 'User profile' }).click();
  await page.getByRole('menuitem', { name: /Manage API keys/ }).click();
  await page.getByRole('button', { name: 'Remove saved key' }).click();
  assert.match(await page.getByRole('status').innerText(), /key removed/);
  await page.getByRole('button', { name: 'Close AI settings' }).click();
  const callsBefore = requests.length;
  await page.getByRole('button', { name: questions[1], exact: true }).click();
  assert.equal(requests.length, callsBefore);
  assert.equal(await page.locator('.analyst-section-heading').innerText(), local[1].title);
  assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /api|key/i.test(key)) || Object.keys(sessionStorage).some(key => /api|key/i.test(key))), false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(base + '/#analyst', { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: 'artifacts/ai-analyst-mobile-final.png', fullPage: true });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ local: local.map(({ title, evidence }) => ({ title, evidence })), liveRequests: requests.length, desktopOverflow: false, mobileOverflow: false, pageErrors: errors }));
  await mobile.close();
} finally {
  await browser.close();
}

