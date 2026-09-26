import activityCsv from '../../dataset/processed/gcc_index_activity_timeline.csv?raw';
import type { GccRecord } from '../data';
import { parseCsv, splitList } from '../data/csv';

export type OpportunityActivity = {
  company_name: string;
  profile_url: string;
  event_date: string;
  event_type: string;
  event_title: string;
  event_detail: string;
};
export type Opportunity = {
  id: string;
  company: GccRecord;
  title: string;
  description: string;
  focus: string[];
  cities: string[];
  teamSize: string;
  teamNumber: number | null;
  date: number;
  sourceUrl: string;
  status: 'open' | 'upcoming';
  eventTitle: string;
};
export type OpportunityTab = Opportunity['status'] | 'closed';

export const opportunityActivities = parseCsv(activityCsv) as OpportunityActivity[];
const DAY = 86_400_000;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const focusRules: [string, RegExp][] = [
  ['AI/ML', /\bAI\b|artificial intelligence|machine learning|model evaluation/i],
  ['Engineering', /engineering|engineers/i],
  ['Product', /\bproduct/i],
  ['Data & Analytics', /\bdata\b|analytics/i],
  ['R&D', /\bR&D\b|research|development/i],
  ['Cybersecurity', /cybersecurity|cyber security|information security|security operations|application security|network security|cloud security|security engineering|\bSOC\b/i],
  ['Cloud', /cloud/i],
  ['Finance', /finance|accounting/i],
  ['Operations', /operations|operational/i],
  ['Software', /software/i],
  ['Human Resources', /\bHR\b|human resources|recruiting/i],
  ['Supply Chain', /supply chain|procurement/i],
  ['Workplace', /\b(?:offices?|leases?|leasing|leased|workplace|campus)\b/i],
];

export function activityDate(value: string): number {
  const match = value.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return NaN;
  const month = months.findIndex(item => item.toLowerCase() === match[2].toLowerCase());
  if (month < 0) return NaN;
  return Date.UTC(Number(match[3]), month, Number(match[1]));
}

const normalizeCompany = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const known = (value: string) => Boolean(value && value !== 'Unknown');

export function reportedTeam(detail: string): { teamSize: string; teamNumber: number | null } {
  const match = detail.match(/\b(\d[\d,]*)(?:\s*[-–]\s*(\d[\d,]*))?(\+)?\s+(?:staff|employees|engineers|professionals|team members|people|seats|roles)\b/i) || detail.match(/\b(\d[\d,]*)(?:\s*[-–]\s*(\d[\d,]*))?(\+)?[- ]seat\b/i);
  if (!match) return { teamSize: 'Not disclosed', teamNumber: null };
  const value = Number(match[1].replaceAll(',', ''));
  const end = match[2] ? Number(match[2].replaceAll(',', '')) : null;
  const prefix = /(?:over|more than|past)\s*$/i.test(detail.slice(0, match.index)) ? '+' : match[3] || '';
  return { teamSize: end ? `${value.toLocaleString('en-IN')}–${end.toLocaleString('en-IN')}` : `${value.toLocaleString('en-IN')}${prefix}`, teamNumber: value };
}

export function buildOpportunities(records: GccRecord[], activities = opportunityActivities, now = new Date()): Opportunity[] {
  const companies = new Map(records.map(record => [normalizeCompany(record.parent_company), record]));
  const latest = new Map<string, Opportunity>();
  const knownCities = [...new Set(records.flatMap(record => [...splitList(record.cities), ...(known(record.primary_city) ? [record.primary_city] : [])]))].filter(known);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  for (const event of activities) {
    if (event.event_type !== 'pipeline' && (event.event_type !== 'news' || !/Expansion|New GCC/i.test(event.event_title))) continue;
    const company = companies.get(normalizeCompany(event.company_name));
    const date = activityDate(event.event_date);
    if (!company || !Number.isFinite(date) || !known(event.event_detail)) continue;
    const key = normalizeCompany(event.company_name);
    if ((latest.get(key)?.date ?? -Infinity) >= date) continue;
    const focus = focusRules.filter(([, pattern]) => pattern.test(event.event_detail)).map(([label]) => label);
    const titleCity = event.event_title.split(/[—–]/).slice(1).join(' ').trim();
    const reportedCities = titleCity ? splitList(titleCity) : knownCities.filter(city => event.event_detail.toLowerCase().includes(city.toLowerCase()));
    const cities = reportedCities.length ? reportedCities : known(company.primary_city) ? [company.primary_city] : [];
    const headlineFocus = focus.slice(0, 2).join(' & ');
    const title = headlineFocus ? `${headlineFocus} ${/Expansion/i.test(event.event_title) ? 'Centre Expansion' : 'Capability Centre'}` : event.event_title.replace(/\s*[—–]\s*/, ' in ');
    latest.set(key, {
      id: `${company.gcc_id}:${date}`,
      company, title, description: event.event_detail, focus: focus.length ? focus : splitList(company.functions).filter(fn => fn !== 'Global Capability Expansion').slice(0, 4),
      cities, ...reportedTeam(event.event_detail), date,
      sourceUrl: /^https?:\/\//.test(event.profile_url) ? event.profile_url : '',
      status: (event.event_type === 'pipeline' && event.event_title !== 'Market Signal') || date > today ? 'upcoming' : 'open',
      eventTitle: event.event_title,
    });
  }
  return [...latest.values()].sort((a, b) => b.date - a.date || a.company.parent_company.localeCompare(b.company.parent_company));
}

export function daysSince(date: number, now = new Date()): number {
  return Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - date) / DAY);
}
export function reportedDate(date: number): string {
  const days = daysSince(date);
  if (days < 0) return `Expected ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;
  if (days === 0) return 'Reported today';
  if (days === 1) return 'Reported yesterday';
  return `Reported ${days} days ago`;
}
export function teamBand(opportunity: Opportunity): string {
  const number = opportunity.teamNumber;
  return number === null ? 'unknown' : number < 100 ? 'small' : number < 250 ? 'medium' : number < 500 ? 'large' : 'enterprise';
}
