# GCC Compass Research Source Map

Last updated: September 24, 2026

## Executive Summary

There is enough credible public data to build a strong demo of GCC Compass, but not enough clean public data to build a fully authoritative production-grade GCC intelligence platform without ongoing verification.

The strongest approach is:

1. Use official and high-credibility sources as anchors.
2. Seed the app with a curated dataset of 40-80 real records.
3. Store source URL, source type, last checked date, and confidence score for every claim.
4. Use AI to summarize, normalize, compare, and answer questions from this structured dataset.
5. Use a crawler later for refresh and discovery, not as the only source of truth.

For the prototype, we do not need Tinyfish or any crawler yet. We can manually curate enough real data from public sources. Tinyfish or a similar crawler becomes useful if we want to scale from a polished demo to a constantly updating intelligence product.

## Source Quality Framework

### Tier 1: Highest Trust

Use these as source-of-truth anchors.

- Government portals and policy PDFs.
- Ministry / parliamentary answers.
- MCA / data.gov.in company master data.
- SEZ India official lists.
- Company annual reports and official press releases.
- Direct state investment promotion portals.

### Tier 2: High Trust Industry Intelligence

Use for market sizing, trends, city comparisons, real estate, salary, and maturity frameworks.

- Nasscom + Zinnov.
- CBRE, JLL, Knight Frank, Cushman & Wakefield, Colliers.
- EY, Deloitte, KPMG, PwC.
- Aon, Mercer, TeamLease Digital, Randstad, Michael Page.
- STPI, CII, ICAI, ACCA, Dun & Bradstreet.

### Tier 3: Useful Directories / Discovery Sources

Use to discover candidate records, then verify against Tier 1 or Tier 2.

- Flexiple GCC directory.
- Business of GCC.
- GCC Index.
- GCC Village.
- GCC Journal.
- Sansovi GCC directory.
- GCC Explorer.
- Provider directories such as GCC Scout.

### Tier 4: Signal Sources

Use for weak or medium-confidence signals, not final truth.

- Job postings.
- LinkedIn company pages.
- News articles.
- Reddit / operator discussions.
- Blog posts from vendors.
- Recruiter reports.

## Best Sources By App Module

## 1. GCC Atlas

Goal: searchable list of companies operating GCCs in India, including city, sector, function, approximate headcount band, source, and confidence.

### Primary Sources

#### Flexiple GCC India Directory

URL: https://flexiple.com/gcc/india

Why it matters:

- Directly relevant to Flexiple.
- Contains a public list of verified centres.
- Has useful city filters and counts.
- Page says each entry traces to a source and headcounts come from Flexiple's talent graph where measurable.

Useful data fields:

- Company / GCC name.
- City.
- Sector.
- Headcount band.
- Captive vs services-led model.
- Source-linked verification if exposed.

Observed public counts from the page:

- Showing 536 verified centers.
- Bangalore 437.
- Delhi NCR 305.
- Hyderabad 299.
- Mumbai 283.
- Chennai 244.
- Pune 169.
- Kolkata 74.
- Coimbatore 48.
- Ahmedabad 30.

How to use in prototype:

- Use as a strong discovery source and compare against other directories.
- Since this is Flexiple's own public asset, the prototype should not merely copy it. The product should add decision intelligence on top: city comparison, build-vs-buy, AI analyst, and stakeholder layer.

#### Zinnov-Nasscom India GCC Landscape Report 2026

URL: https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/

Why it matters:

- Most credible macro anchor for India's GCC ecosystem.
- Co-published by Nasscom and Zinnov.
- Gives the headline market numbers Karthik referenced.

Useful facts:

- India has 2,117 GCCs in FY2026.
- 3,728 GCC units.
- $98.4B market revenue.
- 2.36M GCC workforce.
- 506 Forbes Global 2000 companies have GCCs in India.
- 504 PE-backed GCCs.
- 32% growth since FY2021.
- Zinnov says the research uses 200+ primary interviews, 1M+ job postings, real estate data across top 8 GCC cities, and a GCC tracking database.

How to use in prototype:

- Market Overview module.
- Source badge for top-level market stats.
- City/maturity framework references.

#### Dun & Bradstreet / JLL GCC Reports

Primary source found:

- Rethinking the Future of Global Capability Centers 2025 PDF: https://www.dnb.co.in/files/reports/DNB-Rethinking-the-Future-of-Global-Capability-Centers-2025.pdf
- Hyderabad edition: https://www.dnb.co.in/files/reports/Rethinking-the-Future-of-Global-Capability-Center-Hyderabad-2025.pdf

Why it matters:

- Contains listings of leading GCCs and city-specific insight.
- Useful for sample real company records.

Useful fields:

- Parent company.
- GCC entity / centre type.
- Indian cities.
- Sector and city cluster context.

How to use:

- Seed 30-50 known GCC examples.
- Validate company/city relationships.

#### Business of GCC Directory

URL: https://www.businessofgcc.com/gcc-data/companies/cities/bangalore

Why it matters:

- City-wise company pages.
- Useful descriptions by company and sector.
- Good discovery layer for candidate records.

Caution:

- Treat as Tier 3 until each record is cross-verified.

#### GCC Index

URL: https://gccindex.in/companies

Why it matters:

- Public list of companies by sector and city.
- Useful for finding newer or less obvious GCCs.

Caution:

- Use for discovery, then verify using press releases, MCA, or company sources.

#### GCC Village

URL: https://www.gccvillage.in/gcc-data

Why it matters:

- India GCC Directory 2026 claims compiled data from Nasscom, Zinnov, EY, press releases, and verified public sources.
- Useful for candidate records.

Caution:

- Need cross-verification.

#### GCC Journal List

URL: https://gccjournal.in/insights/list-of-global-capability-centers-gcc-in-india/

Why it matters:

- Gives a publicly readable GCC list with company, city, sector, headcount, and focus area.

Caution:

- Use as discovery, not final truth.

