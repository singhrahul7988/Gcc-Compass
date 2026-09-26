import { searchLocal, identifyCities } from './local-search.mjs';
import { readWebPage, selectPassages } from './web-reader.mjs';
import { planSchema, gapSchema, researchSchema, planInstructions, gapInstructions, researchInstructions, parseJson, cleanResearch, repairTask, partialResearch, ResearchValidationError } from './research-contract.mjs';

const tasks = {
  plan: { schema: planSchema, instructions: planInstructions, tokens: 1600, timeoutMs: 25000 },
  gaps: { schema: gapSchema, instructions: gapInstructions, tokens: 1600, timeoutMs: 25000 },
  report: { schema: researchSchema, instructions: researchInstructions, tokens: 8000, timeoutMs: 90000 },
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

function rankSources(groups, question, entities, seen, limit) {
  const combined = new Map();
  for (const item of groups.flat()) {
    try {
      const id = canonicalUrl(item.url);
      const previous = combined.get(id);
      if (!previous) combined.set(id, item);
      else {
        const best = (item.content?.length || 0) > (previous.content?.length || 0) ? item : previous;
        combined.set(id, { ...best, sourceIds: [...new Set([...(previous.sourceIds || []), ...(item.sourceIds || [])])] });
      }
    } catch { /* Invalid source URLs cannot participate in ranking. */ }
  }
  groups = groups.map(group => group.map(item => {
    try { return combined.get(canonicalUrl(item.url)); } catch { return null; }
  }).filter(Boolean));
  const tokens = question.toLowerCase().match(/[a-z]{4,}/g) || [];
  const rankedGroups = groups.map(group => group.filter(item => {
    try { return !seen.has(canonicalUrl(item.url)); } catch { return false; }
  }).map(item => {
    const host = new URL(item.url).hostname;
    const body = (item.title + ' ' + item.detail).toLowerCase();
    const primary = /(?:^|\.)(?:gov\.in|nic\.in)$/.test(host) || ['cbre.com', 'cbre.co.in', 'jll.com', 'jll.co.in', 'nasscom.in', 'zinnov.com', 'michaelpage.co.in', 'randstad.in', 'aon.com', 'mercer.com', 'colliers.com', 'savills.in'].some(domain => host === domain || host.endsWith('.' + domain));
    const cityHits = entities.filter(city => identifyCities(body).includes(city)).length;
    return { ...item, rank: (primary ? 12 : 0) + cityHits * 3 + tokens.filter(word => body.includes(word)).length - (/directory|all.*companies/i.test(item.title) ? 5 : 0) };
  }).sort((a, b) => b.rank - a.rank));
  const selected = [];
  const hosts = new Map();
  // Round-robin selection prevents one search topic from crowding out other decision factors.
  while (rankedGroups.some(group => group.length) && selected.length < limit) {
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
      if (selected.length >= limit) break;
    }
  }
  return selected;
}

