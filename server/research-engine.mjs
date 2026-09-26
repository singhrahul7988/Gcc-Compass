import { searchLocal, identifyCities } from './local-search.mjs';
import { readWebPage } from './web-reader.mjs';
import { planSchema, gapSchema, researchSchema, planInstructions, gapInstructions, researchInstructions, parseJson, cleanResearch } from './research-contract.mjs';

const tasks = {
  plan: { schema: planSchema, instructions: planInstructions, tokens: 1600 },
  gaps: { schema: gapSchema, instructions: gapInstructions, tokens: 1600 },
  report: { schema: researchSchema, instructions: researchInstructions, tokens: 8000 },
};

export async function pool(items, concurrency, work) {
  let cursor = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await work(items[index], index);
    }
  }));
  return results;
}

export function canonicalUrl(value) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|gclid|fbclid)/i.test(key)) url.searchParams.delete(key);
  return url.href.replace(/\/$/, '');
}

function publicEvidence(item) {
  const { content, ...rest } = item;
  return rest;
}

function fallbackQueries(question, entities) {
  const location = entities.join(' ') || question;
  if (entities.length >= 2 || /compare|\bvs\b|best city|strongest.*talent/i.test(question)) {
    const year = new Date().getFullYear();
    const roles = /data|analyst/i.test(question) ? 'data analyst software developer' : /AI|ML/.test(question) ? 'AI machine learning engineer' : 'software engineer';
    return [
      question,
      location + ' ' + roles + ' salary compensation survey ' + year,
      location + ' office rent per square foot market report ' + year,
      location + ' technology talent retention attrition GCC report ' + year,
      location + ' GCC policy incentives official eligibility',
    ];
  }
  return [question, question + ' official report data', question + ' costs requirements risks'];
}

function cleanQueries(values, max = 5) {
  return Array.isArray(values) ? [...new Set(values.filter(item => typeof item === 'string').map(item => item.trim().slice(0, 300)).filter(Boolean))].slice(0, max) : [];
}

function rankSources(groups, question, entities, seen) {
  const tokens = question.toLowerCase().match(/[a-z]{4,}/g) || [];
  const rankedGroups = groups.map(group => group.filter(item => {
    try { return !seen.has(canonicalUrl(item.url)); } catch { return false; }
  }).map(item => {
    const host = new URL(item.url).hostname;
    const body = (item.title + ' ' + item.detail).toLowerCase();
    const primary = /gov\.in$|nic\.in$|cbre\.|jll\.|nasscom\.|zinnov\.|michaelpage\.|randstad\.|aon\.|mercer\.|colliers\.|savills\./i.test(host);
    const cityHits = entities.filter(city => body.includes(city.toLowerCase()) || (city === 'Delhi NCR' && /delhi|noida|gurugram|gurgaon/.test(body))).length;
    return { ...item, rank: (primary ? 12 : 0) + cityHits * 3 + tokens.filter(word => body.includes(word)).length - (/directory|all.*companies/i.test(item.title) ? 5 : 0) };
  }).sort((a, b) => b.rank - a.rank));
  const selected = [];
  const hosts = new Map();
  // Round-robin selection prevents one search topic from crowding out other decision factors.
  while (rankedGroups.some(group => group.length) && selected.length < 12) {
    for (const group of rankedGroups) {
      let item;
      while (group.length) {
        const candidate = group.shift();
        const id = canonicalUrl(candidate.url);
        const host = new URL(id).hostname.replace(/^www\./, '');
        if (seen.has(id) || (hosts.get(host) || 0) >= 2) continue;
        seen.add(id); hosts.set(host, (hosts.get(host) || 0) + 1);
        item = candidate; break;
      }
      if (item) selected.push(item);
      if (selected.length >= 12) break;
    }
  }
  return selected;
}