## 2. City Benchmarking

Goal: compare cities on GCC maturity, talent depth, sector strengths, office market, cost, policy incentives, and risk.

### GCC / City Market Sources

#### Zinnov-Nasscom GCC Landscape 2026

URL: https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/

Use for:

- Top 8 city coverage.
- Workforce trends.
- AI talent benchmarks.
- GCC maturity framework.
- Overall city ecosystem credibility.

#### JLL India GCC Pages and Reports

URLs:

- https://www.jll.com/en-in/property-types/global-capability-centres
- https://www.jll.com/en-in/newsroom/india-s-gcc-expansion-hits-record-31-million
- https://www.jll.com/en-in/insights/how-india-s-gccs-transformed-from-cost-centres-to-enterprise-powerhouse
- https://www.jll.com/en-in/insights/market-dynamics/india-office

Useful facts:

- JLL says GCCs leased a record 31M sq ft in 2025.
- JLL reports Bengaluru has 34-39% GCC market share and 900+ GCC units.
- JLL reports Hyderabad has 20-23% market capture and strength in healthcare/biotech.
- JLL office market pages can support demand, supply, rent movement, and leasing trend comparisons.

Use for:

- Office demand.
- City strengths.
- Real estate maturity.
- Office market momentum.

#### CBRE India Office and GCC Research

URLs:

- https://www.cbre.com/insights/reports/decoding-the-gcc-surge-insights-into-india-s-transforming-workspace-landscape
- https://www.cbre.co.in/insights/figures/india-office-figures-q2-2026
- https://www.cbre.co.in/press-releases/indias-office-demand-and-supply-continue-to-scale-new-peaks-in-q2

Useful facts:

- CBRE says GCCs leased about 10.3M sq ft in Q2 2026.
- In H1 2026, GCCs absorbed around 19.6M sq ft.
- GCCs represented 43% of total H1 2026 office leasing.
- Bengaluru, Hyderabad and Pune accounted for 68% of large-format transactions in Q2 2026.

Use for:

- City office market score.
- GCC real estate demand strength.
- Office supply and leasing charts.

#### Knight Frank India Research

URLs:

- https://www.knightfrank.co.in/research
- https://content.knightfrank.com/research/3013/documents/en/india-real-estate-office-and-residential-market-h1-2025-12239.pdf

Use for:

- Office rentals by market.
- City leasing and completions.
- Rental movement.
- Residential + office market context.

Why it matters:

- Knight Frank PDFs often include city-wise rental values in INR per sq ft per month, which is exactly what the City Benchmarking module needs.

#### Cushman & Wakefield India Office Market Report

URL: https://cw-prod-emeagws-a-cd.cushwake.com/en/india/insights/india-office-market-report

Use for:

- Grade A supply.
- Vacancy and rents.
- Leasing by city.
- Office market trend validation.

#### Colliers India Research

URL: https://www.colliers.com/en-in/research

Use for:

- Office market reports.
- Flex space trends.
- City-level commercial real estate commentary.

## 3. Build vs Buy Calculator

Goal: compare EOR / managed team / BOT / direct entity / full GCC setup.

### Setup Model Sources

#### Flexiple GCC and Offshore Team Pages

URLs:

- https://flexiple.com/gcc
- https://flexiple.com/
- https://flexiple.com/about
- https://flexiple.com/hire-offshore-engineering-teams-in-india

Use for:

- Flexiple-aligned route options.
- Positioning Flexiple-managed team vs own India entity.
- Services involved: sourcing, evaluation, onboarding, payroll, compliance, equipment, office/IT admin, scaling.

#### Legal / GCC Setup Guides

IndusLaw GCC guide:

- https://induslaw.com/publications/pdf/alerts-2025/article-operating-a-gcc-in-india-2025.pdf

Use for:

- Models of GCC setup.
- EOR vs entity considerations.
- Legal, labour, real estate, payroll, compliance issues.

EY GCC Advisory:

- https://www.ey.com/en_in/services/consulting/global-capability-centers

Use for:

- GCC lifecycle categories: strategy, setup, operations, transformation, governance, workforce, AI-enabled GCC, digital enablement.

Deloitte + Embark alliance:

- https://www.deloitte.com/in/en/about/press-room/deloitte-india-and-embark-form-a-strategic-alliance.html

Use for:

- Proof that end-to-end GCC setup is an active advisory market.
- Competitive landscape for Flexiple.

ISG / KPMG GCC Services report:

- https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2025/07/kpmg-firms-identified-as-a-leader-in-isg-provider-lens-global-capability-center-gcc-services-2025.pdf.coredownload.inline.pdf

Use for:

- Provider landscape: strategy consulting, setup, optimization, managed services.

Avasant GCC Services RadarView excerpt:

- https://www.cognizant.com/en_us/general/documents/cognizant-avasant-gcc-services-radarview-2025.pdf

Use for:

- Service provider list and categories.

## 4. Talent And Compensation Benchmarks

Goal: estimate salary bands, talent depth, attrition, increments, and city-level skill strength.

### Highest Quality Sources

#### Zinnov Salary Increase, Attrition & Hiring Trends: India GCC View 2026

URL: https://media.zinnov.com/wp-content/uploads/2025/11/salary-increase-attrition-hiring-trends-an-india-gcc-view-2026-report.pdf

Use for:

- GCC-specific salary increase, attrition, and hiring trends.
- Survey methodology across 93+ GCCs.
- GCC-specific rather than generic tech market view.

#### Nasscom India Technology Industry Compensation Benchmarking Survey 2025

URL: https://community.nasscom.in/communities/nasscom-insights/india-technology-industry-compensation-benchmarking-survey-findings-2025

Use for:

- Salary increase trends.
- Attrition.
- Benefits.
- Niche skills and premiums.

#### Aon Annual Salary Increase and Turnover Survey 2025-26 India

URL: https://www.aon.com/apac/in-the-press/asia-newsroom/2026/aon-survey-projects-slight-uptick-in-salaries-in-india-2026

