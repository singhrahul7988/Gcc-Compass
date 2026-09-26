import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { report } from './fixtures/ai-research-report.mjs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1554, height: 1024 } });
const errors = [], requests = [];
const saved = new Map();
let active = null, revision = 0;
const researchKeys = new Set();
const status = () => ({ configured: Boolean(active), provider: active, model: active ? saved.get(active) : null, saved: [...saved].map(([provider, model]) => ({ provider, model })), searchConfigured: researchKeys.size > 0, researchProviders: [...researchKeys], revision });
const fulfill = (route, body, code = 200) => route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify(body) });
page.on('pageerror', error => errors.push(String(error)));
try {
  await page.route('**/api/ai/status', route => fulfill(route, status()));
  await page.route('**/api/ai/settings', route => {
    const body = route.request().postDataJSON();
    if (route.request().method() === 'DELETE') {
      saved.delete(body.provider);
      if (active === body.provider) active = saved.keys().next().value || null;
    } else {
      if (body.apiKey && body.apiKey.length < 20) return fulfill(route, { error: 'Enter a valid API key.' }, 400);
      if (body.apiKey?.startsWith('bad-')) return fulfill(route, { error: 'Provider rejected this API key.' }, 401);
      saved.set(body.provider, body.model); active = body.provider;
    }
    revision++;
    return fulfill(route, status());
  });
  await page.route('**/api/ai/research-settings', route => {
    const body = route.request().postDataJSON();
    if (route.request().method() === 'DELETE') researchKeys.delete(body.provider);
    else researchKeys.add(body.provider);
    revision++;
    return fulfill(route, status());
  });
  await page.route('**/api/ai/research-test', route => fulfill(route, { ok: true }));
  await page.route('**/api/ai/test', route => fulfill(route, { ok: true }));
  await page.route('**/api/ai/research', route => {
    const question = route.request().postDataJSON().question;
    requests.push({ question, provider: active, model: saved.get(active) });
    const events = [
      { stage: 'local', total: 0, results: [] },
      { stage: 'analyzing' },
      { stage: 'answer', analysis: { ...report, title: 'Research: ' + question } },
      { stage: 'done' },
    ];
    return route.fulfill({ contentType: 'application/x-ndjson', body: events.map(event => JSON.stringify(event)).join('\n') + '\n' });
  });
  await page.goto((process.env.APP_URL || 'http://127.0.0.1:5175') + '/#analyst', { waitUntil: 'networkidle' });
  const summaries = [];
  for (const button of await page.locator('.analyst-question-list button').all()) {
    await button.click();
    summaries.push(await page.locator('.analyst-takeaway p').innerText());
  }
  assert.equal(new Set(summaries).size, 7);
  await page.getByRole('button', { name: 'User profile' }).click();
  await page.getByRole('menuitem', { name: 'Manage API keys' }).click();
  const form = page.getByRole('form', { name: 'AI provider', exact: true });
  assert.deepEqual(await page.locator('#ai-provider option').allTextContents(), ['OpenAI', 'Gemini', 'Claude', 'DeepSeek']);
  await page.getByLabel('API key', { exact: true }).fill('short');
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('alert').waitFor();
  const connections = [
    ['openai', 'custom-openai-model', 'sk-test-openai-12345678901234567890'],
    ['gemini', 'custom-gemini-model', 'AIza-test-gemini-12345678901234567890'],
    ['claude', 'custom-claude-model', 'sk-ant-test-12345678901234567890'],
    ['deepseek', 'custom-deepseek-model', 'sk-test-deepseek-12345678901234567890'],
  ];
  for (const [provider, model, key] of connections) {
    await page.getByLabel('Provider', { exact: true }).selectOption(provider);
    await page.getByLabel('Model', { exact: true }).fill(model);
    await page.getByLabel('API key', { exact: true }).fill(key);
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await form.getByRole('status').waitFor();
    assert.equal(active, provider);
    assert.equal(saved.get(provider), model);
    assert.equal(await page.getByLabel('API key', { exact: true }).inputValue(), '');
    await form.getByRole('button', { name: 'Test connection' }).click();
    await page.getByText('Connection verified.').waitFor();
  }
  const searchForm = page.getByRole('form', { name: 'Research APIs', exact: true });
  const researchProviders = ['tavily', 'exa', 'firecrawl', 'serper'];
  const labels = { tavily: 'Tavily', exa: 'Exa', firecrawl: 'Firecrawl', serper: 'Serper' };
  for (const provider of researchProviders) {
    await page.locator('.ai-settings-services button').filter({ hasText: labels[provider] }).click();
    await page.getByLabel(labels[provider] + ' API key', { exact: true }).fill(provider + '-fixture-1234567890');
    await searchForm.getByRole('button', { name: 'Save', exact: true }).click();
    await searchForm.getByRole('status').waitFor();
    assert.equal(researchKeys.has(provider), true);
    assert.equal(await page.locator('#ai-search-key').inputValue(), '');
    await searchForm.getByRole('button', { name: 'Test connection' }).click();
    await searchForm.getByText('Connection verified.').waitFor();
  }
  assert.equal(await page.locator('.ai-settings-services [aria-label="Connected"]').count(), 4);
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
  await page.getByRole('dialog').locator('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]').last().focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close AI settings');
  await page.screenshot({ path: 'artifacts/ai-research-apis-settings-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/ai-research-apis-settings-mobile.png' });
  await page.locator('.ai-settings-hint').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/ai-research-apis-settings-mobile-bottom.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.setViewportSize({ width: 1554, height: 1024 });
  await page.getByRole('button', { name: 'Close AI settings' }).click();

  for (const [provider, model] of connections) {
    await page.getByRole('button', { name: 'User profile' }).click();
    await page.getByRole('menuitem', { name: 'Manage API keys' }).click();
    await page.getByLabel('Provider', { exact: true }).selectOption(provider);
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await form.getByRole('status').waitFor();
    await page.getByRole('button', { name: 'Close AI settings' }).click();
    const question = 'What are the setup risks in Bengaluru?';
    await page.getByRole('button', { name: question, exact: true }).click();
    await page.getByRole('heading', { name: 'Research: ' + question, exact: true }).waitFor();
    assert.equal(requests.at(-1).provider, provider);
    assert.equal(requests.at(-1).model, model);
  }

  await page.getByRole('button', { name: 'User profile' }).click();
  await page.getByRole('menuitem', { name: 'Manage API keys' }).click();
  for (const [provider] of connections) {
    await page.getByLabel('Provider', { exact: true }).selectOption(provider);
    await page.getByRole('button', { name: 'Remove ' + ({ openai: 'OpenAI', gemini: 'Gemini', claude: 'Claude', deepseek: 'DeepSeek' })[provider] + ' key' }).click();
    await form.getByText('Key removed.').waitFor();
  }
  assert.equal(active, null);
  for (const provider of researchProviders) {
    await page.locator('.ai-settings-services button').filter({ hasText: labels[provider] }).click();
    await searchForm.getByRole('button', { name: 'Remove ' + labels[provider] + ' key' }).click();
    await searchForm.getByText('Key removed.').waitFor();
  }
  assert.equal(researchKeys.size, 0);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /api|key/i.test(key)) || Object.keys(sessionStorage).some(key => /api|key/i.test(key))), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ providers: connections.map(item => item[0]), customModelIds: true, keySaveTestRemove: true, researchProviders, researchSaveTestRemove: true, distinctLocalAnswers: 7, noStoredKeys: true, errors }));
} finally { await browser.close(); }
