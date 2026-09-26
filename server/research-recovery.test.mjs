import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createAiApiMiddleware } from './ai-api.mjs';
import { report, question } from '../scripts/fixtures/ai-research-report.mjs';

test('Gemini 3.1 Flash Lite and Serper recover the reported query through the real HTTP pipeline', async t => {
  let mode = 'repair', reports = 0;
  const diagnostics = [];
  const respond = (text, finishReason = 'STOP') => new Response(JSON.stringify({
    candidates: [{ finishReason, content: { parts: [{ thought: true, text: 'Internal thought text excluded from parsing.' }, { text }] } }],
  }), { headers: { 'Content-Type': 'application/json' } });
  const middleware = createAiApiMiddleware({
    diagnostic: item => diagnostics.push(item),
    pageReader: async () => ({ title: 'Read research article', content: 'Public research passages about Hyderabad and Delhi NCR talent and office markets. '.repeat(4), format: 'article' }),
    fetchImpl: async (url, options) => {
      const payload = JSON.parse(options.body);
      if (url.includes('serper.dev')) return new Response(JSON.stringify({ organic: Array.from({ length: 6 }, (_, i) => ({
        title: payload.q + ' market report', link: 'https://publisher' + i + '.org/' + encodeURIComponent(payload.q), snippet: 'Research about Hyderabad and Delhi NCR.',
      })) }), { headers: { 'Content-Type': 'application/json' } });
      assert.match(url, /gemini-3\.1-flash-lite:generateContent$/);
      const prompt = payload.contents[0].parts[0].text;
      const instructions = payload.systemInstruction?.parts[0].text || '';
      if (prompt === 'Reply with OK.') return respond('OK');
      if (instructions.includes('Plan web research')) return respond(JSON.stringify({ interpretation: '25-person data team; Delhi means NCR', queries: ['Hyderabad Delhi talent', 'Hyderabad Delhi office'] }));
      if (instructions.includes('Review evidence coverage')) return respond(JSON.stringify({ sufficient: true, queries: [] }));
      reports++;
      const schema = payload.generationConfig.responseJsonSchema;
      if (mode === 'repair') {
        if (reports === 1) return respond(JSON.stringify({ ...report, comparison: null, sections: [], findings: [] }));
        assert.deepEqual(Object.keys(schema.properties), ['sections', 'comparison']);
        const input = JSON.parse(prompt);
        assert.equal(input.previousReport.summary, report.summary);
        assert.ok(input.research.evidence.some(item => item.content?.includes('Public research passages')));
        return respond(JSON.stringify({ comparison: report.comparison, sections: report.sections }));
      }
      if (mode === 'cutoff' && reports === 1) return respond('{"title":', 'MAX_TOKENS');
      if (mode === 'cutoff') assert.equal(payload.generationConfig.maxOutputTokens, 12000);
      return respond(JSON.stringify({ ...report, findings: [], next: '', caveat: '' }));
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
  const request = async (path, body) => {
    const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
    const savedCookie = response.headers.get('set-cookie');
    if (savedCookie) cookie = savedCookie.split(';')[0];
    assert.equal(response.status, 200);
    return response;
  };
  await request('/settings', { provider: 'gemini', model: 'gemini-3.1-flash-lite', apiKey: 'fixture-gemini-secret-1234567890' });
  await request('/web-settings', { apiKey: 'fixture-serper-secret-1234567890' });
  for (mode of ['repair', 'cutoff', 'optional']) {
    reports = 0;
    const response = await request('/research', { question });
    const events = (await response.text()).trim().split('\n').map(line => JSON.parse(line));
    const answer = events.find(event => event.stage === 'answer');
    assert.ok(answer, mode);
    assert.equal(answer.incomplete, undefined);
    assert.equal(answer.analysis.comparison.rows.length, 6);
    assert.equal(answer.analysis.sections.length, 3);
    assert.equal(events.some(event => event.stage === 'analysis-error'), false);
    assert.equal(events.at(-1).stage, 'done');
    assert.equal(events[0].results.length + events.filter(event => event.stage === 'web').at(-1).results.length, 12);
    assert.equal(reports, mode === 'optional' ? 1 : 2);
  }
  const safeLog = JSON.stringify(diagnostics);
  assert.match(safeLog, /INCOMPLETE_REPORT/);
  assert.match(safeLog, /OUTPUT_TRUNCATED/);
  assert.doesNotMatch(safeLog, /fixture-gemini-secret|fixture-serper-secret|Compare hyderabad/);
});
