# GCC Compass MVP PRD

Last updated: September 24, 2026

## 1. Product Thesis

GCC Compass is an AI-powered decision tool for foreign companies evaluating India GCC or offshore team setup.

It helps an executive answer four questions:

1. Where should we set up in India?
2. What will it cost?
3. Should we start with EOR/Flexiple-managed team, BOT, or direct entity?
4. Which ecosystem stakeholders can help, and why should we trust the data?

The MVP will use a curated sample of real publicly verifiable data. We are not inventing records. We are manually collecting public data from credible sources, normalizing it into local datasets, and showing citations/confidence in the product.

## 2. Primary User

Incoming foreign decision-maker evaluating India entry:

- Founder
- CTO
- CFO
- CHRO
- VP Engineering
- Strategy / Global Business Services leader

Example user:

A US fintech company wants to build a 75-person engineering and analytics team in India within 6-12 months. They need to compare Bengaluru, Hyderabad, Pune, and Chennai; estimate costs; choose EOR vs own entity; and identify credible ecosystem partners.

## 3. Secondary Users

Ecosystem stakeholders who can provide data, proof, services, or market access:

- GCC advisors
- Big 4 advisory teams
- Real estate firms
- Recruiters / RPO / staffing firms
- Legal and tax firms
- Payroll / EOR providers
- Nasscom / STPI / industry bodies
- State governments and investment promotion agencies

## 4. MVP Modules

### Module 1: Market Snapshot

Purpose:

Show the scale of the India GCC opportunity and establish credibility immediately.

Required data:

- GCC count
- GCC units
- workforce
- market revenue
- growth rate
- source and last checked date

Primary source:

- Nasscom-Zinnov India GCC Landscape 2026

MVP UI:

- Top metric cards with source badges.
- Short insight: "India has scale, but the data layer is fragmented."

### Module 2: GCC Atlas

Purpose:

Search and filter a curated set of real GCC records.

Required fields:

- parent company
- Indian entity name if available
- CIN if available
- city/cities
- sector
- functions
- parent country
- headcount band
- maturity stage
- year established / India since
- source URLs
- confidence score
- verification status

MVP UI:

- Search bar.
- Filters for city, sector, function, maturity, confidence.
- Table/card list.
- Detail drawer with source links and verification notes.

MVP data target:

- 30-50 real GCC records.

### Module 3: City Benchmarking

Purpose:

Compare India locations by talent, cost, maturity, and risk.

Required fields:

- city
- state
- city tier
- GCC count/sample count
- dominant sectors
- talent strengths
- salary range assumptions
- office rent range
- attrition proxy
- state incentive summary
- key office clusters
- risks
- best-fit use cases
- source URLs
- confidence score

MVP UI:

- Select 2-3 cities and compare side by side.
- Badges: best for AI, best for cost, best for BFSI, emerging hub, etc.
- Source/confidence shown on each metric group.

MVP data target:

- 8-10 city records.

### Module 4: Build vs Buy Calculator

Purpose:

Help buyers compare setup routes.

Routes:

- EOR / Flexiple-managed team
- BOT / managed offshore team
- direct Indian entity / full GCC

Inputs:

- city
- team size
- timeline
- team mix
- role mix
- control preference
- speed preference

Outputs:

- recommended route
- indicative cost comparison
- timeline comparison
- break-even range
- assumption cards
- source links
- legal/tax disclaimer

MVP assumptions:

- Use source-backed directional assumptions, not precise financial advice.
- Show every assumption in an editable drawer.
- Include warning for AI/ML and cybersecurity skill premiums.

### Module 5: AI Analyst

Purpose:

Demonstrate AI product capability while avoiding hallucination.

MVP behavior:

- Ask questions against local structured dataset.
- If Gemini API key is provided, use Gemini with a strict grounded prompt.
- If no API key is provided, use deterministic local answer templates based on the dataset.
- Every answer must show citations and confidence.
- If data is insufficient, answer: "Insufficient verified data in the GCC Compass database."

Example prompts:

- Best city for a 50-person AI GCC?
- Hyderabad vs Bengaluru for fintech engineering?
- When does EOR stop making sense?
- Which stakeholders should I speak to for a 100-person GCC?

### Module 6: Ecosystem Stakeholder Layer

Purpose:

Address Karthik's follow-up: the product should attract existing stakeholders, not just buyers.

Required fields:

- stakeholder name
- category
- cities covered
- services
- proof points
- source URL
- profile status
- demand signals they care about

MVP UI:

- Stakeholder cards.
- CTAs: claim profile, submit proof, submit data, receive demand signals.
- Example demand signal: "US fintech exploring a 75-person engineering GCC in Hyderabad/Pune within 6 months."

MVP data target:

