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
  await page.route('**/api/ai/status', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: false, provider: null, model: null, saved: [], searchConfigured: false }) }));
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
  assert.equal(new Set(local.map(item => item.title)).size, 7);
  assert.equal(new Set(local.map(item => item.summary)).size, 7);
  assert.equal(local[6].evidence, 0);
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
  assert.deepEqual(await page.locator('#ai-provider option').allTextContents(), ['OpenAI', 'Gemini', 'Claude', 'DeepSeek']);
  await page.getByLabel('API key', { exact: true }).fill('short');
  await page.getByRole('form', { name: 'AI provider', exact: true }).getByRole('button', { name: 'Save', exact: true }).click();
  assert.match(await page.getByRole('alert').innerText(), /valid OpenAI API key/);

  const requests = [];
  const settingsRequests = [];
  const saved = new Map();
  let active = null;
  let failNext = false;
  const status = () => ({ configured: Boolean(active), provider: active, model: active ? saved.get(active)?.model : null, saved: [...saved].map(([provider, value]) => ({ provider, model: value.model })), searchConfigured: false });
  await page.route('**/api/ai/settings', route => {
    const body = route.request().postDataJSON();
    settingsRequests.push({ method: route.request().method(), ...body });
    if (route.request().method() === 'DELETE') {
      saved.delete(body.provider);
      if (active === body.provider) active = saved.keys().next().value || null;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status()) });
    }
    if (body.apiKey.startsWith('bad-')) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Claude rejected this API key or its permissions.' }) });
    saved.set(body.provider, { model: body.model, key: body.apiKey || saved.get(body.provider)?.key });
    active = body.provider;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status()) });
  });
  await page.route('**/api/ai/test', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, provider: route.request().postDataJSON().provider, model: 'test-model' }) }));
  await page.route('**/api/ai/analyze', route => {
    const body = route.request().postDataJSON();
    requests.push({ ...body, provider: active });
    if (failNext) {
      failNext = false;
      return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Gemini rate limit or quota reached.' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      provider: active, model: saved.get(active)?.model,
      analysis: {
        title: 'Live: ' + body.question,
        summary: 'Live answer for ' + body.question,
        findings: [{ text: 'This analysis uses the supplied context.', citations: body.context.evidence.length ? [1] : [] }],
        next: 'Validate the proposed next step.',
        caveat: 'Use the cited records as directional evidence.',
      },
    }) });
  });

  const connections = [
    ['openai', 'gpt-4.1-mini', 'sk-test-openai-12345678901234567890'],
    ['gemini', 'gemini-3.8-flash', 'AIza-test-gemini-12345678901234567890'],
    ['claude', 'claude-sonnet-5', 'sk-ant-test-12345678901234567890'],
    ['deepseek', 'deepseek-flash', 'sk-test-deepseek-12345678901234567890'],
  ];
  for (const [provider, model, key] of connections) {
    await page.getByLabel('Provider', { exact: true }).selectOption(provider);
    await page.getByLabel('Model', { exact: true }).fill(model);
    await page.getByLabel('API key', { exact: true }).fill(key);
    await page.getByRole('form', { name: 'AI provider', exact: true }).getByRole('button', { name: 'Save', exact: true }).click();
    assert.equal(await page.getByRole('status').innerText(), 'Saved.');
    assert.equal(await page.getByLabel('Model', { exact: true }).inputValue(), model);
  }
  assert.equal(saved.size, 4);
  await page.screenshot({ path: 'artifacts/ai-settings-providers-final.png', fullPage: true });
  await page.getByLabel('Provider', { exact: true }).selectOption('claude');
  await page.getByLabel('API key', { exact: true }).fill('bad-key-12345678901234567890');
  await page.getByRole('form', { name: 'AI provider', exact: true }).getByRole('button', { name: 'Save', exact: true }).click();
  assert.match(await page.getByRole('alert').innerText(), /rejected this API key/);
  assert.equal(active, 'deepseek');

  await page.getByLabel('Provider', { exact: true }).selectOption('gemini');
  await page.getByLabel('Model', { exact: true }).fill('gemini-3.7-flash');
  await page.getByRole('form', { name: 'AI provider', exact: true }).getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal(settingsRequests.at(-1).apiKey, '');
  assert.equal(active, 'gemini');
  assert.equal(await page.getByLabel('Model', { exact: true }).inputValue(), 'gemini-3.7-flash');
  await page.getByRole('button', { name: 'Test connection', exact: true }).click();
  assert.equal(await page.getByRole('status').innerText(), 'Connection verified.');
  await page.getByRole('button', { name: 'Close AI settings' }).click();

  for (const question of questions) {
    await page.getByRole('button', { name: question, exact: true }).click();
    await page.getByText('Live: ' + question, { exact: true }).waitFor();
    assert.equal(await page.locator('.analyst-section-heading').innerText(), 'Live: ' + question);
    assert.equal(requests.at(-1).provider, 'gemini');
    if (question === questions[0]) {
      await page.screenshot({ path: 'artifacts/ai-analyst-live-final.png', fullPage: true });
      await page.getByRole('button', { name: 'View citation 1' }).first().click();
      assert.match(await page.locator('.analyst-source-records').innerText(), /Bengaluru/);
    }
  }
  assert.equal(requests.length, 7);
  assert.equal(new Set(requests.map(item => item.question)).size, 7);
  assert.equal(requests[6].context.evidence.length, 0);
  const customQuestion = 'Compare Hyderabad and Pune for a 30-person analytics team';
  const researchRequests = [];
  await page.route('**/api/ai/research', route => {
    researchRequests.push(route.request().postDataJSON().question);
    const events = [
      { stage: 'local', total: 1, results: [{ number: 1, type: 'local', kind: 'city', title: 'Hyderabad', detail: 'Engineering and analytics talent', url: null, sourceIds: ['LOCAL'], confidence: 80, checked: null, facts: {} }] },
      { stage: 'web-unavailable' },
      { stage: 'analyzing', provider: active, model: saved.get(active)?.model },
      { stage: 'answer', analysis: { title: 'Custom analytics comparison', summary: 'The available data favors Hyderabad for this role mix.', summaryCitations: [1], findings: [{ text: 'Hyderabad has analytics talent.', citations: [1] }], next: 'Validate hiring requirements.', caveat: 'Web search was not connected.' }, provider: active, model: saved.get(active)?.model },
      { stage: 'done' },
    ];
    return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: events.map(item => JSON.stringify(item)).join('\n') + '\n' });
  });
  await page.getByLabel('Ask the AI Analyst a question').fill(customQuestion);
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.getByText('Custom analytics comparison').waitFor();
  assert.equal(researchRequests.at(-1), customQuestion);
  assert.equal(await page.locator('.analyst-research-findings-grid article').count(), 1);
  await page.unroute('**/api/ai/research');
  failNext = true;
  await page.getByRole('button', { name: questions[0], exact: true }).click();
  assert.match(await page.getByRole('alert').innerText(), /rate limit/);
  assert.equal(await page.locator('.analyst-section-heading').innerText(), local[0].title);
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.getByText('Live: ' + questions[0], { exact: true }).waitFor();

  await page.getByRole('button', { name: 'User profile' }).click();
  await page.getByRole('menuitem', { name: /Manage API keys/ }).click();
  await page.getByRole('button', { name: 'Remove Gemini key' }).click();
  assert.equal(active, 'openai');
  assert.equal(await page.getByRole('button', { name: 'Remove Gemini key' }).count(), 0);
  await page.getByRole('button', { name: 'Close AI settings' }).click();
  await page.getByText(local[0].title, { exact: true }).waitFor();
  assert.equal(await page.locator('.analyst-section-heading').innerText(), local[0].title);
  await page.getByRole('button', { name: 'User profile' }).click();
  await page.getByRole('menuitem', { name: /Manage API keys/ }).click();
  for (const provider of ['openai', 'claude', 'deepseek']) {
    await page.getByLabel('Provider', { exact: true }).selectOption(provider);
    await page.getByRole('button', { name: new RegExp('Remove ' + provider, 'i') }).click();
  }
  assert.equal(active, null);
  assert.equal(await page.locator('.ai-settings-status, .ai-settings-saved').count(), 0);
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
  await mobile.getByRole('button', { name: 'User profile' }).click();
  await mobile.getByRole('menuitem', { name: /Manage API keys/ }).click();
  await mobile.screenshot({ path: 'artifacts/ai-settings-mobile-final.png', fullPage: true });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ providers: [...new Set(settingsRequests.filter(item => item.method === 'POST').map(item => item.provider))], local: local.map(({ title, evidence }) => ({ title, evidence })), liveRequests: requests.length, desktopOverflow: false, mobileOverflow: false, pageErrors: errors }));
  await mobile.close();
} finally {
  await browser.close();
}
