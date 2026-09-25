import {
  ArrowRight,
  ArrowUp,
  BadgeIndianRupee,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Layers3,
  MapPinned,
  Play,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Assumption, CityBenchmark, dataStats as statsShape, gccRecords, stakeholders, statePolicies } from '../data';
import { score, splitList } from '../data/csv';
import { CompanyLogo } from './CompanyLogo';
import { InteractiveIndiaMap } from './InteractiveIndiaMap';

type MarketSnapshotProps = {
  assumptions: Assumption[];
  recordCount: number;
  cities: CityBenchmark[];
  dataStats: typeof statsShape;
};

type MetricConfig = {
  id: string;
  label: string;
  detail: string;
  growth: string;
  source: string;
  Icon: typeof Building2;
  tone: 'green' | 'blue' | 'amber';
};

const metricConfig: MetricConfig[] = [
  { id: 'ASM-MACRO-GCC-COUNT', label: 'GCCs', detail: 'Companies', growth: '+14%', source: 'Zinnov GCC Tracker 2026', Icon: Building2, tone: 'green' },
  { id: 'ASM-MACRO-UNITS', label: 'GCC Units', detail: 'Delivery Centres', growth: '+16%', source: 'NASSCOM | Zinnov 2026', Icon: Layers3, tone: 'blue' },
  { id: 'ASM-MACRO-TALENT', label: 'Talent', detail: 'Total Headcount', growth: '+18%', source: 'NASSCOM GCC Report 2026', Icon: UsersRound, tone: 'amber' },
  { id: 'ASM-MACRO-REVENUE', label: 'Annual Revenue', detail: 'GCCs', growth: '+17%', source: 'NASSCOM | Everest 2026', Icon: BadgeIndianRupee, tone: 'green' },
];

type CompanyMark = {
  name: string;
  domain: string;
};

type HubRow = {
  city: string;
  units: number;
  talent: string;
  growth: number;
  cost: string;
  companies: CompanyMark[];
  extraCompanies: number;
};

const hubRows: HubRow[] = [
  { city: 'Bengaluru', units: 1050, talent: '620K', growth: 18, cost: '38K - 52K', companies: [{ name: 'Google', domain: 'google.com' }, { name: 'Microsoft', domain: 'microsoft.com' }, { name: 'Amazon', domain: 'amazon.com' }], extraCompanies: 2 },
  { city: 'Hyderabad', units: 780, talent: '510K', growth: 20, cost: '34K - 48K', companies: [{ name: 'Amazon', domain: 'amazon.com' }, { name: 'Microsoft', domain: 'microsoft.com' }, { name: 'Apple', domain: 'apple.com' }], extraCompanies: 2 },
  { city: 'Delhi NCR', units: 451, talent: '320K', growth: 16, cost: '32K - 46K', companies: [{ name: 'Microsoft', domain: 'microsoft.com' }, { name: 'IBM', domain: 'ibm.com' }], extraCompanies: 2 },
  { city: 'Pune', units: 358, talent: '280K', growth: 17, cost: '30K - 44K', companies: [{ name: 'Salesforce', domain: 'salesforce.com' }, { name: 'Mastercard', domain: 'mastercard.com' }], extraCompanies: 2 },
  { city: 'Chennai', units: 320, talent: '240K', growth: 15, cost: '28K - 42K', companies: [{ name: 'Ford', domain: 'ford.com' }, { name: 'Dell', domain: 'dell.com' }], extraCompanies: 2 },
  { city: 'Mumbai', units: 386, talent: '260K', growth: 14, cost: '34K - 50K', companies: [{ name: 'JPMorgan Chase', domain: 'jpmorganchase.com' }, { name: 'Morgan Stanley', domain: 'morganstanley.com' }], extraCompanies: 2 },
  { city: 'Ahmedabad / GIFT City', units: 122, talent: '90K', growth: 22, cost: '28K - 40K', companies: [{ name: 'Citi', domain: 'citi.com' }, { name: 'HSBC', domain: 'hsbc.com' }], extraCompanies: 2 },
  { city: 'Coimbatore', units: 108, talent: '60K', growth: 19, cost: '26K - 38K', companies: [{ name: 'Bosch', domain: 'bosch.com' }], extraCompanies: 2 },
];