- 15-25 stakeholder records.

## 5. Trust Layer

This is the core product differentiator.

Every major claim or record should include:

- source URL
- source type
- last checked date
- confidence score
- verified / needs review status
- notes on limitation or assumption

Confidence scoring for MVP:

- 90-100: government source, official company source, MCA/data.gov.in, official policy, annual report.
- 80-89: Nasscom/Zinnov, CBRE, JLL, Knight Frank, Cushman, Colliers, EY, Deloitte, KPMG, PwC, STPI.
- 65-79: well-sourced directory, credible news, D&B report, industry body article.
- 45-64: vendor blog, job posting signal, LinkedIn signal, salary aggregator.
- Below 45: do not use in MVP except as a "needs verification" lead.

## 6. Data Strategy

We will not fabricate data.

For MVP, we will manually curate real public data into local CSV/JSON files.

Why manual curation:

- Faster for a 2-3 day prototype.
- Cleaner than raw crawler output.
- Safer than scraping restricted websites.
- Lets us choose high-signal examples and preserve source links.

Post-MVP, this can become crawler-assisted:

- Use Tinyfish/browser automation for allowed public directories and state policy pages.
- Avoid crawling MCA directly, gated reports, LinkedIn, Naukri, Glassdoor, AmbitionBox, or sources disallowed by terms.

## 7. Dataset Folder Structure

Use this structure:

```text
dataset/
  README.md
  raw/
    reports/
    policies/
    screenshots/
    downloaded-pages/
  processed/
    gcc_records.csv
    city_benchmarks.csv
    state_policies.csv
    stakeholders.csv
    sources.csv
    assumptions.csv
  sources/
    source_links.md
  templates/
    gcc_records_template.csv
    city_benchmarks_template.csv
    state_policies_template.csv
    stakeholders_template.csv
    sources_template.csv
    assumptions_template.csv
  notes/
    collection_log.md
```

## 8. Data Collection Targets

Minimum viable data:

- 30 GCC records
- 8 city records
- 7 state policy records
- 15 stakeholder records
- 20 source records
- 10 calculator assumptions

Strong demo data:

- 50 GCC records
- 10 city records
- 10 state policy records
- 25 stakeholder records
- 40 source records
- 15 calculator assumptions

## 9. Public Data Links To Start From

### Macro GCC Market

- Nasscom-Zinnov India GCC Landscape 2026: https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/
- Zinnov-Nasscom India GCC Landscape 5-Year Journey: https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-report-the-5-year-journey-report/
- Flexiple GCC statistics: https://flexiple.com/gcc/statistics
- STPI GCC publication: https://stpi.in/en/knowledge-center/publication/accelerating-growth-global-capability-centres-gccs-india

### GCC Company Records

- Flexiple GCC India directory: https://flexiple.com/gcc/india
- Flexiple Bengaluru GCC page: https://flexiple.com/gcc/bengaluru
- Flexiple Hyderabad GCC page: https://flexiple.com/gcc/hyderabad
- GCC Index company list: https://gccindex.in/companies
- Business of GCC company data: https://www.businessofgcc.com/gcc-data/companies/cities/bangalore
- GCC Village data: https://www.gccvillage.in/gcc-data
- GCC Journal list: https://gccjournal.in/insights/list-of-global-capability-centers-gcc-in-india/

### Entity Verification

- MCA company master data catalog: https://data.gov.in/catalog/company-master-data
- ROC-wise company master data API/resource: https://www.data.gov.in/resource/registrars-companies-roc-wise-company-master-data
- MCA portal: https://www.mca.gov.in/
- India LEI registry: https://indialei.in/
- ZaubaCorp: https://www.zaubacorp.com/
- PlanetExim company pages: https://www.planetexim.net/

### SEZ / STPI / Facility Signals

- SEZ India approved SEZs: https://sezindia.gov.in/approved-sez
- SEZ India notified SEZ list: https://sezindia.gov.in/sites/default/files/notifed/Notified%20351.pdf
- SEZ India BoA agenda example: https://sezindia.gov.in/sites/default/files/board_of_approval/files/113rd%20BoA%20-%20Agenda.pdf
- SEZ India BoA minutes example: https://sezindia.gov.in/sites/default/files/board_of_approval/files/Minutes%20127th%20BOA%20for%20SEZs.pdf
- STPI statutory services: https://stpi.in/en/statutory-services
- STPI about: https://stpi.in/en/about-stpi

### Real Estate / Office Market