export async function conductResearch({ question, search, model, pageReader = readWebPage, emit, signal, diagnostic = () => {}, retrievalMetrics = () => ({}) }) {
  const started = Date.now();
  const local = searchLocal(question, 6);
  emit({ stage: 'local', ...local });
  const web = [];
  const evidence = () => [...local.results, ...web];
  const context = () => ({
    question, currentDate: new Date().toISOString().slice(0, 10), entities: local.entities,
    interpretation, previousSearches: queries,
    requestedComparisonColumns: local.entities,
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
    check();
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
      const groups = await pool(nextQueries, 3, async (query, index) => {
        check(); searchCount++;
        try { return await search(query, signal, { index, followUp: web.length > 0 }); }
        catch (error) { check(); searchFailure = error.message; return []; }
      });
      check();
      const selected = rankSources(groups, question, local.entities, seen, maxNew);
      const offset = local.results.length + web.length;
      selected.forEach((item, index) => web.push({ ...item, number: offset + index + 1, status: 'preview' }));
      emit({ stage: 'web', results: web.map(publicEvidence) });
      let completed = 0;
      await pool(selected, 3, async (_item, index) => {
        check();
        const source = web[offset - local.results.length + index];
        emit({ stage: 'reading', completed, total: selected.length });
        try {
          const page = await pageReader(source.url, question, { signal: AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(45000)]), source, index });
          if (typeof page?.content !== 'string' || !page.content.trim()) throw new Error('The page did not expose usable text.');
          source.content = selectPassages(page.content, question, 12000);
          source.status = 'read';
          source.title = page.title || source.title;
          source.publishedAt = page.publishedAt;
          source.retrievedAt = page.retrievedAt;
          source.format = page.format;
          source.finalUrl = page.finalUrl;
          source.extractor = page.extractor;
          if (page.finalUrl) { source.url = page.finalUrl; seen.add(canonicalUrl(page.finalUrl)); }
        } catch (error) {
          check();
          source.reason = error.message || 'Page text was unavailable.';
        }
        completed++;
        emit({ stage: 'reading', completed, total: selected.length });
        emit({ stage: 'web', results: web.map(publicEvidence) });
      });
      // Different discovery URLs may redirect to the same article. Keep one source before citing it.
      const unique = new Map();
      for (const source of web) {
        const id = canonicalUrl(source.url);
        const previous = unique.get(id);
        if (!previous || (source.content?.length || 0) > (previous.content?.length || 0)) unique.set(id, source);
      }
      web.splice(0, web.length, ...unique.values());
      web.forEach((source, index) => { source.number = local.results.length + index + 1; });
      emit({ stage: 'web', results: web.map(publicEvidence) });
    };
    await gather(queries, 10);
    if (!web.length && searchFailure) emit({ stage: 'web-error', error: searchFailure });
    if (web.length && model) {
      check(); emit({ stage: 'checking' });
      let extra = [];
      try {
        const gaps = parseJson(await model(JSON.stringify(context()), tasks.gaps, signal));
        if (gaps.sufficient !== true) extra = cleanQueries(gaps.queries, 2).filter(query => !queries.includes(query));
      } catch { check(); }
      // Replacement sources are needed even when gap review fails or claims sufficient coverage.
      if (!extra.length && web.filter(item => item.status === 'read').length < 2) {
        extra = [question + ' research report pdf official'].filter(query => !queries.includes(query));
      }
      if (extra.length) { queries.push(...extra); await gather(extra, 4); }
    }
    if (web.length && !web.some(item => item.status === 'read')) emit({ stage: 'web-error', error: 'Publishers did not expose readable page text. This answer uses local records and search previews; detailed benchmarks may be incomplete.' });
  } else emit({ stage: 'web-unavailable' });

  check();
  if (model) {
    emit({ stage: 'analyzing' });
    const comparisonRequired = local.entities.length >= 2 || /\b(compare|comparison|versus|vs|ranking|rank)\b|best city|strongest.*talent/i.test(question);
    let report;
    let previousReport;
    let previousText = '';
    let lastError;
    const metrics = () => ({
      searches: searchCount, pagesRead: web.filter(item => item.status === 'read').length,
      previews: web.filter(item => item.status !== 'read').length, durationMs: Date.now() - started,
      retrieval: retrievalMetrics(),
    });
    const validate = value => {
      let cleaned, issues = [];
      try { cleaned = cleanResearch(value, evidence(), comparisonRequired); }
      catch (error) {
        if (!(error instanceof ResearchValidationError)) throw error;
        cleaned = error.report; issues = [...error.issues];
      }
      if (local.entities.length >= 2) {
        const columns = identifyCities(cleaned.comparison?.columns.join(' ') || '');
        if (local.entities.some(city => !columns.includes(city)) && !issues.some(issue => issue.field === 'comparison')) {
          issues.push({ field: 'comparison', message: 'The comparison omitted a requested location.' });
        }
      }
      if (issues.length) throw new ResearchValidationError(issues, cleaned);
      return cleaned;
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      check();
      const targeted = attempt && lastError?.issues && previousReport;
      const task = { ...(targeted ? repairTask(lastError.issues) : { ...tasks.report, ...(attempt && lastError?.code === 'OUTPUT_TRUNCATED' ? { tokens: 12000 } : {}) }), requireComparison: comparisonRequired };
      const input = attempt ? JSON.stringify({
        research: context(), previousReport,
        ...(previousReport ? {} : { previousResponse: previousText.slice(0, 30000) }),
        problems: lastError?.issues || [{ message: lastError?.message }],
        repair: 'The previous report failed validation. Correct the listed problems. Preserve supported analysis. Return exactly the supplied schema. If the previous response was cut short, keep the report concise: six comparison rows and three sections with one paragraph each.',
      }) : JSON.stringify(context());
      if (attempt) emit({ stage: 'repairing' });
      try {
        previousText = await model(input, task, signal);
        const response = parseJson(previousText);
        if (targeted) {
          // Only repaired fields can change. Valid narrative is not discarded or regenerated.
          previousReport = { ...previousReport, ...Object.fromEntries(Object.keys(task.schema.properties).filter(key => key in response).map(key => [key, response[key]])) };
        } else previousReport = response;
        report = validate(previousReport);
        break;
      } catch (error) {
        check();
        lastError = error;
        if (typeof error.responseText === 'string') previousText = error.responseText;
        diagnostic({
          phase: 'report', attempt: attempt + 1, code: error.code || (error.status ? 'PROVIDER_ERROR' : 'INVALID_RESPONSE'),
          fields: error.issues?.map(issue => issue.field) || [], finishReason: error.finishReason,
          ...metrics(),
        });
        // Do not repeat authentication, quota, or unsupported-model requests.
        if (error.status) break;
      }
    }
    if (report) emit({ stage: 'answer', analysis: report, metrics: metrics() });
    else {
      let partial = null;
      try { partial = partialResearch(previousReport, evidence(), local.entities); } catch { /* Non-report JSON has nothing to preserve. */ }
      if (partial?.comparison && local.entities.length >= 2) {
        const columns = identifyCities(partial.comparison.columns.join(' '));
        if (local.entities.some(city => !columns.includes(city))) partial.comparison = null;
      }
      if (partial) {
        emit({
          stage: 'answer', analysis: partial, metrics: metrics(),
          incomplete: true,
          warning: lastError?.issues?.some(issue => issue.field === 'comparison')
            ? 'The full comparison could not be completed. Available comparisons and findings are shown below; retry to finish the report.'
            : 'Some parts of this analysis could not be completed. The available findings are shown below; retry to finish the report.',
        });
      } else {
        emit({ stage: 'analysis-error', error: lastError?.message || 'The model could not produce a complete researched answer. Retry or choose another model.' });
      }
    }
  } else emit({ stage: 'analysis-unavailable' });
  emit({ stage: 'done' });
}