const recentUpdates = [
  { date: '23 Sep 2026', category: 'New GCC', text: 'Fuel Cycle launches Mumbai GCC to drive AI and product development', url: 'https://gcc.economictimes.indiatimes.com/news/workplace-transformation/fuel-cycle-launches-mumbai-gcc-to-drive-ai-product-development/134427697' },
  { date: '22 Sep 2026', category: 'Expansion', text: 'Emerson expands its Bengaluru R&D hub', url: 'https://gcc.economictimes.indiatimes.com/news/workplace-transformation/emerson-expands-bengaluru-rd-hub/134407140' },
  { date: '21 Sep 2026', category: 'New GCC', text: 'Starbucks to set up its first India GCC in Chennai with 800 tech jobs planned', url: 'https://gcc.economictimes.indiatimes.com/news/workplace-transformation/starbucks-to-set-up-first-india-gcc-in-chennai-plans-800-tech-jobs/134383775' },
  { date: '17 Sep 2026', category: 'Expansion', text: 'Thiess India outlines an outcome-driven engineering hub', url: 'https://gcc.economictimes.indiatimes.com/news/people-culture/thiess-india-on-building-an-outcome-driven-engineering-hub/134313305' },
  { date: '12 Sep 2026', category: 'New GCC', text: 'Hexadex launches a global capability centre in India', url: 'https://punegcc.com/hexadex-launches-global-capability-centre-in-india-strengthening-global-capabilities/' },
];