- CBRE India Office Figures Q2 2026: https://www.cbre.co.in/insights/figures/india-office-figures-q2-2026
- CBRE India office demand/supply press release: https://www.cbre.co.in/press-releases/indias-office-demand-and-supply-continue-to-scale-new-peaks-in-q2
- CBRE GCC workspace report: https://www.cbre.com/insights/reports/decoding-the-gcc-surge-insights-into-india-s-transforming-workspace-landscape
- JLL India Office Market Dynamics: https://www.jll.co.in/en/trends-and-insights/research/india-office-market-dynamics
- JLL GCC property page: https://www.jll.com/en-in/property-types/global-capability-centres
- JLL GCC expansion article: https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million
- Knight Frank India research: https://www.knightfrank.co.in/research
- Cushman & Wakefield India office market report: https://cw-prod-emeagws-a-cd.cushwake.com/en/india/insights/india-office-market-report
- Colliers India research: https://www.colliers.com/en-in/research

### Talent / Compensation

- Zinnov salary, attrition and hiring trends for India GCCs: https://zinnov.com/global-talent/salary-increase-attrition-and-hiring-trends-an-india-gcc-view-2026-report/
- Zinnov high-performer attrition blog: https://zinnov.com/global-talent/high-performer-attrition-gcc-india-2026-zinnov-blog/
- Nasscom compensation benchmarking survey 2025: https://community.nasscom.in/communities/nasscom-insights/india-technology-industry-compensation-benchmarking-survey-findings-2025
- Aon India salary increase survey 2026: https://www.aon.com/apac/in-the-press/asia-newsroom/2026/aon-survey-projects-slight-uptick-in-salaries-in-india-2026
- TeamLease Digital reports: https://www.teamleasedigital.com/reports
- Mercer high-tech remuneration database brochure: https://shop.mercer.com/media/wysiwyg/file_uploads/3000500-CP_High_Tech_TRD_brochure-V1.pdf
- Levels.fyi India salaries: https://www.levels.fyi/t/software-engineer/locations/india
- AmbitionBox salaries: https://www.ambitionbox.com/salaries
- Glassdoor India salaries: https://www.glassdoor.co.in/Salaries/index.htm

### State Policies / Incentives

- Karnataka Invest India page: https://www.investindia.gov.in/state/karnataka
- Karnataka GCC policy summary by CBRE: https://www.cbre.co.in/insights/articles/karnataka-gcc-policy-2024-29-pioneering-growth-through-innovation-and-regional-development
- Maharashtra GCC policy: https://industry.maharashtra.gov.in/en/services/policies/maharashtra-global-capability-centre-policy-2025
- Maharashtra IT/ITES Policy PDF: https://industry.maharashtra.gov.in/sites/default/files/2025-09/it-policy-booklet_1_11zon.pdf
- Gujarat GCC policy: https://directorit.gujarat.gov.in/GCC
- Uttar Pradesh GCC policy: https://invest.up.gov.in/up-gcc-policy-2024/
- Tamil Nadu GCC scheme PDF: https://tnswp.com/DIGIGOV/StaticAttachment?AttachmentFileName=%2Fpdf%2Fpoli_noti%2FGo_1.pdf
- Madhya Pradesh policy notifications: https://invest.mp.gov.in/rs_elements/for-investors-policy-notifications/
- Telangana Rising 2047 PDF: https://tgswc.telangana.gov.in/wp-content/uploads/2025/12/TelanganaRising-2047.pdf
- Invest India IT/ITES state blog: https://www.investindia.gov.in/team-india-blogs/six-indian-states-leading-next-wave-it-and-ites-growth
- Odisha data centre policy: https://investodisha.gov.in/datacentre-policy
- Rajasthan IT/ITES: https://rising.rajasthan.gov.in/it-and-ites

### Setup / Build vs Buy / Compliance

- Invest India FAQ: https://www.investindia.gov.in/faq-pdf/17/en
- Flexiple GCC page: https://flexiple.com/gcc
- Flexiple offshore engineering teams: https://flexiple.com/hire-offshore-engineering-teams-in-india
- IndusLaw GCC guide: https://induslaw.com/publications/pdf/alerts-2025/article-operating-a-gcc-in-india-2025.pdf
- EY GCC advisory: https://www.ey.com/en_in/services/consulting/global-capability-centers
- PwC Digital GCC page: https://www.pwc.in/services/global-capability-centre-gcc/digital-global-capability-centers-gccs.html
- Deloitte + Embark GCC alliance: https://www.deloitte.com/in/en/about/press-room/deloitte-india-and-embark-form-a-strategic-alliance.html
- Deel India entity setup: https://www.deel.com/blog/entity-setup-india/
- Deel EOR India: https://www.deel.com/hiring/employees/india/
- RBI Master Directions: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10199
- RBI FEMA notification: https://rbi.org.in/Scripts/NotificationUser.aspx?Id=10289&Mode=0
- Dhruva GCC report: https://www.dhruvaadvisors.com/wp-content/uploads/2025/07/Dhruva-GCC-Report-2025.pdf

