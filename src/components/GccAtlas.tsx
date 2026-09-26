import {
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  Filter,
  Flag,
  Globe2,
  Info,
  Link2,
  MapPin,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GccRecord } from '../data';
import { score, splitList } from '../data/csv';
import { CompanyLogo } from './CompanyLogo';

type GccAtlasProps = {
  records: GccRecord[];
  onOpenAnalyst: () => void;
};

type Tab = 'overview' | 'sources' | 'verification' | 'insights' | 'related';
type SortBy = 'Relevance' | 'Confidence' | 'Company';

type DisplayRecord = {
  confidence: number;
  status: 'Verified' | 'Needs review';
  sector: string;
  functions: string;
  headcount: string;
  primaryCity: string;
  otherCities: string;
  country: string;
  indianEntity: string;
  mcaCin: string;
  globalHq: string;
  year: string;
  sourceCount: number;
  lastChecked: string;
  knownFieldCount: number;
};

type SourceItem = {
  label: string;
  url: string;
};

const preferredOrder = [
  '3M',
  'A.P. Moller - Maersk',
  'Microsoft',
  'Google',
  'Amazon',
  'JPMorgan Chase',
  'Accenture',
  'Intel',
  'Philips',
  'Siemens',
  'Caterpillar',
  'Bosch',
  "L'Oreal",
  'HSBC',
  'Shell',
];

const companyDomains: Record<string, string> = {
  '3M': '3m.com',
  'A.P. Moller - Maersk': 'maersk.com',
  Microsoft: 'microsoft.com',
  Google: 'google.com',
  Amazon: 'amazon.com',
  'JPMorgan Chase': 'jpmorganchase.com',
  Accenture: 'accenture.com',
  Intel: 'intel.com',
  Philips: 'philips.com',
  Siemens: 'siemens.com',
  Caterpillar: 'caterpillar.com',
  Bosch: 'bosch.com',
  "L'Oreal": 'loreal.com',
  HSBC: 'hsbc.com',
  Shell: 'shell.com',
};

