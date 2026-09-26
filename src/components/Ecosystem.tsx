import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, BriefcaseBusiness, CheckCircle2, ChevronLeft, ChevronRight, Database, FileText, Info, LayoutGrid, MapPin, Megaphone, Search, ShieldCheck, SlidersHorizontal, UserRound, UserRoundPlus, UsersRound, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GccRecord, Stakeholder } from '../data';
import { Opportunities } from './Opportunities';
import { EcosystemDropdown } from './EcosystemDropdown';
import { ecosystemPartners } from './ecosystemPartners';
import type { EcosystemPartner } from './ecosystemPartners';
import './ecosystem.css';

type Modal = { kind: 'profile'; partner: EcosystemPartner } | { kind: 'claim' } | { kind: 'help' } | { kind: 'workspace'; title: string };
const PAGE_SIZE = 6;
const CLAIM_DRAFT_KEY = 'gcc-compass-partner-claim-draft';

export function Ecosystem({ stakeholders, records }: { stakeholders: Stakeholder[]; records: GccRecord[] }) {
  const [section, setSection] = useState<'partners' | 'opportunities'>(() => location.hash.startsWith('#ecosystem/opportunities') ? 'opportunities' : 'partners');
  const isOpportunities = section === 'opportunities';
  const openSection = (next: 'partners' | 'opportunities') => {
    setSection(next);
    history.replaceState(null, '', next === 'opportunities' ? '#ecosystem/opportunities' : '#ecosystem');
  };
  const opportunityLink = <button className={isOpportunities ? 'selected' : ''} aria-current={isOpportunities ? 'page' : undefined} onClick={() => openSection('opportunities')}><BriefcaseBusiness size={22} /><span>Opportunities</span></button>;
  const partners = useMemo(() => ecosystemPartners(stakeholders), [stakeholders]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [evidence, setEvidence] = useState('');
  const [page, setPage] = useState(1);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [modal, setModal] = useState<Modal | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => partners.filter(partner => {
    const searchText = [partner.name, partner.type, ...partner.cities, ...partner.services].join(' ').toLowerCase();
    return searchText.includes(query.trim().toLowerCase()) && (!type || partner.type === type) && (!city || partner.cities.includes(city) || partner.cities.includes('India') || partner.cities.includes('India metros')) && (!service || partner.services.includes(service)) && (!evidence || partner.claimed === (evidence === 'claimed'));
  }), [partners, query, type, city, service, evidence]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visiblePartners = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const options = (field: 'type' | 'cities' | 'services') => [...new Set(partners.flatMap(partner => partner[field]))].sort();
  const hasFilters = Boolean(query || type || city || service || evidence);
  const resetFilters = () => { setQuery(''); setType(''); setCity(''); setService(''); setEvidence(''); setPage(1); };

  return (
    <div className={`ecosystem-screen ${isOpportunities ? 'opportunities-mode' : ''}`}>
      <aside className="ecosystem-sidebar" aria-label="Ecosystem sidebar">
        <div className="ecosystem-sidebar-top">
          <p className="ecosystem-nav-label">Discover</p>
          <nav className="ecosystem-sidebar-nav" aria-label="Discover">
            <button className={!isOpportunities ? 'selected' : ''} aria-current={!isOpportunities ? 'page' : undefined} onClick={() => { openSection('partners'); resetFilters(); searchRef.current?.focus(); }}><UsersRound size={22} /><span>Explore partners</span></button>
          </nav>
          <p className="ecosystem-nav-label workspace-label">Partner workspace</p>
          <nav className="ecosystem-sidebar-nav" aria-label="Partner workspace">
            {opportunityLink}
            <button onClick={() => setModal({ kind: 'workspace', title: 'My profile' })}><UserRound size={22} /><span>My profile</span></button>
            <button onClick={() => setModal({ kind: 'workspace', title: 'Contribute data' })}><Database size={22} /><span>Contribute data</span></button>
          </nav>
        </div>
        <div className="ecosystem-sidebar-bottom">
          <button className="ecosystem-how" onClick={() => setModal({ kind: 'help' })}><BookOpen size={21} /><span>How it works</span><ChevronRight size={18} /></button>
          <button className="ecosystem-primary ecosystem-claim" onClick={() => setModal({ kind: 'claim' })}><UserRoundPlus size={22} />Claim your profile</button>
        </div>
      </aside>
      {isOpportunities ? <Opportunities records={records} onClaim={() => setModal({ kind: 'claim' })} /> : <section className="ecosystem-content" aria-labelledby="ecosystem-title">
        <header className="ecosystem-heading">
          <h1 id="ecosystem-title">Explore India’s GCC ecosystem</h1>
          <p>Find advisors, service providers, industry bodies, and government partners with evidence you can inspect.</p>
        </header>
        {bannerVisible && <div className="ecosystem-banner">
          <Megaphone className="ecosystem-banner-icon" size={31} strokeWidth={1.8} />
          <div><h2>Get discovered by GCC buyers.</h2><p>Claim your profile, publish proof, contribute data, and receive relevant opportunities.</p></div>
          <button className="ecosystem-primary" onClick={() => setModal({ kind: 'claim' })}><UserRoundPlus size={22} />Claim your profile</button>
          <button className="ecosystem-dismiss" aria-label="Dismiss profile claim banner" onClick={() => setBannerVisible(false)}><X size={18} /></button>
        </div>}
        <div className="ecosystem-search">
          <Search size={21} aria-hidden="true" />
          <input ref={searchRef} aria-label="Search partners" placeholder="Search partners by name, service, city, or keyword..." value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />
          {query && <button aria-label="Clear partner search" onClick={() => { setQuery(''); setPage(1); searchRef.current?.focus(); }}><X size={17} /></button>}
        </div>
        <div className="ecosystem-filters">
          <PartnerFilter label="Stakeholder type" defaultLabel="All types" Icon={SlidersHorizontal} value={type} options={options('type')} onChange={value => { setType(value); setPage(1); }} />
          <PartnerFilter label="City" defaultLabel="All cities" Icon={MapPin} value={city} options={options('cities')} onChange={value => { setCity(value); setPage(1); }} />
          <PartnerFilter label="Service" defaultLabel="All services" Icon={LayoutGrid} value={service} options={options('services').map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} onChange={value => { setService(value); setPage(1); }} />
          <PartnerFilter label="Evidence status" defaultLabel="All profiles" Icon={ShieldCheck} value={evidence} options={[{ value: 'claimed', label: 'Claimed profile' }, { value: 'source', label: 'Source-backed information' }]} onChange={value => { setEvidence(value); setPage(1); }} />
        </div>
        {hasFilters && <div className="ecosystem-filter-summary"><span>{filtered.length} matching {filtered.length === 1 ? 'profile' : 'profiles'}</span><button onClick={resetFilters}>Clear all filters <X size={14} /></button></div>}
        <div className="ecosystem-partner-grid">
          {visiblePartners.map(partner => <PartnerCard key={partner.id} partner={partner} onOpen={() => setModal({ kind: 'profile', partner })} />)}
        </div>
        {filtered.length === 0 && <div className="ecosystem-empty" role="status"><Search size={28} /><h2>No partners found</h2><p>Try a different name, city, or service, or clear your filters.</p><button className="ecosystem-primary" onClick={resetFilters}>Clear filters</button></div>}
        <footer className="ecosystem-footer">
          <p role="status">{filtered.length ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} profiles` : 'Showing 0 profiles'}</p>
          <nav className="ecosystem-pagination" aria-label="Partner pages">
            <button aria-label="Previous partner page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => <button key={number} aria-label={`Partner page ${number}`} aria-current={number === currentPage ? 'page' : undefined} className={number === currentPage ? 'active' : ''} onClick={() => setPage(number)}>{number}</button>)}
            <button aria-label="Next partner page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18} /></button>
          </nav>
        </footer>
      </section>}
      {modal && <PartnerDialog modal={modal} partners={partners} onClose={() => setModal(null)} onClaim={() => setModal({ kind: 'claim' })} />}
    </div>
  );
}

function PartnerFilter({ label, defaultLabel, Icon, value, options, onChange }: { label: string; defaultLabel: string; Icon: LucideIcon; value: string; options: (string | { value: string; label: string })[]; onChange: (value: string) => void }) {
  return <EcosystemDropdown label={label} defaultLabel={defaultLabel} Icon={Icon} value={value} options={options.map(option => typeof option === 'string' ? { value: option, label: option } : option)} onChange={onChange} />;
}

function PartnerLogo({ partner }: { partner: EcosystemPartner }) {
  const [failed, setFailed] = useState(false);
  return <div className={`ecosystem-logo ${partner.logo === 'cbre' ? 'ecosystem-logo-dark' : ''}`}>
    {partner.logo && !failed ? <img src={`/partners/${partner.logo}.${['ey', 'kpmg', 'nasscom'].includes(partner.logo) ? 'svg' : 'png'}`} alt={`${partner.name} logo`} onError={() => setFailed(true)} /> : <span aria-label={partner.name}>{partner.logo === 'cbre' ? 'CBRE' : partner.name.split(' ').slice(0, 2).map(word => word[0]).join('')}</span>}
  </div>;
}

function EvidenceBadge({ claimed }: { claimed: boolean }) {
  return <span className={`ecosystem-evidence-badge ${claimed ? 'claimed' : 'source'}`}>{claimed ? <CheckCircle2 size={16} /> : <Info size={16} fill="currentColor" />}<span>{claimed ? 'Claimed profile' : 'Source-backed information'}</span></span>;
}

function PartnerCard({ partner, onOpen }: { partner: EcosystemPartner; onOpen: () => void }) {
  return <article className="ecosystem-partner-card" aria-label={partner.name}>
    <div className="ecosystem-partner-main">
      <PartnerLogo partner={partner} />
      <div className="ecosystem-partner-details">
        <h2>{partner.name}</h2>
        <p className="ecosystem-partner-type">{partner.type}</p>
        <p className="ecosystem-partner-cities"><MapPin size={15} fill="currentColor" /><span>{partner.cities.slice(0, 3).join(', ')}</span>{partner.cities.length > 3 && <button onClick={onOpen} aria-label={`See all ${partner.cities.length} cities for ${partner.name}`}>+{partner.cities.length - 3}</button>}</p>
        <div className="ecosystem-service-tags">{partner.services.map(service => <span key={service}>{service}</span>)}</div>
      </div>
      <EvidenceBadge claimed={partner.claimed} />
    </div>
    <div className="ecosystem-partner-bottom"><p><FileText size={20} /><span>{partner.proof}</span></p><button className="ecosystem-primary" onClick={onOpen}>View profile <ArrowRight size={15} /></button></div>
  </article>;
}

function PartnerDialog({ modal, partners, onClose, onClaim }: { modal: Modal; partners: EcosystemPartner[]; onClose: () => void; onClaim: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draft, setDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CLAIM_DRAFT_KEY) || 'null') || { organization: '', name: '', email: '' }; }
    catch { return { organization: '', name: '', email: '' }; }
  });
  const [draftError, setDraftError] = useState('');
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  useEffect(() => { setDraftSaved(false); setDraftError(''); }, [modal.kind]);
  const title = modal.kind === 'profile' ? modal.partner.name : modal.kind === 'claim' ? 'Claim your profile' : modal.kind === 'help' ? 'How it works' : modal.title;
  return <dialog ref={dialogRef} className="ecosystem-dialog" aria-labelledby="ecosystem-dialog-title" onCancel={onClose} onClick={event => { if (event.target === dialogRef.current) { const bounds = dialogRef.current.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}>
    <header><h2 id="ecosystem-dialog-title">{title}</h2><button autoFocus aria-label="Close partner dialog" onClick={onClose}><X size={21} /></button></header>
    {modal.kind === 'profile' && <div className="ecosystem-profile-body"><div className="ecosystem-profile-overview"><PartnerLogo partner={modal.partner} /><div><p>{modal.partner.type}</p><EvidenceBadge claimed={modal.partner.claimed} /></div></div><h3>Cities supported</h3><p>{modal.partner.cities.join(', ')}</p><h3>Services</h3><div className="ecosystem-service-tags">{modal.partner.services.map(service => <span key={service}>{service}</span>)}</div><h3>Evidence</h3><p className="ecosystem-profile-proof"><FileText size={19} />{modal.partner.proof}</p>{modal.partner.website && <a href={modal.partner.website} target="_blank" rel="noreferrer">Visit company website <ArrowRight size={15} /></a>}<button className="ecosystem-primary" onClick={onClaim}><UserRoundPlus size={19} />Claim your profile</button></div>}
    {modal.kind === 'help' && <div className="ecosystem-help-body"><p>Find the right partners for your GCC, and inspect the evidence behind their profiles.</p><ol><li><strong>Discover partners.</strong> Search by organization, city, or service and narrow the results with filters.</li><li><strong>Inspect their profiles.</strong> Review services, locations, and the source named in each proof point. Claimed profiles are managed by their organizations; source-backed profiles are compiled from published information.</li><li><strong>Get discovered.</strong> Start a profile claim to add your organization’s services and evidence.</li></ol><button className="ecosystem-primary" onClick={onClaim}>Claim your profile <ArrowRight size={16} /></button></div>}
    {modal.kind === 'workspace' && <div className="ecosystem-help-body"><p>{modal.title} is coming soon.</p><p>You can explore partner profiles and save a profile claim draft today.</p><button className="ecosystem-primary" onClick={onClose}>Back to Explore partners</button></div>}
    {modal.kind === 'claim' && <form className="ecosystem-claim-form" onSubmit={event => { event.preventDefault(); try { localStorage.setItem(CLAIM_DRAFT_KEY, JSON.stringify(draft)); setDraftSaved(true); setDraftError(''); } catch { setDraftError('Your browser could not save the draft. Please allow local storage and try again.'); } }}><p>Help GCC buyers discover your organization. Save a claim draft with your company and contact details.</p><label>Organization<input required list="ecosystem-organizations" value={draft.organization} onChange={event => { setDraft({ ...draft, organization: event.target.value }); setDraftSaved(false); }} placeholder="Your organization" /><datalist id="ecosystem-organizations">{partners.map(partner => <option key={partner.id} value={partner.name} />)}</datalist></label><label>Your name<input required value={draft.name} onChange={event => { setDraft({ ...draft, name: event.target.value }); setDraftSaved(false); }} autoComplete="name" placeholder="Full name" /></label><label>Work email<input required type="email" value={draft.email} onChange={event => { setDraft({ ...draft, email: event.target.value }); setDraftSaved(false); }} autoComplete="email" placeholder="you@company.com" /></label><small>Your draft is saved in this browser. It has not been submitted for verification.</small>{draftSaved && <p className="ecosystem-draft-saved" role="status"><CheckCircle2 size={19} />Your profile claim draft has been saved.</p>}{draftError && <p role="alert">{draftError}</p>}<button className="ecosystem-primary" type="submit">Save claim draft <ArrowRight size={16} /></button></form>}
  </dialog>;
}