export async function conductResearch({ question, search, model, pageReader = readWebPage, emit, signal }) {
  const started = Date.now();
  const local = searchLocal(question, 6);
  emit({ stage: 'local', ...local });
  const web = [];
  const evidence = () => [...local.results, ...web];
  const context = () => ({
    question, currentDate: new Date().toISOString().slice(0, 10), entities: local.entities,
    interpretation, previousSearches: queries,
    evidence: evidence().map(item => ({
      number: item.number, type: item.type, title: item.title, url: item.url,
      status: item.type === 'local' ? 'local' : item.status,
      detail: item.detail, facts: item.facts, checked: item.checked,
      publishedAt: item.publishedAt, retrievedAt: item.retrievedAt, content: item.content,
    })),
  });
  let queries = fallbackQueries(question, local.entities);
  let interpretation = '';
  const seen = new Set();
  let searchCount = 0;
  let searchFailure = '';
  const check = () => signal?.throwIfAborted();

  if (search) {
    if (model) {
      emit({ stage: 'planning' });
      try {
        const plan = parseJson(await model(JSON.stringify({ question, currentDate: new Date().toISOString().slice(0, 10), entities: local.entities, local: local.results }), tasks.plan, signal));
        const planned = cleanQueries(plan.queries);
        if (planned.length >= 2) queries = planned;
        interpretation = typeof plan.interpretation === 'string' ? plan.interpretation.slice(0, 450) : '';
      } catch { check(); /* Deterministic searches keep research working when planning fails. */ }
    }
    const gather = async (nextQueries, maxNew) => {
      check();
      emit({ stage: web.length ? 'searching-more' : 'searching-web' });
      const groups = await pool(nextQueries, 3, async query => {
        check(); searchCount++;
        try { return await search(query, signal); }
        catch (error) { check(); searchFailure = error.message; return []; }
      });
      check();
      const selected = rankSources(groups, question, local.entities, seen).slice(0, maxNew);
      const offset = local.results.length + web.length;
      selected.forEach((item, index) => web.push({ ...item, number: offset + index + 1, status: 'preview' }));
      emit({ stage: 'web', results: web.map(publicEvidence) });
      let completed = 0;
      await pool(selected, 3, async (_item, index) => {
        check();
        const source = web[offset - local.results.length + index];
        emit({ stage: 'reading', completed, total: selected.length });
        try {
          const page = await pageReader(source.url, question, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(22000)]) });
          source.status = 'read';
          source.content = page.content.slice(0, 10500);
          source.title = page.title || source.title;
          source.publishedAt = page.publishedAt;
          source.retrievedAt = page.retrievedAt;
          source.format = page.format;
          source.finalUrl = page.finalUrl;
        } catch (error) {
          check();
          source.reason = error.message || 'Page text was unavailable.';
        }
        completed++;
        emit({ stage: 'reading', completed, total: selected.length });
        emit({ stage: 'web', results: web.map(publicEvidence) });
      });
    };
    await gather(queries, 10);
    if (!web.length && searchFailure) emit({ stage: 'web-error', error: searchFailure });
    if (web.length && model) {
      check(); emit({ stage: 'checking' });
      try {
        const gaps = parseJson(await model(JSON.stringify(context()), tasks.gaps, signal));
        let extra = cleanQueries(gaps.queries, 2).filter(query => !queries.includes(query));
        // A blocked first pass needs replacement sources even if a model claims sufficient coverage.
        if (!extra.length && web.filter(item => item.status === 'read').length < 2) extra = [question + ' research report pdf official'];
        if (extra.length) { queries.push(...extra); await gather(extra, 4); }
      } catch { check(); }
    }
    if (web.length && !web.some(item => item.status === 'read')) emit({ stage: 'web-error', error: 'Publishers did not expose readable page text. This answer uses local records and search previews; detailed benchmarks may be incomplete.' });
  } else emit({ stage: 'web-unavailable' });

  check();
  if (model) {
    emit({ stage: 'analyzing' });
    const prompt = JSON.stringify(context());
    const comparisonRequired = local.entities.length >= 2 || /\b(compare|comparison|versus|vs|ranking|rank)\b|best city|strongest.*talent/i.test(question);
    try {
      let report;
      let lastError;
      for (let attempt = 0; attempt < 2; attempt++) {
        check();
        const input = attempt ? JSON.stringify({ research: context(), repair: 'The previous report failed validation: ' + lastError.message + '. Return a complete corrected report with nonempty cited sections, findings, and a comparison table when required.' }) : prompt;
        try {
          report = cleanResearch(parseJson(await model(input, tasks.report, signal)), evidence(), comparisonRequired);
          if (local.entities.length >= 2) {
            const columns = identifyCities(report.comparison?.columns.join(' ') || '');
            if (local.entities.some(city => !columns.includes(city))) throw new Error('The comparison omitted a requested location.');
          }
          break;
        } catch (error) {
          check(); report = undefined; lastError = error;
          // Retrying a quota/auth/model error cannot repair the report.
          if (error.status) throw error;
        }
      }
      if (!report) throw lastError;
      const metrics = {
        searches: searchCount, pagesRead: web.filter(item => item.status === 'read').length,
        previews: web.filter(item => item.status !== 'read').length, durationMs: Date.now() - started,
      };
      emit({ stage: 'answer', analysis: report, metrics });
    } catch (error) {
      check();
      emit({ stage: 'analysis-error', error: error.message || 'The model could not produce a complete researched answer. Retry or choose another model.' });
    }
  } else emit({ stage: 'analysis-unavailable' });
  emit({ stage: 'done' });
}