export function GccAtlas({ records, onOpenAnalyst }: GccAtlasProps) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [sector, setSector] = useState('All sectors');
  const [fn, setFn] = useState('All functions');
  const [status, setStatus] = useState('All statuses');
  const [minimumConfidence, setMinimumConfidence] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>('Relevance');
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const baseRecords = useMemo(() => sortRecords(records), [records]);
  const [selectedId, setSelectedId] = useState(() => baseRecords[0]?.gcc_id ?? '');
  const selected = baseRecords.find((record) => record.gcc_id === selectedId) ?? baseRecords[0] ?? null;

  const cities = useMemo(() => optionList(records.flatMap((record) => [getDisplayRecord(record).primaryCity, ...splitList(getDisplayRecord(record).otherCities)])), [records]);
  const sectors = useMemo(() => optionList(records.map((record) => getDisplayRecord(record).sector)), [records]);
  const functions = useMemo(() => optionList(records.flatMap((record) => splitList(getDisplayRecord(record).functions))), [records]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const next = baseRecords
      .filter((record) => {
        const display = getDisplayRecord(record);
        return city === 'All cities' || display.primaryCity === city || splitList(display.otherCities).includes(city) || record.cities.includes(city);
      })
      .filter((record) => sector === 'All sectors' || getDisplayRecord(record).sector === sector)
      .filter((record) => fn === 'All functions' || splitList(getDisplayRecord(record).functions).includes(fn))
      .filter((record) => status === 'All statuses' || getDisplayRecord(record).status === status)
      .filter((record) => getDisplayRecord(record).confidence >= minimumConfidence)
      .filter((record) => {
        if (!search) return true;
        const display = getDisplayRecord(record);
        return [record.parent_company, display.country, display.primaryCity, display.otherCities, display.sector, display.functions, getSources(record).map((source) => source.label).join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(search);
      });

    if (sortBy === 'Company') return [...next].sort((a, b) => a.parent_company.localeCompare(b.parent_company));
    if (sortBy === 'Confidence') return [...next].sort((a, b) => getDisplayRecord(b).confidence - getDisplayRecord(a).confidence);
    return next;
  }, [baseRecords, city, fn, minimumConfidence, query, sector, sortBy, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = filtered.length ? (safePage - 1) * pageSize : 0;
  const pageRows = filtered.slice(start, start + pageSize);
  const pageNumbers = paginationRange(safePage, pageCount);
  const relatedRecords = selected ? baseRecords.filter((record) => record.gcc_id !== selected.gcc_id && isRelatedRecord(record, selected)).slice(0, 6) : [];

  const resetPage = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const exportRows = (scope: 'page' | 'filtered') => {
    const rows = scope === 'page' ? pageRows : filtered;
    const csv = makeCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gcc-atlas-${scope}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const selectRecord = (record: GccRecord) => {
    setSelectedId(record.gcc_id);
    setActiveTab('overview');
  };

  return (
    <section className="atlas-screen" id="atlas">
      <div className="atlas-hero">
        <div>
          <p className="atlas-eyebrow">GCC Atlas</p>
          <h1>Explore {records.length.toLocaleString()}+ GCCs in India</h1>
          <p>Consolidated from source-linked records. Search, filter and verify GCC records with transparent evidence.</p>
        </div>
        <div className="atlas-hero-actions">
          <div className="atlas-count-card"><Database size={24} /><span><strong>{records.length.toLocaleString()}</strong> companies<br /><strong>{records.reduce((sum, record) => sum + Math.max(1, splitList(record.cities).length), 0).toLocaleString()}</strong> listed delivery locations</span></div>
          <div className="atlas-export-menu">
            <button className="atlas-export-button" onClick={() => setExportOpen((open) => !open)} aria-expanded={exportOpen}><Download size={15} />Export <ChevronDown size={15} /></button>
            {exportOpen ? <div className="atlas-export-popover"><button onClick={() => exportRows('page')}>Current page CSV</button><button onClick={() => exportRows('filtered')}>Filtered results CSV</button></div> : null}
          </div>
        </div>
      </div>

      <div className="atlas-shell">
        <div className="atlas-left-pane">
          <div className="atlas-filter-bar">
            <label className="atlas-search-box"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search company, city, sector, source..." /></label>
            <FilterSelect label="City" value={city} onChange={resetPage(setCity)} options={['All cities', ...cities]} />
            <FilterSelect label="Sector" value={sector} onChange={resetPage(setSector)} options={['All sectors', ...sectors]} />
            <FilterSelect label="Function" value={fn} onChange={resetPage(setFn)} options={['All functions', ...functions]} />
            <label className="atlas-confidence-filter"><span>Confidence</span><div><small>{minimumConfidence}%</small><input type="range" min="0" max="100" step="5" value={minimumConfidence} onChange={(event) => { setMinimumConfidence(Number(event.target.value)); setPage(1); }} /><small>100%</small></div></label>
            <FilterSelect label="Verification status" value={status} onChange={resetPage(setStatus)} options={['All statuses', 'Verified', 'Needs review']} />
            <button className="atlas-more-button" onClick={() => { setQuery(''); setCity('All cities'); setSector('All sectors'); setFn('All functions'); setStatus('All statuses'); setMinimumConfidence(0); setPage(1); }}><Filter size={15} />Clear filters</button>
          </div>

          <div className="atlas-table-toolbar">
            <span>Showing {filtered.length ? start + 1 : 0}-{Math.min(start + pageSize, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()} GCCs</span>
            <label>Sort by<select value={sortBy} onChange={(event) => { setSortBy(event.target.value as SortBy); setPage(1); }}><option>Relevance</option><option>Confidence</option><option>Company</option></select></label>
          </div>

          <div className="atlas-table-wrap" tabIndex={0} aria-label="GCC records table with horizontal and vertical scroll">
            <table className="atlas-table">
              <thead><tr><th>#</th><th>Company</th><th>Parent HQ</th><th>City (Primary)</th><th>Other Cities</th><th>Sector</th><th>Key Functions</th><th>Headcount</th><th>Verification</th><th>Sources</th><th>Confidence <Info size={12} /></th><th /></tr></thead>
              <tbody>{pageRows.map((record, index) => <AtlasRow key={record.gcc_id} index={start + index + 1} record={record} selected={selected?.gcc_id === record.gcc_id} onSelect={() => selectRecord(record)} />)}</tbody>
            </table>
          </div>

          <div className="atlas-pagination">
            <button disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={15} /></button>
            {pageNumbers.map((item, index) => item === 'gap' ? <span key={`gap-${index}`}>...</span> : <button key={item} className={item === safePage ? 'active' : ''} onClick={() => setPage(item)}>{item}</button>)}
            <button disabled={safePage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight size={15} /></button>
            <label>Show<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value="15">15 per page</option><option value="25">25 per page</option><option value="50">50 per page</option></select></label>
          </div>
        </div>

        <aside className="atlas-detail-panel">
          {selected ? <AtlasDetail record={selected} activeTab={activeTab} setActiveTab={setActiveTab} relatedRecords={relatedRecords} onSelectRelated={selectRecord} onOpenAnalyst={onOpenAnalyst} /> : <p className="empty-state">Select a company to inspect its source-linked dossier.</p>}
        </aside>
      </div>
    </section>
  );
}

function AtlasRow({ index, record, selected, onSelect }: { index: number; record: GccRecord; selected: boolean; onSelect: () => void }) {
  const display = getDisplayRecord(record);
  const sources = getSources(record);
  return (
    <tr className={selected ? 'selected' : ''} onClick={onSelect}>
      <td>{index}</td>
      <td><div className="atlas-company-cell"><CompanyLogo name={record.parent_company} domain={companyDomains[record.parent_company]} size={30} className="atlas-company-logo" /><span>{shortName(record.parent_company)}</span></div></td>
      <td><span className="country-cell">{countryName(display.country)}</span></td>
      <td>{display.primaryCity}</td>
      <td>{display.otherCities}</td>
      <td><span className={`sector-pill ${sectorTone(display.sector)}`}>{display.sector}</span></td>
      <td>{display.functions}</td>
      <td>{display.headcount}</td>
      <td><StatusPill record={record} /></td>
      <td><SourceCell sources={sources} /></td>
      <td><div className="confidence-cell"><strong>{display.confidence}%</strong><span><i style={{ width: `${display.confidence}%` }} /></span></div></td>
      <td><ChevronRight size={16} /></td>
    </tr>
  );
}

function AtlasDetail({ record, activeTab, setActiveTab, relatedRecords, onSelectRelated, onOpenAnalyst }: { record: GccRecord; activeTab: Tab; setActiveTab: (tab: Tab) => void; relatedRecords: GccRecord[]; onSelectRelated: (record: GccRecord) => void; onOpenAnalyst: () => void }) {
  const display = getDisplayRecord(record);
  const confidence = display.confidence;
  const sources = getSources(record);
  const verified = display.status === 'Verified';
  const tabs: Array<[Tab, string]> = [['overview', 'Overview'], ['sources', `Sources (${sources.length})`], ['verification', 'Verification'], ['insights', 'Insights'], ['related', 'Related']];

  const openCorrection = () => {
    const subject = encodeURIComponent(`Correction for ${record.parent_company} in GCC Atlas`);
    const body = encodeURIComponent(`Company: ${record.parent_company}\nRecord ID: ${record.gcc_id}\nCurrent source links: ${sources.map((source) => source.url).join(', ') || 'None listed'}\n\nSuggested correction:`);
    window.location.href = `mailto:research@gcc-compass.local?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <button className="atlas-detail-close" aria-label="Close detail"><X size={18} /></button>
      <div className="atlas-detail-hero"><CompanyLogo name={record.parent_company} domain={companyDomains[record.parent_company]} size={58} className="atlas-detail-logo" /><div><h2>{record.parent_company} India Capability Centre</h2><p>{display.sector} <span>|</span> {countryName(display.country)} (HQ)</p><small>{sources.length} linked source{sources.length === 1 ? '' : 's'} - Last checked {display.lastChecked}</small></div><StatusPill record={record} /></div>
      <div className="atlas-tabs">{tabs.map(([tab, label]) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{label}</button>)}</div>

      <div className="atlas-tab-panel">
        {activeTab === 'overview' ? <OverviewPanel record={record} display={display} confidence={confidence} verified={verified} /> : null}
        {activeTab === 'sources' ? <SourcesPanel sources={sources} record={record} /> : null}
        {activeTab === 'verification' ? <VerificationPanel record={record} display={display} verified={verified} confidence={confidence} /> : null}
        {activeTab === 'insights' ? <InsightsPanel record={record} display={display} /> : null}
        {activeTab === 'related' ? <RelatedPanel records={relatedRecords} onSelect={onSelectRelated} /> : null}
      </div>

      <div className="atlas-detail-actions"><button onClick={onOpenAnalyst}><Sparkles size={16} />Open in AI Analyst</button><button onClick={openCorrection}><Flag size={16} />Submit a correction</button></div>
    </>
  );
}

function OverviewPanel({ record, display, confidence, verified }: { record: GccRecord; display: DisplayRecord; confidence: number; verified: boolean }) {
  return (
    <>
      <div className="atlas-detail-grid">
        <section className="atlas-score-card"><h3>Confidence score <Info size={13} /></h3><div><strong>{confidence}%</strong><span>{confidence >= 80 ? 'High confidence' : confidence >= 60 ? 'Review advised' : 'Low confidence'}</span></div><i><b style={{ width: `${confidence}%` }} /></i></section>
        <section className={`atlas-verification-card ${verified ? 'verified' : 'review'}`}><h3>Verification status</h3><strong>{verified ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}{verified ? 'Verified' : 'Needs review'}</strong><p>{verified ? 'Record meets confidence or verification criteria in the dataset.' : 'Record is source-linked but requires manual confirmation before canonical use.'}</p></section>
      </div>
      <section className="atlas-key-card"><h3>Key details</h3><DetailRow icon={MapPin} label="Primary city" value={display.primaryCity} /><DetailRow icon={MapPin} label="Other cities (delivery units)" value={display.otherCities} /><DetailRow icon={Building2} label="Indian entity" value={display.indianEntity} /><DetailRow icon={FileCheck2} label="MCA CIN" value={display.mcaCin} /><DetailRow icon={Globe2} label="Parent company" value={record.parent_company} external /><DetailRow icon={Globe2} label="Global HQ" value={display.globalHq} /><DetailRow icon={Info} label="Sector" value={display.sector} /><DetailRow icon={Users} label="Key functions" value={display.functions} chips /><DetailRow icon={Users} label="Estimated headcount" value={display.headcount} /><DetailRow icon={Calendar} label="Year of setup (India)" value={display.year} /></section>
    </>
  );
}

function SourcesPanel({ sources, record }: { sources: SourceItem[]; record: GccRecord }) {
  return (
    <section className="atlas-sources-card full"><div><h3>Data sources ({sources.length})</h3><span>Every source below is linked from this record.</span></div>{sources.length ? <div className="atlas-source-list">{sources.map((source, index) => <a className="atlas-source-row" href={source.url} target="_blank" rel="noreferrer" key={`${source.label}-${index}`}><span><Link2 size={14} />{source.label}</span><b>#{index + 1}</b><ExternalLink size={13} /></a>)}</div> : <p className="atlas-empty-note">No source URL is listed for {record.parent_company}.</p>}</section>
  );
}

function VerificationPanel({ record, display, verified, confidence }: { record: GccRecord; display: DisplayRecord; verified: boolean; confidence: number }) {
  return (
    <>
      <div className="atlas-note-grid"><section className="atlas-note-card blue"><h3><Info size={16} />Verification notes</h3><p>{record.notes}</p></section><section className="atlas-note-card amber"><h3><Flag size={16} />Caveats</h3><ul><li>Confidence score in dataset: {confidence}%.</li><li>Source links listed: {display.sourceCount}.</li><li>Last checked: {display.lastChecked}.</li><li>Status: {verified ? 'verified' : 'needs review'}.</li></ul></section></div>
      <section className="atlas-key-card compact"><h3>Record completeness</h3><DetailRow icon={FileCheck2} label="Known core fields" value={`${display.knownFieldCount}/9`} /><DetailRow icon={Database} label="Source records" value={`${display.sourceCount}`} /><DetailRow icon={Calendar} label="Last checked" value={display.lastChecked} /></section>
    </>
  );
}

function InsightsPanel({ record, display }: { record: GccRecord; display: DisplayRecord }) {
  return (
    <section className="atlas-key-card compact"><h3>Data-backed insights</h3><DetailRow icon={MapPin} label="Footprint" value={`${display.primaryCity}${display.otherCities !== 'Not available' ? ` + ${splitList(display.otherCities).length} other listed cities` : ''}`} /><DetailRow icon={Users} label="Function profile" value={display.functions} /><DetailRow icon={Building2} label="Maturity stage" value={clean(record.maturity_stage)} /><DetailRow icon={Calendar} label="Setup year" value={display.year} /><p className="atlas-empty-note">Insights are derived only from the selected record fields and linked source metadata.</p></section>
  );
}

function RelatedPanel({ records, onSelect }: { records: GccRecord[]; onSelect: (record: GccRecord) => void }) {
  return <section className="atlas-related-card"><h3>Related GCC records</h3>{records.length ? <div className="atlas-related-list">{records.map((record) => { const display = getDisplayRecord(record); return <button key={record.gcc_id} onClick={() => onSelect(record)}><CompanyLogo name={record.parent_company} domain={companyDomains[record.parent_company]} size={24} /><span><b>{record.parent_company}</b><small>{display.primaryCity} - {display.sector}</small></span><ChevronRight size={14} /></button>; })}</div> : <p className="atlas-empty-note">No close related records found by city or sector.</p>}</section>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="atlas-select-filter"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function DetailRow({ icon: Icon, label, value, external, chips }: { icon: LucideIcon; label: string; value: string; external?: boolean; chips?: boolean }) {
  const cleanValue = clean(value);
  return <div className="atlas-detail-row"><Icon size={15} /><span>{label}</span>{chips && cleanValue !== 'Not available' ? <p className="detail-function-chips">{splitList(cleanValue).slice(0, 4).map((item) => <b key={item}>{item}</b>)}</p> : <strong className={cleanValue === 'Not available' ? 'muted-value' : ''}>{cleanValue}{external ? <ExternalLink size={13} /> : null}</strong>}</div>;
}

function StatusPill({ record }: { record: GccRecord }) {
  const label = getDisplayRecord(record).status;
  return <span className={`atlas-status-pill ${label === 'Verified' ? 'verified' : 'review'}`}>{label === 'Verified' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{label}</span>;
}

function SourceCell({ sources }: { sources: SourceItem[] }) {
  if (!sources.length) return <span className="source-link-cell muted">No link</span>;
  return <a className="source-link-cell" href={sources[0].url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}><Link2 size={13} />{sources.length} source{sources.length === 1 ? '' : 's'}</a>;
}

function getDisplayRecord(record: GccRecord): DisplayRecord {
  const sources = getSources(record);
  const fields = [record.parent_company, record.primary_city, record.cities, record.sector, record.functions, record.headcount_band, record.indian_entity_name, record.mca_cin, record.year_established];
  return {
    confidence: score(record.confidence_score),
    status: statusLabel(record),
    sector: sectorLabel(record.sector),
    functions: functionsLabel(record.functions),
    headcount: headcountLabel(record.headcount_band),
    primaryCity: clean(record.primary_city),
    otherCities: otherCities(record),
    country: countryName(record.parent_country),
    indianEntity: clean(record.indian_entity_name),
    mcaCin: clean(record.mca_cin),
    globalHq: clean(record.parent_country),
    year: yearLabel(record.year_established),
    sourceCount: sources.length,
    lastChecked: clean(record.last_checked),
    knownFieldCount: fields.filter((field) => clean(field) !== 'Not available').length,
  };
}

function getSources(record: GccRecord): SourceItem[] {
  const ids = splitList(record.source_ids);
  const urls = splitList(record.source_urls);
  return ids.map((id, index) => ({ label: sourceLabel(id), url: urls[index] ?? urls[0] ?? '#' })).filter((source) => source.url !== '#');
}

function sortRecords(records: GccRecord[]) {
  const byName = new Map(records.map((record) => [record.parent_company, record]));
  const preferred = preferredOrder.map((name) => byName.get(name)).filter(Boolean) as GccRecord[];
  const preferredIds = new Set(preferred.map((record) => record.gcc_id));
  return [...preferred, ...records.filter((record) => !preferredIds.has(record.gcc_id))];
}

function paginationRange(page: number, pageCount: number): Array<number | 'gap'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const middle = [page - 1, page, page + 1].filter((item) => item > 1 && item < pageCount);
  return [1, ...(middle[0] && middle[0] > 2 ? ['gap' as const] : []), ...middle, ...(middle[middle.length - 1] && middle[middle.length - 1] < pageCount - 1 ? ['gap' as const] : []), pageCount];
}

function makeCsv(records: GccRecord[]) {
  const header = ['Company', 'Parent HQ', 'Primary city', 'Other cities', 'Sector', 'Functions', 'Headcount', 'Verification', 'Confidence', 'Source URLs'];
  const rows = records.map((record) => {
    const display = getDisplayRecord(record);
    return [record.parent_company, countryName(display.country), display.primaryCity, display.otherCities, display.sector, display.functions, display.headcount, display.status, `${display.confidence}%`, getSources(record).map((source) => source.url).join('; ')];
  });
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
}

function optionList(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && value !== 'Not available'))).sort((a, b) => a.localeCompare(b)).slice(0, 120);
}

function statusLabel(record: GccRecord): 'Verified' | 'Needs review' {
  return /cross-directory|verified/i.test(record.verification_status) || score(record.confidence_score) >= 80 ? 'Verified' : 'Needs review';
}

function clean(value?: string) {
  return value && value !== 'Unknown' ? value : 'Not available';
}

function shortName(name: string) {
  return name.replace('A.P. Moller - ', '').replace('JPMorgan Chase', 'JPMorgan Chase');
}

function countryName(value: string) {
  const cleanValue = clean(value);
  if (cleanValue.includes(',')) return cleanValue.split(',').pop()?.trim() ?? cleanValue;
  return cleanValue;
}

function countryCode(value: string) {
  const country = countryName(value).toUpperCase();
  if (country.includes('UNITED STATES') || country === 'USA') return 'US';
  if (country.includes('DENMARK')) return 'DK';
  if (country.includes('GERMANY')) return 'DE';
  if (country.includes('IRELAND')) return 'IE';
  if (country.includes('NETHERLANDS')) return 'NL';
  if (country.includes('FRANCE')) return 'FR';
  if (country.includes('UK')) return 'UK';
  if (country === 'NOT AVAILABLE') return 'NA';
  return country.slice(0, 2);
}

function sectorLabel(value: string) {
  return clean(value).replace('Engineering & Industrial', 'Industrial').replace('Logistics & Transportation', 'Logistics').replace('Consulting & Professional Services', 'Professional Services').replace('Healthcare & Pharma', 'Healthcare').replace('Retail & Consumer', 'Consumer Goods');
}

function sectorTone(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes('technology')) return 'technology';
  if (lower.includes('logistics')) return 'logistics';
  if (lower.includes('bfsi') || lower.includes('financial')) return 'bfsi';
  if (lower.includes('health')) return 'healthcare';
  if (lower.includes('retail') || lower.includes('consumer') || lower.includes('commerce')) return 'consumer';
  return 'industrial';
}

function otherCities(record: GccRecord) {
  return splitList(record.cities).filter((item) => item !== record.primary_city).slice(0, 3).join(', ') || 'Not available';
}

function functionsLabel(value: string) {
  const list = splitList(value);
  if (!list.length) return 'Not available';
  return list.slice(0, 3).join(', ');
}

function headcountLabel(value: string) {
  return clean(value).replace(' people', '').replace('-', ' - ');
}

function yearLabel(value: string) {
  if (!value || value === 'Unknown') return 'Not available';
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? `${parsed}` : clean(value);
}

function sourceLabel(source: string) {
  return source.replace('SRC_', '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRelatedRecord(record: GccRecord, selected: GccRecord) {
  const recordDisplay = getDisplayRecord(record);
  const selectedDisplay = getDisplayRecord(selected);
  return recordDisplay.primaryCity === selectedDisplay.primaryCity || recordDisplay.sector === selectedDisplay.sector;
}



