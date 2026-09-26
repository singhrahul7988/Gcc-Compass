import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bell, Building2, CalendarDays, Check, ChevronLeft, ChevronRight, ExternalLink, MapPin, Search, Target, UsersRound, X } from 'lucide-react';
import type { GccRecord } from '../data';
import { splitList } from '../data/csv';
import { companyLogoUrl } from './CompanyLogo';
import { EcosystemDropdown } from './EcosystemDropdown';
import { buildOpportunities, daysSince, reportedDate, teamBand } from './opportunityData';
import type { Opportunity, OpportunityTab } from './opportunityData';
import './opportunities.css';

const PAGE_SIZE = 6;
const NOTIFICATION_KEY = 'gcc-compass-opportunity-notifications';
const INTEREST_KEY = 'gcc-compass-opportunity-interest-drafts';
type Filters = { query: string; fn: string; size: string; industry: string; city: string; period: string };
const emptyFilters: Filters = { query: '', fn: '', size: '', industry: '', city: '', period: '30' };
type OpportunityDialog = { kind: 'company' | 'interest'; opportunity: Opportunity };

export function Opportunities({ records, onClaim }: { records: GccRecord[]; onClaim: () => void }) {
  const opportunities = useMemo(() => buildOpportunities(records), [records]);
  const [tab, setTab] = useState<OpportunityTab>('open');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [detailDismissed, setDetailDismissed] = useState(false);
  const [dialog, setDialog] = useState<OpportunityDialog | null>(null);
  const [notifications, setNotifications] = useState(() => { try { return localStorage.getItem(NOTIFICATION_KEY) !== 'off'; } catch { return true; } });
  const [notificationFeedback, setNotificationFeedback] = useState('');
  const detailRef = useRef<HTMLElement>(null);
  const filtered = useMemo(() => opportunities.filter(opportunity => {
    const search = [opportunity.company.parent_company, opportunity.company.sector, opportunity.title, opportunity.description, opportunity.teamSize, ...opportunity.focus, ...opportunity.cities].join(' ').toLowerCase();
    return opportunity.status === tab && search.includes(filters.query.trim().toLowerCase()) && (!filters.fn || opportunity.focus.includes(filters.fn)) && (!filters.size || teamBand(opportunity) === filters.size) && (!filters.industry || opportunity.company.sector === filters.industry) && (!filters.city || opportunity.cities.includes(filters.city)) && (!filters.period || daysSince(opportunity.date) <= Number(filters.period));
  }), [opportunities, filters, tab]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const selected = detailDismissed ? null : visible.find(opportunity => opportunity.id === selectedId) || visible[0] || null;
  const hasFilters = filters.query || filters.fn || filters.size || filters.industry || filters.city || filters.period !== '30';
  const options = (field: 'focus' | 'cities' | 'industry') => [...new Set(opportunities.flatMap(opportunity => field === 'industry' ? [opportunity.company.sector] : opportunity[field]))].filter(value => value !== 'Unknown').sort();
  const changeFilter = (field: keyof Filters, value: string) => { setFilters(previous => ({ ...previous, [field]: value })); setPage(1); setDetailDismissed(false); };
  const changeTab = (next: OpportunityTab) => { setTab(next); setPage(1); setSelectedId(''); setDetailDismissed(false); };
  const reset = () => { setFilters(emptyFilters); setPage(1); setDetailDismissed(false); };
  const selectOpportunity = (opportunity: Opportunity) => {
    setSelectedId(opportunity.id); setDetailDismissed(false);
    if (matchMedia('(max-width: 1200px)').matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
  };

  return <section className="opportunities-content" aria-labelledby="opportunities-title">
    <header className="opportunities-hero">
      <div><p className="opportunities-eyebrow">Opportunities</p><h1 id="opportunities-title">GCC opportunities in India</h1><p className="opportunities-subtitle">Company expansions and announced GCC plans from published sources.</p></div>
      <div className="opportunities-claim-banner"><span className="opportunities-target"><Target size={23} /></span><div><h2>Connect with GCC buyers</h2><p>Showcase your expertise and published evidence.</p></div><button className="ecosystem-primary" onClick={onClaim}>Claim profile <ArrowRight size={14} /></button></div>
    </header>
    <div className="opportunities-controls">
      <div className="opportunities-toolbar">
        <div className="opportunities-tabs" role="tablist" aria-label="Opportunity status" onKeyDown={event => {
          const tabs: OpportunityTab[] = ['open', 'upcoming', 'closed'];
          const index = tabs.indexOf(tab);
          const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : -1;
          if (next >= 0) { event.preventDefault(); changeTab(tabs[next]); event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next].focus(); }
        }}>
          {(['open', 'upcoming', 'closed'] as OpportunityTab[]).map(status => <button key={status} id={`opportunity-tab-${status}`} role="tab" aria-controls="opportunities-results" aria-selected={tab === status} tabIndex={tab === status ? 0 : -1} className={tab === status ? 'active' : ''} onClick={() => changeTab(status)}>{status === 'open' ? 'Open opportunities' : status === 'upcoming' ? 'Upcoming' : 'Closed'}</button>)}
        </div>
        <div className="opportunities-notify"><span className="opportunities-notify-icon"><Bell size={18} /></span><div><strong>Get notified</strong><p>{notificationFeedback || 'Notification preference for this browser'}</p></div><button className={notifications ? 'on' : ''} role="switch" aria-checked={notifications} aria-label="Opportunity notifications" onClick={() => { const next = !notifications; setNotifications(next); try { localStorage.setItem(NOTIFICATION_KEY, next ? 'on' : 'off'); setNotificationFeedback('Preference saved in this browser'); } catch { setNotificationFeedback('Preference changed for this session'); } }}><span /></button></div>
      </div>
      <div className="opportunities-filterbar">
        <label className="opportunities-search"><Search size={17} /><input aria-label="Search opportunities" placeholder="Company or keyword" value={filters.query} onChange={event => changeFilter('query', event.target.value)} />{filters.query && <button aria-label="Clear opportunity search" onClick={() => changeFilter('query', '')}><X size={15} /></button>}</label>
        <OpportunityFilter label="Function" defaultLabel="All functions" value={filters.fn} options={options('focus')} onChange={value => changeFilter('fn', value)} />
        <OpportunityFilter label="Team size" defaultLabel="All sizes" value={filters.size} options={[['small', '1–99'], ['medium', '100–249'], ['large', '250–499'], ['enterprise', '500+'], ['unknown', 'Not disclosed']]} onChange={value => changeFilter('size', value)} />
        <OpportunityFilter label="Industry" defaultLabel="All industries" value={filters.industry} options={options('industry')} onChange={value => changeFilter('industry', value)} />
        <OpportunityFilter label="Location preference" defaultLabel="All cities" value={filters.city} options={options('cities')} onChange={value => changeFilter('city', value)} />
        <OpportunityFilter label="Reported in" defaultLabel="All dates" value={filters.period} options={[['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last year']]} onChange={value => changeFilter('period', value)} />
      </div>
    </div>
    <div className={`opportunities-workspace ${selected ? '' : 'without-detail'}`} id="opportunities-results" role="tabpanel" aria-labelledby={`opportunity-tab-${tab}`}>
      <div className="opportunities-list-column">
        <div className="opportunities-results-heading"><p role="status">{filtered.length ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} opportunities` : 'Showing 0 opportunities'}</p>{hasFilters && <button onClick={reset}>Reset filters <X size={13} /></button>}</div>
        <div className="opportunities-list">
          {visible.map(opportunity => <button className={`opportunity-row ${selected?.id === opportunity.id ? 'selected' : ''}`} key={opportunity.id} aria-label={`View opportunity: ${opportunity.company.parent_company} — ${opportunity.title}`} aria-pressed={selected?.id === opportunity.id} onClick={() => selectOpportunity(opportunity)}>
            <OpportunityLogo opportunity={opportunity} />
            <div className="opportunity-row-description"><p><span>{opportunity.company.parent_company}</span><i>•</i><span>{opportunity.company.sector}</span></p><h2>{opportunity.title}</h2><div className="opportunity-tags">{opportunity.focus.slice(0, 3).map(focus => <span key={focus}>{focus}</span>)}</div></div>
            <div className="opportunity-row-facts"><div className="opportunity-row-location"><MapPin size={14} /><div><span>{opportunity.cities[0] || 'Not disclosed'}{opportunity.cities.length > 1 ? ' (Primary)' : ''}</span>{opportunity.cities.length > 1 && <small>Also reported: {opportunity.cities.slice(1).join(', ')}</small>}</div></div>
            <div className="opportunity-row-meta"><p><UsersRound size={14} /><span>{opportunity.teamSize}</span></p><p><CalendarDays size={14} /><span title={reportedDate(opportunity.date)}>{reportedDate(opportunity.date).replace(/^Reported\s+/, '')}</span></p></div></div><ChevronRight size={17} className="opportunity-row-chevron" />
          </button>)}
        </div>
        {!visible.length && <div className="opportunities-empty"><Search size={29} /><h2>{tab === 'closed' ? 'No closed opportunities recorded' : 'No matching opportunities'}</h2><p>{tab === 'closed' ? 'The available records do not include confirmed closure dates.' : 'Try a different function, location, or date range.'}</p>{tab !== 'closed' && <button className="ecosystem-primary" onClick={() => { setFilters({ ...emptyFilters, period: '' }); setPage(1); }}>View all dates <ArrowRight size={15} /></button>}</div>}
        {!!visible.length && <nav className="opportunities-pagination" aria-label="Opportunity pages"><button aria-label="Previous opportunity page" disabled={currentPage === 1} onClick={() => { setPage(currentPage - 1); setDetailDismissed(false); }}><ChevronLeft size={15} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).filter(number => pageCount <= 7 || number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1).map((number, index, numbers) => <span key={number}>{index > 0 && number - numbers[index - 1] > 1 && <span className="opportunities-page-gap">…</span>}<button aria-label={`Opportunity page ${number}`} aria-current={number === currentPage ? 'page' : undefined} className={number === currentPage ? 'active' : ''} onClick={() => { setPage(number); setDetailDismissed(false); }}>{number}</button></span>)}<button aria-label="Next opportunity page" disabled={currentPage === pageCount} onClick={() => { setPage(currentPage + 1); setDetailDismissed(false); }}><ChevronRight size={15} /></button></nav>}
      </div>
      {selected && <aside className="opportunity-detail" ref={detailRef} aria-label="Opportunity details" tabIndex={-1}>
        <button className="opportunity-detail-close" aria-label="Close opportunity details" onClick={() => setDetailDismissed(true)}><X size={18} /></button>
        <div className="opportunity-detail-company"><OpportunityLogo key={selected.company.gcc_id} opportunity={selected} /><h2>{selected.company.parent_company}</h2></div>
        <div className="opportunity-detail-meta"><span className="opportunity-status"><span />{selected.status === 'open' ? 'Reported' : 'Upcoming'}</span><p className="opportunity-detail-date">{reportedDate(selected.date)}</p></div>
        <h2 className="opportunity-detail-title">{selected.title}</h2>
        <p className="opportunity-detail-summary">{selected.eventTitle}</p>
        <div className="opportunity-detail-facts"><DetailFact Icon={UsersRound} label="Reported team" value={selected.teamSize} /><DetailFact Icon={MapPin} label="Primary location" value={selected.cities[0] || 'Not disclosed'} note={selected.cities.length > 1 ? `Also reported: ${selected.cities.slice(1).join(', ')}` : undefined} /><DetailFact Icon={CalendarDays} label="Announcement" value={new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} /><DetailFact Icon={Building2} label="Engagement" value="Not disclosed" /></div>
        <div className="opportunity-detail-section"><h3>Key focus areas</h3><div className="opportunity-tags">{selected.focus.length ? selected.focus.map(focus => <span key={focus}>{focus}</span>) : <p className="opportunity-unknown">Not disclosed in the available record.</p>}</div></div>
        <div className="opportunity-detail-section"><h3>About the opportunity</h3><p>{selected.description}</p></div>
        <div className="opportunity-detail-section opportunity-source-section"><h3>Source & opportunity status</h3><ul><li>{selected.status === 'open' ? 'Reported company expansion or new GCC announcement.' : 'Announced plans from the company activity timeline.'}</li><li>Partner requirements and RFP availability are not disclosed in this record.</li><li>{selected.sourceUrl ? <a href={selected.sourceUrl} target="_blank" rel="noreferrer">View the published company timeline <ExternalLink size={12} /></a> : 'Source link unavailable.'}</li></ul></div>
        <div className="opportunity-detail-actions"><button className="ecosystem-primary" onClick={() => setDialog({ kind: 'interest', opportunity: selected })}>Express interest <ArrowRight size={17} /></button><button onClick={() => setDialog({ kind: 'company', opportunity: selected })}>View company profile <ExternalLink size={15} /></button></div>
      </aside>}
    </div>
    {dialog && <OpportunityModal dialog={dialog} onClose={() => setDialog(null)} />}
  </section>;
}

function OpportunityFilter({ label, defaultLabel, value, options, onChange }: { label: string; defaultLabel: string; value: string; options: (string | string[])[]; onChange: (value: string) => void }) {
  return <EcosystemDropdown label={label} defaultLabel={defaultLabel} value={value} options={options.map(option => typeof option === 'string' ? { value: option, label: option } : { value: option[0], label: option[1] })} onChange={onChange} />;
}
function OpportunityLogo({ opportunity }: { opportunity: Opportunity }) {
  const [failed, setFailed] = useState(false);
  return <span className="opportunity-logo">{failed ? <span>{opportunity.company.parent_company.split(' ').slice(0, 2).map(word => word[0]).join('')}</span> : <img src={companyLogoUrl({ name: opportunity.company.parent_company, size: 128, theme: 'light' })} alt={`${opportunity.company.parent_company} logo`} onError={() => setFailed(true)} />}</span>;
}
function DetailFact({ Icon, label, value, note }: { Icon: typeof UsersRound; label: string; value: string; note?: string }) {
  return <div><Icon size={16} /><div><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div></div>;
}
function OpportunityModal({ dialog, onClose }: { dialog: OpportunityDialog; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const company = dialog.opportunity.company;
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog className="opportunity-modal ecosystem-dialog" ref={ref} aria-labelledby="opportunity-modal-title" onCancel={onClose} onClick={event => { if (event.target === ref.current) { const bounds = ref.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}><header><h2 id="opportunity-modal-title">{dialog.kind === 'company' ? company.parent_company : 'Express interest'}</h2><button autoFocus aria-label="Close opportunity dialog" onClick={onClose}><X size={20} /></button></header>{dialog.kind === 'company' ? <div className="opportunity-company-profile"><div><OpportunityLogo opportunity={dialog.opportunity} /><p>{company.sector}</p></div><dl><div><dt>Directory locations</dt><dd>{company.cities}</dd></div><div><dt>Company capabilities</dt><dd>{company.functions}</dd></div><div><dt>Directory headcount band</dt><dd>{company.headcount_band}</dd></div><div><dt>Verification status</dt><dd>{company.verification_status}</dd></div><div><dt>Last checked</dt><dd>{company.last_checked}</dd></div></dl><h3>Source profiles</h3>{splitList(company.source_urls).filter(url => /^https?:\/\//.test(url)).map(url => <a key={url} href={url} target="_blank" rel="noreferrer">{new URL(url).hostname} <ExternalLink size={14} /></a>)}</div> : <form className="opportunity-interest-form" onChange={() => { setSaved(false); setError(''); }} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); try { const drafts = JSON.parse(localStorage.getItem(INTEREST_KEY) || '{}'); localStorage.setItem(INTEREST_KEY, JSON.stringify({ ...drafts, [dialog.opportunity.id]: { company: company.parent_company, title: dialog.opportunity.title, source: dialog.opportunity.sourceUrl, name: data.get('name'), organization: data.get('organization'), email: data.get('email'), message: data.get('message') } })); setSaved(true); setError(''); } catch { setError('Your browser could not save the interest draft. Please allow local storage and try again.'); } }}><p>Track your interest in <strong>{company.parent_company}</strong>’s published expansion.</p><label>Your name<input name="name" required autoComplete="name" /></label><label>Organization<input name="organization" required autoComplete="organization" /></label><label>Work email<input name="email" required type="email" autoComplete="email" /></label><label>How you can help<textarea name="message" rows={3} placeholder="Describe your relevant services and experience" /></label><small>This saves a draft in this browser. No message is sent to the company.</small>{saved && <p className="opportunity-interest-saved" role="status"><Check size={17} />Interest draft saved.</p>}{error && <p role="alert">{error}</p>}<button className="ecosystem-primary" type="submit">Save interest draft <ArrowRight size={16} /></button></form>}</dialog>;
}
