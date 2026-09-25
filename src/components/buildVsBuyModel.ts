import type { Assumption, CityBenchmark } from '../data';

export type RouteId = 'eor' | 'bot' | 'direct';
export type Priority = 'speed' | 'control';
export type Preferences = [boolean, boolean, boolean, boolean];
export type TeamMix = [number, number, number];

export type CalculatorInputs = {
  city: CityBenchmark;
  teamSize: number;
  timeline: number;
  mix: TeamMix;
  priority: Priority;
  preferences: Preferences;
  costs?: Record<RouteId, number | null>;
};

export type CostQuote = {
  annualPerPersonLakh: string;
  setupLakh: string;
};

export const routeOrder: RouteId[] = ['eor', 'bot', 'direct'];
export const timelineOptions = ['< 3 months', '3 – 6 months', '6 – 12 months', '12+ months'];
export const routeInfo: Record<RouteId, {
  title: string;
  subtitle: string;
  tag: string;
  timeline: string;
  minMonths: number;
  control: string;
  scale: string;
  risk: string;
  complexity: string;
}> = {
  eor: {
    title: 'EOR / Flexiple-managed team',
    subtitle: 'Hire through an Indian employment partner',
    tag: 'FASTEST START',
    timeline: '1 – 3 months',
    minMonths: 1,
    control: 'Low – Medium',
    scale: 'Useful for a small first team',
    risk: 'Partner handles employment administration',
    complexity: 'Lower',
  },
  bot: {
    title: 'BOT / Managed Offshore Team',
    subtitle: 'A partner builds and operates the team',
    tag: 'MANAGED SCALE',
    timeline: '3 – 6 months',
    minMonths: 3,
    control: 'Medium – High',
    scale: 'Useful while hiring and operations scale',
    risk: 'Responsibilities are shared with the partner',
    complexity: 'Moderate',
  },
  direct: {
    title: 'Direct entity / Full GCC',
    subtitle: 'Own the Indian legal entity and operation',
    tag: 'MOST CONTROL',
    timeline: '9 – 12+ months',
    minMonths: 9,
    control: 'High',
    scale: 'Fits a long-term owned operation',
    risk: 'Your entity owns compliance and operations',
    complexity: 'Higher',
  },
};

export type Recommendation = {
  route: RouteId;
  factors: string[];
  watchouts: string[];
  roleFit: string;
  threshold: string | null;
  sourceConfidence: number;
  scores: Record<RouteId, number>;
};

const bounded = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function breakEvenBand(assumptions: Assumption[]): [number, number] | null {
  const source = assumptions.find(item => item.assumption_id === 'ASM-BUILD-BREAKEVEN');
  const numbers = source?.value_or_range.match(/\d+/g)?.map(Number);
  if (!numbers || numbers.length < 2 || !numbers.every(Number.isFinite)) return null;
  return [Math.min(numbers[0], numbers[1]), Math.max(numbers[0], numbers[1])];
}

