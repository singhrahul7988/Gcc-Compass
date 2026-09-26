import { isIP } from 'node:net';
import { readWebPage, selectPassages, validateRemoteUrl, isPublicAddress } from './web-reader.mjs';

export const RESEARCH_PROVIDERS = ['tavily', 'exa', 'firecrawl', 'serper'];
export const RESEARCH_LABELS = { tavily: 'Tavily', exa: 'Exa', firecrawl: 'Firecrawl', serper: 'Serper' };
const ENDPOINTS = { tavily: 'https://api.tavily.com', exa: 'https://api.exa.ai', firecrawl: 'https://api.firecrawl.dev/v2', serper: 'https://google.serper.dev' };
const trimmed = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function getResearchKeys(session) {
  const values = { ...session?.researchKeys, ...(session?.searchKey ? { serper: session.searchKey } : {}) };
  return Object.fromEntries(RESEARCH_PROVIDERS.filter(provider => typeof values[provider] === 'string' && values[provider]).map(provider => [provider, values[provider]]));
}

export function sourceUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
        (url.port && !['80', '443'].includes(url.port)) ||
        /(^|\.)(localhost|local|internal|invalid|test)$/.test(host) ||
        (isIP(host) && !isPublicAddress(host))) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|gclid|fbclid)/i.test(key)) url.searchParams.delete(key);
    return url.href.length <= 2000 ? url.href : null;
  } catch { return null; }
}

export function readableContent(value) {
  const content = trimmed(value, 180000);
  return content.length >= 160 && !/^(?:#\s*)?(access denied|just a moment|enable javascript|checking your browser|captcha|403 forbidden)/i.test(content) ? content : '';
}

export function normalizeSources(provider, data) {
  const entries = provider === 'serper' ? data.organic : provider === 'firecrawl' ? (Array.isArray(data.data) ? data.data : data.data?.web) : data.results;
  if (!Array.isArray(entries)) return [];
  const dedup = new Map();
  for (const item of entries.slice(0, 12)) {
    const url = sourceUrl(item?.url || item?.link);
    if (!url) continue;
    const content = readableContent(provider === 'tavily' ? item.raw_content : provider === 'exa' ? item.text : provider === 'firecrawl' ? item.markdown : '');
    const source = {
      type: 'web', kind: 'web-result', url,
      title: trimmed(item.title, 220) || new URL(url).hostname,
      detail: trimmed(item.snippet || item.description || item.content || (Array.isArray(item.highlights) ? item.highlights.join(' ') : ''), 900),
      sourceIds: [RESEARCH_LABELS[provider]], confidence: null, checked: null, facts: {},
      provider, content, format: /\.pdf(?:$|\?)/i.test(url) ? 'pdf' : 'article',
      publishedAt: trimmed(item.publishedDate || item.published_date, 100) || null,
      retrievedAt: new Date().toISOString(),
    };
    const existing = dedup.get(url);
    if (!existing || content.length > existing.content.length) dedup.set(url, source);
  }
  return [...dedup.values()];
}

async function responseJson(response, provider) {
  const limit = 2 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel().catch(() => {});
    throw new Error(RESEARCH_LABELS[provider] + ' returned too much data.');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error(RESEARCH_LABELS[provider] + ' returned an empty response.');
  const decoder = new TextDecoder();
  let body = '', bytes = 0, complete = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) { complete = true; break; }
      bytes += chunk.value.byteLength;
      if (bytes > limit) throw new Error(RESEARCH_LABELS[provider] + ' returned too much data.');
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    try { return JSON.parse(body); }
    catch { throw new Error(RESEARCH_LABELS[provider] + ' returned an unreadable response.'); }
  } finally {
    if (!complete) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function researchRequest(fetchImpl, provider, key, path, body, { signal, timeoutMs = 18000, method = 'POST' } = {}) {
  signal?.throwIfAborted();
  const headers = { 'Content-Type': 'application/json' };
  if (provider === 'exa') headers['x-api-key'] = key;
  else if (provider === 'serper') headers['X-API-KEY'] = key;
  else headers.Authorization = 'Bearer ' + key;
  let response;
  try {
    response = await fetchImpl(ENDPOINTS[provider] + path, {
      method, headers, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeoutMs)]),
    });
  } catch (error) {
    signal?.throwIfAborted();
    throw Object.assign(new Error(RESEARCH_LABELS[provider] + (error.name === 'TimeoutError' ? ' took too long to respond.' : ' could not be reached.')), { status: 502 });
  }
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    const quota = [402, 429, 432, 433].includes(response.status);
    throw Object.assign(new Error(RESEARCH_LABELS[provider] + ([401, 403].includes(response.status) ? ' rejected this API key or its permissions.' : quota ? ' quota or rate limit reached.' : ' request failed (' + response.status + ').')), { status: response.status, quota });
  }
  let data;
  try { data = await responseJson(response, provider); }
  catch (error) {
    signal?.throwIfAborted();
    if (['TimeoutError', 'AbortError'].includes(error.name)) throw Object.assign(new Error(RESEARCH_LABELS[provider] + ' took too long to respond.'), { status: 504 });
    throw error;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error(RESEARCH_LABELS[provider] + ' returned an unreadable response.'), { status: 502 });
  if (provider === 'firecrawl' && data.success === false) throw Object.assign(new Error('Firecrawl could not retrieve the requested data.'), { status: 502 });
  return data;
}