Useful fact:

- Aon projects India salary increases at 9.1% in 2026.

Use for:

- Macro salary growth assumption in calculator.
- Annual escalation input.

#### TeamLease Digital Reports

URL: https://www.teamleasedigital.com/reports

Use for:

- Digital skills salary primer.
- Skill demand and role-level salary trends.
- GCC and non-tech sector comparisons.

#### Mercer High Tech Total Remuneration Database

URL: https://shop.mercer.com/media/wysiwyg/file_uploads/3000500-CP_High_Tech_TRD_brochure-V1.pdf

Use for:

- Commercial benchmark source reference.
- May not provide free granular data, but credible for deck source mapping.

### Useful But Lower Confidence Salary Sources

- Randstad Salary Trends Report 2025-26.
- Michael Page Salary Guide India.
- Levels.fyi salary heatmaps.
- AmbitionBox salary pages.
- Glassdoor salary pages.
- Naukri / IIMJobs / LinkedIn job postings.
- MyAnatomy GCC Talent Index 2026: https://myanatomy.ai/assets/pdfs/gcc_pdf/GCC_Talent_Index_2026_Report.pdf

Caution:

- These can be noisy, role definitions differ, and some platforms are user-reported.
- Use ranges, not precise numbers.
- Clearly label as estimates.

## 5. Government Policy And Incentive Tracker

Goal: compare states by GCC policy, incentives, eligibility, target sectors, target cities, and nodal agency.

### National / Central Government Sources

#### STPI GCC Report

URL: https://stpi.in/en/knowledge-center/publication/accelerating-growth-global-capability-centres-gccs-india

Why it matters:

- Official STPI / MeitY-linked source.
- Covers need for national GCC policy.
- Looks at states including Gujarat, Haryana, Madhya Pradesh, Maharashtra, Karnataka, Tamil Nadu, Telangana, and Uttar Pradesh.

#### Lok Sabha / MeitY Answer On GCCs

URL: https://sansad.in/getFile/loksabhaquestions/annex/187/AU2996_3pbGyi.pdf?source=pqals

Use for:

- Government acknowledgement of GCC industry size and policy direction.
- National framework mention for emerging tier-2 cities.

#### SEZ India

URLs:

- https://sezindia.gov.in/approved-sez
- https://www.sezindia.nic.in/sites/default/files/operational_SEZ/Operational%20SEZs%20in%20India%20276.pdf

Use for:

- IT/ITES SEZ locations.
- Developer names.
- City infrastructure signals.
- Potential office cluster evidence.

### State Policy Sources

#### Karnataka GCC Policy 2024-2029

Sources:

- CBRE summary: https://www.cbre.co.in/insights/articles/karnataka-gcc-policy-2024-29-pioneering-growth-through-innovation-and-regional-development
- Draft policy PDF found publicly: https://www.hiwave.or.jp/panf/Draft-KarnatakaGCCPolicy2024-2029-.pdf

Useful facts:

- Karnataka aims to attract 500 new GCCs.
- Target of 3.5 lakh new jobs by 2029.
- Strong Bengaluru + beyond-Bengaluru angle.

Need further verification:

- Find final official Karnataka government policy PDF before using exact incentive tables.

#### Maharashtra GCC Policy 2025

URL: https://industry.maharashtra.gov.in/en/services/policies/maharashtra-global-capability-centre-policy-2025

Use for:

- Official policy attachment.
- Maharashtra state policy tracker.
- Nodal department and year.

#### Gujarat GCC Policy 2025-30

URL: https://directorit.gujarat.gov.in/GCC

Useful facts:

- Gujarat wants to attract at least 250 new GCC units.
- Target of more than 50,000 jobs.
- Target investment of INR 10,000 crore.

Use for:

- State incentive tracker.
- Emerging hub example.

#### Uttar Pradesh GCC Policy 2024

URL: https://invest.up.gov.in/up-gcc-policy-2024/

Useful facts:

- Defines GCC as a global in-house centre / offshore unit owned and operated by parent company.
- Explicitly excludes staffing companies and service providers from GCC eligibility.
- Provides policy docs and implementation rules.
- Useful for definitions and eligibility logic.

#### Tamil Nadu Special Scheme To Promote GCCs

URL: https://tnswp.com/DIGIGOV/StaticAttachment?AttachmentFileName=%2Fpdf%2Fpoli_noti%2FGo_1.pdf

Use for:

- State incentive comparison.
- Chennai / Coimbatore / GCC corridor positioning.

#### Madhya Pradesh GCC Policy 2025

URL: https://invest.mp.gov.in/rs_elements/for-investors-policy-notifications/

Use for:

- Tier-2 / emerging city incentive comparison.
- Policy tracker.

#### Telangana GCC Policy Direction

Source found:

- Telangana Rising 2047 PDF: https://tgswc.telangana.gov.in/wp-content/uploads/2025/12/TelanganaRising-2047.pdf

Useful facts:

- Telangana indicates a planned GCC Policy 2025-2030 and single-window nodal body.
- Useful for Hyderabad positioning.

Need further verification:

- Find final Telangana GCC policy page/PDF if published.

## 6. Real Estate Cost And Office Cluster Data

Goal: city and micro-market office costs: ORR Bengaluru, Whitefield, HITEC City, Gachibowli, Hinjewadi, Magarpatta, Gurugram Cyber City, Noida, Chennai OMR, etc.

### Best Sources

- CBRE India Office Figures / Market Monitor.
- JLL India Office Market Dynamics.
- Knight Frank India Real Estate reports.
- Cushman & Wakefield India Office Market Report.
- Colliers India Office reports.
- SEZ India operational SEZ lists.
- Developer / REIT investor presentations such as Embassy, Mindspace, Brookfield, Nexus, Bagmane where public.

### App Fields To Extract

