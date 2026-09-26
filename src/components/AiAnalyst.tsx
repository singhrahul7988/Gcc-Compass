import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowRight, BarChart3, Building2, CalendarDays, Check, ChevronRight, ChevronDown, CircleHelp,
  Cpu, Database, ExternalLink, File, FileSearch, Landmark, Lightbulb, List,
  LoaderCircle, Search, Sparkles, Target, Users, X
} from 'lucide-react';
import type { Assumption, CityBenchmark, GccRecord, Stakeholder, StatePolicy } from '../data';
import { score, splitList } from '../data/csv';
import { requestResearch } from './aiClient';
import type { AiProvider, LiveAnalysis, LiveFinding, ResearchEvidence, ResearchEvent } from './aiClient';
import bengaluruImage from '../assets/cities/bengaluru-reference.png';
import hyderabadImage from '../assets/cities/hyderabad-reference.png';
import puneImage from '../assets/cities/pune-unsplash.jpg';
import delhiImage from '../assets/cities/delhi-unsplash.jpg';

type Props = {
  cities: CityBenchmark[];
  records: GccRecord[];
  stakeholders: Stakeholder[];
  assumptions: Assumption[];
  policies: StatePolicy[];
  aiConfigured: boolean;
  aiProvider: AiProvider | null;
  aiModel: string | null;
  searchConfigured: boolean;
  onOpenSettings: () => void;
  onOpenCityCompare: () => void;
  onOpenBuildVsBuy: () => void;
};
type Source = { id: string; url?: string };
type Evidence = {
  title: string;
  detail: string;
  confidence: number;
  checked: string;
  sources: Source[];
  facts: Record<string, string>;
  image?: string;
};
type Tradeoff = { label: string; Icon: typeof Users; left: string; right: string };
type Answer = {
  title: string;
  summary: string;
  next: string;
  caveat: string;
  evidence: Evidence[];
  tradeoffs?: Tradeoff[];
  findings?: LiveFinding[];
  action?: 'cities' | 'build';
};
type ResearchState = {
  question: string;
  stage: 'local' | 'local-complete' | 'planning' | 'searching-web' | 'searching-more' | 'reading' | 'checking' | 'web' | 'analyzing' | 'done' | 'error';
  entities?: string[];
  reading?: { completed: number; total: number };
  local: ResearchEvidence[];
  web: ResearchEvidence[];
  total: number;
  analysis?: LiveAnalysis;
  warnings: string[];
  error?: string;
};

export const suggestedQuestions = [
  'Bengaluru vs Hyderabad for a 50-person AI team?',
  'Best city for a 20-person engineering GCC?',
  'Hyderabad vs Pune for fintech operations?',
  'When should we choose BOT over a direct entity?',
  'Which cities have the strongest AI/ML talent depth?',
  'What are the setup risks in Bengaluru?',
  'Show policy support for Telangana vs Karnataka',
];

const sourceLabels: Record<string, string> = {
  SRC_FLEXIPLE_GCC_INDIA_HTML: 'Flexiple',
  SRC_ZINNOV_GCC_2026_LOCAL: 'Nasscom–Zinnov',
  SRC_CBRE_OFFICE_Q2_2026_PAGE: 'CBRE',
  SRC_JLL_OFFICE_DYNAMICS_PAGE: 'JLL',
  SRC_INDUSLAW_GCC_2025_PDF: 'IndusLaw',
  SRC_DHRUVA_GCC_2025_PDF: 'Dhruva',
};
const factFields = [
  'city', 'state', 'gcc_sample_count', 'sector_strengths', 'talent_strengths',
  'office_rent_range', 'best_for', 'risks', 'state_incentive_summary',
  'assumption_name', 'value_or_range', 'unit', 'caveat', 'policy_name',
  'policy_status', 'notes', 'parent_company', 'primary_city', 'sector',
];

function getEvidence(row: Record<string, string>, title: string, detail: string, image?: string): Evidence {
  const urls = (row.source_urls || '').split(';').map(value => value.trim());
  const facts = Object.fromEntries(factFields.filter(key => row[key] && row[key] !== 'Unknown').map(key => [key, row[key]]));
  return {
    title, detail, image, facts,
    confidence: score(row.confidence_score),
    checked: row.last_checked && row.last_checked !== 'Unknown' ? row.last_checked : 'Not recorded',
    sources: splitList(row.source_ids).map((id, index) => ({
      id,
      url: urls[index]?.startsWith('https://') ? urls[index] : undefined,
    })),
  };
}

function findCity(cities: CityBenchmark[], name: string) {
  return cities.find(city => city.city.toLowerCase() === name.toLowerCase());
}

function cityImage(name: string) {
  return name === 'Bengaluru' ? bengaluruImage : name === 'Hyderabad' ? hyderabadImage : undefined;
}