export async function searchProvider(fetchImpl, provider, key, query, signal, testing = false) {
  let path, body;
  if (provider === 'tavily') {
    path = '/search';
    body = { query, topic: 'general', search_depth: testing ? 'basic' : 'advanced', max_results: testing ? 1 : 6, include_answer: false, include_raw_content: testing ? false : 'markdown', include_images: false, auto_parameters: false };
  } else if (provider === 'exa') {
    path = '/search';
    body = { query, type: 'auto', numResults: testing ? 1 : 6, ...(testing ? {} : { contents: { text: { maxCharacters: 16000 } } }) };
  } else if (provider === 'firecrawl') {
    path = '/search';
    body = { query, limit: testing ? 1 : 6, sources: ['web'], country: 'IN', timeout: 15000 };
  } else {
    path = '/search';
    body = { q: query, gl: 'in', hl: 'en', num: testing ? 1 : 8 };
  }
  return normalizeSources(provider, await researchRequest(fetchImpl, provider, key, path, body, { signal }));
}

export async function testResearchKey(fetchImpl, provider, key, signal) {
  // Firecrawl's account endpoint verifies the key without consuming scrape credits.
  if (provider === 'firecrawl') {
    await researchRequest(fetchImpl, provider, key, '/team/credit-usage', undefined, { signal, method: 'GET' });
  } else await searchProvider(fetchImpl, provider, key, 'India GCC market', signal, true);
}

// A per-run semaphore respects Firecrawl's free-plan concurrency while allowing other readers to work.
function semaphore(limit) {
  let active = 0;
  const waiting = [];
  return async work => {
    if (active < limit) active++;
    else await new Promise(resolve => waiting.push(resolve));
    try { return await work(); }
    finally { const next = waiting.shift(); if (next) next(); else active--; }
  };
}