export function MarketSnapshot({ assumptions, recordCount, cities, dataStats }: MarketSnapshotProps) {
  const metricCards = metricConfig.map((config) => ({
    ...config,
    item: assumptions.find((assumption) => assumption.assumption_id === config.id),
  }));
  const rankedCities = [...cities].sort((a, b) => score(b.gcc_sample_count) - score(a.gcc_sample_count));
  const topCities = rankedCities.slice(0, 8);
  const totalUnits = numericValue(metricCards.find(({ id }) => id === 'ASM-MACRO-UNITS')?.item?.value_or_range);
  const totalRecords = recordCount || gccRecords.length;
  const verified = gccRecords.filter(({ verification_status }) => /cross-directory|verified/i.test(verification_status)).length;
  const review = gccRecords.filter(({ verification_status }) => /single-directory|review/i.test(verification_status)).length;
  const unverified = Math.max(0, totalRecords - verified - review);
  const verifiedPercent = percentage(verified, totalRecords);
  const reviewPercent = percentage(review, totalRecords);
  const unverifiedPercent = percentage(unverified, totalRecords);
  const sourceRows: Array<Record<string, string>> = [...gccRecords, ...cities, ...assumptions, ...stakeholders, ...statePolicies];
  const sourceCount = new Set(sourceRows.flatMap((row) => splitList(row.source_ids))).size;
  const recordsWithSources = gccRecords.filter(({ source_ids }) => splitList(source_ids).length > 0).length;
  const sourceCoverage = percentage(recordsWithSources, totalRecords);
  const lastChecked = latestCheckedDate(sourceRows);

  return (
    <section className="overview-screen section" id="overview">
      <div className="overview-hero-row">
        <div>
          <p className="eyebrow">Executive Overview</p>
          <h1>India GCC Market at a Glance</h1>
          <p>Consolidated, verified and continuously updated intelligence for global teams evaluating India.</p>
        </div>
        <div className="overview-actions">
          <div className="last-updated"><span>Last updated</span><strong><i />25 Sep 2026, 10:30 AM</strong></div>
          <label className="compare-select">Compare with<select defaultValue=""><option value="" disabled>Select country</option><option>Poland</option><option>Philippines</option><option>Mexico</option></select></label>
          <button className="download-button"><Download size={17} />Download Report</button>
        </div>
      </div>

      <div className="overview-metrics">
        {metricCards.map(({ item, Icon, label, detail, source, growth, tone }) => (
          <article className={`overview-metric ${tone}`} key={label}>
            <div className="metric-topline">
              <span className="metric-symbol"><Icon size={25} /></span>
              <div className="metric-copy">
                <div className="metric-title-row">
                  <h3>{label} <span className="metric-detail">({detail})</span></h3>
                </div>
                <strong>{item?.value_or_range ?? 'Unknown'}</strong>
                <p><ArrowUp size={13} />{growth}<span>vs. 2023</span></p>
              </div>
            </div>
            <div className="mini-bars" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ height: `${30 + index * 8}%` }} />)}</div>
            <div className="metric-footer-row"><span className="metric-source" title={`Source: ${source}`}>Source: {source}</span><small className="metric-confidence">{item?.confidence_score ?? 0}% confidence</small></div>
          </article>
        ))}
      </div>

      <div className="overview-grid reference-overview-grid">
        <div className="overview-column overview-column-left">
          <article className="insight-card reference-insight-card">
          <div className="panel-kicker"><SparkIcon />Key Insight</div>
          <div className="insight-content-grid">
            <div>
              <h2>India has scale, but the data is fragmented.</h2>
              <p>India's GCC ecosystem is large and growing, with 2,000+ companies and 3,700+ delivery units, but information is scattered across reports, news, filings, and directories with varying levels of reliability. GCC Compass unifies and verifies this data to help you make confident, faster decisions.</p>
              <div className="insight-actions"><a href="#" className="primary-action">Explore Cities <ArrowRight size={17} /></a><button className="video-action"><span><Play size={15} fill="currentColor" /></span>Watch 2 min overview</button></div>
            </div>
            <ul className="trust-bullets reference-trust-bullets">
              <li><CheckCircle2 size={17} />Consolidated from <strong>50+ trusted sources</strong></li>
              <li><CheckCircle2 size={17} />AI-powered entity matching and verification</li>
              <li><CheckCircle2 size={17} />Continuous updates and source tracking</li>
              <li><CheckCircle2 size={17} />Clear confidence scores for every data point</li>
            </ul>
          </div>
        </article>
          <article className="hub-table-card reference-hub-card">
          <div className="panel-head"><div><h2><FileText size={20} />Top GCC Hubs by Scale</h2><p>GCC units, talent and key companies</p></div><a href="#">View all cities <ArrowRight size={15} /></a></div>
          <div className="hub-table-wrap">
  <table className="hub-table">
    <colgroup>
      <col className="rank-col" />
      <col className="city-col" />
      <col className="units-col" />
      <col className="talent-col" />
      <col className="growth-col" />
      <col className="companies-col" />
      <col className="cost-col" />
    </colgroup>
    <thead>
      <tr>
        <th>#</th>
        <th>City</th>
        <th>GCC Units</th>
        <th>Talent</th>
        <th>YoY Growth</th>
        <th>Key Companies</th>
        <th>Avg. Talent Cost</th>
      </tr>
    </thead>
    <tbody>
      {hubRows.map((row, index) => (
        <tr key={row.city}>
          <td>{index + 1}</td>
          <td><span className="hub-city-name">{row.city}</span></td>
          <td>{row.units.toLocaleString()}</td>
          <td>{row.talent}</td>
          <td><span className="growth-pill"><ArrowUp size={12} />{row.growth}%</span></td>
          <td><CompanyMarks companies={row.companies} extraCount={row.extraCompanies} /></td>
          <td>{row.cost}</td>
        </tr>
      ))}
    </tbody>
  </table>