function makeComparison(left: CityBenchmark, right: CityBenchmark, mode: 'ai-team' | 'engineering' | 'fintech' | 'ai-depth' | 'generic'): Answer {
  const topic = mode === 'engineering' ? 'Engineering fit' : mode === 'fintech' ? 'Fintech fit' : 'AI fit';
  const titles = {
    'ai-team': 'Bengaluru vs Hyderabad: 50-person AI team',
    engineering: 'Bengaluru vs Pune: 20-person engineering GCC',
    fintech: 'Hyderabad vs Pune: fintech operations',
    'ai-depth': 'AI/ML talent depth: city signals',
    generic: left.city + ' vs ' + right.city + ': key tradeoffs',
  };
  const summaries = {
    'ai-team': 'For a 50-person AI team, Bengaluru offers the deepest specialist and product talent pool in this dataset, while Hyderabad offers strong engineering depth with a better cost-quality balance. Choose based on the roles that are hardest to hire and the operating budget you can sustain.',
    engineering: 'For a 20-person engineering GCC, Bengaluru offers broad product and platform hiring depth. Pune is well suited to engineering and ER&D teams with a cost-quality focus. The right choice depends on the specialist roles, leadership needs, and target budget.',
    fintech: 'Both Hyderabad and Pune show BFSI strength in the city benchmarks. Hyderabad has a larger sample directory footprint and scaled engineering base; Pune offers engineering depth and a cost-quality tradeoff. Check the exact operations roles and financial-services talent before committing.',
    'ai-depth': 'Bengaluru has the strongest AI and product ecosystem signal in the sampled city data. Hyderabad also has strong AI and data talent with a growing enterprise base. These are directional city signals, not verified counts of available AI candidates.',
    generic: left.city + ' and ' + right.city + ' have different talent, sector, cost, and risk profiles. Match their strengths to your hiring plan before making a location decision.',
  };
  const leftCost = left.office_rent_range.split(';')[0] + ' office market; verify exact role and site costs.';
  const rightCost = right.office_rent_range.split(';')[0] + ' office market; verify exact role and site costs.';
  const scaleLeft = left.gcc_sample_count + ' records in the sample directory; this is coverage, not a total market count.';
  const scaleRight = right.gcc_sample_count + ' records in the sample directory; this is coverage, not a total market count.';
  const tradeoffs: Tradeoff[] = mode === 'ai-depth' ? [
    { label: 'Talent depth', Icon: Users, left: left.talent_strengths, right: right.talent_strengths },
    { label: 'AI/ML capability', Icon: Cpu, left: left.best_for, right: right.best_for },
    { label: 'Scale signal', Icon: Database, left: scaleLeft, right: scaleRight },
    { label: 'Risks', Icon: BarChart3, left: left.risks, right: right.risks },
  ] : [
    { label: 'Talent depth', Icon: Users, left: left.talent_strengths, right: right.talent_strengths },
    { label: 'Cost position', Icon: Database, left: leftCost, right: rightCost },
    { label: topic, Icon: Cpu, left: mode === 'fintech' ? left.sector_strengths : left.best_for, right: mode === 'fintech' ? right.sector_strengths : right.best_for },
    { label: 'Risks', Icon: BarChart3, left: left.risks, right: right.risks },
  ];
  return {
    title: titles[mode],
    summary: summaries[mode],
    tradeoffs,
    next: 'Compare ' + left.city + ' and ' + right.city + ' against your team shape, timing, and control needs.',
    caveat: 'City costs are directional and directory records are sample coverage, not complete city totals.',
    evidence: [
      getEvidence(left, left.city, left.gcc_sample_count + ' records in sample directory', cityImage(left.city)),
      getEvidence(right, right.city, right.gcc_sample_count + ' records in sample directory', cityImage(right.city)),
    ],
    action: 'cities',
  };
}

function setupAnswer(assumptions: Assumption[]): Answer {
  const ids = ['ASM-BUILD-EOR-SPEED', 'ASM-BUILD-ENTITY-TIMELINE', 'ASM-BUILD-BREAKEVEN'];
  const rows = ids.map(id => assumptions.find(item => item.assumption_id === id)).filter(Boolean) as Assumption[];
  const [managed, entity, breakeven] = rows;
  return {
    title: 'BOT vs direct entity: route decision',
    summary: 'The local evidence supports a directional timing comparison, not a definitive BOT versus direct-entity breakeven. A managed or EOR bridge can be faster to start; a direct entity gives longer-term control but takes more setup work. Contract transfer terms and total costs still need validation.',
    findings: [
      { text: managed ? 'Managed or EOR setup speed is estimated at ' + managed.value_or_range + '.' : 'Managed setup timing is not verified.', citations: managed ? [1] : [] },
      { text: entity ? 'Direct entity setup is planned at ' + entity.value_or_range + '.' : 'Direct entity timing is not verified.', citations: entity ? [2] : [] },
      { text: breakeven ? 'The ' + breakeven.value_or_range + ' crossover is a configurable demo assumption, not a proven BOT threshold.' : 'No verified crossover is available.', citations: breakeven ? [3] : [] },
    ],
    next: 'Use the Build vs Buy model with your team size, launch date, and desired control level.',
    caveat: 'No verified BOT contract economics or transition obligations are present in this evidence set.',
    evidence: rows.map(row => getEvidence(row, row.assumption_name, row.value_or_range + ' ' + row.unit)),
    action: 'build',
  };
}