### Stakeholder Layer

- GCC Scout: https://www.gccscout.com/
- Business of GCC partners: https://www.businessofgcc.com/gcc-partners/cities/bangalore
- Zinnov GCC setup and transformation: https://zinnov.com/offerings/gcc-setup-and-transformation/
- EY GCC services: https://www.ey.com/en_in/services/consulting/global-capability-centers
- PwC GCC page: https://www.pwc.in/services/global-capability-centre-gcc/digital-global-capability-centers-gccs.html
- KPMG ISG provider lens PDF: https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2025/07/kpmg-firms-identified-as-a-leader-in-isg-provider-lens-global-capability-center-gcc-services-2025.pdf.coredownload.inline.pdf
- Avasant GCC services RadarView example: https://www.cognizant.com/en_us/general/documents/cognizant-avasant-gcc-services-radarview-2025.pdf
- Nasscom: https://www.nasscom.in/
- Invest India: https://www.investindia.gov.in/
- STPI: https://stpi.in/
- CII: https://www.cii.in/
- ICAI GCC Committee: https://gcc.icai.org/

## 10. Step-By-Step Data Sourcing Workflow

### Step 1: Start With Sources, Not Rows

Open `dataset/sources/source_links.md` and add each source you plan to use.

For every source, capture:

- source ID
- source name
- URL
- category
- access type
- trust level
- date accessed
- what fields it provides
- caveats

### Step 2: Save Raw Evidence

For each source:

- If it is a PDF, save it under `dataset/raw/reports/` or `dataset/raw/policies/`.
- If it is a web page, save the URL in `source_links.md` and optionally keep a screenshot under `dataset/raw/screenshots/`.
- If you copy important excerpts, put them in `dataset/notes/collection_log.md` with the source URL.

Do not paste unsourced claims into processed CSV files.

### Step 3: Create Source IDs

Every source should get an ID:

- `SRC_ZINNOV_GCC_2026`
- `SRC_FLEXIPLE_GCC_INDIA`
- `SRC_CBRE_OFFICE_Q2_2026`
- `SRC_UP_GCC_POLICY_2024`

These IDs go into the processed records.

### Step 4: Fill GCC Records

Use `dataset/templates/gcc_records_template.csv`.

For each GCC record:

- Start from Flexiple directory, GCC Index, or official company source.
- Add legal entity/CIN only if verified through MCA/data.gov.in, LEI, official source, or MCA mirror.
- Add source IDs and confidence score.
- If a field is unknown, use `Unknown`, not a guess.

### Step 5: Fill City Benchmarks

Use `dataset/templates/city_benchmarks_template.csv`.

For each city:

- Use CBRE/JLL/Knight Frank/Cushman/Colliers for office data.
- Use Zinnov/Nasscom/TeamLease/Aon/Mercer for talent assumptions.
- Use state policy PDFs for incentives.
- Use ranges where exact numbers are not safely available.

### Step 6: Fill State Policies

Use `dataset/templates/state_policies_template.csv`.

Only use official government policy PDFs or official state/investment portals for incentive details.

Mark each policy as:

- final
- draft
- announced
- needs verification

### Step 7: Fill Stakeholder Records

Use `dataset/templates/stakeholders_template.csv`.

For each stakeholder, capture:

- category
- services
- proof points
- source URL
- what demand signal they would care about

### Step 8: Fill Calculator Assumptions

Use `dataset/templates/assumptions_template.csv`.

Examples:

- EOR setup speed
- direct entity setup timeline
- EOR markup range
- annual salary growth
- AI/ML skill premium
- office cost per seat
- compliance cost assumption

Every assumption must have:

- value or range
- source ID
- confidence
- caveat

### Step 9: Move Cleaned Files To Processed

When a template is filled and checked, copy it into `dataset/processed/`.

The app should eventually read from `processed`, not `raw`.

### Step 10: Track Gaps Honestly

If data is not available, do not invent it.

Use:

- `Unknown`
- `Needs verification`
- `Estimated range`
- `Source unavailable`

This is part of the product's trust story.

## 11. What We Will Not Build In MVP

- Full crawler pipeline.
- 2,000+ GCC directory.
- Login/auth.
- Paid stakeholder marketplace.
- Real legal/tax advice.
- Perfect salary database.
- Automated MCA scraping.
- Scraping gated or restricted sources.

## 12. Success Criteria

The MVP is successful if Karthik can see:

- real public sources were used,
- the tool works end to end,
- data is source-linked and confidence-scored,
- the buyer wedge is clear,
- the ecosystem stakeholder layer is visible,
- the product can plausibly become a defensible GCC intelligence graph for Flexiple.