export function getRecommendation(inputs: CalculatorInputs, assumptions: Assumption[]): Recommendation {
  const { city, teamSize, timeline, mix, priority, preferences, costs } = inputs;
  const [partner, immediateOffice, rapidScale, sensitiveIp] = preferences;
  const sources = assumptions.filter(item => item.module === 'build_vs_buy');
  const band = breakEvenBand(sources);
  const low = band?.[0] ?? 0;
  const high = band?.[1] ?? 0;
  const scores: Record<RouteId, number> = { eor: 0, bot: 1, direct: 0 };
  const factors: string[] = [];
  const watchouts: string[] = [];
  const sampleCount = Number(city.gcc_sample_count) || 0;

  if (band && teamSize <= low) {
    scores.eor += 8;
    factors.push(teamSize + ' people is below the dataset’s indicative ' + low + '–' + high + ' person crossover.');
  } else if (band && teamSize <= high) {
    scores.eor += 9;
    scores.bot += 2;
    factors.push(teamSize + ' people sits inside the dataset’s ' + low + '–' + high + ' person crossover band.');
  } else if (teamSize >= 500) {
    scores.direct += 4;
    scores.bot += 2;
    factors.push(teamSize + ' people makes long-term ownership worth evaluating.');
  } else {
    scores.bot += 3;
    scores.direct += 1;
    factors.push(teamSize + ' people favors a scalable managed launch in this decision guide.');
  }

  if (timeline === 0) {
    scores.eor += 8;
    scores.direct -= 4;
    factors.push('The under-3-month target strongly favors an employment bridge.');
  } else if (timeline === 1) {
    scores.bot += 4;
    scores.eor += 1;
    scores.direct -= 2;
    factors.push('A 3–6 month target favors a managed build.');
  } else if (timeline === 2) {
    scores.bot += 2;
    scores.direct += 2;
    factors.push('A 6–12 month target leaves time to compare managed and owned setups.');
  } else {
    scores.direct += 3;
    scores.bot += 1;
    factors.push('A 12+ month horizon makes a direct entity more feasible.');
  }

  if (priority === 'speed') {
    scores.eor += 1;
    scores.bot += 2;
    factors.push('You prioritized launch speed.');
  } else {
    scores.direct += 3;
    scores.bot += 1;
    factors.push('You prioritized long-term control.');
  }

  if (partner) {
    scores.bot += 2;
    scores.eor += 1;
    factors.push('You prefer partner support.');
  } else {
    scores.direct += 2;
    factors.push('You did not select partner support.');
  }

  if (immediateOffice) {
    scores.bot += 1;
    watchouts.push('An immediate physical office is not guaranteed by any route. Confirm availability before committing.');
  }
  if (rapidScale) {
    scores.direct += 2;
    scores.bot += 1;
    factors.push('Your 500+ growth plan increases the value of a durable operating structure.');
  }
  if (sensitiveIp) {
    scores.direct += 3;
    scores.bot += 1;
    watchouts.push('IP-sensitive work needs contract, access-control and data-handling review for any route.');
  }

  const aiShare = mix[1];
  const engineeringShare = mix[0];
  const supportShare = mix[2];
  const mlRange = city['ml_engineer_salary_range']?.toLowerCase() ?? '';
  let roleFit: string;
  if (aiShare >= 40) {
    roleFit = aiShare + '% Data / AI roles: ' + city['ml_engineer_salary_range'].replace(/;\s*/g, ' — ') + '. Specialist pay premiums are not quantified in the dataset.';
    if (sampleCount < 100 || mlRange.includes('emerging') || mlRange.includes('lower')) {
      scores.bot += 2;
      watchouts.push('For an AI-heavy team in this emerging hub, validate specialist availability and hiring support.');
    } else {
      scores.bot += 1;
    }
  } else if (engineeringShare >= 70) {
    roleFit = engineeringShare + '% Engineering / Product roles: ' + city.talent_strengths.replace(/;\s*/g, ' — ');
  } else if (supportShare >= 40) {
    roleFit = supportShare + '% G&A / Support roles: validate local operations talent and office needs against your hiring plan.';
  } else {
    roleFit = 'City salary data is qualitative. Enter role-based quotes in Cost breakdown for a useful price comparison.';
  }

  if (sampleCount < 100 && teamSize >= 150) {
    scores.bot += 2;
    scores.direct -= 1;
    watchouts.push(city.city + ' has a smaller GCC sample in this dataset; validate hiring depth for a ' + teamSize + '-person plan.');
  } else if (sampleCount >= 250 && teamSize >= 500 && timeline >= 2) {
    scores.direct += 1;
  }

  const pricedRoutes = routeOrder.filter(id => costs?.[id] !== null && costs?.[id] !== undefined)
    .sort((a, b) => (costs?.[a] ?? 0) - (costs?.[b] ?? 0));
  if (pricedRoutes.length >= 2) {
    const cheapest = pricedRoutes[0];
    const next = pricedRoutes[1];
    const difference = Math.round((1 - (costs?.[cheapest] ?? 0) / (costs?.[next] ?? 1)) * 100);
    if (difference >= 10) {
      if (routeInfo[cheapest].minMonths <= [2, 6, 12, 24][timeline]) {
        scores[cheapest] += difference >= 25 ? 10 : 6;
        factors.push('Your entered Year 1 pricing puts ' + routeInfo[cheapest].title + ' ' + difference + '% below the next quoted route.');
      } else {
        watchouts.push('Your ' + routeInfo[cheapest].title + ' quote is ' + difference + '% lower, but its planning launch window misses your target.');
      }
    } else {
      factors.push('Your two lowest entered Year 1 quotes are within 10%; launch fit and control drive the route choice.');
    }
  }

  const selected = routeOrder.reduce((best, candidate) => scores[candidate] > scores[best] ? candidate : best, 'bot' as RouteId);
  if (selected === 'direct' && timeline < 2) {
    watchouts.push('Direct ownership may conflict with your launch target. Ask advisors for a phased hiring plan.');
  }
  if (selected === 'bot' && !partner) {
    watchouts.push('BOT still ranked highest for your timing. Confirm whether you are willing to use a setup partner.');
  }

  const sourceConfidence = sources.length
    ? Math.round(sources.reduce((sum, item) => sum + bounded(Number(item.confidence_score) || 0, 0, 100), 0) / sources.length)
    : 0;

  return {
    route: selected,
    factors,
    watchouts,
    roleFit,
    threshold: band ? low + '–' + high + ' people' : null,
    sourceConfidence,
    scores,
  };
}

export function calculateCost(quote: CostQuote, teamSize: number): number | null {
  const perPerson = Number(quote.annualPerPersonLakh);
  const setup = Number(quote.setupLakh);
  if (!quote.annualPerPersonLakh.trim() || !quote.setupLakh.trim() || !Number.isFinite(perPerson) || !Number.isFinite(setup) || perPerson <= 0 || setup < 0) return null;
  return (perPerson * teamSize + setup) / 100;
}

export function formatCostCr(value: number | null): string {
  return value === null ? 'Add pricing' : '₹' + value.toFixed(2) + ' Cr';
}

export const sourceLinks: Record<string, { name: string; url?: string; note?: string }> = {
  SRC_DEEL_EOR_INDIA: { name: 'Deel: hiring in India', url: 'https://www.deel.com/hiring/employees/india/', note: 'Provider claim; validate timing with a quote.' },
  SRC_FLEXIPLE_GCC_INDIA_HTML: { name: 'Flexiple: GCC in India', url: 'https://flexiple.com/gcc', note: 'Provider claim; validate timing and commercial terms.' },
  SRC_INVEST_INDIA_FAQ_PDF: { name: 'Invest India: setting up business', url: 'https://www.investindia.gov.in/faqs/setting-up-business-in-india' },
  SRC_INDUSLAW_GCC_2025_PDF: { name: 'IndusLaw: GCC legal framework', url: 'https://induslaw.com/publications/pdf/alerts-2025/article-operating-a-gcc-in-india-2025.pdf' },
  SRC_DHRUVA_GCC_2025_PDF: { name: 'Dhruva: GCC report 2025', url: 'https://www.dhruvaadvisors.com/wp-content/uploads/2025/07/Dhruva-GCC-Report-2025.pdf' },
};

export function sourceName(id: string): string {
  return sourceLinks[id]?.name ?? id.replace('SRC_', '').replaceAll('_', ' ');
}
