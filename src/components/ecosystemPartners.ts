import type { Stakeholder } from '../data';

export type EcosystemPartner = {
  id: string;
  name: string;
  type: string;
  cities: string[];
  services: string[];
  claimed: boolean;
  proof: string;
  domain?: string;
  logo?: string;
  website?: string;
};

// Featured profiles and display copy supplied with the Explore partners reference.
const featuredPartners: EcosystemPartner[] = [
  { id: 'STK-EY', name: 'EY India GCC Advisory', type: 'Advisory / Consulting', cities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'], services: ['GCC strategy', 'Operating model', 'Talent & organization'], claimed: true, proof: '500+ GCC engagements in India (company website, 2024)', domain: 'ey.com', logo: 'ey', website: 'https://www.ey.com/en_in' },
  { id: 'STK-CBRE', name: 'CBRE India', type: 'Real estate & infra', cities: ['Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR', 'Chennai', 'Gurugram', 'Kolkata'], services: ['Office leasing', 'Workplace strategy', 'Project management'], claimed: false, proof: '3.8M sq. ft. leased to GCCs in 2023 (CBRE India, 2024)', domain: 'cbre.co.in', logo: 'cbre', website: 'https://www.cbre.co.in/' },
  { id: 'STK-NASSCOM', name: 'Nasscom', type: 'Industry body', cities: ['Bengaluru', 'Delhi NCR'], services: ['Policy & advocacy', 'Industry research', 'Community & events'], claimed: true, proof: '1,800+ GCC members (Nasscom, 2024)', domain: 'nasscom.in', logo: 'nasscom', website: 'https://nasscom.in/' },
  { id: 'STK-KPMG', name: 'KPMG India', type: 'Advisory / Consulting', cities: ['Bengaluru', 'Mumbai', 'Gurugram', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR'], services: ['GCC setup advisory', 'Risk & compliance', 'Finance transformation'], claimed: false, proof: '300+ GCC advisory engagements (KPMG India, 2024)', domain: 'kpmg.com', logo: 'kpmg', website: 'https://kpmg.com/in/en.html' },
  { id: 'STK-ZINNOV', name: 'Zinnov', type: 'Research & advisory', cities: ['Bengaluru', 'Hyderabad', 'Pune'], services: ['GCC market intelligence', 'Benchmarking', 'Talent insights'], claimed: false, proof: 'Track record of 1,200+ GCCs studied (Zinnov, 2024)', domain: 'zinnov.com', logo: 'zinnov', website: 'https://zinnov.com/' },
  { id: 'STK-THUB', name: 'T-Hub (Telangana)', type: 'State government / Investment agency', cities: ['Hyderabad'], services: ['GCC facilitation', 'Innovation & partnerships', 'Policy support'], claimed: true, proof: 'Supported 100+ GCCs in Telangana (T-Hub, 2024)', domain: 't-hub.co', logo: 'thub', website: 'https://t-hub.co/' },
];

export function ecosystemPartners(stakeholders: Stakeholder[]): EcosystemPartner[] {
  const featuredIds = new Set(featuredPartners.map(partner => partner.id));
  return [...featuredPartners, ...stakeholders.filter(stakeholder => !featuredIds.has(stakeholder.stakeholder_id)).map(stakeholder => ({
    id: stakeholder.stakeholder_id,
    name: stakeholder.name,
    type: stakeholder.category,
    cities: stakeholder.cities_supported.split(';').map(city => city.trim()),
    services: stakeholder.services.split(',').map(service => service.trim()).slice(0, 3),
    claimed: stakeholder.profile_status === 'claimed' || stakeholder.profile_status === 'owner',
    proof: stakeholder.proof_points,
  }))];
}
