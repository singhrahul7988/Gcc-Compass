import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAiApiMiddleware } from './ai-api.mjs';

test('AI key lifecycle and grounded response protocol', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    calls.push({ url, authorization: options.headers.Authorization, payload });
    const text = payload.input === 'Reply with OK.' ? 'OK' : JSON.stringify({
      title: 'A question-specific AI brief',
      summary: 'Bengaluru has the deeper specialist pool in the supplied record.',
      findings: [{ text: 'The city record supports the talent finding.', citations: [1, 99] }],
      next: 'Validate the role mix.',
      caveat: 'This is directional.',
    });
    return new Response(JSON.stringify({ output: [{ type: 'message', content: [{ type: 'output_text', text }] }] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  };
  const middleware = createAiApiMiddleware({ fetchImpl: fakeFetch });
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
  try {
    let result = await request('/status');
    assert.equal(result.data.configured, false);
    result = await request('/analyze', 'POST', { question: 'Compare cities', context: { evidence: [] } });
    assert.equal(result.response.status, 401);

    result = await request('/settings', 'POST', { apiKey: 'sk-test-12345678901234567890', model: 'gpt-4o-mini' });
    assert.equal(result.response.status, 200);
    assert.equal(result.data.configured, true);
    assert.equal(JSON.stringify(result.data).includes('sk-test'), false);
    assert.match(result.response.headers.get('set-cookie'), /HttpOnly/);
    assert.match(result.response.headers.get('set-cookie'), /SameSite=Strict/);

    result = await request('/status');
    assert.equal(result.data.model, 'gpt-4o-mini');
    result = await request('/test', 'POST');
    assert.equal(result.data.ok, true);

    result = await request('/analyze', 'POST', {
      question: 'Where should the team hire?',
      context: { evidence: [{ number: 1, title: 'Bengaluru', facts: { talent_strengths: 'Deep engineering pool' } }] },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.data.analysis.title, 'A question-specific AI brief');
    assert.deepEqual(result.data.analysis.findings[0].citations, [1]);
    assert.equal(calls[1].url, 'https://api.openai.com/v1/responses');
    assert.equal(calls[1].payload.text.format.type, 'json_schema');
    assert.equal(calls[1].payload.store, false);
    assert.equal(calls[1].authorization, 'Bearer sk-test-12345678901234567890');

    result = await request('/settings', 'DELETE');
    assert.equal(result.data.configured, false);
    result = await request('/status');
    assert.equal(result.data.configured, false);
    result = await request('/settings', 'POST', { apiKey: 'short', model: 'gpt-4o-mini' });
    assert.equal(result.response.status, 400);
    result = await request('/status', 'GET', undefined, { Origin: 'https://other.example' });
    assert.equal(result.response.status, 403);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