- City.
- Micro-market.
- Average rent INR / sq ft / month.
- Vacancy.
- Absorption.
- New supply.
- Grade A stock.
- GCC leasing share.
- Major tech parks / clusters.
- Major occupiers if publicly available.

### Important Caution

Exact current rent numbers are often inside PDFs or gated reports. For MVP, use directional ranges and cite the report source. Do not overclaim precision.

## 7. Ecosystem Stakeholder Layer

Goal: show advisors, Big 4, real estate firms, recruiters, EORs, government bodies, and industry bodies with claim-profile and proof-submission flows.

### Provider / Stakeholder Sources

#### GCC Scout

URL: https://www.gccscout.com/

Use for:

- Service provider category discovery.
- Advisory, legal, HR, real estate, IT infrastructure categories.

#### Business of GCC Service Provider Pages

URL: https://www.businessofgcc.com/gcc-partners/cities/bangalore

Use for:

- Partner/service provider discovery by city.

#### EY GCC Advisory

URL: https://www.ey.com/en_in/services/consulting/global-capability-centers

Use for:

- Big 4 stakeholder profile example.

#### Deloitte + Embark GCC Alliance

URL: https://www.deloitte.com/in/en/about/press-room/deloitte-india-and-embark-form-a-strategic-alliance.html

Use for:

- Big 4 + on-ground operator partnership example.

#### KPMG / ISG Provider Lens GCC Services 2025

URL: https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2025/07/kpmg-firms-identified-as-a-leader-in-isg-provider-lens-global-capability-center-gcc-services-2025.pdf.coredownload.inline.pdf

Use for:

- Provider categories and competitive landscape.

#### Avasant GCC Services RadarView 2025

URL: https://www.cognizant.com/en_us/general/documents/cognizant-avasant-gcc-services-radarview-2025.pdf

Use for:

- Service provider list: Accenture, Aeries, ANSR, Capgemini, Coforge, Cognizant, Deloitte, EY, Genpact, HCLTech, IBM, Infosys, KPMG, LTIMindtree, PwC, TCS, Tech Mahindra, Wipro, etc.

#### Industry Bodies

- Nasscom: https://www.nasscom.in/
- STPI: https://stpi.in/
- CII: https://www.cii.in/
- ICAI GCC Committee: https://gcc.icai.org/
- Invest India: https://www.investindia.gov.in/

Use for:

- Stakeholder profiles.
- Ecosystem credibility.
- Reports and policy links.

## 8. Company-Level Verification Sources

For each GCC record, the best validation stack is:

1. Company press release / official India careers page.
2. Annual report / investor presentation.
3. MCA / data.gov.in company master data.
4. SEZ unit list if applicable.
5. Credible news article.
6. Job postings / LinkedIn as activity signal.
7. Third-party directory as discovery signal.

### MCA / data.gov.in Company Master Data

URL: https://data.gov.in/catalog/company-master-data

API/resource page: https://www.data.gov.in/resource/registrars-companies-roc-wise-company-master-data

Useful facts:

- Data contains CIN, company name, company status, company class/category/sub-category, authorized capital, paid-up capital, date of registration, registered state, Registrar of Companies, principal business activity, registered office address, and sub-category.
- Published by Ministry of Corporate Affairs on data.gov.in.
- Updated in 2026.

Use for:

- Entity verification.
- Indian legal entity name.
- State of registration.
- Incorporation date.
- Paid-up capital proxy.

Caution:

- MCA data does not directly say a company is a GCC.
- It confirms legal entity existence and metadata only.

## Recommended MVP Dataset

For the prototype, build a curated dataset with:

### GCC Records: 40-80

Fields:

- id
- parent_company
- gcc_name_or_india_entity
- sector
- cities
- primary_city
- parent_country
- functions
- headcount_band
- maturity_stage
- source_url
- source_type
- confidence_score
- notes

Source mix:

- 15 from Flexiple public directory.
- 10 from D&B / JLL list.
- 10 from Business of GCC / GCC Index, cross-verified with press/news.
- 5-10 from recent official company announcements.

### City Records: 8-10

Cities:

- Bengaluru
- Hyderabad
- Pune
- Chennai
- Delhi NCR / Gurugram / Noida
- Mumbai
- Ahmedabad / GIFT City
- Coimbatore
- Kolkata
- Kochi or Thiruvananthapuram

Fields:

- city
- gcc_maturity_score
- talent_depth_score
- ai_ml_strength
- erd_strength
- bfsi_strength
- healthcare_life_sciences_strength
- average_senior_engineer_salary_range
- average_ml_engineer_salary_range
- office_rent_range
- key_clusters
- state_policy_summary
- risks
- best_for
- source_urls

### State Policy Records: 7-10

States:

- Karnataka
- Telangana
- Maharashtra
- Tamil Nadu
- Gujarat
- Uttar Pradesh
- Madhya Pradesh
- Haryana
- Kerala
- Rajasthan if data is available

Fields:

- state
- policy_name
- effective_years
- target_gccs
- target_jobs
- incentives
- eligibility
- nodal_agency
- source_url
- confidence_score

### Stakeholder Records: 20-30

Categories:

- GCC advisor
- Big 4 / consulting
- legal / tax
- real estate
- recruiter / RPO
- payroll / EOR
- government / investment promotion
- industry body

Fields:

- stakeholder_name
- category
- cities_supported
- proof_points
- profile_status
- source_url
- claim_profile_cta
- submit_proof_cta
- confidence_score

## Should We Use Tinyfish Crawler?

### Short Answer

Not for the first prototype. Yes for the next step if we want the app to feel like a real intelligence engine.

### Why Not Needed For MVP

- We only need 40-80 GCC records, 8-10 city records, and 20-30 stakeholder records.
- Manual curation is faster and cleaner for a 2-3 day challenge.
- Crawler output still needs human cleaning, deduplication, and confidence scoring.
- The demo's quality depends more on product judgment than raw volume.

### Where Tinyfish Would Help

