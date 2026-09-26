import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAiApiMiddleware } from './ai-api.mjs';
import { report, question } from '../scripts/fixtures/ai-research-report.mjs';

const article = 'Verified public research passages about Hyderabad and Delhi NCR talent, salaries, office markets and retention. '.repeat(5);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('all research APIs save independently, survive concurrent updates, and supply the complete Gemini research flow', async t => {
  const calls = [], diagnostics = [];
  let rejectTavily = false;
  const middleware = createAiApiMiddleware({
    validateSource: async () => {},
    diagnostic: item => diagnostics.push(item),
    pageReader: async () => { throw new Error('External readers should supply article text.'); },
    fetchImpl: async (url, options) => {
      const body = options.body ? JSON.parse(options.body) : {};
      calls.push({ url, body, headers: options.headers });
      if (url.includes('api.tavily.com')) {
        if (rejectTavily) return json({ error: 'DO NOT EXPOSE fixture-tavily-secret' }, 401);
        // Ensure saves finish in a different order and cannot overwrite another service.
        await new Promise(resolve => setTimeout(resolve, 15));
        return json({ results: [{ url: 'https://example.org/talent', title: 'Hyderabad Delhi talent study', content: 'Search preview', raw_content: article }] });
      }
      if (url.includes('api.exa.ai')) return json({ results: [
        { url: 'https://example.org/talent?utm_source=exa', title: 'Same talent study', text: article },
        { url: 'https://example.net/office', title: 'Hyderabad Delhi office study', text: article },
      ] });
      if (url.includes('api.firecrawl.dev')) {
        if (url.endsWith('/team/credit-usage')) return json({ success: true, data: { remainingCredits: 1000 } });
        return json({ success: true, data: { markdown: article, metadata: { sourceURL: body.url, title: 'Live research report', statusCode: 200 } } });
      }
      if (url.includes('serper.dev')) return json({ organic: [{ link: 'https://example.com/retention', title: 'Retention study', snippet: 'Search preview' }] });
      assert.match(url, /gemini-3\.1-flash-lite:generateContent$/);
      const prompt = body.contents[0].parts[0].text;
      const instructions = body.systemInstruction?.parts[0]?.text || '';
      let text;
      if (prompt === 'Reply with OK.') text = 'OK';
      else if (instructions.includes('Plan web research')) text = JSON.stringify({ interpretation: '25-person data team', queries: ['Hyderabad Delhi talent', 'Hyderabad Delhi office', 'Hyderabad Delhi retention'] });
      else if (instructions.includes('Review evidence coverage')) text = JSON.stringify({ sufficient: true, queries: [] });
      else {
        const input = JSON.parse(prompt);
        const evidence = input.evidence;
        assert.ok(evidence.some(source => source.status === 'read' && source.content.includes('Verified public research')));
        assert.ok(evidence.some(source => source.type === 'local'));
        text = JSON.stringify(report);
      }
      return json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }] });
    },
  });
  const server = createServer((req, res) => {
    req.url = req.url.slice('/api/ai'.length) || '/';
    middleware(req, res, () => { res.statusCode = 404; res.end(); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = 'http://127.0.0.1:' + server.address().port + '/api/ai';
  let cookie;
  const request = async (path, method = 'GET', body) => {
    const response = await fetch(base + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { response, data: await response.json() };
  };
  let result = await request('/status');
  assert.equal(result.data.revision, 0);
  assert.match(result.response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  const providers = ['tavily', 'exa', 'firecrawl', 'serper'];
  await Promise.all([
    ...providers.map(provider => request('/research-settings', 'POST', { provider, apiKey: 'fixture-' + provider + '-secret-1234567890' })),
    request('/settings', 'POST', { provider: 'gemini', model: 'gemini-3.1-flash-lite', apiKey: 'fixture-gemini-secret-1234567890' }),
  ]);
  result = await request('/status');
  assert.deepEqual(result.data.researchProviders, providers);
  assert.equal(result.data.provider, 'gemini');
  assert.equal(result.data.revision, 5);
  assert.doesNotMatch(JSON.stringify(result.data), /secret|apiKey/);
  for (const provider of providers) assert.equal((await request('/research-test', 'POST', { provider })).data.ok, true);
  result = await request('/research-settings', 'POST', { provider: 'arbitrary-url', apiKey: 'fixture-invalid-secret' });
  assert.equal(result.response.status, 400);
  assert.equal((await request('/test', 'POST', { provider: '__proto__' })).response.status, 400);
  rejectTavily = true;
  result = await request('/research-settings', 'POST', { provider: 'tavily', apiKey: 'fixture-bad-replacement' });
  assert.equal(result.response.status, 401);
  assert.doesNotMatch(JSON.stringify(result.data), /DO NOT EXPOSE|secret/);
  assert.equal((await request('/status')).data.revision, 5);
  rejectTavily = false;
  const start = calls.length;
  const stream = await fetch(base + '/research', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ question }) });
  const events = (await stream.text()).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(events[0].stage, 'local');
  const answer = events.find(event => event.stage === 'answer');
  assert.ok(answer);
  assert.equal(answer.incomplete, undefined);
  assert.equal(answer.analysis.comparison.rows.length, 6);
  assert.equal(answer.analysis.sections.length, 3);
  const web = events.filter(event => event.stage === 'web').at(-1).results;
  assert.equal(web.length, 2);
  assert.equal(web.every(source => source.status === 'read' && source.extractor === 'firecrawl'), true);
  assert.deepEqual(web.find(source => source.url.includes('talent')).sourceIds, ['Tavily', 'Exa']);
  const researchCalls = calls.slice(start);
  assert.equal(researchCalls.filter(call => call.url.includes('tavily')).length, 3);
  assert.equal(researchCalls.filter(call => call.url.includes('exa')).length, 2);
  assert.equal(researchCalls.filter(call => call.url.endsWith('/scrape')).length, 2);
  assert.equal(answer.metrics.pagesRead, 2);
  assert.equal(answer.metrics.retrieval.firecrawl.pages, 2);
  assert.doesNotMatch(JSON.stringify(events) + JSON.stringify(diagnostics), /fixture-.*-secret|raw_content|x-api-key/);
  for (const provider of providers) {
    result = await request('/research-settings', 'DELETE', { provider });
    assert.equal(result.data.researchProviders.includes(provider), false);
    assert.equal(result.data.configured, true);
  }
  assert.equal(result.data.searchConfigured, false);
  result = await request('/settings', 'DELETE', { provider: 'gemini' });
  assert.equal(result.data.configured, false);
  assert.equal(result.data.revision, 10);
});