function riskAnswer(city: CityBenchmark): Answer {
  return {
    title: city.city + ': setup risks to plan for',
    summary: city.city + ' has relevant talent and sector strengths, but its benchmark flags ' + city.risks.toLowerCase() + ' Build a hiring and location plan around those constraints.',
    findings: [
      { text: 'Benchmark risks: ' + city.risks, citations: [1] },
      { text: 'Best-fit functions: ' + city.best_for + '.', citations: [1] },
      { text: 'Office cost signal: ' + city.office_rent_range + '.', citations: [1] },
    ],
    next: 'Compare this city with an alternative before fixing headcount and site assumptions.',
    caveat: 'The dataset has no verified role-level salary band or site-specific office quote.',
    evidence: [getEvidence(city, city.city, city.gcc_sample_count + ' records in sample directory', cityImage(city.city))],
    action: 'cities',
  };
}

function policyAnswer(question: string, policies: StatePolicy[]): Answer {
  const matches = policies.filter(row => question.toLowerCase().includes(row.state.toLowerCase()));
  if (!matches.length) return {
    title: 'Telangana vs Karnataka: policy evidence gap',
    summary: 'The current local policy table has no verified Telangana or Karnataka policy record. The city benchmarks mention policy direction, but that is not enough to compare incentives or eligibility.',
    findings: [{ text: 'Obtain current official state policy documents and verify eligibility, effective dates, and incentive conditions before using them in a location decision.', citations: [] }],
    next: 'Collect official Telangana and Karnataka policy documents and validate them against the proposed GCC structure.',
    caveat: 'No incentive amount or policy entitlement is inferred from missing records.',
    evidence: [],
  };
  return {
    title: 'Policy support in the verified local table',
    summary: matches.map(row => row.state + ': ' + row.policy_name + ' (' + row.policy_status + ').').join(' '),
    findings: matches.map((row, index) => ({ text: row.notes || row.policy_name, citations: [index + 1] })),
    next: 'Open each official policy source and confirm eligibility for your location, investment, and employment plan.',
    caveat: 'Policy details can change and exact incentives depend on current eligibility rules.',
    evidence: matches.map(row => getEvidence(row, row.state + ' policy', row.policy_name)),
  };
}

function sectorAnswer(query: string, records: GccRecord[]): Answer | null {
  const pattern = /fintech|financial|bfsi/.test(query) ? /BFSI|Financial Services/i
    : /health|pharma/.test(query) ? /Healthcare|Pharma/i
    : /retail|consumer/.test(query) ? /Retail|Consumer/i : null;
  if (!pattern) return null;
  const matches = records.filter(row => pattern.test(row.sector));
  const rows = [...matches].sort((a, b) => score(b.confidence_score) - score(a.confidence_score)).slice(0, 3);
  if (!rows.length) return null;
  return {
    title: matches.length + ' matching GCC records in this directory',
    summary: 'These records provide examples of documented India GCC activity in the requested sector. They are directory examples, not a complete market count.',
    findings: rows.map((row, index) => ({ text: row.parent_company + ' — ' + row.primary_city + '; ' + row.sector + '.', citations: [index + 1] })),
    next: 'Open GCC Atlas to inspect the company records and their source fields.',
    caveat: 'A directory record does not verify current headcount or operating scale.',
    evidence: rows.map(row => getEvidence(row, row.parent_company, row.primary_city + ' · ' + row.verification_status)),
  };
}

function stakeholderAnswer(stakeholders: Stakeholder[]): Answer {
  const rows = stakeholders.filter(row => /advisor|managed|talent/i.test(row.category)).slice(0, 3);
  return {
    title: 'Stakeholders to validate for a GCC setup',
    summary: 'A GCC setup typically needs strategy, legal structure, workspace, and hiring support. The local stakeholder directory contains example profiles that should be checked before selection.',
    findings: rows.map((row, index) => ({ text: row.name + ' — ' + row.category + '; ' + row.services + '.', citations: [index + 1] })),
    next: 'Ask each provider for recent work in your target city, a scoped timeline, and client references.',
    caveat: 'Directory inclusion is not an endorsement or proof of delivery quality.',
    evidence: rows.map(row => getEvidence(row, row.name, row.category + ' · ' + row.profile_status)),
  };
}

