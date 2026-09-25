import {
  BarChart3,
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
import { useMemo, useState } from 'react';
import { CityBenchmark, StatePolicy } from '../data';
import { score, splitList } from '../data/csv';

type CityCompareProps = {
  cities: CityBenchmark[];
  policies: StatePolicy[];
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
  Hyderabad: 'https://images.unsplash.com/photo-1563448927998-6f79e5ec8cc0?auto=format&fit=crop&w=520&q=80',
  Pune: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=520&q=80',
  'Delhi NCR': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=520&q=80',
  Chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=520&q=80',
  Mumbai: 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=520&q=80',
  'Ahmedabad / GIFT City': 'https://images.unsplash.com/photo-1613292443284-8d10ef9383fe?auto=format&fit=crop&w=520&q=80',
  Coimbatore: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=520&q=80',
};

const mapPoints: Record<string, { x: number; y: number }> = {
  'Delhi NCR': { x: 50, y: 23 },
  'Ahmedabad / GIFT City': { x: 36, y: 38 },
  Mumbai: { x: 32, y: 53 },
  Pune: { x: 40, y: 61 },
  Hyderabad: { x: 62, y: 54 },
  Bengaluru: { x: 49, y: 76 },
  Chennai: { x: 77, y: 75 },
  Coimbatore: { x: 45, y: 86 },
};

export function CityCompare({ cities, policies }: CityCompareProps) {
  const orderedCities = useMemo(() => sortCities(cities), [cities]);
  const [selectedCities, setSelectedCities] = useState(selectedDefaults);
  const selected = useMemo(() => selectedCities.map((name) => orderedCities.find((city) => city.city === name)).filter(Boolean).slice(0, 3) as CityBenchmark[], [orderedCities, selectedCities]);
  const scores = useMemo(() => selected.map((city, index) => cityScore(city, index)), [selected]);
  const scoreRows = useMemo<ScoreItem[]>(() => buildScoreRows(selected), [selected]);
  const ranked = useMemo(() => selected.map((city, index) => ({ city, score: scores[index].overall, tone: palette[index] })).sort((a, b) => b.score - a.score), [selected, scores]);

  const toggleCity = (cityName: string) => {
    setSelectedCities((current) => {
      if (current.includes(cityName)) return current.filter((item) => item !== cityName);
      return [...current, cityName].slice(-3);
    });
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
          <button><Plus size={16} />Add city</button>
          <button><Share2 size={16} />Share</button>
          <button className="download"><Download size={17} />Download Comparison</button>
        </div>
      </div>

      <div className="city-compare-layout">
        <aside className="city-left-rail">
          <CityMap cities={orderedCities} selected={selectedCities} onToggle={toggleCity} />
          <QuickAdd cities={orderedCities} selected={selectedCities} onToggle={toggleCity} />
        </aside>

        <section className="city-main-panel">
          <div className="city-summary-grid">
            {selected.map((city, index) => <CitySummaryCard key={city.city_id} city={city} tone={palette[index]} score={scores[index]} />)}
          </div>
          <ComparisonMatrix cities={selected} scoreRows={scoreRows} scores={scores} />
        </section>

        <aside className="city-right-rail">
          <OverallComparison ranked={ranked} />
          <Insights cities={selected} scores={scores} />
          <div className="city-ai-card"><ShieldCheck size={24} /><h3>Need a deeper analysis?</h3><p>Let our AI analyst recommend the best location based on your specific requirements.</p><button><Sparkles size={16} />Ask AI Analyst <ChevronRight size={16} /></button></div>
        </aside>
      </div>
    </section>
  );
}

function CityMap({ cities, selected, onToggle }: { cities: CityBenchmark[]; selected: string[]; onToggle: (city: string) => void }) {
  return (
    <section className="city-map-card">
      <button className="country-select"><span className="india-flag" />India <ChevronRight size={15} /></button>
      <div className="india-map-art" aria-label="India city benchmark map">
        {cities.map((city) => {
          const point = mapPoints[city.city];
          if (!point) return null;
          const isSelected = selected.includes(city.city);
          const selectedIndex = selected.indexOf(city.city);
          return <button key={city.city_id} className={`map-city-dot ${isSelected ? `selected selected-${selectedIndex}` : ''}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => onToggle(city.city)}><span /><b>{displayCity(city.city)}</b></button>;
        })}
      </div>
    </section>
  );
}

function QuickAdd({ cities, selected, onToggle }: { cities: CityBenchmark[]; selected: string[]; onToggle: (city: string) => void }) {
  return (
    <section className="quick-city-card">
      <h3>Quick add city</h3>
      <label><Search size={15} /><input placeholder="Search and add a city" /></label>
      <div>{cities.map((city) => <button key={city.city_id} className={selected.includes(city.city) ? 'active' : ''} onClick={() => onToggle(city.city)}><span>{selected.includes(city.city) ? <Check size={13} /> : null}</span>{displayCity(city.city)}</button>)}</div>
    </section>
  );
}

function CitySummaryCard({ city, tone, score }: { city: CityBenchmark; tone: string; score: ReturnType<typeof cityScore> }) {
  const display = cityDisplay[city.city];
  return (
    <article className={`city-summary-card ${tone}`}>
      <div className="city-card-top"><img src={cityImages[city.city] ?? cityImages.Bengaluru} alt="" /><div><h2>{city.city}</h2><p>{citySubtitle(city)}</p></div></div>
      <div className="city-stat-row"><div><strong>{display?.units ?? Number(city.gcc_sample_count).toLocaleString()}</strong><span>GCC units</span></div><b>{score.confidence}% confidence</b></div>
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
      <table className="city-criteria-table">
        <thead><tr><th>Evaluation criteria</th>{cities.map((city) => <th key={city.city_id}>{city.city}</th>)}</tr></thead>
        <tbody>
          {scoreRows.map((row) => <tr key={row.label}><td><span><row.Icon size={16} /></span><div><strong>{row.label}</strong><small>{row.helper}</small></div></td>{row.values.map((value, index) => <td key={`${row.label}-${cities[index]?.city}`}><ScoreMeter value={value} tone={palette[index]} /></td>)}</tr>)}
          {infoRows.map(([label, getter]) => <tr key={label} className="text-row"><td><span><InfoIcon label={label} /></span><strong>{label}</strong></td>{cities.map((city) => <td key={`${label}-${city.city}`}>{getter(city)}</td>)}</tr>)}
          <tr className="sources-row"><td><strong>Sources & confidence</strong></td>{cities.map((city, index) => <td key={city.city_id}><span>{cityDisplay[city.city]?.sources ?? splitList(city.source_ids).length} sources</span><b className={palette[index]}>{scores[index].confidence}% confidence</b></td>)}</tr>
        </tbody>
      </table>
    </section>
  );
}

function OverallComparison({ ranked }: { ranked: Array<{ city: CityBenchmark; score: number; tone: string }> }) {
  return <section className="overall-card"><div className="rail-heading"><BarChart3 size={24} /><div><h3>Overall comparison</h3><p>Weighted score (customizable)</p></div></div>{ranked.map((item, index) => <div className="rank-row" key={item.city.city_id}><span className={item.tone}>{index + 1}</span><div><strong>{item.city.city}</strong><i><b className={item.tone} style={{ width: `${item.score * 10}%` }} /></i></div><em>{item.score.toFixed(1)}</em></div>)}<button><SlidersHorizontal size={16} />Customize weights</button></section>;
}

function Insights({ cities, scores }: { cities: CityBenchmark[]; scores: ReturnType<typeof cityScore>[] }) {
  return <section className="city-insights-card"><h3>Insights</h3>{cities.map((city, index) => <div className="insight-row" key={city.city_id}><span className={palette[index]}><IconForTone tone={palette[index]} /></span><p>{insightText(city, scores[index])}</p></div>)}</section>;
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
  const cost = text.includes('premium') || text.includes('very high') ? 6.2 : text.includes('lower') ? 8.7 : 8.0 - index * 0.2;
  const policy = city.state_incentive_summary === 'Unknown' ? 5.8 : text.includes('policy') || text.includes('incentive') ? 8.5 : 7.2;
  const ai = text.includes('ai') || text.includes('analytics') || text.includes('technology') ? 8.8 - index * 0.4 : 7.3;
  const risk = text.includes('high competition') || text.includes('premium') ? 6.2 : text.includes('lower') ? 8.1 : 7.2;
  const overall = (talent * 0.28) + (cost * 0.2) + (policy * 0.18) + (ai * 0.22) + (risk * 0.12);
  return { talent, cost, policy, ai, risk, overall, confidence };
}

function buildScoreRows(cities: CityBenchmark[]): ScoreItem[] {
  const scores = cities.map((city, index) => cityScore(city, index));
  return [
    { label: 'Talent Depth', helper: 'availability & quality', Icon: Users, values: scores.map((item) => item.talent) },
    { label: 'Cost Efficiency', helper: 'office + talent costs', Icon: ShieldCheck, values: scores.map((item) => item.cost) },
    { label: 'Policy Support', helper: 'state incentives, ease of setup', Icon: TriangleAlert, values: scores.map((item) => item.policy) },
    { label: 'AI/ML Readiness', helper: 'talent, ecosystem, infra', Icon: BarChart3, values: scores.map((item) => item.ai) },
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