Use Tinyfish or an equivalent crawler for:

- State policy PDFs and updates.
- GCC announcement press releases.
- Company newsroom pages.
- Public GCC directories.
- Real estate research report pages.
- SEZ India PDFs.
- Provider profile discovery.
- Monthly refresh of city and policy source links.

### Where Not To Crawl Without Care

Avoid or use official APIs/permission for:

- LinkedIn.
- Naukri.
- Glassdoor.
- AmbitionBox.
- Gated consultant reports.
- Login-only datasets.
- Pages whose terms prohibit scraping.

### Best Crawler Design If Used Later

Crawler should not just scrape text. It should output structured records:

- entity_name
- entity_type
- city
- sector
- claim_type
- claim_value
- source_url
- source_title
- source_published_date
- crawl_date
- extracted_quote_or_snippet
- confidence_score
- needs_human_review

For the app, every AI answer should cite these records rather than free-generating from the web.

## Recommended Source Confidence Scoring

- 95-100: official government source, official company source, MCA/data.gov.in, company annual report.
- 85-94: Nasscom/Zinnov, CBRE, JLL, Knight Frank, Cushman, EY, Deloitte, KPMG, PwC, STPI, CII.
- 70-84: reputable business publication, D&B report, industry association report, well-sourced directory.
- 50-69: third-party directory, vendor blog, job posting pattern, LinkedIn signal.
- Below 50: social posts, Reddit, unverified claims, uncited blogs.

## Data Gaps To Be Honest About

- No public source has a perfect canonical list of all Indian GCCs.
- Headcount is often estimated, not disclosed.
- City-wise role compensation is noisy and source definitions differ.
- Office rent varies dramatically by micro-market and lease quality.
- State incentives may be announced before operational rules are fully clear.
- Service provider delivery quality is hard to verify without customer proof.

These gaps should become product features:

- Confidence scores.
- Source labels.
- Last verified dates.
- Contradiction flags.
- Claim profile / submit proof workflows.

## Best Initial App Data Sources

Use these first for the actual prototype:

1. Zinnov-Nasscom GCC Landscape 2026 for macro numbers.
2. Flexiple GCC India Directory for sample company/city records.
3. D&B / JLL GCC report for listed GCC examples.
4. CBRE Q2 2026 office figures for real estate and GCC leasing share.
5. JLL GCC Guide / newsroom for city positioning.
6. data.gov.in MCA company master data for entity verification story.
7. Gujarat, Maharashtra, UP, Tamil Nadu, Karnataka, MP, Telangana policy pages/PDFs for incentive tracker.
8. Aon / Zinnov / TeamLease / Nasscom compensation sources for talent cost assumptions.
9. EY, Deloitte, KPMG/ISG, Avasant, GCC Scout for stakeholder layer.

## Product Implication

The big insight from this research:

GCC Compass should not claim to have perfect truth. It should claim to make fragmented truth usable.

The product's defensibility is not just the dataset. It is the verification layer:

- What is the claim?
- Where did it come from?
- How credible is the source?
- When was it last checked?
- Does another source contradict it?
- Can the stakeholder claim or correct it?

That is exactly the market gap Karthik described.

## Deep Research Synthesis Addendum

Added after reviewing:

- `Docs/Chatgpt-deep-research-report.md`
- `Docs/Gemini- India GCC Ecosystem Research Plan.md`

These notes extend the original source map. Treat numeric claims from secondary research as candidate assumptions until verified against the cited original URLs.

## New Findings From ChatGPT Deep Research Report

### 1. GCC Index Is A Stronger Atlas Source Than Initially Weighted

Source:

- https://gccindex.in/companies

New useful detail:

- Report says GCC Index covers around 318 companies.
- It may include company name, industry, primary function, city/state, incorporation events, CIN-linked events, and news timeline.
- This is especially useful because it can bridge the gap between a marketing-style GCC directory and legal/entity verification.

How to use in GCC Compass:

- Use GCC Index as a second discovery layer after Flexiple's public GCC directory.
- Pull candidate company records from GCC Index, then verify Indian legal entities using MCA/data.gov.in, ZaubaCorp, PlanetExim, India LEI, official company pages, or press releases.
- Add an `events` or `timeline` field to GCC records for incorporation, office announcement, expansion, and hiring signals.

Caveat:

- Treat it as partial coverage, not canonical truth.
- Some advanced data may require login.

### 2. Entity Verification Can Use MCA Mirrors And LEI, But With Ethics Caveats

Sources:

- MCA/data.gov.in company master data: https://data.gov.in/catalog/company-master-data
- ZaubaCorp example: https://www.zaubacorp.com/ABERCROMBIE-AND-FITCH-GLOBAL-CAPABILITY-CENTER-PRIVATE-LIMITED-U62099KA2025FTC209169
- PlanetExim example: https://www.planetexim.net/indian-company/abercrombie-fitch-global-capability-center-private-limited/cin/U62099KA2025FTC209169.html
- India LEI example: https://indialei.in/detailed-information/58702229/64884CLO58U8UG9W0252/abercrombie-fitch-global-capability-center-private-limited/

New useful detail:

- ZaubaCorp and PlanetExim can expose MCA-derived fields such as company name, CIN, incorporation date, activity code, authorized capital, and registered address.
- India LEI can confirm legal name, registration date, address, CIN, and status for entities that have LEI records.

How to use in GCC Compass:

- Add `cin`, `incorporation_date`, `legal_entity_source`, and `entity_verification_status` to GCC records.
- For prototype, manually verify 10-20 recognizable GCC entities to demonstrate depth.
- Do not crawl MCA directly. MCA has login/CAPTCHA and should be treated as non-crawlable unless using licensed data/API access.

Caveat:

- Mirror sites may have scraping/legal/ToS risks and should not be aggressively crawled.
- LEI coverage is incomplete; not all GCC entities will have LEI records.

### 3. Add BusinessOfGCC Report As A Category-Validation Source

