import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import './buildVsBuy.css';
import {
  AlertTriangle, ArrowRight, Building2, Check, ChevronDown, CircleHelp,
  Clock3, Database, Download, Landmark, LayoutGrid, Rocket, Settings2,
  ShieldCheck, SlidersHorizontal, Sparkles, Table2, UsersRound, X,
  ChartNoAxesColumnIncreasing, Info,
} from 'lucide-react';
import type { Assumption, CityBenchmark } from '../data';
import hyderabadImage from '../assets/cities/hyderabad.jpg';
import puneImage from '../assets/cities/pune-unsplash.jpg';
import {
  calculateCost, formatCostCr, getRecommendation, routeInfo, routeOrder,
  sourceLinks, sourceName, timelineOptions,
} from './buildVsBuyModel';
import type { CostQuote, Preferences, Priority, RouteId, TeamMix } from './buildVsBuyModel';

type DetailTab = 'assumptions' | 'cost' | 'timeline' | 'sources';
type Props = { cities: CityBenchmark[]; assumptions: Assumption[] };
type Quotes = Record<RouteId, CostQuote>;

const preferenceOptions = [
  'Leverage a partner (e.g., Flexiple)',
  'Need physical office immediately',
  'Plan to scale to 500+ in 2–3 years',
  'Require IP sensitive work (higher compliance)',
];
const routeIcons = { eor: UsersRound, bot: Building2, direct: Landmark };
const targetMonths = [2, 6, 12, 24];
const emptyQuotes = (): Quotes => ({
  eor: { annualPerPersonLakh: '', setupLakh: '0' },
  bot: { annualPerPersonLakh: '', setupLakh: '0' },
  direct: { annualPerPersonLakh: '', setupLakh: '0' },
});
const progressStyle = (value: number, max = 100, min = 0) => {
  const progress = ((value - min) / (max - min) * 100) + '%';
  return { background: 'linear-gradient(to right, var(--flexiple-green) 0 ' + progress + ', var(--build-line) ' + progress + ' 100%)' };
};
const safeCsv = (value: unknown) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
const splitHighlights = (value: string) => value.split(/[;,]/)
  .map(item => item.trim().replace(/\.$/, ''))
  .filter(Boolean)
  .map(item => item[0].toUpperCase() + item.slice(1));
const cityTag = (item: CityBenchmark) => item.city === 'Bengaluru'
  ? 'Top GCC hub'
  : item.tier_classification === 'Tier 1 / emerging scale' ? 'Emerging scale' : item.tier_classification;

