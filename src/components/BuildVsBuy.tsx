import { Calculator, CheckCircle2, Clock, Landmark, Rocket, Scale } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Assumption, CityBenchmark } from '../data';
import { ConfidenceBadge, SourceBadge } from './Badges';

type BuildVsBuyProps = {
  cities: CityBenchmark[];
  assumptions: Assumption[];
};

export function BuildVsBuy({ cities, assumptions }: BuildVsBuyProps) {
  const [city, setCity] = useState(cities[0]?.city ?? 'Bengaluru');
  const [teamSize, setTeamSize] = useState(75);
  const [timeline, setTimeline] = useState(6);
  const [preference, setPreference] = useState<'speed' | 'balanced' | 'control'>('balanced');
  const selectedCity = cities.find((item) => item.city === city);

  const recommendation = useMemo(() => {
    if (teamSize <= 30 || timeline <= 3 || preference === 'speed') {
      return { route: 'EOR / Flexiple-managed team', icon: Rocket, why: 'Best when speed, hiring execution, and low setup friction matter more than long-term entity control.', timeline: 'Days to weeks', control: 'Low entity burden', active: 'eor' };
    }
    if (teamSize >= 120 || preference === 'control') {
      return { route: 'Direct Indian entity / full GCC', icon: Landmark, why: 'Best when long-term control, captive culture, and permanent India footprint outweigh setup complexity.', timeline: '3-6 months', control: 'Highest control', active: 'direct' };
    }
    return { route: 'BOT / managed offshore team', icon: Scale, why: 'Best for mid-sized teams that need speed now but want a path to ownership once scale is proven.', timeline: 'Weeks to launch', control: 'Transition optionality', active: 'bot' };
  }, [preference, teamSize, timeline]);

  const Icon = recommendation.icon;
  const routeAssumptions = assumptions.filter((item) => item.module === 'build_vs_buy');

  return (
    <section className="section product-section" id="build">
      <div className="section-heading product-heading">
        <div><p className="eyebrow">Build vs Buy Calculator</p><h2>Turn setup ambiguity into a route recommendation with caveats.</h2></div>
      </div>

      <div className="calculator-layout decision-calculator-layout">
        <div className="calculator-controls decision-controls">
          <label>City<select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item.city_id}>{item.city}</option>)}</select></label>
          <label>Team size: {teamSize}<input type="range" min="10" max="250" step="5" value={teamSize} onChange={(event) => setTeamSize(Number(event.target.value))} /></label>
          <label>Timeline: {timeline} months<input type="range" min="1" max="18" step="1" value={timeline} onChange={(event) => setTimeline(Number(event.target.value))} /></label>
          <div className="segmented"><button className={preference === 'speed' ? 'active' : ''} onClick={() => setPreference('speed')}>Speed</button><button className={preference === 'balanced' ? 'active' : ''} onClick={() => setPreference('balanced')}>Balanced</button><button className={preference === 'control' ? 'active' : ''} onClick={() => setPreference('control')}>Control</button></div>
        </div>

        <article className="recommendation hero-recommendation">
          <div className="recommendation-title"><Icon size={34} /><div><span>Recommended route</span><h3>{recommendation.route}</h3></div></div>
          <p>{recommendation.why}</p>
          <div className="route-grid decision-route-grid">
            <RouteCard id="eor" active={recommendation.active} title="EOR / Managed" value="Fastest launch" detail="Days to weeks" />
            <RouteCard id="bot" active={recommendation.active} title="BOT / Managed offshore" value="Balanced transition" detail="Weeks to launch" />
            <RouteCard id="direct" active={recommendation.active} title="Direct entity" value="Maximum control" detail="3-6 months" />
          </div>
          <div className="recommendation-facts">
            <div><Clock size={18} /><span>Timeline</span><strong>{recommendation.timeline}</strong></div>
            <div><Calculator size={18} /><span>City posture</span><strong>{selectedCity?.office_rent_range ?? 'Unknown'}</strong></div>
            <div><Scale size={18} /><span>Control</span><strong>{recommendation.control}</strong></div>
          </div>
          {selectedCity && <div className="trust-row"><ConfidenceBadge score={selectedCity.confidence_score} /><SourceBadge ids={selectedCity.source_ids} urls={selectedCity.source_urls} /></div>}
          <p className="caveat">Indicative product modeling only. Legal, tax, transfer pricing, payroll, office lease, and incentive eligibility require professional validation.</p>
        </article>
      </div>

      <div className="assumption-grid refined-assumption-grid">
        {routeAssumptions.map((assumption) => <article className="assumption-card" key={assumption.assumption_id}><span>{assumption.applies_to}</span><strong>{assumption.assumption_name}: {assumption.value_or_range}</strong><p>{assumption.caveat}</p><div className="trust-row"><ConfidenceBadge score={assumption.confidence_score} /><SourceBadge ids={assumption.source_ids} urls={assumption.source_urls} /></div></article>)}
      </div>
    </section>
  );
}

function RouteCard({ id, active, title, value, detail }: { id: string; active: string; title: string; value: string; detail: string }) {
  return <div className={active === id ? 'active' : ''}><CheckCircle2 size={18} /><span>{title}</span><strong>{value}</strong><small>{detail}</small></div>;
}