export function createResearchRetrieval({ keys, fetchImpl = globalThis.fetch, localReader = readWebPage, validate = validateRemoteUrl, diagnostic = () => {} }) {
  const disabled = new Set(), failures = new Map(), usage = {}, validated = new Map();
  const firecrawlSlot = semaphore(2);
  const limits = { 'firecrawl:scrape': 6, 'tavily:extract': 4, 'exa:contents': 4 };
  const used = new Map();
  const available = provider => Boolean(keys[provider]) && !disabled.has(provider);
  const invoke = async (provider, operation, work, signal) => {
    signal?.throwIfAborted();
    if (!available(provider)) throw new Error(RESEARCH_LABELS[provider] + ' is unavailable for this research.');
    const id = provider + ':' + operation;
    if (limits[id] && (used.get(id) || 0) >= limits[id]) throw new Error('The page retrieval budget for this research was reached.');
    used.set(id, (used.get(id) || 0) + 1);
    usage[provider] ||= { searches: 0, pages: 0, failures: 0 };
    usage[provider][operation === 'search' ? 'searches' : 'pages']++;
    try { return await work(); }
    catch (error) {
      signal?.throwIfAborted();
      usage[provider].failures++;
      failures.set(provider, (failures.get(provider) || 0) + 1);
      if ([401, 403, 402, 429, 432, 433].includes(error.status) || failures.get(provider) >= 2) disabled.add(provider);
      diagnostic({ phase: 'retrieval', provider, operation, code: error.quota ? 'QUOTA' : error.status === 401 || error.status === 403 ? 'AUTH' : 'UNAVAILABLE' });
      throw error;
    }
  };
  const queryProvider = (provider, query, signal) => invoke(provider, 'search', () => searchProvider(fetchImpl, provider, keys[provider], query, signal), signal);

  const search = async (query, signal, { index = 0 } = {}) => {
    signal?.throwIfAborted();
    const providers = available('tavily') ? ['tavily', ...(available('exa') && index < 2 ? ['exa'] : [])]
      : available('exa') ? ['exa'] : available('serper') ? ['serper'] : [];
    const results = await Promise.allSettled(providers.map(provider => queryProvider(provider, query, signal)));
    signal?.throwIfAborted();
    let sources = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    const errors = results.filter(result => result.status === 'rejected').map(result => result.reason.message);
    if (!sources.length) {
      // Empty results and authentication/quota failures both need a different discovery service.
      for (const provider of ['exa', 'serper', 'firecrawl', 'tavily']) {
        if (!available(provider) || providers.includes(provider)) continue;
        try { sources = await queryProvider(provider, query, signal); if (sources.length) break; }
        catch (error) { signal?.throwIfAborted(); errors.push(error.message); }
      }
    }
    if (!sources.length && errors.length) throw new Error([...new Set(errors)].join(' '));
    return sources;
  };

  const checkPublic = async (url, signal) => {
    if (!validated.has(url)) validated.set(url, validate(url));
    await validated.get(url);
    signal?.throwIfAborted();
  };
  const page = (content, source = {}, extractor) => ({
    title: source.title || '', content,
    format: source.format || 'article', publishedAt: source.publishedAt || null,
    retrievedAt: new Date().toISOString(), finalUrl: source.url, extractor,
  });
  const scrape = async (url, question, signal) => firecrawlSlot(async () => {
    await checkPublic(url, signal);
    const data = await invoke('firecrawl', 'scrape', () => researchRequest(fetchImpl, 'firecrawl', keys.firecrawl, '/scrape', { url, formats: ['markdown'], onlyMainContent: true, timeout: 20000, maxAge: 86400000 }, { signal, timeoutMs: 24000 }), signal);
    const metadata = data.data?.metadata || {};
    if (Number(metadata.statusCode) >= 400) throw new Error('The publisher restricted access to this page.');
    const content = readableContent(data.data?.markdown);
    if (!content) throw new Error('Firecrawl did not expose usable page text.');
    const finalUrl = sourceUrl(metadata.sourceURL || metadata.url || url);
    if (!finalUrl) throw new Error('The page redirected to an invalid source address.');
    if (finalUrl !== url) await checkPublic(finalUrl, signal);
    return { ...page(content, { title: trimmed(metadata.title, 220), url: finalUrl, format: /pdf/i.test(metadata.contentType || '') || /\.pdf(?:$|\?)/i.test(url) ? 'pdf' : 'article', publishedAt: trimmed(metadata.publishedTime || metadata['article:published_time'], 100) }, 'firecrawl'), content: selectPassages(content, question, 16000) };
  });

  const pageReader = async (url, question, { signal, source = {}, index = 0 } = {}) => {
    const seed = readableContent(source.content);
    const errors = [];
    const attempt = async work => {
      signal?.throwIfAborted();
      try { return await work(); } catch (error) { signal?.throwIfAborted(); errors.push(error.message); return null; }
    };
    // Render two highly ranked articles even when indexed text is available, to verify live page content.
    const preferRendered = index < 2 && available('firecrawl') && !/\.pdf(?:$|\?)/i.test(url);
    if (preferRendered) {
      const result = await attempt(() => scrape(url, question, signal));
      if (result) return result;
    }
    if (seed) return { ...page(seed, source, source.provider), content: selectPassages(seed, question, 16000) };
    const direct = await attempt(() => localReader(url, question, { signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(12000)]) }));
    if (direct && readableContent(direct.content)) return { ...direct, extractor: 'direct' };
    if (!preferRendered && available('firecrawl')) {
      const result = await attempt(() => scrape(url, question, signal));
      if (result) return result;
    }
    if (available('tavily')) {
      const result = await attempt(async () => {
        await checkPublic(url, signal);
        // Do not send query: Tavily otherwise returns 500-character chunks instead of article text.
        const data = await invoke('tavily', 'extract', () => researchRequest(fetchImpl, 'tavily', keys.tavily, '/extract', { urls: [url], extract_depth: 'advanced', format: 'markdown', include_images: false, timeout: 12 }, { signal, timeoutMs: 15000 }), signal);
        const item = data.results?.find(item => sourceUrl(item.url)?.replace(/\/$/, '') === sourceUrl(url)?.replace(/\/$/, ''));
        const content = readableContent(item?.raw_content);
        if (!content) throw new Error('Tavily could not extract this page.');
        return { ...page(content, { ...source, url }, 'tavily'), content: selectPassages(content, question, 16000) };
      });
      if (result) return result;
    }
    if (available('exa')) {
      const result = await attempt(async () => {
        await checkPublic(url, signal);
        const data = await invoke('exa', 'contents', () => researchRequest(fetchImpl, 'exa', keys.exa, '/contents', { ids: [url], text: { maxCharacters: 16000 } }, { signal, timeoutMs: 15000 }), signal);
        const item = data.results?.find(item => sourceUrl(item.url)?.replace(/\/$/, '') === sourceUrl(url)?.replace(/\/$/, ''));
        const content = readableContent(item?.text);
        if (!content) throw new Error('Exa could not retrieve this page.');
        return { ...page(content, { ...source, title: trimmed(item.title, 220) || source.title, url, publishedAt: item.publishedDate }, 'exa'), content: selectPassages(content, question, 16000) };
      });
      if (result) return result;
    }
    throw new Error(errors.at(-1) || 'Readable page text was unavailable.');
  };
  return { search: Object.keys(keys).length ? search : null, pageReader, metrics: () => structuredClone(usage) };
}
