import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanResearch, parseJson } from './research-contract.mjs';
import { conductResearch } from './research-engine.mjs';
import { report, question } from '../scripts/fixtures/ai-research-report.mjs';

test('citation validation rejects a factual comparison with no source support', () => {
  const broken = structuredClone(report);
  broken.comparison.rows[0].cells[0].citations = [999];
  assert.throws(() => cleanResearch(broken, [{ number: 1 }, { number: 2 }], true), /unsupported factual cells/);
});

test('wrong-city comparisons never appear, while cited partial narrative survives failed repair', async () => {
  const events = [];
  let attempts = 0;
  await conductResearch({
    question, search: null, emit: event => events.push(event),
    model: async () => {
      attempts++;
      return JSON.stringify({ ...report, comparison: { ...report.comparison, columns: ['Hyderabad', 'Pune'] } });
    },
  });
  assert.equal(attempts, 2);
  const answer = events.find(event => event.stage === 'answer');
  assert.equal(answer.incomplete, true);
  assert.equal(answer.analysis.comparison, null);
  assert.equal(answer.analysis.recommendation, null);
  assert.match(answer.warning, /could not be completed/);
});

test('web research has a separate evidence budget from local records', async () => {
  const events = [];
  await conductResearch({
    question, emit: event => events.push(event), model: null,
    search: async query => Array.from({ length: 8 }, (_, i) => ({
      type: 'web', title: query + ' ' + i, detail: 'Decision-specific report',
      url: 'https://publisher' + i + '.org/' + encodeURIComponent(query), facts: {},
    })),
    pageReader: async () => ({ content: 'Research article text with decision-specific details.', format: 'article' }),
  });
  const sources = events.filter(event => event.stage === 'web').at(-1).results;
  assert.equal(sources.length, 10);
  assert.ok(sources.every(source => source.status === 'read'));
  assert.equal(new Set(sources.map(source => source.number)).size, 10);
});

test('substantive reports do not fail because of redundant findings or optional footnotes', () => {
  const value = cleanResearch({ ...report, findings: [], next: '', caveat: '' }, [{ number: 1 }, { number: 2 }], true);
  assert.equal(value.sections.length, 3);
  assert.equal(value.comparison.rows.length, 6);
  assert.equal(value.findings.length, 0);
});

