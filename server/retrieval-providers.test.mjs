import test from 'node:test';
import assert from 'node:assert/strict';
import { createResearchRetrieval, normalizeSources, researchRequest, sourceUrl, testResearchKey } from './retrieval-providers.mjs';

const text = 'Hyderabad and Delhi NCR have distinct talent markets. The published market report explains hiring, office costs and operational risks for data teams. '.repeat(4);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const keys = { tavily: 'fixture-tavily-key', exa: 'fixture-exa-key', firecrawl: 'fixture-firecrawl-key', serper: 'fixture-serper-key' };
const validate = async () => {};

test('discovery normalizes full text, dates, unsafe URLs and duplicates without leaking provider payloads', () => {
  const tavily = normalizeSources('tavily', { results: [
    { url: 'https://example.org/report?utm_source=ad#top', title: 'Report', content: 'Search preview', raw_content: text, apiKey: 'secret' },
    { url: 'https://example.org/report', title: 'Duplicate', raw_content: text + text },
    { url: 'http://127.0.0.1/admin', title: 'Private' },
    { url: 'javascript:alert(1)', title: 'Unsafe' },
  ] });
  assert.equal(tavily.length, 1);
  assert.equal(tavily[0].content.length, (text + text).trim().length);
  assert.doesNotMatch(JSON.stringify(tavily), /apiKey|secret|utm_source/);
  assert.equal(normalizeSources('exa', { results: [{ url: 'https://example.org/r', text, publishedDate: '2026-09-01' }] })[0].publishedAt, '2026-09-01');
  assert.equal(normalizeSources('firecrawl', { data: { web: [{ url: 'https://example.org/r', description: 'Preview' }] } })[0].content, '');
  for (const url of ['http://10.0.0.1', 'http://localhost', 'http://[::1]', 'http://metadata.internal', 'https://user:password@example.org', 'https://example.org:8080']) assert.equal(sourceUrl(url), null);
});

test('Tavily and Exa find sources and Firecrawl renders two ranked pages with correct API contracts', async () => {
  const calls = [];
  const service = createResearchRetrieval({ keys, validate, localReader: async () => { throw new Error('Direct reader should not be needed.'); }, fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body, headers: options.headers });
    if (url === 'https://api.tavily.com/search') {
      assert.equal(body.include_raw_content, 'markdown');
      assert.equal(body.search_depth, 'advanced');
      assert.equal(options.headers.Authorization, 'Bearer ' + keys.tavily);
      return json({ results: [{ url: 'https://example.org/talent', title: 'Talent', content: 'Preview', raw_content: text }] });
    }
    if (url === 'https://api.exa.ai/search') {
      assert.equal(options.headers['x-api-key'], keys.exa);
      assert.equal(body.contents.text.maxCharacters, 16000);
      return json({ results: [{ url: 'https://example.net/offices', title: 'Offices', text }] });
    }
    assert.equal(url, 'https://api.firecrawl.dev/v2/scrape');
    assert.equal(options.headers.Authorization, 'Bearer ' + keys.firecrawl);
    assert.deepEqual(body.formats, ['markdown']);
    assert.equal(body.onlyMainContent, true);
    return json({ success: true, data: { markdown: text, metadata: { title: 'Rendered report', sourceURL: body.url, statusCode: 200 } } });
  } });
  const found = await service.search('Hyderabad Delhi data team', undefined, { index: 0 });
  assert.equal(found.length, 2);
  const pages = await Promise.all(found.map((source, index) => service.pageReader(source.url, 'data team', { source, index })));
  assert.equal(pages.every(page => page.extractor === 'firecrawl'), true);
  assert.deepEqual(service.metrics(), { tavily: { searches: 1, pages: 0, failures: 0 }, exa: { searches: 1, pages: 0, failures: 0 }, firecrawl: { searches: 0, pages: 2, failures: 0 } });
  await service.search('additional query', undefined, { index: 3 });
  assert.equal(calls.filter(call => call.url.includes('exa.ai/search')).length, 1);
});

test('quota failure disables a service for the run and discovery falls back to remaining keys', async () => {
  const calls = [], diagnostics = [];
  const service = createResearchRetrieval({ keys, validate, diagnostic: item => diagnostics.push(item), fetchImpl: async (url, options) => {
    calls.push(url);
    if (url.includes('tavily')) return json({ error: keys.tavily }, 432);
    if (url.includes('exa')) return json({ results: [] });
    assert.equal(url, 'https://google.serper.dev/search');
    assert.equal(options.headers['X-API-KEY'], keys.serper);
    return json({ organic: [{ link: 'https://example.org/fallback', title: 'Fallback' }] });
  } });
  assert.equal((await service.search('query')).length, 1);
  assert.equal((await service.search('query 2')).length, 1);
  assert.equal(calls.filter(url => url.includes('tavily')).length, 1);
  assert.equal(diagnostics[0].code, 'QUOTA');
  assert.doesNotMatch(JSON.stringify(diagnostics), /fixture-tavily-key/);
});

