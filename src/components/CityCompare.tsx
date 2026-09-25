import {
  BarChart3,
  BrainCircuit,
  Landmark,
  Wallet,
  Building2,
  Check,
  ChevronRight,
  Download,
  Leaf,
  MapPin,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { AttributionControl, MapContainer, Marker, TileLayer, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet';
import hyderabadImage from '../assets/cities/hyderabad.jpg';
import puneImage from '../assets/cities/pune-unsplash.jpg';
import { CityBenchmark, StatePolicy } from '../data';
import { score, splitList } from '../data/csv';

type CityCompareProps = {
  cities: CityBenchmark[];
  policies: StatePolicy[];
  onOpenAnalyst?: () => void;
};

type ScoreItem = {
  label: string;
  helper: string;
  Icon: typeof Users;
  values: number[];
};

const cityOrder = ['Bengaluru', 'Hyderabad', 'Pune', 'Delhi NCR', 'Chennai', 'Mumbai', 'Ahmedabad / GIFT City', 'Coimbatore'];
const selectedDefaults = ['Bengaluru', 'Hyderabad', 'Pune'];
const palette = ['green', 'blue', 'orange'] as const;

type CityDisplay = {
  units: string;
  confidence: number;
  score: {
    talent: number;
    cost: number;
    policy: number;
    ai: number;
    risk: number;
    overall: number;
  };
  subtitle: string;
  positioning: string;
  insight: string;
  sources: number;
  bestFor: string;
  talent: string;
  officeCost: string;
  attrition: string;
  policy: string;
  clusters: string;
  risks: string;
};

const cityDisplay: Record<string, CityDisplay> = {
  Bengaluru: {
    units: '1,050',
    confidence: 92,
    score: { talent: 9.5, cost: 6.5, policy: 7.0, ai: 9.0, risk: 6.0, overall: 7.8 },
    subtitle: "India's largest GCC hub",
    positioning: 'Established ecosystem with deepest talent pool and global hub for engineering and R&D.',
    insight: 'Bengaluru leads in talent depth and AI/ML readiness, ideal for core R&D and product development.',
    sources: 12,
    bestFor: 'R&D, AI/ML, Product Development, Global Engineering, Core Tech',
    talent: 'Large and diverse talent pool (1.2M+ tech talent)',
    officeCost: '\u20b9120 \u2013 160 (Higher)',
    attrition: '16 \u2013 18% (Higher)',
    policy: 'Stable, moderate incentives',
    clusters: 'Outer Ring Road, Whitefield, Electronic City, Manyata Tech Park',
    risks: 'High competition for talent, higher real estate costs, congestion',
  },
  Hyderabad: {
    units: '780',
    confidence: 89,
    score: { talent: 8.5, cost: 8.0, policy: 8.5, ai: 8.0, risk: 7.5, overall: 7.5 },
    subtitle: 'Fastest growing GCC destination',
    positioning: 'High-growth destination with strong policy support and expanding talent base.',
    insight: 'Hyderabad offers the best balance of cost, policy support and a rapidly growing talent base.',
    sources: 11,
    bestFor: 'Engineering, Analytics, Cloud, Cybersecurity, Back-office, Product',
    talent: 'Strong and growing pool (600K+ tech talent)',
    officeCost: '\u20b970 \u2013 100 (Moderate)',
    attrition: '12 \u2013 15% (Moderate)',
    policy: 'Strong state support (TS-iPASS)',
    clusters: 'HITEC City, Financial District, Gachibowli, Genome Valley',
    risks: 'Infrastructure bottlenecks, talent supply still maturing',
  },
  Pune: {
    units: '358',
    confidence: 87,
    score: { talent: 8.0, cost: 8.5, policy: 7.5, ai: 7.5, risk: 7.0, overall: 7.1 },
    subtitle: 'Cost-efficient and talent-rich',
    positioning: 'Cost-efficient, high-quality talent with strong manufacturing and engineering base.',
    insight: 'Pune is a strong cost-efficient alternative, well-suited for engineering, manufacturing tech and shared services.',
    sources: 9,
    bestFor: 'Engineering, Manufacturing Tech, Embedded Systems, Shared Services',
    talent: 'High-quality, cost-efficient talent (400K+ tech talent)',
    officeCost: '\u20b960 \u2013 90 (Lower)',
    attrition: '12 \u2013 14% (Lower)',
    policy: 'Favourable, focused on GCCs',
    clusters: 'Hinjewadi, Kharadi, Magarpatta, Pimpri-Chinchwad',
    risks: 'Smaller talent pool vs. Bengaluru, limited senior leadership talent',
  },
};


const cityImages: Record<string, string> = {
  Bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=520&q=80',
  Hyderabad: hyderabadImage,
  Pune: puneImage,
  'Delhi NCR': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=520&q=80',
  Chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=520&q=80',
  Mumbai: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=520&q=80',
  'Ahmedabad / GIFT City': 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&w=520&q=80',
  Coimbatore: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=520&q=80',
};

const cityCoordinates: Record<string, [number, number]> = {
  Bengaluru: [12.9716, 77.5946], Hyderabad: [17.385, 78.4867], Pune: [18.5204, 73.8567],
  'Delhi NCR': [28.4595, 77.0266], Chennai: [13.0827, 80.2707], Mumbai: [19.076, 72.8777],
  'Ahmedabad / GIFT City': [23.2156, 72.6369], Coimbatore: [11.0168, 76.9558],
};
const indiaBounds: [[number, number], [number, number]] = [[7.2, 68.1], [32.6, 87.7]];
const defaultWeights = { talent: 28, cost: 20, policy: 18, ai: 22, risk: 12 };
type WeightKey = keyof typeof defaultWeights;
const weightLabels: Record<WeightKey, string> = { talent: 'Talent', cost: 'Cost', policy: 'Policy', ai: 'AI readiness', risk: 'Setup risk' };

export function CityCompare({ cities, policies, onOpenAnalyst }: CityCompareProps) {
  const orderedCities = useMemo(() => sortCities(cities), [cities]);
  const [selectedCities, setSelectedCities] = useState(() => {
    const shared = new URLSearchParams(location.hash.slice(1)).get('cities')?.split(',');
    const valid = [...new Set(shared?.filter((name) => orderedCities.some((city) => city.city === name)) ?? [])];
    return valid?.length ? valid : selectedDefaults;
  });
  const [weights, setWeights] = useState(defaultWeights);
  const [shareLabel, setShareLabel] = useState('Share');
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = useMemo(() => selectedCities.map((name) => orderedCities.find((city) => city.city === name)).filter(Boolean) as CityBenchmark[], [orderedCities, selectedCities]);
  const scores = useMemo(() => selected.map((city, index) => cityScore(city, index)), [selected]);
  const scoreRows = useMemo<ScoreItem[]>(() => buildScoreRows(selected), [selected]);
  const ranked = useMemo(() => selected.map((city, index) => ({ city, score: weightedScore(scores[index], weights), tone: palette[index % palette.length] })).sort((a, b) => b.score - a.score), [selected, scores, weights]);

  const toggleCity = (cityName: string) => {
    setSelectedCities((current) => {
      if (current.includes(cityName)) return current.length > 1 ? current.filter((item) => item !== cityName) : current;
      return [...current, cityName];
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#cities=${selectedCities.map(encodeURIComponent).join(',')}`);
      setShareLabel('Link copied');
      window.setTimeout(() => setShareLabel('Share'), 2400);
    } catch { setShareLabel('Copy unavailable'); }
  };
  const download = () => {
    const rows = [
      ['Criterion', ...selected.map((city) => city.city)],
      ...scoreRows.map((row) => [row.label, ...row.values.map((value) => value.toFixed(1))]),
      ['Weighted score', ...selected.map((_, index) => weightedScore(scores[index], weights).toFixed(1))],
      ['Confidence', ...scores.map((item) => `${item.confidence}%`)],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'gcc-city-comparison.csv'; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="city-compare-screen" id="cities">
      <div className="city-compare-hero">
        <div>
          <p className="city-eyebrow">City Benchmarking</p>
          <h1>Compare India's GCC Destinations</h1>
          <p>Evaluate cities across talent, cost, policy, ecosystem and risk to find the best location for your GCC.</p>
        </div>
        <div className="city-hero-actions">
          <button onClick={() => { searchRef.current?.focus(); searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><Plus size={16} />Add city</button>
          <button onClick={share}><Share2 size={16} />{shareLabel}</button>
          <button className="download" onClick={download}><Download size={17} />Download Comparison</button>
        </div>
      </div>

      <div className="city-compare-layout">
        <aside className="city-left-rail">
          <CityMap cities={orderedCities} selected={selectedCities} onToggle={toggleCity} />
          <QuickAdd cities={orderedCities} selected={selectedCities} onToggle={toggleCity} searchRef={searchRef} />
        </aside>

        <section className="city-main-panel">
          <div className="city-summary-grid">
            {selected.map((city, index) => <CitySummaryCard key={city.city_id} city={city} tone={palette[index % palette.length]} score={scores[index]} />)}
          </div>
          <ComparisonMatrix cities={selected} scoreRows={scoreRows} scores={scores} />
        </section>

        <aside className="city-right-rail">
          <OverallComparison ranked={ranked} weights={weights} onWeightChange={(key, value) => setWeights((current) => ({ ...current, [key]: value }))} />
          <Insights cities={selected} scores={scores} />
          <div className="city-ai-card"><ShieldCheck size={24} /><h3>Need a deeper analysis?</h3><p>Let our AI analyst recommend the best location based on your specific requirements.</p><button onClick={onOpenAnalyst}><Sparkles size={16} />Ask AI Analyst <ChevronRight size={16} /></button></div>
        </aside>
      </div>
    </section>
  );
}

function CityMap({ cities, selected, onToggle }: { cities: CityBenchmark[]; selected: string[]; onToggle: (city: string) => void }) {
  const [zoomLevel, setZoomLevel] = useState(4);
  return (
    <section className="city-map-card" aria-label="Interactive map of Indian GCC cities">
      <div className="city-map-heading"><span className="india-flag" /> India <span>Explore cities</span></div>
      <MapContainer className="city-embedded-map" bounds={indiaBounds} boundsOptions={{ padding: [12, 12] }}
        maxBounds={[[5, 65], [36, 92]]} maxBoundsViscosity={0.75} minZoom={4} maxZoom={10}
        scrollWheelZoom zoomControl={false} attributionControl={false}>
        <CityMapZoomObserver onZoom={setZoomLevel} />
        <ZoomControl position="topright" />
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'} />
        {cities.map((city) => {
          const coordinates = cityCoordinates[city.city];
          if (!coordinates) return null;
          const selectedIndex = selected.indexOf(city.city);
          const tone = selectedIndex >= 0 ? palette[selectedIndex % palette.length] : 'muted';
          const icon = L.divIcon({ className: `compare-map-marker ${tone} ${zoomLevel >= 6 ? 'show-label' : ''}`,
            html: `<span class="compare-map-pin"></span><b>${displayCity(city.city).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</b>`,
            iconSize: [18, 18], iconAnchor: [9, 9] });
          return <Marker key={city.city_id} position={coordinates} icon={icon} eventHandlers={{ click: () => onToggle(city.city) }}>
            <Tooltip className="city-map-tooltip" direction="top" offset={[0, -8]}>
              <span className="city-tooltip-location">{city.city}, {city.state}</span>
              <span className="city-tooltip-status">{selectedIndex >= 0 ? 'Selected' : 'Click to compare'}</span>
            </Tooltip>
          </Marker>;
        })}
      </MapContainer>
      <div className="city-map-hint">Scroll to zoom · Click pins</div>
    </section>
  );
}

function CityMapZoomObserver({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => { onZoom(map.getZoom()); }, [map, onZoom]);
  return null;
}

function QuickAdd({ cities, selected, onToggle, searchRef }: { cities: CityBenchmark[]; selected: string[]; onToggle: (city: string) => void; searchRef: React.RefObject<HTMLInputElement | null> }) {
  const [query, setQuery] = useState('');
  const filtered = cities.filter((city) => city.city.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="quick-city-card">
      <div className="quick-city-heading"><h3>Compare cities</h3><span aria-live="polite">{selected.length}/{cities.length} selected</span></div>
      <label><Search size={15} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cities" /></label>
      <div className="quick-city-list">{filtered.map((city) => <button key={city.city_id} className={selected.includes(city.city) ? 'active' : ''} onClick={() => onToggle(city.city)} aria-pressed={selected.includes(city.city)}><span>{selected.includes(city.city) ? <Check size={13} /> : null}</span>{displayCity(city.city)}</button>)}</div>
      {filtered.length === 0 && <p className="quick-city-empty">No matching cities</p>}
    </section>
  );
}

function CitySummaryCard({ city, tone, score }: { city: CityBenchmark; tone: string; score: ReturnType<typeof cityScore> }) {
  const display = cityDisplay[city.city];
  return (
    <article className={`city-summary-card ${tone}`}>
      <div className="city-card-top"><div className="city-photo"><MapPin size={22} aria-hidden="true" /><img src={cityImages[city.city] ?? cityImages.Bengaluru} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div><div><h2>{city.city}</h2><p>{citySubtitle(city)}</p></div></div>
      <div className="city-stat-row"><div className="city-unit-chip"><strong>{display?.units ?? Number(city.gcc_sample_count).toLocaleString()}</strong><span>GCC units</span></div><b>{score.confidence}% confidence</b></div>
      <div className="city-positioning"><IconForTone tone={tone} /><div><h3>Key positioning</h3><p>{positioningText(city, score)}</p></div></div>
    </article>
  );
}

function ComparisonMatrix({ cities, scoreRows, scores }: { cities: CityBenchmark[]; scoreRows: ScoreItem[]; scores: ReturnType<typeof cityScore>[] }) {
  const infoRows = [
    ['Best fit use cases', (city: CityBenchmark) => cityDisplay[city.city]?.bestFor ?? city.best_for],
    ['Talent strength', (city: CityBenchmark) => cityDisplay[city.city]?.talent ?? city.talent_strengths],
    ['Office cost posture', (city: CityBenchmark) => cityDisplay[city.city]?.officeCost ?? city.office_rent_range],
    ['Attrition risk', (city: CityBenchmark) => cityDisplay[city.city]?.attrition ?? city.attrition_proxy],
    ['Policy signal', (city: CityBenchmark) => cityDisplay[city.city]?.policy ?? city.state_incentive_summary],
    ['Key GCC clusters', (city: CityBenchmark) => cityDisplay[city.city]?.clusters ?? splitList(city.key_clusters).join(', ')],
    ['Top risks', (city: CityBenchmark) => cityDisplay[city.city]?.risks ?? city.risks],
  ] as const;
  return (
    <section className="comparison-table-card">
      <div className={`city-table-scroll-hint${cities.length > 3 ? ' has-overflow' : ''}`}>Scroll across to see all compared cities &rarr;</div>
      <table className="city-criteria-table" style={{ minWidth: `${185 + cities.length * 180}px` }}>
        <thead><tr><th>Evaluation criteria</th>{cities.map((city) => <th key={city.city_id}>{city.city}</th>)}</tr></thead>
        <tbody>
          {scoreRows.map((row) => <tr key={row.label}><td><span><row.Icon size={16} /></span><div><strong>{row.label}</strong><small>{row.helper}</small></div></td>{row.values.map((value, index) => <td key={`${row.label}-${cities[index]?.city}`}><ScoreMeter value={value} tone={palette[index % palette.length]} /></td>)}</tr>)}
          {infoRows.map(([label, getter]) => <tr key={label} className="text-row"><td><span><InfoIcon label={label} /></span><strong>{label}</strong></td>{cities.map((city) => <td key={`${label}-${city.city}`}>{getter(city)}</td>)}</tr>)}
          <tr className="sources-row"><td><strong>Sources & confidence</strong></td>{cities.map((city, index) => <td key={city.city_id}><span>{cityDisplay[city.city]?.sources ?? splitList(city.source_ids).length} sources</span><b className={palette[index % palette.length]}>{scores[index].confidence}% confidence</b></td>)}</tr>
        </tbody>
      </table>
    </section>
  );
}

function OverallComparison({ ranked, weights, onWeightChange }: { ranked: Array<{ city: CityBenchmark; score: number; tone: string }>; weights: typeof defaultWeights; onWeightChange: (key: WeightKey, value: number) => void }) {
  const [showWeights, setShowWeights] = useState(false);
  return <section className="overall-card"><div className="rail-heading"><BarChart3 size={24} /><div><h3>Overall comparison</h3><p>Weighted score &middot; out of 10</p></div></div>{ranked.map((item, index) => <div className="rank-row" key={item.city.city_id}><span className={item.tone}>{index + 1}</span><div><strong>{item.city.city}</strong><i><b className={item.tone} style={{ width: `${item.score * 10}%` }} /></i></div><em>{item.score.toFixed(1)}</em></div>)}<button className="weight-toggle" aria-expanded={showWeights} onClick={() => setShowWeights(!showWeights)}><SlidersHorizontal size={16} />Customize weights</button>{showWeights && <div className="weight-controls">{(Object.keys(weightLabels) as WeightKey[]).map((key) => <label key={key}><span>{weightLabels[key]} <b>{weights[key]}</b></span><input type="range" min="0" max="50" value={weights[key]} onChange={(event) => onWeightChange(key, Number(event.target.value))} /></label>)}<p>Scores are normalized to the total weight.</p></div>}</section>;
}

function Insights({ cities, scores }: { cities: CityBenchmark[]; scores: ReturnType<typeof cityScore>[] }) {
  return <section className="city-insights-card"><h3>Insights</h3>{cities.map((city, index) => <div className="insight-row" key={city.city_id}><span className={palette[index % palette.length]}><IconForTone tone={palette[index % palette.length]} /></span><p>{insightText(city, scores[index])}</p></div>)}</section>;
}

function ScoreMeter({ value, tone }: { value: number; tone: string }) {
  return <div className="criteria-meter"><i><b className={tone} style={{ width: `${value * 10}%` }} /></i><strong>{value.toFixed(1)}</strong></div>;
}

function IconForTone({ tone }: { tone: string }) {
  if (tone === 'blue') return <Leaf size={20} />;
  if (tone === 'orange') return <ShieldCheck size={20} />;
  return <Star size={20} />;
}

function InfoIcon({ label }: { label: string }) {
  if (label.includes('risk')) return <TriangleAlert size={15} />;
  if (label.includes('Talent')) return <Users size={15} />;
  if (label.includes('Office')) return <Building2 size={15} />;
  if (label.includes('Policy')) return <Landmark size={15} />;
  if (label.includes('Best')) return <Star size={15} />;
  return <MapPin size={15} />;
}

function sortCities(cities: CityBenchmark[]) {
  return [...cities].sort((a, b) => (cityOrder.indexOf(a.city) === -1 ? 99 : cityOrder.indexOf(a.city)) - (cityOrder.indexOf(b.city) === -1 ? 99 : cityOrder.indexOf(b.city)));
}

function cityScore(city: CityBenchmark, index: number) {
  const display = cityDisplay[city.city];
  if (display) return { ...display.score, confidence: display.confidence };

  const confidence = score(city.confidence_score);
  const count = score(city.gcc_sample_count);
  const text = `${city.best_for} ${city.talent_strengths} ${city.risks} ${city.office_rent_range} ${city.state_incentive_summary}`.toLowerCase();
  const talent = clamp(count / 46 + (text.includes('deepest') ? 0.6 : 0.2), 6, 9.7);
  const cost = text.includes('premium') || text.includes('very high') ? 6.2 : text.includes('lower') ? 8.7 : 8.0;
  const policy = city.state_incentive_summary === 'Unknown' ? 5.8 : text.includes('policy') || text.includes('incentive') ? 8.5 : 7.2;
  const ai = text.includes('ai') || text.includes('analytics') || text.includes('technology') ? 8.4 : 7.3;
  const risk = text.includes('high competition') || text.includes('premium') ? 6.2 : text.includes('lower') ? 8.1 : 7.2;
  const overall = (talent * 0.28) + (cost * 0.2) + (policy * 0.18) + (ai * 0.22) + (risk * 0.12);
  return { talent, cost, policy, ai, risk, overall, confidence };
}

function weightedScore(values: ReturnType<typeof cityScore>, weights: typeof defaultWeights) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  if (!total) return 0;
  const weighted = (Object.keys(weights) as WeightKey[]).reduce((sum, key) => sum + values[key] * weights[key], 0) / total;
  const baseline = (Object.keys(defaultWeights) as WeightKey[]).reduce((sum, key) => sum + values[key] * defaultWeights[key], 0) / 100;
  return clamp(values.overall + weighted - baseline, 0, 10);
}

function buildScoreRows(cities: CityBenchmark[]): ScoreItem[] {
  const scores = cities.map((city, index) => cityScore(city, index));
  return [
    { label: 'Talent Depth', helper: 'availability & quality', Icon: Users, values: scores.map((item) => item.talent) },
    { label: 'Cost Efficiency', helper: 'office + talent costs', Icon: Wallet, values: scores.map((item) => item.cost) },
    { label: 'Policy Support', helper: 'state incentives, ease of setup', Icon: Landmark, values: scores.map((item) => item.policy) },
    { label: 'AI/ML Readiness', helper: 'talent, ecosystem, infra', Icon: BrainCircuit, values: scores.map((item) => item.ai) },
    { label: 'Setup Risk', helper: 'infra, regulatory, talent risk', Icon: TriangleAlert, values: scores.map((item) => item.risk) },
  ];
}

function citySubtitle(city: CityBenchmark) {
  if (cityDisplay[city.city]) return cityDisplay[city.city].subtitle;
  if (city.city === 'Bengaluru') return "India's largest GCC hub";
  if (city.city === 'Hyderabad') return 'Fastest growing GCC destination';
  if (city.city === 'Pune') return 'Cost-efficient and talent-rich';
  return city.tier_classification;
}

function positioningText(city: CityBenchmark, scoreData: ReturnType<typeof cityScore>) {
  if (cityDisplay[city.city]) return cityDisplay[city.city].positioning;
  if (scoreData.talent >= 9) return 'Established ecosystem with deepest talent pool and global hub for engineering and R&D.';
  if (scoreData.cost >= 8.4) return 'Cost-efficient, high-quality talent with strong engineering base.';
  return city.best_for;
}

function insightText(city: CityBenchmark, scoreData: ReturnType<typeof cityScore>) {
  if (cityDisplay[city.city]) return cityDisplay[city.city].insight;
  if (scoreData.talent >= 9) return `${city.city} leads in talent depth and AI/ML readiness, ideal for core R&D and product development.`;
  if (scoreData.cost >= 8.4) return `${city.city} is a strong cost-efficient alternative, well-suited for engineering and shared services.`;
  return `${city.city} offers a balanced location profile for ${city.best_for.toLowerCase()}.`;
}

function displayCity(city: string) {
  return city.replace(' / GIFT City', '').replace('Delhi NCR', 'Delhi NCR');
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