Source:

- https://www.businessofgcc.com/

New useful detail:

- Even if detailed report data is paid, public summaries/table-of-contents can validate which categories matter: market size, city metrics, talent, cost, sectors, service providers, and emerging hubs.

How to use in GCC Compass:

- Use it to sanity-check the deck and product taxonomy.
- Do not rely on it for hard numbers unless the exact source content is accessible and cited.

### 4. ChatGPT Report Adds Practical Stakeholder Categories

New stakeholder examples to include:

- Recruiters/RPO: TeamLease, Randstad, Michael Page, Adecco, ManpowerGroup.
- Legal/tax: IndusLaw, Khaitan, Trilegal, Cyril Amarchand, Nishith Desai.
- Payroll/EOR: Papaya Global, Remote.com, Safeguard Global, Deel, Oyster, Avantis/TeamLease.
- Government/IPAs: Invest India, STPI, KIADB/KINFRA, TSIIC, GIDB and state-level investment agencies.
- Industry bodies: Nasscom, CII, FICCI, ACCA, ICAI GCC Committee.

How to use in GCC Compass:

- Create 20-30 stakeholder seed profiles grouped by category.
- Add `demand_signals_of_interest` field, e.g. real estate firms care about office-size/location intent; recruiters care about role volume and timeline; state governments care about jobs/investment potential.

### 5. Crawler Recommendation Is More Specific

New useful detail:

- Tinyfish/browser automation is useful for JS-heavy directories like Flexiple's public GCC pages and possibly GCC Index.
- It is not useful for gated reports, salary databases, or official MCA portal.
- Real estate and salary reports should be manually extracted from PDFs/press releases for MVP.

Updated crawler stance:

- No crawler needed for first demo.
- Use crawler later for refresh/discovery, especially directory pages and state policy pages.
- Always check robots.txt and terms; use throttling and source attribution.

## New Findings From Gemini Research Report

### 1. SEZ India And Board Of Approval Minutes Are A Hidden High-Value Source

Sources:

- Approved SEZ portal: https://sezindia.gov.in/approved-sez
- Noida SEZ establishment notifications: https://sezindia.gov.in/notifications-for-establishments/58
- Example BoA agenda PDF: https://sezindia.gov.in/sites/default/files/board_of_approval/files/113rd%20BoA%20-%20Agenda.pdf
- Example BoA minutes PDF: https://sezindia.gov.in/sites/default/files/board_of_approval/files/Minutes%20127th%20BOA%20for%20SEZs.pdf
- Notified SEZ list: https://sezindia.gov.in/sites/default/files/notifed/Notified%20351.pdf

New useful detail:

- SEZ India can provide approved SEZs, developer names, locations, notified areas, IT/ITeS classification, and Board of Approval minutes.
- BoA minutes may contain tenant expansion requests, unit approvals, denotifications, and infrastructure changes.
- This is a strong official source for office cluster and facility-level verification.

How to use in GCC Compass:

- Add `sez_or_stpi_status`, `office_cluster`, `tech_park`, `developer`, and `facility_source_url` fields where available.
- Use SEZ data to enrich city benchmarking and GCC Atlas records.
- Long term: crawl/download BoA PDFs and use OCR/text extraction for entity and tech park mentions.

Important caveat:

- A company being located inside an SEZ park does not always mean the specific tenant operates as an SEZ export unit or gets SEZ benefits.
- SEZ Rule 11A / dual-use space means GCC Compass should distinguish between:
  - SEZ processing zone
  - STPI registered unit
  - Domestic Tariff Area office stock
  - non-processing / dual-use office area

Product implication:

- Add a tooltip or warning in City Benchmarking: "SEZ location does not automatically imply tax benefit eligibility. Verify unit status and lease area type."

### 2. Tier-2 City Economics Are A Strong Product Insight

Source candidate:

- Nasscom Community: https://community.nasscom.in/communities/gcc/beyond-metros-indias-next-gcc-frontier

New useful detail from Gemini report:

- Tier-2 office rentals may be 40-50% of Tier-1 rates.
- Experienced GCC professional salaries may be 20-30% lower in tier-2 cities.
- Attrition may be 12-15% in tier-2 cities versus 20-25% in major metros.

How to use in GCC Compass:

- Add an "Emerging Hub Advantage" component to City Benchmarking.
- Show a simple cost/talent tradeoff for Coimbatore, Kochi, Indore, Jaipur, Bhubaneswar, Mysuru, Visakhapatnam, and Ahmedabad/GIFT City.
- Use as directional assumptions only unless verified against original source text.

Product implication:

- The app should not only rank Bengaluru/Hyderabad/Pune. It should show when a tier-2 city is strategically better: lower cost, lower attrition, better retention, but weaker depth for niche senior roles.

### 3. Talent Cost Modeling Needs Skill-Specific Premiums, Not Flat Salary Bands

Sources:

- Zinnov high-performer attrition blog: https://zinnov.com/global-talent/high-performer-attrition-gcc-india-2026-zinnov-blog/
- Zinnov salary/attrition/hiring report: https://zinnov.com/global-talent/salary-increase-attrition-and-hiring-trends-an-india-gcc-view-2026-report/
- Zinnov GCC setup year-3 risk blog: https://zinnov.com/centers-of-excellence/what-no-one-tells-you-about-gcc-setups-that-struggle-by-year-3-blog/

New useful detail from Gemini report:

- Report claims average GCC salary hikes around 9.8%.
- AI/ML roles may command around 21.1% salary increase.
- Cybersecurity roles may require around 20.0% salary increase.
- GCC roles may pay a 12-20% premium over domestic IT services baselines.
- AI/ML capabilities may command an additional 30-40% premium on top of GCC baseline.
- High performers may receive 1.8x the average hike.

How to use in GCC Compass:

- Add `skill_premium_multiplier` to the Build vs Buy calculator.
- Let users choose team mix: General Engineering, AI/ML, Data Engineering, Cybersecurity, Product, Finance Ops.
- Calculator should warn: "Blended averages understate specialized AI/cybersecurity GCC cost."