function analyze(question: string, props: Props): Answer {
  const query = question.trim().toLowerCase();
  const bengaluru = findCity(props.cities, 'Bengaluru');
  const hyderabad = findCity(props.cities, 'Hyderabad');
  const pune = findCity(props.cities, 'Pune');
  const suggested = suggestedQuestions.findIndex(item => item.toLowerCase() === query);
  if (suggested === 0 && bengaluru && hyderabad) return makeComparison(bengaluru, hyderabad, 'ai-team');
  if (suggested === 1 && bengaluru && pune) return makeComparison(bengaluru, pune, 'engineering');
  if (suggested === 2 && hyderabad && pune) return makeComparison(hyderabad, pune, 'fintech');
  if (suggested === 3) return setupAnswer(props.assumptions);
  if (suggested === 4 && bengaluru && hyderabad) return makeComparison(bengaluru, hyderabad, 'ai-depth');
  if (suggested === 5 && bengaluru) return riskAnswer(bengaluru);
  if (suggested === 6) return policyAnswer(question, props.policies);
  const mentioned = props.cities.filter(city => query.includes(city.city.toLowerCase()));
  if (mentioned.length >= 2) return makeComparison(mentioned[0], mentioned[1], 'generic');
  if (/policy|incentive/.test(query)) return policyAnswer(question, props.policies);
  if (/\b(bot|eor|entity|build vs buy|setup route)\b/.test(query)) return setupAnswer(props.assumptions);
  if (/\b(risk|challenge)\b/.test(query) && mentioned.length) return riskAnswer(mentioned[0]);
  if (/\b(ai|ml|machine learning|talent)\b/.test(query) && bengaluru && hyderabad) return makeComparison(bengaluru, hyderabad, 'ai-depth');
  if (/\b(engineering|20-person)\b/.test(query) && bengaluru && pune) return makeComparison(bengaluru, pune, 'engineering');
  if (/stakeholder|advisor|provider/.test(query)) return stakeholderAnswer(props.stakeholders);
  const sector = sectorAnswer(query, props.records);
  if (sector) return sector;
  return {
    title: 'The current evidence cannot support that answer',
    summary: 'The local dataset does not contain enough verified detail for this question. Try a city comparison, sector example, setup route, or stakeholder category.',
    findings: [{ text: 'Narrow the question to a city, sector, role type, or setup decision covered by the current dataset.', citations: [] }],
    next: 'Choose a suggested question or narrow the request to a supported decision.',
    caveat: 'No recommendation was inferred from missing salary, policy, legal, or provider-quality data.',
    evidence: [],
  };
}

function Citation({ number, onClick }: { number: number; onClick: () => void }) {
  return <button className="analyst-citation" type="button" onClick={onClick} aria-label={'View citation ' + number}>[{number}]</button>;
}

