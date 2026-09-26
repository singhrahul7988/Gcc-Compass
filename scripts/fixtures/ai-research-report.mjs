export const question = 'Compare hyderabad and delhi for gcc branch for 25 people team for data analysts and few developers';
const statement = (text, citations) => ({ text, citations });
const cell = (text, citations, status = 'supported') => ({ text, citations, status });
export const report = {
  title: 'Hyderabad vs Delhi NCR: a 25-person data GCC',
  scope: '25-person team · Data analysts and developers · Delhi interpreted as Delhi NCR, with Gurugram and Noida considered separately.',
  summary: 'Shortlist Hyderabad first for a small, data-focused GCC, then benchmark it against a specific NCR location. Hyderabad has a strong engineering and analytics base; NCR offers a broader business and finance ecosystem that may be more useful for teams supporting financial services or consulting. At 25 people, the decision should turn on your actual role mix, leadership hires and office requirements. Treat Gurugram and Noida as separate alternatives: their location choices and incentive eligibility differ. The current evidence supports this directional shortlist, but does not establish an exact payroll advantage or an attrition gap.',
  summaryCitations: [1, 2],
  findings: [statement('Hyderabad is a strong starting point for analytics and engineering.', [1]), statement('NCR needs a micro-market decision, not a single city-wide cost assumption.', [2])],
  comparison: {
    title: 'Head-to-head comparison',
    columns: ['Hyderabad', 'Delhi NCR'],
    rows: [
      { factor: 'Talent and role fit', cells: [cell('Strong engineering depth, with analytics and AI/data teams among the local strengths.', [1]), cell('Large finance, business operations and engineering talent base across the region.', [2])] },
      { factor: 'Office location', cells: [cell('Evaluate HITEC City, Gachibowli and the Financial District against commute and hiring needs.', [1]), cell('Compare Gurugram and Noida separately. The local record identifies premium and cost-efficient options.', [2])] },
      { factor: 'Salary benchmarks', cells: [cell('Exact bands for your analyst seniority and developer mix are not available in the supplied records.', [], 'unknown'), cell('A comparable role-specific compensation survey is needed before claiming a payroll advantage.', [], 'unknown')] },
      { factor: 'Operating risks', cells: [cell('Rising office demand and competition for senior talent require location and hiring validation.', [1]), cell('Multi-state policy complexity makes the exact office district a material decision.', [2])] },
      { factor: 'Policy eligibility', cells: [cell('Verify current Telangana incentives and qualifying employment or investment requirements.', [1]), cell('UP policy support may be relevant for Noida; it does not apply automatically across all of NCR.', [2])] },
      { factor: 'Directory coverage', cells: [cell('299 GCC records in the local sample. This is a directory count, not total market size.', [1]), cell('305 GCC records in the local sample, aggregated across NCR.', [2])] },
    ],
  },
  sections: [
    {
      title: 'Talent depth for a lean data team',
      paragraphs: [statement('For a 25-person branch, a few hard-to-fill roles can determine the setup timeline. Hyderabad is a plausible starting point for an analytics-heavy team because the local benchmark identifies engineering, analytics and data functions as strengths. NCR becomes more compelling when business-domain knowledge and finance or professional-services networks are central to the work.', [1, 2])],
      bullets: [statement('Validate your first leadership hire and the most specialised analyst roles in both markets before choosing the office.', [])],
    },
    {
      title: 'Compare the actual operating footprint',
      paragraphs: [statement('Build the comparison around your intended office clusters. Hyderabad has several established technology corridors; NCR spans different cities and states. A single NCR average would conceal the difference between a Gurugram office and a Noida office, including policy eligibility.', [1, 2])],
      bullets: [statement('Request matching quotes for the same seat count, lease term and office specification. Add payroll, recruitment and travel costs to the same worksheet.', []), statement('Use source-backed compensation bands for each role and seniority. The present evidence cannot justify a precise percentage saving.', [])],
    },
    {
      title: 'Retention and setup risk',
      paragraphs: [statement('The local records flag increasing senior-talent competition in Hyderabad and location-dependent policy complexity in NCR. They do not provide directly comparable, role-specific attrition rates. For this small team, validate manager availability, commute patterns and hiring competition with recruiters in the chosen clusters.', [1, 2])],
      bullets: [statement('Confirm incentive thresholds before adding a subsidy to the business case; a 25-person team may not qualify for every scheme.', [])],
    },
  ],
  recommendation: {
    choice: 'Start with Hyderabad; keep one NCR location on the shortlist',
    rationale: 'Hyderabad aligns with the stated analytics and developer workload. Keep Noida or Gurugram in contention if your parent company needs stronger finance, consulting or northern-India business connections. Make the final choice after comparable hiring and office quotes confirm the tradeoff.',
    citations: [1, 2],
  },
  next: 'Prepare a role-by-role hiring plan and request equivalent 25-seat office quotes from Hyderabad and one selected NCR micro-market. Compare annual operating costs and the time to hire your lead.',
  caveat: 'Local salary and rent fields are qualitative. Exact compensation, lease rates, attrition and incentive eligibility need current, comparable source evidence before committing a budget.',
  followUps: ['How should a 25-person data GCC compare Noida and Gurugram?', 'What should a first-year operating budget include for this team?', 'Which roles should we hire first for the Hyderabad branch?'],
};