Caveat:

- These figures must be verified before being presented as exact values. For MVP, they can be used as clearly labeled assumptions with source links.

### 4. Build-vs-Buy Calculator Should Include Compliance And Transfer Pricing Assumptions

Sources:

- Invest India FAQ: https://www.investindia.gov.in/faq-pdf/17/en
- Deel India entity setup: https://www.deel.com/blog/entity-setup-india/
- Deel EOR India: https://www.deel.com/hiring/employees/india/
- RBI Master Directions: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10199
- RBI FEMA notification: https://rbi.org.in/Scripts/NotificationUser.aspx?Id=10289&Mode=0
- PwC Budget 2026 analysis: https://www.pwc.in/budget/union-budget-2026.html
- Dhruva GCC Report 2025: https://www.dhruvaadvisors.com/wp-content/uploads/2025/07/Dhruva-GCC-Report-2025.pdf

New useful detail:

- IT/ITeS may allow 100% FDI under automatic route, but FEMA and RBI reporting still matter.
- Direct entity setup should include WOS/private limited setup, GST, PF/ESI, payroll, local director/authorized signatory, FEMA/RBI filings, transfer pricing, office lease, equipment, IT admin, and annual compliance.
- Gemini report suggests EOR can be viable for speed, but may lose financial viability beyond roughly 30-50 employees depending on timeline and markup.
- It also highlights transfer pricing safe harbour / margin assumptions as a cost-model input, but these need careful verification and disclaimers.

How to use in GCC Compass:

- Add an "assumptions drawer" to the Build vs Buy calculator:
  - EOR monthly markup assumption
  - statutory employer cost assumption
  - direct entity setup cost
  - monthly compliance cost
  - office cost per seat
  - transfer pricing / captive margin disclaimer
- Keep it as strategic modeling, not legal/tax advice.

Product warning:

- The calculator must say: "This is an indicative model. Actual tax, transfer pricing, and compliance outcomes require qualified legal/tax advice."

### 5. State Policy Layer Needs Quantified Incentive Fields

New useful fields from Gemini report:

- `capital_subsidy_pct`
- `capital_subsidy_cap`
- `payroll_reimbursement_cap`
- `epf_reimbursement_years`
- `sgst_reimbursement_pct`
- `stamp_duty_exemption_pct`
- `electricity_duty_exemption_years`
- `training_subsidy`
- `policy_status`
- `notified_or_draft`

Additional state/policy sources to include:

- Karnataka Invest India state page: https://www.investindia.gov.in/state/karnataka
- Invest India IT/ITeS state blog: https://www.investindia.gov.in/team-india-blogs/six-indian-states-leading-next-wave-it-and-ites-growth
- Maharashtra IT/ITES Policy 2023 PDF: https://industry.maharashtra.gov.in/sites/default/files/2025-09/it-policy-booklet_1_11zon.pdf
- Odisha Data Centre Policy: https://investodisha.gov.in/datacentre-policy
- Odisha Pharmaceutical and Medical Devices Policy 2025: https://investodisha.gov.in/odisha-pharmaceutical-medical-devices-policy-2025
- Rajasthan IT/ITeS: https://rising.rajasthan.gov.in/it-and-ites

Caveat:

- Odisha's data centre/pharma policies are not GCC-specific, but can matter for sector-specific GCCs or infrastructure-heavy setups.
- Exact incentive numbers should come from official policy PDFs, not secondary summaries.

### 6. Add Maturity Stage To GCC Atlas

Sources:

- Nasscom Community GCC Value Orbit: https://community.nasscom.in/communities/nasscom-insights/gcc-value-orbit-delivery-engine-enterprise-nerve-centre
- Zinnov GCC 101: https://zinnov.com/centers-of-excellence/global-capability-centers-101-all-you-need-to-know-about-gccs-blog/
- Zinnov future of GCCs 2026: https://zinnov.com/centers-of-excellence/the-future-of-gccs-in-india-2026-leadership-ai-native-gccs-talent-and-the-next-phase-of-growth-blog/

New useful detail:

- GCCs can be tagged by maturity stage rather than only headcount:
  - Cost Arbitrage / Delivery Engine
  - Centre of Excellence
  - Portfolio Hub
  - Transformation Hub / Enterprise Nerve Centre
  - AI-native GCC

How to use in GCC Compass:

- Add a maturity filter in GCC Atlas.
- Use maturity stage in AI Analyst answers: "For AI-native GCCs, Hyderabad and Bengaluru have deeper talent, but emerging hubs may be better for cost-focused support functions."

### 7. AI Analyst Needs A Strict Refusal Mode

New useful detail:

- Gemini explicitly recommends the AI Analyst respond: "Insufficient verified data in the GCC Compass database" when the dataset does not support an answer.

How to use in GCC Compass:

- Implement a no-hallucination instruction in the system prompt.
- Every answer should cite source records.
- If no source-backed answer exists, the assistant should refuse gracefully and suggest what data would be needed.

### 8. Better Confidence Score Formula

Gemini's formula is useful for productizing the trust layer:

- Base score by source type:
  - +60 primary source: government, MCA, SEZ, direct company release.
  - +40 vetted secondary source: Nasscom/Zinnov, Big 4, CBRE/JLL/Knight Frank/Cushman/Colliers.
  - +20 tertiary/signal source: job board, LinkedIn, crowdsourced salary, vendor blog.
- Recency multiplier:
  - 1.0 if updated within 6 months.
  - 0.8 if 6-12 months old.
  - 0.5 if 1-2 years old.
  - 0.2 if older than 2 years.
- Bonuses:
  - +20 cross-verification bonus if corroborated by two or more distinct source categories.
  - +10 completeness bonus if parent, Indian entity, city, function, and headcount are filled.
- Cap at 100.

How to use in GCC Compass:

