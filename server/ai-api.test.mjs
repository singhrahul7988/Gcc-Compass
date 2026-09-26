import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAiApiMiddleware } from './ai-api.mjs';
import { report } from '../scripts/fixtures/ai-research-report.mjs';

const providerFromUrl = url => url.includes('openai.com') ? 'openai' : url.includes('generativelanguage.googleapis.com') ? 'gemini' : url.includes('anthropic.com') ? 'claude' : 'deepseek';
const promptFrom = (provider, payload) => provider === 'openai' ? payload.input : provider === 'gemini' ? payload.contents[0].parts[0].text : provider === 'claude' ? payload.messages[0].content : payload.messages.at(-1).content;
const providerResult = (provider, text) => provider === 'openai'
  ? { output: [{ type: 'message', content: [{ type: 'output_text', text }] }] }
  : provider === 'gemini' ? { candidates: [{ content: { parts: [{ text }] } }] }
  : provider === 'claude' ? { content: [{ type: 'text', text }] }
  : { choices: [{ message: { content: text } }] };

test('provider keys, custom model IDs, activation, and grounded analysis', async () => {
  const calls = [];
  let failSearch = false;
  const fakeFetch = async (url, options) => {
    if (url === 'https://google.serper.dev/search') {
      if (failSearch) return new Response('{}', { status: 429 });
      calls.push({ provider: 'serper', url, headers: options.headers, payload: JSON.parse(options.body) });
      return new Response(JSON.stringify({ organic: [
        { title: 'External market report', link: 'https://example.org/report', snippet: 'Hyderabad has an active technology talent market.' },
        { title: 'Unsafe result', link: 'javascript:alert(1)', snippet: 'Ignore this.' },
      ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const provider = providerFromUrl(url);
    const payload = JSON.parse(options.body);
    const prompt = promptFrom(provider, payload);
    calls.push({ provider, url, headers: options.headers, payload, prompt });
    if (JSON.stringify(options.headers).includes('bad-key-12345678901234567890')) {
      return new Response(JSON.stringify({ error: 'Invalid key' }), { status: 401 });
    }
    const instruction = payload.instructions || payload.systemInstruction?.parts[0]?.text || payload.system || payload.messages?.[0]?.content || '';
    const text = prompt === 'Reply with OK.' ? 'OK' : instruction.includes('Plan web research') ? JSON.stringify({ interpretation: 'Focused GCC research', queries: ['Microsoft Hyderabad engineering talent', 'Microsoft Hyderabad office research'] }) : instruction.includes('Review evidence coverage') ? JSON.stringify({ sufficient: true, queries: [] }) : instruction.includes('rigorous India GCC') ? JSON.stringify(report) : JSON.stringify({
      title: provider + ' question-specific brief',
      summary: 'Bengaluru has the deeper specialist pool in the supplied record.',
      summaryCitations: [1, 99],
      findings: [{ text: 'The record supports the talent finding.', citations: [1, 99] }],
      next: 'Validate the role mix.',
      caveat: 'This is directional.',
    });
    return new Response(JSON.stringify(providerResult(provider, text)), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  const middleware = createAiApiMiddleware({ fetchImpl: fakeFetch, pageReader: async () => ({ title: 'External market report', content: 'Page text about the active Hyderabad technology talent market. '.repeat(4), format: 'article' }) });
  const server = createServer((req, res) => {
    if (!req.url?.startsWith('/api/ai')) { res.statusCode = 404; res.end(); return; }
    req.url = req.url.slice('/api/ai'.length) || '/';
    middleware(req, res, () => { res.statusCode = 404; res.end(); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let cookie = '';
  const request = async (path, method = 'GET', body, extraHeaders = {}) => {
    const response = await fetch(base + '/api/ai' + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { response, data: await response.json() };
  };
  const requestEvents = async question => {
    const response = await fetch(base + '/api/ai/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ question }),
    });
    assert.equal(response.status, 200);
    return (await response.text()).trim().split('\n').map(line => JSON.parse(line));
  };
  const evidence = { evidence: [{ number: 1, title: 'Bengaluru', facts: { talent_strengths: 'Deep engineering pool' } }] };
  try {
    let result = await request('/status');
    assert.deepEqual(result.data, { configured: false, provider: null, model: null, saved: [], searchConfigured: false, researchProviders: [], revision: 0 });
    let events = await requestEvents('Microsoft GCC Hyderabad');
    assert.deepEqual(events.map(item => item.stage), ['local', 'web-unavailable', 'analysis-unavailable', 'done']);
    assert.equal(events[0].results.some(item => item.title === 'Microsoft'), true);
    result = await request('/analyze', 'POST', { question: 'Compare cities', context: evidence });
    assert.equal(result.response.status, 401);
    result = await request('/settings', 'POST', { provider: 'gemini', apiKey: 'AIza-test-12345678901234567890', model: '../bad' });
    assert.equal(result.response.status, 400);
    result = await request('/settings', 'POST', { provider: 'gemini', apiKey: 'short', model: 'gemini-3.8-flash' });
    assert.equal(result.response.status, 400);

    const settings = [
      ['openai', 'gpt-4.1-mini', 'sk-openai-12345678901234567890'],
      ['gemini', 'gemini-3.8-flash', 'AIza-test-12345678901234567890'],
      ['claude', 'claude-sonnet-5', 'sk-ant-test-12345678901234567890'],
      ['deepseek', 'my-deepseek-model-2026', 'sk-deepseek-12345678901234567890'],
    ];
    for (const [provider, model, apiKey] of settings) {
      result = await request('/settings', 'POST', { provider, model, apiKey });
      assert.equal(result.response.status, 200, provider + ' key should save after test');
      assert.equal(result.data.provider, provider);
      assert.equal(result.data.model, model);
      assert.equal(result.data.saved.length, settings.findIndex(item => item[0] === provider) + 1);
      assert.equal(JSON.stringify(result.data).includes(apiKey), false);
      assert.match(result.response.headers.get('set-cookie'), /HttpOnly/);
      assert.match(result.response.headers.get('set-cookie'), /SameSite=Strict/);
      const testCall = calls.at(-1);
      assert.equal(testCall.provider, provider);
      assert.equal(testCall.prompt, 'Reply with OK.');
      if (provider === 'openai') assert.equal(testCall.payload.model, model);
      if (provider === 'gemini') assert.match(testCall.url, /gemini-3\.8-flash:generateContent$/);
      if (provider === 'claude') assert.equal(testCall.headers['anthropic-version'], '2023-06-01');
      if (provider === 'deepseek') assert.equal(testCall.payload.model, model);

      result = await request('/analyze', 'POST', { question: 'Where should the team hire?', context: evidence });
      assert.equal(result.response.status, 200);
      assert.equal(result.data.provider, provider);
      assert.equal(result.data.analysis.title, provider + ' question-specific brief');
      assert.deepEqual(result.data.analysis.findings[0].citations, [1]);
      const analysisCall = calls.at(-1);
      if (provider === 'openai') {
        assert.equal(analysisCall.payload.text.format.type, 'json_schema');
        assert.equal(analysisCall.payload.store, false);
      }
      if (provider === 'gemini') assert.equal(analysisCall.payload.generationConfig.responseMimeType, 'application/json');
      if (provider === 'claude') assert.equal(analysisCall.payload.output_config.format.type, 'json_schema');
      if (provider === 'deepseek') assert.equal(analysisCall.payload.response_format.type, 'json_object');
    }

    result = await request('/web-settings', 'POST', { apiKey: 'serper-test-12345678901234567890' });
    assert.equal(result.response.status, 200);
    for (const [provider, model] of settings) {
      await request('/settings', 'POST', { provider, model, apiKey: '' });
      const reportEvents = await requestEvents('Compare Hyderabad and Delhi for a 25-person data GCC');
      assert.ok(reportEvents.some(item => item.stage === 'answer'), provider + ' should return a rich report');
      assert.ok(calls.at(-1).prompt.includes('Page text about the active Hyderabad'));
      assert.equal(calls.at(-1).provider, provider);
      if (provider === 'gemini') assert.equal(calls.at(-1).payload.generationConfig.responseJsonSchema.properties.comparison.anyOf[0].type, 'object');
      if (provider === 'deepseek') assert.match(calls.at(-1).payload.messages[0].content, /Output JSON schema/);
    }

    result = await request('/web-settings', 'POST', { apiKey: 'serper-test-12345678901234567890' });
    assert.equal(result.response.status, 200);
    assert.equal(result.data.searchConfigured, true);
    assert.equal(JSON.stringify(result.data).includes('serper-test'), false);
    events = await requestEvents('Microsoft GCC Hyderabad');
    assert.equal(events[0].stage, 'local');
    assert.ok(events.some(item => item.stage === 'reading'));
    assert.ok(events.some(item => item.stage === 'answer'));
    assert.equal(events[0].results.some(item => item.title === 'Microsoft'), true);
    assert.equal(events.find(item => item.stage === 'web').results.length, 1);
    assert.equal(events.find(item => item.stage === 'web').results[0].number, events[0].results.length + 1);
    assert.deepEqual(events.find(item => item.stage === 'answer').analysis.summaryCitations, [1, 2]);
    const researchCall = calls.at(-1);
    const researchContext = JSON.parse(researchCall.prompt);
    assert.equal(researchContext.question, 'Microsoft GCC Hyderabad');
    assert.equal(researchContext.evidence[0].type, 'local');
    assert.equal(researchContext.evidence.at(-1).type, 'web');
    assert.equal(researchContext.evidence.at(-1).url, 'https://example.org/report');
    failSearch = true;
    events = await requestEvents('Microsoft GCC Hyderabad');
    assert.ok(events.some(item => item.stage === 'web-error' && /quota or rate limit/.test(item.error)));
    assert.ok(events.some(item => item.stage === 'answer'));
    failSearch = false;
    result = await request('/settings', 'POST', { provider: 'gemini', model: 'gemini-3.7-flash', apiKey: '' });
    assert.equal(result.response.status, 200);
    assert.equal(result.data.provider, 'gemini');
    assert.equal(result.data.model, 'gemini-3.7-flash');
    assert.equal(result.data.saved.length, 4);
    result = await request('/test', 'POST', { provider: 'claude' });
    assert.equal(result.data.provider, 'claude');
    result = await request('/status');
    assert.equal(result.data.provider, 'gemini');

    result = await request('/settings', 'POST', { provider: 'claude', model: 'claude-sonnet-5', apiKey: 'bad-key-12345678901234567890' });
    assert.equal(result.response.status, 401);
    result = await request('/status');
    assert.equal(result.data.provider, 'gemini');
    assert.equal(result.data.saved.length, 4);

    result = await request('/settings', 'DELETE', { provider: 'claude' });
    assert.equal(result.data.saved.length, 3);
    result = await request('/settings', 'DELETE', { provider: 'gemini' });
    assert.equal(result.data.provider, 'openai');
    await request('/settings', 'DELETE', { provider: 'openai' });
    result = await request('/settings', 'DELETE', { provider: 'deepseek' });
    assert.equal(result.data.configured, false);
    result = await request('/status');
    assert.equal(result.data.saved.length, 0);
    assert.equal(result.data.searchConfigured, true);
    events = await requestEvents('Telangana policy incentives');
    assert.equal(events[0].stage, 'local');
    assert.ok(events.some(item => item.stage === 'analysis-unavailable'));
    assert.equal(events.at(-1).stage, 'done');
    result = await request('/web-settings', 'DELETE');
    assert.equal(result.data.searchConfigured, false);
    result = await request('/status', 'GET', undefined, { Origin: 'https://other.example' });
    assert.equal(result.response.status, 403);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});