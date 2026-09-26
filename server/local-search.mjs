import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const datasetDirectory = fileURLToPath(new URL('../dataset/processed/', import.meta.url));
const files = [
  ['city', 'city_benchmarks.csv'],
  ['company', 'gcc_records.csv'],
  ['policy', 'state_policies.csv'],
  ['assumption', 'assumptions.csv'],
  ['stakeholder', 'stakeholders.csv'],
];
const factFields = [
  'city', 'state', 'gcc_sample_count', 'sector_strengths', 'talent_strengths', 'office_rent_range',
  'best_for', 'risks', 'key_clusters', 'senior_engineer_salary_range', 'ml_engineer_salary_range', 'attrition_proxy', 'state_incentive_summary', 'policy_name', 'policy_status', 'eligibility',
  'capital_subsidy', 'payroll_reimbursement', 'training_subsidy', 'target_jobs', 'nodal_agency',
  'assumption_name', 'value_or_range', 'unit', 'caveat', 'parent_company', 'primary_city',
  'sector', 'functions', 'services', 'notes',
];
const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'best', 'by', 'can', 'compare', 'could',
  'do', 'does', 'for', 'from', 'gcc', 'have', 'how', 'i', 'in', 'india', 'is', 'of',
  'on', 'or', 'our', 'should', 'show', 'the', 'their', 'to', 'us', 'vs', 'we', 'what',
  'when', 'where', 'which', 'with', 'would', 'year', 'team', 'person', 'policy', 'policies', 'incentive', 'incentives', 'prices',
]);
const synonyms = { fintech: ['bfsi', 'financial'], ai: ['ml', 'machine', 'learning'], setup: ['entity', 'build'], policy: ['incentive'] };

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(cell); cell = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = '';
      continue;
    }
    cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...body] = rows;
  return body.map(values => Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] || '').trim()])));
}

function words(value) {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter(Boolean).map(word => word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word);
}

function titleFor(kind, row) {
  if (kind === 'city') return row.city;
  if (kind === 'company') return row.parent_company;
  if (kind === 'policy') return row.policy_name;
  if (kind === 'assumption') return row.assumption_name;
  return row.name;
}

function detailFor(kind, row) {
  if (kind === 'city') return row.best_for || row.talent_strengths;
  if (kind === 'company') return [row.sector, row.primary_city].filter(Boolean).join(' · ');
  if (kind === 'policy') return [row.state, row.policy_status].filter(Boolean).join(' · ');
  if (kind === 'assumption') return [row.value_or_range, row.unit].filter(Boolean).join(' ');
  return [row.category, row.cities_supported].filter(Boolean).join(' · ');
}

const documents = files.flatMap(([kind, filename]) => {
  const path = datasetDirectory + filename;
  return parseCsv(readFileSync(path, 'utf8')).map(row => {
    const title = titleFor(kind, row);
    return {
      kind, row, title,
      titleWords: new Set(words(title + ' ' + [row.city, row.state, row.primary_city].filter(Boolean).join(' '))),
      bodyWords: new Set(words([
        row.city, row.state, row.primary_city, row.key_cities, row.sector, row.functions,
        row.talent_strengths, row.sector_strengths, row.best_for, row.risks,
        row.policy_name, row.eligibility, row.assumption_name, row.services, row.category,
      ].filter(Boolean).join(' '))),
    };
  }).filter(item => item.title);
});

