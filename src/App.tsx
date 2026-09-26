import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BarChart3, Bell, Building2, Calculator, Command, KeyRound, Map, Network, Search, Sparkles } from 'lucide-react';
import { CityCompare } from './components/CityCompare';
import { BuildVsBuy } from './components/BuildVsBuy';
import { GccAtlas } from './components/GccAtlas';
import { MarketSnapshot } from './components/MarketSnapshot';
import { AiAnalyst } from './components/AiAnalyst';
import { AiSettings } from './components/AiSettings';
import { Ecosystem } from './components/Ecosystem';
import { getAiStatus } from './components/aiClient';
import type { AiStatus } from './components/aiClient';
import { assumptions, cityBenchmarks, dataStats, gccRecords, stakeholders, statePolicies } from './data';

const navItems = [
  ['overview', 'Overview', BarChart3],
  ['atlas', 'GCC Atlas', Building2],
  ['cities', 'City Compare', Map],
  ['build', 'Build vs Buy', Calculator],
  ['analyst', 'AI Analyst', Sparkles],
  ['ecosystem', 'Ecosystem', Network],
] as const;

type Page = (typeof navItems)[number][0];

export default function App() {
  const [activePage, setActivePage] = useState<Page>(() => location.hash.startsWith('#cities=') ? 'cities' : location.hash.startsWith('#build') ? 'build' : location.hash.startsWith('#analyst') ? 'analyst' : location.hash.startsWith('#ecosystem') ? 'ecosystem' : 'overview');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>({ configured: false, provider: null, model: null, saved: [], searchConfigured: false });
  const profileRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeaderHeight = () => {
      header.parentElement?.style.setProperty('--topbar-height', `${header.getBoundingClientRect().height}px`);
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    getAiStatus().then(setAiStatus).catch(() => setAiStatus({ configured: false, provider: null, model: null, saved: [], searchConfigured: false }));
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  const openPage = (page: Page) => {
    setActivePage(page);
    if (page === 'ecosystem') {
      if (!location.hash.startsWith('#ecosystem')) history.replaceState(null, '', '#ecosystem');
    }
    else if (location.hash.startsWith('#ecosystem')) history.replaceState(null, '', location.pathname + location.search);
  };

  return (
    <div className="app-shell">
      <header className="topbar" ref={headerRef}>
        <button className="brand brand-button" onClick={() => openPage('overview')} aria-label="GCC Compass home">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          <div><strong>GCC Compass</strong><small>by Flexiple</small></div>
        </button>
        <nav>
          {navItems.map(([page, label, Icon]) => (
            <button className={activePage === page ? 'active' : ''} onClick={() => openPage(page)} key={page}>
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>
        <div className="topbar-tools">
          <label className="global-search" aria-label="Search GCC Compass">
            <Search size={16} />
            <input placeholder="Search companies, cities, insights..." />
            <kbd><Command size={12} /> K</kbd>
          </label>
          <button className="nav-icon-button" aria-label="Notifications"><Bell size={19} /><span /></button>
          <div className="profile-control" ref={profileRef}>
            <button className="avatar-button" aria-label="User profile" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen(open => !open)}>RS</button>
            {profileOpen && <div className="profile-menu" role="menu" aria-label="Profile">
              <div className="profile-menu-heading"><strong>Profile</strong></div>
              <button role="menuitem" type="button" onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}><KeyRound size={18} /><span>Manage API keys</span></button>
            </div>}
          </div>
        </div>
      </header>
      <main>
        {activePage === 'overview' ? (
          <MarketSnapshot assumptions={assumptions} recordCount={gccRecords.length} cities={cityBenchmarks} dataStats={dataStats} />
        ) : activePage === 'atlas' ? (
          <GccAtlas records={gccRecords} />
        ) : activePage === 'cities' ? (
          <CityCompare cities={cityBenchmarks} policies={statePolicies} onOpenAnalyst={() => setActivePage('analyst')} />
        ) : activePage === 'build' ? (
          <BuildVsBuy cities={cityBenchmarks} assumptions={assumptions} />
        ) : activePage === 'analyst' ? (
          <AiAnalyst cities={cityBenchmarks} records={gccRecords} stakeholders={stakeholders} assumptions={assumptions} policies={statePolicies} aiConfigured={aiStatus.configured} aiProvider={aiStatus.provider} aiModel={aiStatus.model} searchConfigured={aiStatus.searchConfigured} connectionRevision={aiStatus.revision} onOpenSettings={() => setSettingsOpen(true)} onOpenCityCompare={() => setActivePage('cities')} onOpenBuildVsBuy={() => setActivePage('build')} />
        ) : activePage === 'ecosystem' ? (
          <Ecosystem stakeholders={stakeholders} records={gccRecords} />
        ) : (
          <section className="page-placeholder">
            <p className="eyebrow">{navItems.find(([page]) => page === activePage)?.[1]}</p>
            <h1>{navItems.find(([page]) => page === activePage)?.[1]} page</h1>
            <p>This section will be built as a separate page after the overview matches the reference cleanly.</p>
          </section>
        )}
      </main>
      {settingsOpen && <AiSettings status={aiStatus} onStatusChange={setAiStatus} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