test('normalization preserves citation support across fenced JSON, strings and numeric-string references', () => {
  const value = structuredClone(report);
  value.summaryCitations = ['1', '2', '999'];
  value.sections[0].paragraphs = ['Supported Hyderabad analysis [1] [999]'];
  value.sections[1].paragraphs = 'Supported NCR analysis [2]';
  const fence = String.fromCharCode(96).repeat(3);
  const normalized = cleanResearch(parseJson(' \n' + fence + 'json\n' + JSON.stringify(value) + '\n' + fence + '\n'), [{ number: 1 }, { number: 2 }], true);
  assert.deepEqual(normalized.summaryCitations, [1, 2]);
  assert.deepEqual(normalized.sections[0].paragraphs[0].citations, [1]);
  assert.doesNotMatch(normalized.sections[0].paragraphs[0].text, /\[/);
});

test('malformed table columns cannot shift cells onto a different city', () => {
  const value = structuredClone(report);
  value.comparison.columns = ['', 'Hyderabad', 'Delhi NCR'];
  assert.throws(() => cleanResearch(value, [{ number: 1 }, { number: 2 }], true), error => error.issues.some(issue => issue.field === 'comparison'));
});

test('a single targeted repair fixes omitted narrative and an incorrect comparison together', async () => {
  const events = [];
  let attempts = 0;
  await conductResearch({
    question, search: null, emit: event => events.push(event),
    model: async (prompt, task) => {
      attempts++;
      if (attempts === 1) return JSON.stringify({ ...report, sections: [], comparison: { ...report.comparison, columns: ['Hyderabad', 'Pune'] } });
      assert.deepEqual(Object.keys(task.schema.properties), ['sections', 'comparison']);
      return JSON.stringify({ sections: report.sections, comparison: report.comparison });
    },
  });
  const answer = events.find(event => event.stage === 'answer');
  assert.equal(attempts, 2);
  assert.equal(answer.incomplete, undefined);
  assert.deepEqual(answer.analysis.comparison.columns, ['Hyderabad', 'Delhi NCR']);
  assert.equal(answer.analysis.sections.length, 3);
});

test('two discovery URLs redirecting to one article become one cited source before report generation', async () => {
  const events = [];
  await conductResearch({
    question: 'Hyderabad setup costs', model: null, emit: event => events.push(event),
    search: async () => [
      { type: 'web', title: 'Office study', url: 'https://example.org/old', detail: 'Office study', facts: {} },
      { type: 'web', title: 'Salary study', url: 'https://example.net/link', detail: 'Salary study', facts: {} },
    ],
    pageReader: async () => ({ content: 'Research article about the Hyderabad office and hiring market.', finalUrl: 'https://example.com/final', format: 'article' }),
  });
  const sources = events.filter(event => event.stage === 'web').at(-1).results;
  assert.equal(sources.length, 1);
  assert.equal(sources[0].url, 'https://example.com/final');
  assert.equal(sources[0].status, 'read');
});

test('a recognised dimension header is removed only when the cell counts prove that layout', () => {
  const value = structuredClone(report);
  value.comparison.columns.unshift('Dimension');
  const normalized = cleanResearch(value, [{ number: 1 }, { number: 2 }], true);
  assert.deepEqual(normalized.comparison.columns, ['Hyderabad', 'Delhi NCR']);
  assert.equal(normalized.comparison.rows[0].cells.length, 2);
  const doubled = structuredClone(value);
  doubled.comparison.rows.forEach(row => row.cells.unshift({ text: row.factor, citations: [], status: 'unknown' }));
  const restored = cleanResearch(doubled, [{ number: 1 }, { number: 2 }], true);
  assert.deepEqual(restored.comparison, normalized.comparison);
  value.comparison.columns[0] = 'Pune';
  assert.throws(() => cleanResearch(value, [{ number: 1 }, { number: 2 }], true), /comparison needs/);
});

test('partial comparisons retain valid rows and replace only uncited factual cells', async () => {
  const { partialResearch } = await import('./research-contract.mjs');
  const value = structuredClone(report);
  value.comparison.rows = value.comparison.rows.slice(0, 2);
  value.comparison.rows[0].cells[0].citations = [999];
  assert.throws(() => cleanResearch(value, [{ number: 1 }, { number: 2 }], true));
  const partial = partialResearch(value, [{ number: 1 }, { number: 2 }], ['Hyderabad', 'Delhi NCR']);
  assert.equal(partial.comparison.rows.length, 2);
  assert.equal(partial.comparison.rows[0].cells[0].status, 'unknown');
  assert.equal(partial.comparison.rows[0].cells[0].text, 'Not established by the available evidence.');
  assert.equal(partial.comparison.rows[0].cells[1].text, report.comparison.rows[0].cells[1].text);
  assert.match(partial.comparisonNote, /Uncited/);
});

test('missing comparisons can use explicitly labelled cited findings without inventing metrics', async () => {
  const { partialResearch } = await import('./research-contract.mjs');
  const value = {
    ...report, comparison: null,
    sections: [
      { title: 'Talent fit', paragraphs: [], bullets: [
        { text: 'Hyderabad: Engineering and analytics are documented strengths.', citations: [1] },
        { text: 'Delhi NCR: Finance and business operations are documented strengths.', citations: [2] },
      ] },
      { title: 'Location risk', paragraphs: [], bullets: [
        { text: 'Hyderabad: Validate the office cluster and senior hiring plan.', citations: [1] },
        { text: 'Delhi NCR: Distinguish Gurugram from Noida before checking eligibility.', citations: [2] },
      ] },
    ],
  };
  const partial = partialResearch(value, [{ number: 1 }, { number: 2 }], ['Hyderabad', 'Delhi NCR']);
  assert.equal(partial.comparison.rows.length, 2);
  assert.equal(partial.comparison.rows[0].cells[0].text, 'Engineering and analytics are documented strengths.');
  assert.deepEqual(partial.comparison.rows[0].cells[1].citations, [2]);
  assert.match(partial.comparisonNote, /Compiled from/);
  assert.equal(partial.recommendation, null);
  value.sections[0].bullets[0].text = 'Hyderabad (Gachibowli; quoted office specification): An explicitly qualified source observation.';
  const qualified = partialResearch(value, [{ number: 1 }, { number: 2 }], ['Hyderabad', 'Delhi NCR']);
  assert.match(qualified.comparison.rows[0].cells[0].text, /Gachibowli; quoted office specification/);
  // A Noida-specific finding cannot become a claim about all of NCR.
  value.sections[0].bullets[1].text = 'Noida: Cost signal for this micro-market only.';
  value.sections[1].bullets[1].citations = [];
  assert.equal(partialResearch(value, [{ number: 1 }, { number: 2 }], ['Hyderabad', 'Delhi NCR']).comparison, null);
});