function relevance(document, queryWords, lowerQuestion) {
  let score = 0;
  for (const word of queryWords) {
    if (document.titleWords.has(word)) score += 5;
    else if (document.bodyWords.has(word)) score += 1;
    for (const equivalent of synonyms[word] || []) {
      if (document.titleWords.has(equivalent)) score += 2;
      else if (document.bodyWords.has(equivalent)) score += 0.5;
    }
  }
  if (document.title.length > 3 && lowerQuestion.includes(document.title.toLowerCase())) score += 8;
  if (/polic|incentive|subsid/.test(lowerQuestion) && document.kind === 'policy' && queryWords.some(word => document.titleWords.has(word) && !['policy', 'incentive'].includes(word))) score += 2;
  if (/city|talent|hiring|office|rent|risk/.test(lowerQuestion) && document.kind === 'city' && queryWords.some(word => document.titleWords.has(word) || document.bodyWords.has(word))) score += 1;
  if (/company|companies|sector|fintech|bfsi/.test(lowerQuestion) && document.kind === 'company' && queryWords.some(word => document.titleWords.has(word) || document.bodyWords.has(word))) score += 1;
  if (/bot|eor|entity|timeline|breakeven/.test(lowerQuestion) && document.kind === 'assumption' && queryWords.some(word => document.titleWords.has(word) || document.bodyWords.has(word))) score += 2;
  if (document.kind === 'company' && !lowerQuestion.includes(document.title.toLowerCase()) &&
      !queryWords.some(word => !['city', 'office', 'rent', 'risk', 'electricity'].includes(word) && document.bodyWords.has(word) && word !== (document.row.primary_city || '').toLowerCase())) return 0;
  return score;
}

function toEvidence(document, number) {
  const row = document.row;
  const urls = String(row.source_urls || '').split(';').map(value => value.trim());
  const url = urls.find(value => /^https:\/\/[^\s]+$/i.test(value));
  const facts = Object.fromEntries(factFields.filter(field => row[field] && row[field].toLowerCase() !== 'unknown').map(field => [field, row[field].slice(0, 260)]));
  return {
    number,
    type: 'local',
    kind: document.kind,
    title: document.title.slice(0, 160),
    detail: detailFor(document.kind, row).slice(0, 240),
    url: url || null,
    sourceIds: String(row.source_ids || '').split(/[;,]/).map(value => value.trim()).filter(Boolean),
    confidence: Number.parseInt(row.confidence_score, 10) || 0,
    checked: row.last_checked || null,
    facts,
  };
}

export const cityAliases = {
  'Bengaluru': ['bengaluru', 'bangalore'],
  'Hyderabad': ['hyderabad'],
  'Delhi NCR': ['delhi', 'ncr', 'gurgaon', 'gurugram', 'noida'],
  'Pune': ['pune'], 'Chennai': ['chennai'], 'Mumbai': ['mumbai', 'bombay'],
  'Ahmedabad / GIFT City': ['ahmedabad', 'gift city', 'gandhinagar'],
  'Coimbatore': ['coimbatore'], 'Kochi': ['kochi', 'cochin'],
};
export function identifyCities(question) {
  const text = String(question || '').toLowerCase();
  return Object.entries(cityAliases).filter(([, aliases]) => aliases.some(alias => new RegExp(String.raw`\b` + alias + String.raw`\b`).test(text))).map(([city]) => city);
}

export function searchLocal(question, limit = 6) {
  const lowerQuestion = String(question || '').toLowerCase();
  const entities = identifyCities(question);
  const queryWords = [...new Set(words(question).filter(word => word.length > 1 && !stopWords.has(word)))].slice(0, 24);
  if (!queryWords.length) return { total: 0, entities, results: [] };
  const wantsExamples = /companies|company|examples|employers|who has|which gcc/.test(lowerQuestion);
  const ranked = documents.map(document => {
    let score = relevance(document, queryWords, lowerQuestion);
    if (document.kind === 'city' && entities.includes(document.title)) score += 50;
    if (document.kind === 'city' && entities.length && !entities.includes(document.title)) score = 0;
    if (document.kind === 'company' && !wantsExamples && !lowerQuestion.includes(document.title.toLowerCase())) score = 0;
    return { document, score };
  }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score);
  const chosen = [];
  const perKind = new Map();
  for (const item of ranked) {
    if ((perKind.get(item.document.kind) || 0) >= (item.document.kind === 'city' ? 4 : 2)) continue;
    chosen.push(item.document);
    perKind.set(item.document.kind, (perKind.get(item.document.kind) || 0) + 1);
    if (chosen.length >= limit) break;
  }
  return { total: ranked.length, entities, results: chosen.map((document, index) => toEvidence(document, index + 1)) };
}