export function BuildVsBuy({ cities, assumptions }: Props) {
  const [city, setCity] = useState(cities.find(item => item.city === 'Bengaluru')?.city ?? cities[0]?.city ?? '');
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [activeCityIndex, setActiveCityIndex] = useState(0);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const cityButtonRef = useRef<HTMLButtonElement>(null);
  const [teamSize, setTeamSize] = useState(200);
  const [timeline, setTimeline] = useState(1);
  const [mix, setMix] = useState<TeamMix>([60, 20, 20]);
  const [priority, setPriority] = useState<Priority>('speed');
  const [preferences, setPreferences] = useState<Preferences>([true, false, false, false]);
  const [manualSelection, setManualSelection] = useState<RouteId | null>(null);
  const [quotes, setQuotes] = useState<Quotes>(emptyQuotes);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [tab, setTab] = useState<DetailTab>('assumptions');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [notice, setNotice] = useState('');

  const selectedCity = cities.find(item => item.city === city) ?? cities[0];
  const selectedCityIndex = Math.max(0, cities.findIndex(item => item.city === city));
  const routeAssumptions = useMemo(() => assumptions.filter(item => item.module === 'build_vs_buy'), [assumptions]);
  const checkedDates = [selectedCity?.last_checked, ...routeAssumptions.map(item => item.last_checked)].filter(Boolean).sort();
  const oldestCheck = checkedDates[0] ?? 'date unavailable';
  const costs = useMemo(
    () => Object.fromEntries(routeOrder.map(id => [id, calculateCost(quotes[id], teamSize)])) as Record<RouteId, number | null>,
    [quotes, teamSize],
  );
  const model = useMemo(
    () => selectedCity ? getRecommendation({ city: selectedCity, teamSize, timeline, mix, priority, preferences, costs }, routeAssumptions) : null,
    [selectedCity, teamSize, timeline, mix, priority, preferences, costs, routeAssumptions],
  );
  const recommendation = model?.route ?? 'bot';
  const selectedRoute = manualSelection ?? recommendation;
  const route = routeInfo[recommendation];
  const cityPhoto = city === 'Hyderabad' ? hyderabadImage : city === 'Pune' ? puneImage : null;
  const hasCityPhoto = city === 'Bengaluru' || cityPhoto !== null;
  const directCost = costs.direct;
  const recommendedCost = costs[recommendation];
  const costDifference = recommendation !== 'direct' && directCost !== null && recommendedCost !== null && directCost > 0
    ? Math.round((1 - recommendedCost / directCost) * 100)
    : null;
  const costHeadline = costDifference === null
    ? formatCostCr(recommendedCost)
    : (costDifference >= 0 ? costDifference + '% below direct' : Math.abs(costDifference) + '% above direct');
  const costDetail = recommendedCost === null
    ? 'Enter your quotes in Cost breakdown'
    : costDifference === null ? 'Year 1 from your entered pricing' : 'Year 1 · ' + formatCostCr(recommendedCost);
  const routeExplanation = recommendation === 'eor'
    ? 'A local employment partner can help you start hiring sooner. Confirm terms and operational readiness.'
    : recommendation === 'bot'
      ? 'A partner can build and operate the team while you plan longer-term scale and oversight.'
      : 'An owned entity gives you direct control, with more setup and compliance work.';

  useEffect(() => { setManualSelection(null); }, [city, teamSize, timeline, mix, priority, preferences]);
  useEffect(() => {
    if (!cityMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!cityPickerRef.current?.contains(event.target as Node)) setCityMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [cityMenuOpen]);

  function selectCity(nextCity: string) {
    setCity(nextCity);
    setCityMenuOpen(false);
    cityButtonRef.current?.focus();
  }

  function handleCityKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!cityMenuOpen) {
        setActiveCityIndex(selectedCityIndex);
        setCityMenuOpen(true);
      } else {
        setActiveCityIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + cities.length) % cities.length);
      }
    } else if (cityMenuOpen && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveCityIndex(event.key === 'Home' ? 0 : cities.length - 1);
    } else if (cityMenuOpen && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      selectCity(cities[activeCityIndex].city);
    } else if (event.key === 'Escape') {
      setCityMenuOpen(false);
    }
  }

  function updateMix(index: number, value: number) {
    const other = [0, 1, 2].filter(item => item !== index);
    const remaining = 100 - value;
    const total = mix[other[0]] + mix[other[1]];
    const first = total ? Math.round(remaining * mix[other[0]] / total) : Math.round(remaining / 2);
    const next = [...mix] as TeamMix;
    next[index] = value;
    next[other[0]] = first;
    next[other[1]] = remaining - first;
    setMix(next);
  }

  function updateQuote(id: RouteId, field: keyof CostQuote, value: string) {
    setQuotes(current => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  function downloadAssumptions() {
    if (!model) return;
    const rows: unknown[][] = [
      ['Category', 'Item', 'Value', 'Source', 'Confidence or note'],
      ['Scenario', 'City', city, 'Your input', ''],
      ['Scenario', 'Year 1 team size', teamSize, 'Your input', ''],
      ['Scenario', 'Target timeline', timelineOptions[timeline], 'Your input', ''],
      ['Scenario', 'Engineering / Data & AI / Support mix', mix.join(' / ') + '%', 'Your input', ''],
      ['Scenario', 'Priority', priority, 'Your input', ''],
      ...preferenceOptions.map((label, index) => ['Scenario', label, preferences[index] ? 'Yes' : 'No', 'Your input', '']),
      ['Recommendation', 'Suggested route', routeInfo[recommendation].title, 'Decision guide', 'Directional, not a guarantee'],
      ['Recommendation', 'Route being explored', routeInfo[selectedRoute].title, 'Your selection', ''],
      ...routeAssumptions.map(item => ['Evidence', item.assumption_name, item.value_or_range, item.source_ids, item.confidence_score + '%; ' + item.caveat]),
      ...routeOrder.flatMap(id => [
        ['Pricing', id.toUpperCase() + ' annual per person (₹ lakh)', quotes[id].annualPerPersonLakh || 'Not entered', 'Your input', ''],
        ['Pricing', id.toUpperCase() + ' one-time setup (₹ lakh)', quotes[id].setupLakh, 'Your input', ''],
        ['Pricing', id.toUpperCase() + ' Year 1 total (₹ crore)', costs[id] === null ? 'Not available' : costs[id]?.toFixed(2), 'Calculated', 'Annual per person × team size + setup'],
      ]),
    ];
    const csv = rows.map(row => row.map(safeCsv).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gcc-build-vs-buy-scenario.csv';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Downloaded the current scenario and documented assumptions.');
  }

  if (!selectedCity || !model) {
    return <section className="build-screen"><p>No city benchmarks are available for this calculator.</p></section>;
  }

  return <section className="build-screen" id="build"><div className="build-layout">
    <aside className="build-sidebar">
      <div className="build-intro">
        <p>BUILD VS BUY CALCULATOR</p>
        <h1>Find the right setup route for your GCC</h1>
        <span>Compare EOR, managed offshore and direct entity routes for your India team.</span>
      </div>
      <div className="build-controls">
        <div className="build-field">
          <label htmlFor="build-city">1. Select city <CircleHelp size={13} /></label>
          <div className="build-city-picker" ref={cityPickerRef} onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) setCityMenuOpen(false);
          }}>
            <button
              id="build-city"
              ref={cityButtonRef}
              className="build-city-trigger"
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={cityMenuOpen}
              aria-controls={cityMenuOpen ? 'build-city-options' : undefined}
              aria-activedescendant={cityMenuOpen ? 'build-city-option-' + activeCityIndex : undefined}
              onClick={() => {
                setActiveCityIndex(selectedCityIndex);
                setCityMenuOpen(open => !open);
              }}
              onKeyDown={handleCityKeyDown}
            >
              <span className="build-city-icon"><Building2 size={18} /></span>
              <span className="build-city-name">{city}</span>
              <small className="build-city-tag">{cityTag(selectedCity)}</small>
              <ChevronDown className={cityMenuOpen ? 'open' : ''} size={16} aria-hidden="true" />
            </button>
            {cityMenuOpen && <div id="build-city-options" className="build-city-menu" role="listbox" aria-label="Cities">
              {cities.map((item, index) => <button
                key={item.city_id}
                id={'build-city-option-' + index}
                className={'build-city-option' + (index === activeCityIndex ? ' active' : '')}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={item.city === city}
                onMouseEnter={() => setActiveCityIndex(index)}
                onClick={() => selectCity(item.city)}
              >
                <span className="build-city-option-icon"><Building2 size={15} /></span>
                <span className="build-city-option-name">{item.city}</span>
                <small className="build-city-tag">{cityTag(item)}</small>
                {item.city === city && <Check size={15} aria-hidden="true" />}
              </button>)}
            </div>}
          </div>
        </div>
        <div className="build-field">
          <label htmlFor="build-team-size">2. Target team size (Year 1) <CircleHelp size={13} /></label>
          <div className="build-range-with-value">
            <input id="build-team-size" type="range" min="10" max="1000" step="10" value={teamSize} style={progressStyle(teamSize, 1000, 10)} onChange={event => setTeamSize(Number(event.target.value))} />
            <input type="number" min="10" max="1000" value={teamSize} aria-label="Target team size" onChange={event => setTeamSize(Math.max(10, Math.min(1000, Number(event.target.value) || 10)))} />
          </div>
          <div className="build-range-ends"><span>10</span><span>1,000</span></div>
        </div>
        <div className="build-field">
          <label>3. Target timeline to be operational <CircleHelp size={13} /></label>
          <div className="build-segments">{timelineOptions.map((option, index) =>
            <button type="button" key={option} aria-pressed={timeline === index} className={timeline === index ? 'active' : ''} onClick={() => setTimeline(index)}>{option}</button>,
          )}</div>
        </div>
        <div className="build-field build-mix-field">
          <label>4. Team mix (approximate) <CircleHelp size={13} /></label>
          {['Engineering / Product', 'Data / AI / Analytics', 'G&A / Support'].map((label, index) =>
            <div className="build-mix-row" key={label}>
              <div className="build-mix-row-heading"><span>{label}</span><output>{mix[index]}<small>%</small></output></div>
              <input type="range" min="0" max="100" step="5" value={mix[index]} style={progressStyle(mix[index])} aria-label={label + ' percentage'} onChange={event => updateMix(index, Number(event.target.value))} />
            </div>,
          )}
        </div>
        <div className="build-field">
          <label>5. What matters more? <CircleHelp size={13} /></label>
          <div className="build-priority">
            <button type="button" aria-pressed={priority === 'speed'} className={priority === 'speed' ? 'active' : ''} onClick={() => setPriority('speed')}><Rocket size={21} />Faster setup</button>
            <button type="button" aria-pressed={priority === 'control'} className={priority === 'control' ? 'active' : ''} onClick={() => setPriority('control')}><Settings2 size={22} /><span>More control <small>(long-term)</small></span></button>
          </div>
        </div>
        <div className="build-field build-preferences">
          <label>6. Other preferences (optional)</label>
          {preferenceOptions.map((label, index) =>
            <label className="build-check-row" key={label}>
              <input type="checkbox" checked={preferences[index]} onChange={() => setPreferences(current => current.map((value, item) => item === index ? !value : value) as Preferences)} />
              <span>{label}</span>
            </label>,
          )}
        </div>
        <button type="button" className="build-submit" onClick={() => {
          setManualSelection(null);
          setNotice('Showing the recommendation for your current inputs.');
          document.getElementById('build-recommendation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}>View recommended route <ArrowRight size={17} /></button>
      </div>
    </aside>

    <div className="build-results">
      <section className="build-recommendation" id="build-recommendation" aria-live="polite">
        <div className={'build-skyline' + (hasCityPhoto ? '' : ' abstract')} aria-hidden="true" style={cityPhoto ? { '--build-city-photo': 'url("' + cityPhoto + '")' } as CSSProperties : undefined} />
        <div className="build-hero-copy">
          <p className="build-kicker"><Sparkles size={15} /> <span>RECOMMENDED ROUTE</span></p>
          <h2>{route.title}</h2>
          <p className="build-hero-subtitle">A directional match for your current team and launch plan.</p>
          <p className="build-hero-context">{teamSize} people <span>·</span> {city} <span>·</span> {timelineOptions[timeline]} target</p>
          <p className="build-hero-description">{routeExplanation}</p>
        </div>
        <div className="build-hero-trust"><span><ShieldCheck size={15} /> Indicative model</span><small>{routeAssumptions.length} documented assumptions</small></div>
        {hasCityPhoto && <div className="build-hero-city"><strong>{city}</strong><span>India GCC destination</span></div>}
        <div className="build-metrics">
          <Metric icon={Clock3} label="Planning timeline" value={route.timeline} detail="Confirm launch milestones with providers" />
          <Metric icon={Database} label="Year 1 cost" value={costHeadline} detail={costDetail} />
          <Metric icon={SlidersHorizontal} label="Operational control" value={route.control} detail="Varies by contract and operating model" />
          <Metric icon={ChartNoAxesColumnIncreasing} label="Setup complexity" value={route.complexity} detail="Scope of your direct responsibilities" />
        </div>
      </section>

      <section className="build-reasons" aria-label="What shaped the suggestion">
        <div>
          <h2>What shaped the suggestion</h2>
          <ul>{model.factors.map(factor => <li key={factor}>{factor}</li>)}</ul>
        </div>
        <div className="build-fit-card">
          <h2>City and role fit <small>{city}</small></h2>
          <div className="build-fit-row">
            <h3>Good fit for</h3>
            <ul className="build-fit-list">{splitHighlights(selectedCity.best_for).map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="build-fit-row">
            <h3>Plan for</h3>
            <ul className="build-fit-list risks">{splitHighlights(selectedCity.risks).map(item => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="build-fit-row">
            <h3>Role insight</h3>
            <p className="build-fit-insight">{model.roleFit}</p>
          </div>
          {model.watchouts.length > 0 && <div className="build-fit-row">
            <h3>Validate</h3>
            <ul className="build-fit-cautions">{model.watchouts.map(watchout => <li key={watchout}><AlertTriangle size={14} aria-hidden="true" /> <span>{watchout}</span></li>)}</ul>
          </div>}
        </div>
      </section>

      <section className="build-comparison">
        <div className="build-section-heading">
          <h2>Compare setup routes</h2>
          <div className="build-view-toggle">
            <button type="button" aria-pressed={view === 'table'} className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Table2 size={14} /> View as table</button>
            <button type="button" aria-pressed={view === 'cards'} className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}><LayoutGrid size={14} /> View as cards</button>
          </div>
        </div>
        {manualSelection && manualSelection !== recommendation && <div className="build-exploration" role="status">
          <strong>Exploring {routeInfo[manualSelection].title}</strong>
          <span>The guide still suggests {routeInfo[recommendation].title}. {routeInfo[manualSelection].risk}. {costs[manualSelection] === null ? 'Add pricing to compare Year 1 costs.' : 'Your Year 1 total: ' + formatCostCr(costs[manualSelection]) + '.'}</span>
          <button type="button" onClick={() => setManualSelection(null)}>Return to suggestion</button>
        </div>}
        {view === 'cards' ? <div className="build-route-cards">{routeOrder.map(id => {
          const item = routeInfo[id];
          const Icon = routeIcons[id];
          return <article className={'build-route-card ' + (recommendation === id ? 'recommended ' : '') + (selectedRoute === id ? 'selected' : '')} key={id}>
            <div className="build-route-top"><div className={'build-route-icon ' + id}><Icon size={25} /></div><div><h3>{item.title}</h3><p>{item.subtitle}</p><span className={'build-route-tag ' + id}>{recommendation === id ? 'RECOMMENDED' : item.tag}</span></div></div>
            <div className="build-route-facts">
              <Fact label="Planning launch" value={item.timeline} />
              <Fact label={'Year 1 cost (' + teamSize + ')'} value={formatCostCr(costs[id])} />
              <Fact label="Operational control" value={item.control} />
            </div>
            <p className="build-route-note">{item.scale}</p>
            <button type="button" className={selectedRoute === id ? 'selected' : ''} onClick={() => { setManualSelection(id); setNotice('Exploring ' + item.title + '.'); }}>
              {selectedRoute === id ? <><Check size={15} /> Exploring{recommendation === id ? ' recommended route' : ''}</> : 'Explore ' + (id === 'eor' ? 'EOR' : id === 'bot' ? 'BOT' : 'Direct Entity')}
            </button>
          </article>;
        })}</div> : <div className="build-route-table-wrap"><table className="build-route-table"><thead><tr><th>Route</th>{routeOrder.map(id => <th key={id}>{routeInfo[id].title}{recommendation === id && <span>Recommended</span>}</th>)}</tr></thead><tbody>
          {(['timeline', 'cost', 'control', 'scale', 'risk'] as const).map(key => <tr key={key}><th>{({ timeline: 'Planning launch', cost: 'Year 1 cost (' + teamSize + ')', control: 'Operational control', scale: 'Best use', risk: 'Responsibility' })[key]}</th>{routeOrder.map(id => <td key={id}>{key === 'cost' ? formatCostCr(costs[id]) : routeInfo[id][key]}</td>)}</tr>)}
          <tr><th>Explore route</th>{routeOrder.map(id => <td key={id}><button type="button" className="build-table-select" aria-pressed={selectedRoute === id} onClick={() => setManualSelection(id)}>{selectedRoute === id ? 'Exploring' : 'Explore'}</button></td>)}</tr>
        </tbody></table></div>}
      </section>

      {detailsOpen ? <section className="build-details">
        <div className="build-details-header">
          <div className="build-tabs" role="tablist" aria-label="Recommendation details">
            {([['assumptions', 'Key assumptions'], ['cost', 'Cost breakdown'], ['timeline', 'Timeline view'], ['sources', 'Source references']] as [DetailTab, string][]).map(([id, label]) =>
              <button type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} key={id} onClick={() => setTab(id)}>{label}</button>,
            )}
          </div>
          <div className="build-detail-actions"><button type="button" onClick={downloadAssumptions}><Download size={15} /> Download scenario</button><button type="button" aria-label="Close details" onClick={() => setDetailsOpen(false)}><X size={17} /></button></div>
        </div>
        <div className="build-details-body">
          <div className="build-tab-content">
            {tab === 'assumptions' && <>
              <div className="build-table-scroll"><table className="build-assumptions-table"><thead><tr><th>#</th><th>Assumption</th><th>Value</th><th>Source(s)</th><th>Confidence</th></tr></thead><tbody>
                {routeAssumptions.map((item, index) => <tr key={item.assumption_id}><td>{index + 1}</td><td>{item.assumption_name}</td><td>{item.value_or_range}</td><td>{item.source_ids.split(';').map(sourceName).join(', ')}</td><td><span className="build-confidence">{item.confidence_score}%</span></td></tr>)}
                <tr><td>{routeAssumptions.length + 1}</td><td>Year 1 team size</td><td>{teamSize} people</td><td>Your input</td><td><span className="build-confidence input">Input</span></td></tr>
                <tr><td>{routeAssumptions.length + 2}</td><td>Team mix: engineering / data / support</td><td>{mix.join(' / ')}%</td><td>Your input</td><td><span className="build-confidence input">Input</span></td></tr>
              </tbody></table></div>
              <button className="build-inline-link" type="button" onClick={() => setTab('sources')}>View sources <ArrowRight size={14} /></button>
            </>}
            {tab === 'cost' && <div className="build-cost-panel">
              <div className="build-cost-intro"><div><h3>Build a comparison from your quotes</h3><p>Enter an annual all-in cost per person and one-time setup fee for each route. Values are in ₹ lakh; totals update with team size.</p></div><button type="button" onClick={() => setQuotes(emptyQuotes())}>Reset pricing</button></div>
              <div className="build-quote-grid">{routeOrder.map(id => <div className="build-quote" key={id}>
                <h4>{routeInfo[id].title}</h4>
                <label>Annual cost / person <span>₹ lakh</span><input aria-label={id.toUpperCase() + ' annual cost per person in lakh'} type="number" min="0.01" step="0.1" inputMode="decimal" placeholder="Enter quote" value={quotes[id].annualPerPersonLakh} onChange={event => updateQuote(id, 'annualPerPersonLakh', event.target.value)} /></label>
                <label>One-time setup <span>₹ lakh</span><input aria-label={id.toUpperCase() + ' one-time setup in lakh'} type="number" min="0" step="0.1" inputMode="decimal" value={quotes[id].setupLakh} onChange={event => updateQuote(id, 'setupLakh', event.target.value)} /></label>
                <div className="build-quote-total"><span>Year 1 · {teamSize} people</span><strong>{formatCostCr(costs[id])}</strong></div>
              </div>)}</div>
              <p className="build-cost-formula">Year 1 total = annual cost per person × {teamSize} people + one-time setup. Cost estimates are unavailable until you enter pricing; city and role pay differences are not quantified in this dataset. A quote difference of 10% or more influences the suggestion when the cheaper route fits your launch target.</p>
            </div>}
            {tab === 'timeline' && <div className="build-timeline-panel">
              <p>Target: <strong>{timelineOptions[timeline]}</strong>. These are directional operational launch windows; confirm scope and milestones with providers.</p>
              <div className="build-timeline-list">{routeOrder.map(id => <div key={id}>
                <span>{routeInfo[id].title}</span><b>{routeInfo[id].timeline}</b>
                <small className={routeInfo[id].minMonths <= targetMonths[timeline] ? 'fits' : 'misses'}>{routeInfo[id].minMonths <= targetMonths[timeline] ? 'Potential fit' : 'Likely misses target'}</small>
                <i style={{ width: id === 'eor' ? '25%' : id === 'bot' ? '55%' : '90%' }} />
              </div>)}</div>
            </div>}
            {tab === 'sources' && <div className="build-source-list">
              {routeAssumptions.map(item => <div key={item.assumption_id}>
                <strong>{item.assumption_name} · {item.value_or_range}</strong>
                <div className="build-source-links">{item.source_ids.split(';').filter(Boolean).map(id => sourceLinks[id]?.url
                  ? <a key={id} href={sourceLinks[id].url} target="_blank" rel="noreferrer noopener">{sourceName(id)} ↗</a>
                  : <span key={id}>{sourceName(id)} · link unavailable</span>,
                )}</div>
                <small>{item.caveat}</small>
              </div>)}
              <div><strong>{city} city benchmark</strong><span>{selectedCity.best_for}</span><div className="build-source-links">
                {selectedCity.source_urls.split(';').filter(url => /^https?:\/\//.test(url)).map(url => <a key={url} href={url} target="_blank" rel="noreferrer noopener">City benchmark source ↗</a>)}
              </div></div>
            </div>}
          </div>
          <div className="build-insights">
            <div className="build-caveats"><h3><AlertTriangle size={17} /> Planning limits</h3><ul>
              <li>Costs vary by role, seniority, city and contract. Enter actual pricing to compare.</li>
              <li>Operational launch and legal registration have different timelines.</li>
              <li>Confirm entity, tax, employment and IP requirements with local advisors.</li>
            </ul></div>
            <div className="build-coverage"><h3><Info size={17} aria-hidden="true" /> Evidence coverage</h3><div className="build-coverage-meter"><i style={{ width: model.sourceConfidence + '%' }} /></div>
              <p><strong>{model.sourceConfidence}% average confidence</strong> recorded for {routeAssumptions.length} local assumptions. This is source metadata, not the probability that a route will succeed.</p>
              <p className="build-data-date">Benchmark snapshot last checked {oldestCheck}. Market data does not refresh automatically.</p>
              <button type="button" onClick={() => setTab('sources')}>View sources <ArrowRight size={14} /></button>
            </div>
          </div>
        </div>
      </section> : <button className="build-reopen" type="button" onClick={() => setDetailsOpen(true)}>Show assumptions and sources <ArrowRight size={14} /></button>}
      <span className="build-status" role="status">{notice}</span>
    </div>
  </div></section>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Clock3; label: string; value: string; detail: string }) {
  return <div className="build-metric"><span className="build-metric-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}
function Fact({ label, value }: { label: string; value: string }) {
  return <div className="build-fact"><span>{label}</span><strong>{value}</strong></div>;
}
