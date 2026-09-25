import { useState } from 'react';
import { BarChart3, Bell, Building2, Calculator, Command, Map, Network, Search, Sparkles } from 'lucide-react';
import { CityCompare } from './components/CityCompare';
import { GccAtlas } from './components/GccAtlas';
import { MarketSnapshot } from './components/MarketSnapshot';
import { assumptions, cityBenchmarks, dataStats, gccRecords, statePolicies } from './data';

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
  const [activePage, setActivePage] = useState<Page>('overview');

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setActivePage('overview')} aria-label="GCC Compass home">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          <div>
            <strong>GCC Compass</strong>
            <small>by Flexiple</small>
          </div>
        </button>
        <nav>
          {navItems.map(([page, label, Icon]) => (
            <button className={activePage === page ? 'active' : ''} onClick={() => setActivePage(page)} key={page}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="topbar-tools">
          <label className="global-search" aria-label="Search GCC Compass">
            <Search size={16} />
            <input placeholder="Search companies, cities, insights..." />
            <kbd><Command size={12} /> K</kbd>
          </label>
          <button className="nav-icon-button" aria-label="Notifications">
            <Bell size={19} />
            <span />
          </button>
          <button className="avatar-button" aria-label="User profile">RS</button>
        </div>
      </header>

      <main>
        {activePage === 'overview' ? (
          <MarketSnapshot assumptions={assumptions} recordCount={gccRecords.length} cities={cityBenchmarks} dataStats={dataStats} />
        ) : activePage === 'atlas' ? (
          <GccAtlas records={gccRecords} />
        ) : activePage === 'cities' ? (
          <CityCompare cities={cityBenchmarks} policies={statePolicies} />
        ) : (
          <section className="page-placeholder">
            <p className="eyebrow">{navItems.find(([page]) => page === activePage)?.[1]}</p>
            <h1>{navItems.find(([page]) => page === activePage)?.[1]} page</h1>
            <p>This section will be built as a separate page after the overview matches the reference cleanly.</p>
          </section>
        )}
      </main>
    </div>
  );
}


