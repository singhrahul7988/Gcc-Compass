import test from 'node:test';
import assert from 'node:assert/strict';
import { conductResearch } from './research-engine.mjs';
import { report, question } from '../scripts/fixtures/ai-research-report.mjs';
import { searchLocal, identifyCities } from './local-search.mjs';

test('comparison retrieval resolves aliases and prioritizes both city records', () => {
  const result = searchLocal(question);
  assert.deepEqual(result.entities, ['Hyderabad', 'Delhi NCR']);
  assert.deepEqual(new Set(result.results.filter(item => item.kind === 'city').map(item => item.title)), new Set(['Hyderabad', 'Delhi NCR']));
  assert.equal(result.results.some(item => item.kind === 'company'), false);
  assert.deepEqual(identifyCities('Bangalore versus Gurgaon'), ['Bengaluru', 'Delhi NCR']);
});

test('deep research reads pages, fills evidence gaps and repairs incomplete reports', async () => {
  const events = [], searches = [], reads = [], modelCalls = [];
  let attempt = 0;
  const controller = new AbortController();
  await conductResearch({
    question, signal: controller.signal, emit: event => events.push(event),
    search: async query => {
      searches.push(query);
      return [{ type: 'web', kind: 'google-result', title: query, detail: 'Search preview only', url: 'https://' + (query.includes('policy') ? 'policy' : query.includes('salary') ? 'salary' : 'office') + '.example.org/report', facts: {} }];
    },
    pageReader: async (url, _query, { signal }) => {
      signal.throwIfAborted(); reads.push(url);
      if (url.includes('office')) throw new Error('The publisher restricted access.');
      return { title: 'Detailed publisher report', content: 'FULL PAGE CONTENT with role and policy details not in the snippet.', format: 'article', publishedAt: '2026-01-01', retrievedAt: new Date().toISOString() };
    },
    model: async (prompt, task) => {
      modelCalls.push(JSON.parse(prompt));
      if ('interpretation' in task.schema.properties) return JSON.stringify({ interpretation: '25 people, Delhi NCR', queries: ['Hyderabad Delhi salary', 'Hyderabad Delhi office'] });
      if ('sufficient' in task.schema.properties) {
        assert.match(prompt, /FULL PAGE CONTENT/);
        return JSON.stringify({ sufficient: false, queries: ['Telangana UP policy'] });
      }
      attempt++;
      if (attempt === 1) return JSON.stringify({ ...report, findings: [], comparison: null, sections: [] });
      assert.match(prompt, /previous report failed validation/);
      assert.match(prompt, /FULL PAGE CONTENT/);
      return JSON.stringify({ ...report, summaryCitations: [1, 2, 999] });
    },
  });
  assert.equal(searches.length, 3);
  assert.equal(reads.length, 3);
  assert.equal(events[0].stage, 'local');
  assert.ok(events.some(event => event.stage === 'searching-more'));
  const answer = events.find(event => event.stage === 'answer');
  assert.ok(answer.analysis.comparison.rows.length >= 4);
  assert.deepEqual(answer.analysis.summaryCitations, [1, 2]);
  assert.equal(answer.metrics.pagesRead, 2);
  assert.equal(answer.metrics.previews, 1);
  assert.equal(events.at(-1).stage, 'done');
  assert.ok(events.filter(event => event.stage === 'web').every(event => event.results.every(item => !('content' in item))));
});

test('unrepairable reports produce a visible error, never an empty findings report', async () => {
  const events = [];
  await conductResearch({ question: 'What are setup risks?', emit: event => events.push(event), search: null, model: async () => JSON.stringify({ ...report, findings: [], sections: [] }) });
  assert.equal(events.some(event => event.stage === 'answer'), false);
  assert.match(events.find(event => event.stage === 'analysis-error').error, /substantive analysis/);
});

test('cancelled research stops before further paid requests', async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(conductResearch({ question, signal: controller.signal, emit: event => { if (event.stage === 'local') controller.abort(); }, search: async () => { calls++; return []; }, model: null }), /abort/i);
  assert.equal(calls, 0);
});