export function AiAnalyst(props: Props) {
  const [draft, setDraft] = useState(suggestedQuestions[0]);
  const [submitted, setSubmitted] = useState(suggestedQuestions[0]);
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const [research, setResearch] = useState<ResearchState | null>(null);
  const controller = useRef<AbortController | null>(null);
  const isCustom = !suggestedQuestions.some(question => question.toLowerCase() === submitted.toLowerCase());
  const localAnswer = useMemo(() => analyze(submitted, props), [submitted, props.cities, props.records, props.stakeholders, props.assumptions, props.policies]);
  const useResearch = isCustom || research?.question === submitted;
  const answer = localAnswer;
  const isComparison = Boolean(localAnswer.tradeoffs);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort();
    setResearch(previous => previous && !['done', 'error'].includes(previous.stage)
      ? { ...previous, stage: 'error', error: 'Connections changed. Ask again to use the new settings.' }
      : previous);
  }, [props.aiConfigured, props.aiProvider, props.aiModel, props.searchConfigured]);

  const runResearch = (question: string) => {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setResearch({ question, stage: 'local', local: [], web: [], total: 0, warnings: [] });
    requestResearch(question, (event: ResearchEvent) => {
      if (nextController.signal.aborted) return;
      setResearch(previous => {
        if (!previous || previous.question !== question) return previous;
        if (event.stage === 'local') return { ...previous, local: event.results, entities: event.entities, total: event.total, stage: 'local-complete' };
        if (['planning', 'searching-web', 'searching-more', 'checking'].includes(event.stage)) return { ...previous, stage: event.stage as ResearchState['stage'] };
        if (event.stage === 'reading') return { ...previous, stage: 'reading', reading: { completed: event.completed, total: event.total } };
        if (event.stage === 'web') return { ...previous, web: event.results };
        if (event.stage === 'web-error') return { ...previous, warnings: [...previous.warnings, event.error], stage: 'web' };
        if (event.stage === 'web-unavailable') return { ...previous, warnings: [...previous.warnings, 'Google search is not connected. Add a Serper key in AI settings.'], stage: 'web' };
        if (event.stage === 'analyzing') return { ...previous, stage: 'analyzing' };
        if (event.stage === 'answer') return { ...previous, analysis: event.analysis, stage: 'done' };
        if (event.stage === 'analysis-error') return { ...previous, error: event.error, stage: 'error' };
        if (event.stage === 'analysis-unavailable') return { ...previous, warnings: [...previous.warnings, 'Connect an AI model in settings to synthesize these sources.'], stage: 'done' };
        if (event.stage === 'done') return { ...previous, stage: previous.error ? 'error' : 'done' };
        return previous;
      });
      if (event.stage === 'answer' || event.stage === 'done') setGeneratedAt(new Date());
    }, nextController.signal).catch(error => {
      if (!nextController.signal.aborted) setResearch(previous => previous?.question === question ? { ...previous, stage: 'error', error: (error as Error).message } : previous);
    });
  };

  const ask = (question: string) => {
    const value = question.trim();
    if (!value) return;
    setDraft(value);
    setSubmitted(value);
    setGeneratedAt(new Date());
    setShowSources(false);
    setCopied(false);
    if (props.aiConfigured || props.searchConfigured || !suggestedQuestions.some(item => item.toLowerCase() === value.toLowerCase())) runResearch(value);
    else { controller.current?.abort(); setResearch(null); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(draft);
  };
  const inspectSources = () => {
    if (!useResearch) setShowSources(true);
    window.setTimeout(() => document.getElementById(useResearch ? 'analyst-research-sources' : 'analyst-source-records')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(useResearch && research?.analysis ? reportText(submitted, research.analysis, [...research.local, ...research.web]) : [submitted, answer.title, answer.summary, ...(answer.findings || []).map(item => item.text), 'Caveat: ' + answer.caveat].join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const citationRecords = localAnswer.evidence.map((item, index) => ({ number: index + 1, title: item.title, detail: item.detail, source: item.sources[0] }));
  if (isComparison) {
    const existing = new Set<string>();
    for (const item of localAnswer.evidence) {
      for (const source of item.sources) {
        if (!/CBRE|ZINNOV/.test(source.id) || existing.has(source.id)) continue;
        existing.add(source.id);
        citationRecords.push({ number: citationRecords.length + 1, title: sourceLabels[source.id] || source.id, detail: 'Supporting market research', source });
      }
    }
  }
  const extraCitation = (side: number, label: string) => {
    const kind = /Cost/.test(label) ? 'CBRE' : /AI|Fintech|Engineering/.test(label) ? 'ZINNOV' : '';
    if (!kind) return null;
    const source = localAnswer.evidence[side]?.sources.find(item => item.id.includes(kind));
    return source ? citationRecords.find(item => item.source?.id === source.id && item.number > localAnswer.evidence.length)?.number || null : null;
  };
  const generated = generatedAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const findings = answer.findings || [];

  return <section className={'analyst-screen' + (useResearch ? ' analyst-has-research' : '')} id="analyst">
    <header className="analyst-hero">
      <p className="eyebrow">AI Analyst / Decision intelligence</p>
      <h1>Ask a question. Trace the answer.</h1>
      <p>Evidence-backed guidance for India GCC decisions, with every claim linked to inspectable sources.</p>
    </header>
    <form className="analyst-search" onSubmit={submit} role="search">
      <Search size={20} aria-hidden="true" />
      <label className="sr-only" htmlFor="analyst-question">Ask the AI Analyst a question</label>
      <input id="analyst-question" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Ask about cities, talent or GCC setup..." />
      {draft && <button className="analyst-clear" type="button" onClick={() => setDraft('')} aria-label="Clear question"><X size={18} /></button>}
      <span className="analyst-search-divider" />
      <button className="analyst-ask" type="submit" disabled={!draft.trim()}>Ask <ArrowRight size={18} /></button>
    </form>
    <div className="analyst-workspace">
      <aside className="analyst-questions analyst-panel">
        <h2><List size={20} /> Suggested questions</h2>
        <div className="analyst-question-list">{suggestedQuestions.map(question => <button key={question} className={submitted === question ? 'active' : ''} type="button" onClick={() => ask(question)}><span>{question}</span><ChevronRight size={18} /></button>)}</div>
      </aside>
      <article className="analyst-answer analyst-panel" aria-live="polite">
        <div className="analyst-answer-header">
          <div className="analyst-answer-title"><Sparkles size={22} /><h2>AI Analyst answer</h2></div>
          <span className="analyst-generated">Generated on {generated}</span>
        </div>
        <div className="analyst-answer-content">
          {useResearch ? <ResearchAnswer research={research} searchConfigured={props.searchConfigured} aiConfigured={props.aiConfigured} onOpenSettings={props.onOpenSettings} onRetry={() => runResearch(submitted)} onAsk={ask} onCopy={copy} copied={copied} /> : <>
          <section className="analyst-takeaway">
            <Target size={25} />
            <div><h3>Executive takeaway</h3><p>{answer.summary} {localAnswer.evidence.slice(0, 2).map((_, index) => <Citation key={index} number={index + 1} onClick={inspectSources} />)}</p></div>
          </section>
          {isComparison ? <>
            <h3 className="analyst-section-heading"><BarChart3 size={24} /> {answer.title}</h3>
            <div className="analyst-table-scroll"><table className="analyst-tradeoff-table">
              <thead><tr><th>Dimension</th>{localAnswer.evidence.slice(0, 2).map((city, index) => <th key={city.title} className={index === 0 ? 'left-city' : 'right-city'}><BuildingIcon index={index} /> {city.title}</th>)}</tr></thead>
              <tbody>{localAnswer.tradeoffs!.map(row => <tr key={row.label}>
                <th><row.Icon size={21} /><span>{row.label}</span></th>
                <td data-city={localAnswer.evidence[0]?.title}>{row.left} <Citation number={1} onClick={inspectSources} />{extraCitation(0, row.label) && <Citation number={extraCitation(0, row.label)!} onClick={inspectSources} />}</td>
                <td data-city={localAnswer.evidence[1]?.title}>{row.right} <Citation number={2} onClick={inspectSources} />{extraCitation(1, row.label) && <Citation number={extraCitation(1, row.label)!} onClick={inspectSources} />}</td>
              </tr>)}</tbody>
            </table></div>
          </> : <section className="analyst-brief"><h3 className="analyst-section-heading"><BarChart3 size={24} /> {answer.title}</h3>{findings.length > 0 ? <div className="analyst-brief-points">{findings.map((finding, index) => <p key={index}>{finding.text} {finding.citations.map(number => <Citation key={number} number={number} onClick={inspectSources} />)}</p>)}</div> : <p>{answer.summary}</p>}</section>}
          <div className="analyst-next">
            <Lightbulb size={27} />
            <div><strong>Recommended next step</strong><p>{answer.next}</p>{localAnswer.action === 'cities' && <button className="analyst-next-action" type="button" onClick={props.onOpenCityCompare}>Open City Compare <ExternalLink size={12} /></button>}{localAnswer.action === 'build' && <button className="analyst-next-action" type="button" onClick={props.onOpenBuildVsBuy}>Open Build vs Buy <ExternalLink size={12} /></button>}</div>
            {localAnswer.action && <button className="analyst-next-arrow" onClick={localAnswer.action === 'cities' ? props.onOpenCityCompare : props.onOpenBuildVsBuy} type="button" aria-label={localAnswer.action === 'cities' ? 'Go to City Compare' : 'Go to Build vs Buy'}><ChevronRight size={22} /></button>}
          </div>
          <p className="analyst-caveat"><CircleHelp size={17} /><span><strong>Caveat:</strong> {answer.caveat}</span></p>
          </>}
        </div>
      </article>
      <aside className={'analyst-evidence analyst-panel' + (useResearch ? ' analyst-evidence-snapshot' : '')}>
        <div className="analyst-evidence-heading"><h2><Database size={20} /> Evidence used</h2>{!useResearch && <button type="button" onClick={inspectSources}>Trace citations</button>}</div>
        {useResearch ? <ResearchSnapshot research={research} question={submitted} cities={props.cities} /> : localAnswer.evidence.length ? <>
          <div className="analyst-evidence-list">{localAnswer.evidence.map((item, index) => <article className="analyst-evidence-card" key={item.title + index}>
            <div className="analyst-evidence-main">
              {item.image ? <img src={item.image} alt={item.title + ' city landmark'} /> : <span className="analyst-evidence-placeholder"><FileSearch size={26} /></span>}
              <div><h3>{item.title}</h3><p>{item.detail}</p>
                <div className="analyst-meta"><File size={16} /> Source confidence: <strong>{item.confidence}%</strong> <CircleHelp size={13} /></div>
                <div className="analyst-meta"><CalendarDays size={16} /> Last checked: {item.checked === 'Not recorded' ? item.checked : /^\d{4}-\d{2}-\d{2}$/.test(item.checked) ? new Date(item.checked + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : item.checked}</div>
              </div>
            </div>
            <div className="analyst-source-chips">{item.sources.slice(0, 3).map(source => <span key={source.id}>{sourceLabels[source.id] ?? source.id}</span>)}</div>
          </article>)}</div>
          <section className="analyst-quality">
            <h3><BarChart3 size={19} /> Evidence confidence <CircleHelp size={14} /></h3>
            {localAnswer.evidence.map((item, index) => <div className="analyst-quality-row" key={item.title + index}><span>{item.title}</span><div><i style={{ width: Math.max(0, Math.min(item.confidence, 100)) + '%' }} className={index === 0 ? 'green' : 'blue'} /></div><b>{item.confidence}%</b></div>)}
          </section>
          <button className="analyst-inspect" type="button" onClick={inspectSources}><File size={21} /><span><strong>Inspect source records</strong><small>View the records and source IDs used in this analysis.</small></span><ChevronRight size={17} /></button>
        </> : <div className="analyst-empty-evidence"><FileSearch size={30} /><strong>No supporting records</strong><p>This question cannot be answered from the verified local evidence.</p></div>}
        {!useResearch && showSources && <section className="analyst-source-records" id="analyst-source-records"><div><h3>Source records</h3><button onClick={() => setShowSources(false)} type="button" aria-label="Close source records"><X size={16} /></button></div>{citationRecords.length ? citationRecords.map(record => <p key={record.number}><b>[{record.number}]</b> {record.source?.url ? <a href={record.source.url} target="_blank" rel="noreferrer">{record.title} <ExternalLink size={12} /></a> : <span>{record.title}</span>}<small>{record.detail} · {record.source?.id ?? 'Local dataset'}</small></p>) : <p>No source record is available for this question.</p>}<button className="analyst-copy" onClick={copy} type="button">{copied ? <Check size={15} /> : <File size={15} />}{copied ? 'Copied answer' : 'Copy answer'}</button></section>}
      </aside>
    </div>
  </section>;
}


function reportText(question: string, answer: LiveAnalysis, sources: ResearchEvidence[]) {
  const cite = (finding: LiveFinding) => finding.text + ' ' + finding.citations.map(number => '[' + number + ']').join(' ');
  return [
    question, answer.title, answer.scope || '', cite({ text: answer.summary, citations: answer.summaryCitations || [] }),
    ...(answer.comparison ? [answer.comparison.title, ['Factor', ...answer.comparison.columns].join(' | '), ...answer.comparison.rows.map(row => [row.factor, ...row.cells.map(cite)].join(' | '))] : []),
    ...(answer.sections || []).flatMap(section => [section.title, ...section.paragraphs.map(cite), ...section.bullets.map(cite)]),
    ...(answer.recommendation ? [answer.recommendation.choice, cite({ text: answer.recommendation.rationale, citations: answer.recommendation.citations })] : []),
    'Next step: ' + answer.next, 'Caveat: ' + answer.caveat,
    'Sources', ...sources.map(source => '[' + source.number + '] ' + source.title + (source.url ? ': ' + source.url : '')),
  ].filter(Boolean).join('\n\n');
}

function ResearchAnswer({ research, searchConfigured, aiConfigured, onOpenSettings, onRetry, onAsk, onCopy, copied }: {
  research: ResearchState | null;
  searchConfigured: boolean;
  aiConfigured: boolean;
  onOpenSettings: () => void;
  onRetry: () => void;
  onAsk: (question: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [activeSource, setActiveSource] = useState<number | null>(null);
  useEffect(() => { setSourcesOpen(false); setActiveSource(null); }, [research?.question]);
  const sources = [...(research?.local || []), ...(research?.web || [])];
  const busy = Boolean(research && !['done', 'error'].includes(research.stage));
  const analysis = research?.analysis;
  const openSource = (number: number) => {
    setSourcesOpen(true); setActiveSource(number);
    window.setTimeout(() => document.getElementById('research-source-' + number)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
  };
  const refs = (numbers: number[]) => numbers.map(number => <Citation key={number} number={number} onClick={() => openSource(number)} />);
  const progress = research?.stage === 'local' ? 'Checking GCC Compass data...' : research?.stage === 'planning' ? 'Exploring your question...' : research?.stage === 'reading' ? 'Reading sources' + (research.reading ? ' · ' + research.reading.completed + ' of ' + research.reading.total : '') + '...' : research?.stage === 'checking' ? 'Checking the evidence...' : research?.stage === 'searching-more' ? 'Researching the missing details...' : research?.stage === 'analyzing' ? 'Writing your analysis...' : 'Searching deeper...';
  return <div className="analyst-research" aria-busy={busy}>
    {busy && <div className="analyst-research-status" role="status"><span className="analyst-status-icon"><Sparkles size={20} /></span><div><strong>{progress}</strong><span>{sources.length ? 'Working with ' + sources.length + ' sources to answer your question.' : 'Gathering the context for a useful answer.'}</span></div><LoaderCircle className="spin" size={18} /></div>}
    {research?.error && <div className="analyst-live-error" role="alert"><span>{research.error}</span><button type="button" onClick={onRetry}>Retry research</button></div>}
    {research?.warnings.map((warning, index) => <p className="analyst-research-warning" key={index}><CircleHelp size={16} /> {warning} {!searchConfigured && warning.includes('Serper') && <button type="button" onClick={onOpenSettings}>Connect search</button>}{!aiConfigured && warning.includes('AI model') && <button type="button" onClick={onOpenSettings}>Connect AI</button>}</p>)}
    {analysis ? <>
      <section className="analyst-report-summary"><div className="analyst-report-heading"><Target size={22} /><h3>{analysis.title}</h3></div>{analysis.scope && <p className="analyst-report-scope">{analysis.scope}</p>}<p>{analysis.summary} {refs(analysis.summaryCitations || [])}</p></section>
      {analysis.comparison && <section className="analyst-report-comparison"><h3 className="analyst-section-heading"><BarChart3 size={21} />{analysis.comparison.title}</h3><div className="analyst-report-table-wrap"><table className="analyst-report-table"><thead><tr><th scope="col">Decision factor</th>{analysis.comparison.columns.map((column, index) => <th scope="col" key={column} className={index % 2 ? 'right-city' : 'left-city'}><BuildingIcon index={index} />{column}</th>)}</tr></thead><tbody>{analysis.comparison.rows.map((row, index) => <tr key={index}><th scope="row">{row.factor}</th>{row.cells.map((cell, col) => <td key={col} data-city={analysis.comparison!.columns[col]} className={cell.status === 'unknown' ? 'analyst-missing-metric' : ''}>{cell.text} {refs(cell.citations)}</td>)}</tr>)}</tbody></table></div></section>}
      {analysis.sections?.length ? <div className="analyst-report-sections">{analysis.sections.map((section, index) => <section key={index} className="analyst-report-section"><h3><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h3>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph.text} {refs(paragraph.citations)}</p>)}{section.bullets.length > 0 && <ul>{section.bullets.map((bullet, i) => <li key={i}>{bullet.text} {refs(bullet.citations)}</li>)}</ul>}</section>)}</div> : analysis.findings.length > 0 && <section className="analyst-research-findings"><h3 className="analyst-section-heading"><BarChart3 size={22} /> Key findings</h3><div className="analyst-research-findings-grid">{analysis.findings.map((finding, index) => <article key={index}><span className="analyst-research-index">{String(index + 1).padStart(2, '0')}</span><p>{finding.text} {refs(finding.citations)}</p></article>)}</div></section>}
      {analysis.recommendation && <section className="analyst-report-verdict"><span className="analyst-verdict-icon"><Check size={23} /></span><div><span className="analyst-verdict-label">The recommendation</span><h3>{analysis.recommendation.choice}</h3><p>{analysis.recommendation.rationale} {refs(analysis.recommendation.citations)}</p></div></section>}
      <div className="analyst-next"><Lightbulb size={25} /><div><strong>Recommended next step</strong><p>{analysis.next}</p></div></div>
      <p className="analyst-caveat"><CircleHelp size={17} /><span><strong>Evidence note:</strong> {analysis.caveat}</span></p>
      {analysis.followUps?.length ? <section className="analyst-report-followups"><h3>Explore further</h3>{analysis.followUps.map(question => <button key={question} type="button" onClick={() => onAsk(question)}><span>{question}</span><ArrowRight size={17} /></button>)}</section> : null}
    </> : busy ? <div className="analyst-research-skeleton" aria-hidden="true"><i /><i /><i /><div><i /><i /></div></div> : <section className="analyst-research-pending"><h3>{research?.error ? 'The analysis needs another attempt' : 'Sources found for this question'}</h3><p>{sources.length ? sources.length + ' source records available. ' : 'No matching source records found. '}{aiConfigured ? 'Review the sources below or retry the analysis.' : 'Connect an AI model to turn these results into an answer.'}</p></section>}
    {sources.length > 0 && !busy && <section className="analyst-report-sources" id="analyst-research-sources"><div className="analyst-report-actions"><button type="button" className="analyst-sources-toggle" aria-expanded={sourcesOpen} aria-controls="analyst-source-list" onClick={() => setSourcesOpen(!sourcesOpen)}><FileSearch size={18} /><span>Sources used <small>{sources.length}</small></span><ChevronDown size={16} className={sourcesOpen ? 'open' : ''} /></button>{analysis && <button className="analyst-copy" onClick={onCopy} type="button">{copied ? <Check size={15} /> : <File size={15} />}{copied ? 'Copied' : 'Copy answer'}</button>}</div>{sourcesOpen && <ol id="analyst-source-list" className="analyst-source-list">{sources.map(item => <li id={'research-source-' + item.number} key={item.number} className={item.number === activeSource ? 'active' : ''}><span className="analyst-source-number">{item.number}</span><div>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}<ExternalLink size={13} /></a> : <strong>{item.title}</strong>}<small>{item.type === 'local' ? 'Local dataset' : item.url ? new URL(item.url).hostname.replace(/^www\./, '') : 'Web source'}{item.type === 'web' ? ' · ' + (item.status === 'read' ? item.format === 'pdf' ? 'PDF report read' : 'Page read' : 'Search preview only') : ''}{item.publishedAt ? ' · ' + item.publishedAt.slice(0, 10) : ''}</small><p>{item.detail}</p>{item.status === 'preview' && item.reason && <span className="analyst-source-access">{item.reason}</span>}</div></li>)}</ol>}</section>}
  </div>;
}

function cityPicture(name: string) {
  const city = name.toLowerCase();
  if (city === 'bengaluru') return bengaluruImage;
  if (city === 'hyderabad') return hyderabadImage;
  if (city === 'pune') return puneImage;
  if (city === 'delhi ncr') return delhiImage;
  return null;
}

function ResearchSnapshot({ research, question, cities }: {
  research: ResearchState | null;
  question: string;
  cities: CityBenchmark[];
}) {
  const supportedCities = cities.filter(city =>
    research?.local.some(item => item.kind === 'city' && item.title.toLowerCase() === city.city.toLowerCase())
  );
  const namedCities = supportedCities.filter(city => research?.entities?.includes(city.city) || question.toLowerCase().includes(city.city.toLowerCase()) || (city.city === 'Delhi NCR' && /\b(delhi|ncr|gurgaon|gurugram|noida)\b/i.test(question)));
  const asksAboutCities = /\b(cities|city|location|talent|office|rent|hiring|cost)\b/i.test(question);
  const cards = (namedCities.length ? namedCities : asksAboutCities ? supportedCities : []).slice(0, 3);
  const localCount = research?.local.length || 0;
  const webCount = research?.web.filter(item => item.status === 'read').length || 0;
  return <div className="analyst-snapshot">
    {cards.length ? cards.map(city => {
      const picture = cityPicture(city.city);
      const count = Number.parseInt(city.gcc_sample_count, 10);
      const confidence = score(city.confidence_score);
      return <article className="analyst-snapshot-city" key={city.city}>
        {picture ? <img src={picture} alt={city.city + ' landmark'} /> : <div className="analyst-snapshot-placeholder"><Building2 size={29} aria-hidden="true" /></div>}
        <div className="analyst-snapshot-city-body">
          <h3>{city.city}</h3>
          <p>{city.state}</p>
          <div className="analyst-snapshot-metrics">
            {Number.isFinite(count) && <div><strong>{count.toLocaleString('en-IN')}</strong><span>GCC records in sample</span></div>}
            {confidence > 0 && <div><strong>{confidence}%</strong><span>Source confidence</span></div>}
          </div>
        </div>
      </article>;
    }) : null}
    {!cards.length && <div className="analyst-snapshot-coverage">
      <div><strong>{localCount}</strong><span>Local records reviewed</span></div>
      <div><strong>{webCount}</strong><span>Web pages read</span></div>
    </div>}
  </div>;
}

function BuildingIcon({ index }: { index: number }) {
  return index === 0 ? <Building2 className="analyst-city-icon" size={22} /> : <Landmark className="analyst-city-icon" size={22} />;
}



