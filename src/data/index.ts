import assumptionsCsv from '../../dataset/processed/assumptions.csv?raw';
import cityBenchmarksCsv from '../../dataset/processed/city_benchmarks.csv?raw';
import gccRecordsCsv from '../../dataset/processed/gcc_records.csv?raw';
import stakeholdersCsv from '../../dataset/processed/stakeholders.csv?raw';
import statePoliciesCsv from '../../dataset/processed/state_policies.csv?raw';
import { CsvRow, parseCsv } from './csv';

export type GccRecord = CsvRow & {
  gcc_id: string;
  parent_company: string;
  primary_city: string;
  cities: string;
  sector: string;
  functions: string;
  headcount_band: string;
  verification_status: string;
  confidence_score: string;
  source_ids: string;
  source_urls: string;
  notes: string;
};

export type CityBenchmark = CsvRow & {
  city_id: string;
  city: string;
  state: string;
  tier_classification: string;
  gcc_sample_count: string;
  key_clusters: string;
  sector_strengths: string;
  talent_strengths: string;
  office_rent_range: string;
  attrition_proxy: string;
  state_incentive_summary: string;
  best_for: string;
  risks: string;
  confidence_score: string;
  source_ids: string;
  source_urls: string;
  notes: string;
};

export type Assumption = CsvRow & {
  assumption_id: string;
  module: string;
  assumption_name: string;
  value_or_range: string;
  unit: string;
  applies_to: string;
  confidence_score: string;
  source_ids: string;
  caveat: string;
};

export type Stakeholder = CsvRow & {
  stakeholder_id: string;
  name: string;
  category: string;
  cities_supported: string;
  services: string;
  proof_points: string;
  profile_status: string;
  demand_signals_of_interest: string;
  confidence_score: string;
  source_ids: string;
  notes: string;
};

export type StatePolicy = CsvRow & {
  policy_id: string;
  state: string;
  policy_name: string;
  policy_status: string;
  key_cities: string;
  confidence_score: string;
  source_ids: string;
  notes: string;
};

export const gccRecords = parseCsv(gccRecordsCsv) as GccRecord[];
export const cityBenchmarks = parseCsv(cityBenchmarksCsv) as CityBenchmark[];
export const assumptions = parseCsv(assumptionsCsv) as Assumption[];
export const stakeholders = parseCsv(stakeholdersCsv) as Stakeholder[];
export const statePolicies = parseCsv(statePoliciesCsv) as StatePolicy[];

export const dataStats = {
  gccRecords: gccRecords.length,
  cityBenchmarks: cityBenchmarks.length,
  stakeholders: stakeholders.length,
  assumptions: assumptions.length,
  statePolicies: statePolicies.length,
};