- Show confidence score on every GCC record.
- For MVP, compute manually using this simplified formula.

### 9. New Risk: Real Estate Dual-Use And Tax Eligibility Confusion

New useful detail:

- SEZ/tech park labels can mislead buyers.
- A GCC in a tech park may not receive SEZ benefits if operating from DTA or non-processing/dual-use areas.

How to use in GCC Compass:

- Add `tax_benefit_status` as Unknown / Confirmed / Not Applicable / Needs Verification.
- Add source-backed explanations instead of assuming benefits from location.

## Merged Product Implications

### Prototype Changes To Consider

1. GCC Atlas should include:
   - CIN / Indian legal entity where available.
   - Maturity stage.
   - Source confidence score.
   - Timeline/events.
   - Entity verification status.

2. City Benchmarking should include:
   - Tier-1 vs tier-2 classification.
   - Talent attrition proxy.
   - Office rent range.
   - Emerging hub advantage badge.
   - SEZ/STPI/DTA caution note.

3. Build vs Buy Calculator should include:
   - Team size and timeline.
   - Team mix / skill mix.
   - EOR markup assumption.
   - Direct entity setup and compliance cost assumption.
   - Skill premium multiplier for AI/ML/cybersecurity.
   - Break-even range around 30-50 employees, shown as assumption rather than fact.
   - Legal/tax disclaimer.

4. AI Analyst should include:
   - Citation-only responses.
   - Refusal mode when data is insufficient.
   - Source cards with confidence scores.

5. Stakeholder Layer should include:
   - Claim profile.
   - Submit proof.
   - Submit policy/data update.
   - Receive demand signals.
   - Stakeholder-specific demand signal examples.

### Best New MVP Data Sources To Add Immediately

1. GCC Index company pages: https://gccindex.in/companies
2. India LEI registry examples for entity validation: https://indialei.in/
3. SEZ India approved SEZs and BoA minutes: https://sezindia.gov.in/approved-sez
4. STPI statutory services: https://stpi.in/en/statutory-services
5. Invest India FAQ for setup basics: https://www.investindia.gov.in/faq-pdf/17/en
6. RBI Master Directions/FEMA source for compliance references: https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10199
7. Zinnov talent and year-3 GCC risk blogs:
   - https://zinnov.com/global-talent/high-performer-attrition-gcc-india-2026-zinnov-blog/
   - https://zinnov.com/global-talent/salary-increase-attrition-and-hiring-trends-an-india-gcc-view-2026-report/
   - https://zinnov.com/centers-of-excellence/what-no-one-tells-you-about-gcc-setups-that-struggle-by-year-3-blog/
8. Nasscom tier-2 GCC frontier article: https://community.nasscom.in/communities/gcc/beyond-metros-indias-next-gcc-frontier
9. PwC / EY GCC pages for stakeholder and compliance framing:
   - https://www.pwc.in/services/global-capability-centre-gcc/digital-global-capability-centers-gccs.html
   - https://www.ey.com/en_in/services/consulting/global-capability-centers
10. Dhruva GCC report: https://www.dhruvaadvisors.com/wp-content/uploads/2025/07/Dhruva-GCC-Report-2025.pdf

### Updated Data Model Fields

Add these fields to the original schema:

GCC record:

- `mca_cin`
- `incorporation_date`
- `entity_verification_status`
- `maturity_stage`
- `timeline_events`
- `sez_or_stpi_status`
- `tech_park_or_cluster`
- `tax_benefit_status`

City record:

- `tier_classification`
- `talent_attrition_proxy`
- `emerging_hub_advantage`
- `sez_stpi_presence`
- `infrastructure_risk_score`
- `salary_discount_vs_tier1`
- `office_rent_discount_vs_tier1`

State policy record:

- `capital_subsidy_pct`
- `capital_subsidy_cap`
- `payroll_reimbursement_cap`
- `epf_reimbursement_years`
- `sgst_reimbursement_pct`
- `stamp_duty_exemption_pct`
- `electricity_duty_exemption_years`
- `training_subsidy`
- `policy_status`

Build-vs-buy assumptions:

- `eor_setup_days`
- `direct_entity_setup_months`
- `eor_markup_pct`
- `statutory_employer_cost_pct`
- `entity_setup_cost`
- `monthly_compliance_cost`
- `office_cost_per_seat`
- `skill_premium_multiplier`
- `transfer_pricing_margin_assumption`
- `assumption_confidence`

Source/citation record:

- `date_accessed`
- `extract_text`
- `claim_type`
- `claim_value`
- `recency_multiplier`
- `cross_verified`
- `needs_human_review`

### Updated Crawler Recommendation

For MVP:

- Do not use Tinyfish unless manual data collection becomes too slow.
- Manually curate enough data for a polished demo.

For post-MVP:

Use Tinyfish or browser automation for:

- Flexiple GCC directory pages, if allowed.
- GCC Index pages, if allowed.
- State policy pages and investment portals.
- SEZ India BoA pages/PDF discovery.
- Company newsroom monitoring for GCC announcements.

Avoid crawling:

- MCA portal directly.
- Gated compensation reports.
- LinkedIn, Naukri, Glassdoor, AmbitionBox at scale.
- Any source disallowed by robots.txt or terms.

Best crawler output format:

- `entity_name`
- `source_url`
- `source_title`
- `publisher`
- `published_date`
- `crawl_date`
- `claim_type`
- `claim_value`
- `source_snippet`
- `confidence_score`
- `needs_human_review`

## Strategic Insight For Deck And Demo

The strongest hidden insight from both reports is this:

GCC Compass should not compete on having the biggest list. It should compete on turning fragmented, differently reliable sources into decision-grade intelligence.

This means the prototype should visibly show:

- source citations,
- confidence scores,
- verified vs unverified fields,
- model assumptions,
- and stakeholder correction/claim flows.

That directly answers Karthik's original concern: the market has data, but nobody knows what to trust.