test('Firecrawl-only configuration provides discovery without an additional search key', async () => {
  const service = createResearchRetrieval({ keys: { firecrawl: keys.firecrawl }, validate, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.firecrawl.dev/v2/search');
    assert.equal(JSON.parse(options.body).country, 'IN');
    return json({ success: true, data: { web: [{ url: 'https://example.org/report', title: 'Research' }] } });
  } });
  assert.equal((await service.search('question')).length, 1);
});

test('a failed renderer uses indexed full text, and extraction fallbacks never mistake snippets for page text', async () => {
  let calls = [];
  const seedReader = createResearchRetrieval({ keys: { firecrawl: keys.firecrawl }, validate, localReader: async () => { throw new Error('Not needed'); }, fetchImpl: async url => { calls.push(url); return json({}, 429); } });
  const seeded = await seedReader.pageReader('https://example.org/r', 'talent', { source: { content: text, provider: 'tavily', url: 'https://example.org/r' } });
  assert.equal(seeded.extractor, 'tavily');
  assert.equal(calls.length, 1);
  calls = [];
  const fallback = createResearchRetrieval({ keys: { tavily: keys.tavily, exa: keys.exa }, validate, localReader: async () => ({ content: 'tiny preview' }), fetchImpl: async (url, options) => {
    calls.push(url);
    const body = JSON.parse(options.body);
    if (url.includes('tavily')) {
      assert.equal(body.query, undefined);
      assert.deepEqual(body.urls, ['https://example.org/r']);
      // A different URL must not be misattributed to the requested source.
      return json({ results: [{ url: 'https://other.org/another', raw_content: text }] });
    }
    assert.deepEqual(body.ids, ['https://example.org/r']);
    return json({ results: [{ url: 'https://example.org/r', title: 'Actual source', text }] });
  } });
  const page = await fallback.pageReader('https://example.org/r', 'talent');
  assert.equal(page.extractor, 'exa');
  assert.equal(page.title, 'Actual source');
  assert.equal(calls.length, 2);
});

test('remote extractors do not receive private DNS targets and an aborted request makes no further API calls', async () => {
  let calls = 0;
  const service = createResearchRetrieval({ keys: { firecrawl: keys.firecrawl, tavily: keys.tavily }, validate: async () => { throw new Error('Private DNS address'); }, localReader: async () => { throw new Error('Private DNS address'); }, fetchImpl: async () => { calls++; return json({}); } });
  await assert.rejects(service.pageReader('https://public-looking.example.org', 'question'), /Private DNS/);
  assert.equal(calls, 0);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(service.search('question', controller.signal), { name: 'AbortError' });
  await assert.rejects(service.pageReader('https://example.org/r', 'question', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls, 0);
});

test('rendering concurrency stays at two and page budgets prevent uncontrolled credit use', async () => {
  let active = 0, peak = 0, calls = 0;
  const service = createResearchRetrieval({ keys: { firecrawl: keys.firecrawl }, validate, localReader: async () => { throw new Error('Blocked'); }, fetchImpl: async (url, options) => {
    active++; peak = Math.max(peak, active); calls++;
    await new Promise(resolve => setTimeout(resolve, 10));
    active--;
    return json({ success: true, data: { markdown: text, metadata: { sourceURL: JSON.parse(options.body).url } } });
  } });
  const pages = await Promise.allSettled(Array.from({ length: 8 }, (_, index) => service.pageReader('https://example.org/' + index, 'talent', { index })));
  assert.equal(peak, 2);
  assert.equal(calls, 6);
  assert.equal(pages.filter(page => page.status === 'fulfilled').length, 6);
});

test('authentication tests use minimal searches and Firecrawl account validation without scraping', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('firecrawl')) return json({ success: true, data: { remainingCredits: 1000 } });
    return json({ results: [], organic: [] });
  };
  for (const provider of ['tavily', 'exa', 'firecrawl', 'serper']) await testResearchKey(fetchImpl, provider, keys[provider]);
  assert.equal(calls[2].url, 'https://api.firecrawl.dev/v2/team/credit-usage');
  assert.equal(calls[2].options.method, 'GET');
  assert.equal(JSON.parse(calls[0].options.body).max_results, 1);
  assert.equal(JSON.parse(calls[1].options.body).numResults, 1);
  await assert.rejects(researchRequest(async () => json(null), 'exa', keys.exa, '/search', {}), /unreadable/);
  await assert.rejects(researchRequest(async () => new Response('not json'), 'exa', keys.exa, '/search', {}), /unreadable/);
  await assert.rejects(researchRequest(async () => json({ success: false }), 'firecrawl', keys.firecrawl, '/scrape', {}), /could not retrieve/);
});