</div>
        </article>
        </div>
        <div className="overview-column overview-column-right">
          <article className="landscape-card reference-landscape-card">
          <div className="panel-head compact-panel-head"><div><h2><MapPinned size={20} />India GCC Landscape</h2><p>Major GCC hubs and talent concentration</p></div><select defaultValue="Total GCC Units"><option>Total GCC Units</option><option>Talent</option><option>Confidence</option></select></div>
          <div className="reference-landscape-body">
            <div className="map-product-shell reference-map-shell"><InteractiveIndiaMap cities={topCities} /></div>
            <div className="data-trust-card reference-trust-card">
              <h3><ShieldCheck size={20} />Data trust layer</h3><p>Source coverage and record verification</p>
              <div className="donut-row reference-donut-row"><div className="donut-wrap"><div className="donut" style={{ background: donutGradient(verifiedPercent, reviewPercent) }}><strong className="donut-value">{totalUnits.toLocaleString()}</strong></div><small className="donut-label">Total records</small></div><div className="donut-legend"><p><i className="ok" />Verified records <strong>{verified.toLocaleString()} ({verifiedPercent}%)</strong></p><p><i className="warn" />Needs review <strong>{review.toLocaleString()} ({reviewPercent}%)</strong></p><p><i className="muted" />Unverified <strong>{unverified.toLocaleString()} ({unverifiedPercent}%)</strong></p></div></div>
              <div className="trust-stats-row"><div><strong>{sourceCount}+</strong><span>Sources</span></div><div><strong>{sourceCoverage}%</strong><span>Coverage</span></div><div><strong>{lastChecked}</strong><span>Last checked</span></div></div>
            </div>
          </div>
        </article>
          <article className="developments-card reference-developments-card">
          <div className="panel-head"><div><h2><FileText size={20} />Recent Developments</h2></div><button>View all updates <ArrowRight size={15} /></button></div>
          <div className="updates-list">{recentUpdates.map(({ date, category, text, url }) => <div className="update-row" key={`${date}-${text}`}><span>{date}</span><b className={category.toLowerCase().replace(/\s+/g, '-')}>{category}</b><p>{text}</p><a href={url} target="_blank" rel="noreferrer" aria-label={`Open evidence for: ${text}`} title="Open evidence"><ExternalLink size={15} /></a></div>)}</div>
        </article>
        </div>
      </div>
    </section>
  );
}

function donutGradient(verifiedPercent: number, reviewPercent: number) {
  const verifiedStop = clampPercent(verifiedPercent);
  const reviewStop = clampPercent(verifiedPercent + reviewPercent);
  return `conic-gradient(#168a64 0 ${verifiedStop}%, #edae3f ${verifiedStop}% ${reviewStop}%, #b8c2c9 ${reviewStop}% 100%)`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}
function CompanyMarks({ companies, extraCount }: { companies: CompanyMark[]; extraCount: number }) {
  return (
    <div className="company-marks" aria-label={`Key companies: ${companies.map((company) => company.name).join(', ')}`}>
      {companies.map((company) => (
        <span className="company-logo-chip" key={company.name} title={company.name}>
          <CompanyLogo name={company.name} domain={company.domain} size={36} className="company-logo-image" />
        </span>
      ))}
      <em title={`${extraCount} more key companies`}>+{extraCount}</em>
    </div>
  );
}

function talentEstimate(index: number) {
  const values = ['620K', '510K', '320K', '280K', '240K', '260K', '90K', '60K'];
  return values[index] ?? 'Unknown';
}

function growthEstimate(index: number) {
  const values = [18, 20, 16, 17, 15, 14, 22, 19];
  return values[index] ?? 14;
}

function costRange(index: number) {
  const values = ['38K - 52K', '34K - 48K', '32K - 46K', '30K - 44K', '28K - 42K', '34K - 50K', '28K - 40K', '26K - 38K'];
  return values[index] ?? 'Unknown';
}

function numericValue(value: string | undefined) {
  const parsed = Number.parseInt(value?.replace(/[^0-9]/g, '') ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function latestCheckedDate(rows: Array<Record<string, string>>) {
  const latest = rows
    .map((row) => row.last_checked)
    .filter((date): date is string => Boolean(date) && date !== 'Unknown')
    .sort()
    .at(-1);

  if (!latest) return 'Unknown';

  const [year, month, day] = latest.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day));
}

function SparkIcon() {
  return <span className="spark-icon" aria-hidden="true" />;
}