test('a selective repair receives the failed report and does not overwrite valid narrative', async () => {
  const events = [], diagnostics = [];
  let calls = 0;
  await conductResearch({
    question, emit: event => events.push(event), diagnostic: event => diagnostics.push(event), search: null,
    model: async (prompt, task) => {
      calls++;
      if (calls === 1) return JSON.stringify({ ...report, comparison: null, findings: [] });
      const input = JSON.parse(prompt);
      assert.equal(input.previousReport.summary, report.summary);
      assert.deepEqual(Object.keys(task.schema.properties), ['comparison']);
      assert.equal(input.problems[0].field, 'comparison');
      return JSON.stringify({ comparison: report.comparison, summary: 'Do not replace the valid summary' });
    },
  });
  const answer = events.find(event => event.stage === 'answer');
  assert.equal(answer.analysis.summary, report.summary);
  assert.equal(answer.analysis.comparison.rows.length, 6);
  assert.equal(events.some(event => event.stage === 'repairing'), true);
  assert.deepEqual(diagnostics[0].fields, ['comparison']);
  assert.equal(JSON.stringify(diagnostics).includes(question), false);
});

test('URLs outside the first reading budget remain eligible for follow-up research', async () => {
  const events = [], read = [];
  const all = Array.from({ length: 12 }, (_, i) => ({ type: 'web', title: 'Salary office report ' + i, detail: 'Hyderabad Delhi research', url: 'https://publisher' + i + '.org/report', facts: {} }));
  await conductResearch({
    question, emit: event => events.push(event),
    search: async () => all,
    pageReader: async url => { read.push(url); return { content: 'Verified article text for the stated team.' }; },
    model: async (_prompt, task) => JSON.stringify('interpretation' in task.schema.properties ? { interpretation: '', queries: ['salary survey', 'office survey'] } : 'sufficient' in task.schema.properties ? { sufficient: false, queries: ['policy research'] } : report),
  });
  assert.equal(read.length, 12);
  assert.equal(new Set(read).size, 12);
});

test('failed gap review still replaces blocked pages and malformed reads stay previews', async () => {
  const events = [];
  let searches = 0;
  await conductResearch({
    question, emit: event => events.push(event),
    search: async () => [{ type: 'web', title: 'Publisher report', detail: 'Research', url: 'https://publisher' + (++searches) + '.org/report', facts: {} }],
    pageReader: async () => ({ content: undefined }),
    model: async (_prompt, task) => {
      if ('interpretation' in task.schema.properties) return JSON.stringify({ interpretation: '', queries: ['salary', 'office'] });
      if ('sufficient' in task.schema.properties) throw new Error('Gap model unavailable');
      return JSON.stringify(report);
    },
  });
  assert.equal(searches, 3);
  const answer = events.find(event => event.stage === 'answer');
  assert.equal(answer.metrics.pagesRead, 0);
  assert.equal(answer.metrics.previews, 3);
  assert.ok(events.some(event => event.stage === 'web-error'));
});

test('a provider output cutoff gets a bounded retry with a larger output allowance', async () => {
  const events = [];
  let calls = 0;
  await conductResearch({
    question, search: null, emit: event => events.push(event),
    model: async (prompt, task) => {
      if (++calls === 1) throw Object.assign(new Error('Gemini stopped before completion.'), { code: 'OUTPUT_TRUNCATED', responseText: '{"title":', finishReason: 'MAX_TOKENS' });
      assert.equal(task.tokens, 12000);
      assert.match(prompt, /previousResponse/);
      return JSON.stringify(report);
    },
  });
  assert.equal(calls, 2);
  assert.ok(events.some(event => event.stage === 'answer'));
});

test('quota failures do not trigger another model request', async () => {
  const events = [];
  let calls = 0;
  await conductResearch({ question, search: null, emit: event => events.push(event), model: async () => { calls++; throw { status: 429, message: 'Gemini quota reached.' }; } });
  assert.equal(calls, 1);
  assert.match(events.find(event => event.stage === 'analysis-error').error, /quota/);
});
