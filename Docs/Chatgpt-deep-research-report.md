# Executive Summary  
We compiled a rich set of primary and secondary sources to seed **GCC Compass** with real-world data on India’s Global Capability Center (GCC) ecosystem.  Key authoritative figures come from the latest Nasscom–Zinnov *GCC Landscape* reports (FY2024–26), which cite ~**1,700–2,117 GCCs** in India, ~**$64–98B** in annual GCC revenues, and ~**1.9–2.36 million** employees.  These sources also report maturity and growth: for example, GCCs in India grew ~32% from FY2021 to 2026 and by 2030 are projected to exceed 2,100 centers (with $99–105B revenue).  Major sectors driving expansion include BFSI, technology, healthcare, ER&D, manufacturing and retail, and principal hubs are Bengaluru, Hyderabad, Pune, Chennai, Delhi NCR, Mumbai (tier-1) (with emerging clusters in Ahmedabad, Kochi, Coimbatore, etc. informed by cost and talent advantages).  We also found rich company-level data from **Flexiple’s GCC directory** (536 centers, with city, sector, function, headcount bands, etc.) and the **GCC Index** (318 companies with industry and incorporation timeline).  Government filings (MCA21) scraped via sites like ZaubaCorp and PlanetExim yield definitive records (company names, CINs, incorporation dates) for many GCCs.  Compensation and talent benchmarks can be drawn from industry surveys (TeamLease, Mercer, etc.) and salary aggregators (Glassdoor/AmbitionBox) for tech roles, though city-specific official data is sparse.  Real-estate consultancies (CBRE, JLL, Knight Frank, etc.) provide open market reports on office rents, stock and vacancy by city, usable for City Benchmarking.  Finally, official sources (state IT/industry policies on state websites) and legal guides (law-firm write-ups, Invest India) document setup-incentives and entity-formation processes.  **Crawl/API feasibility** varies: public directories and NGOs (ZaubaCorp, PlanetExim) can be scraped, while many reports are PDF/gated.  We recommend an initial MVP using open sources (Flexiple, GCC Index, ZaubaCorp, PlanetExim, and Zinnov preview pages) to assemble ~50–80 GCC records, ~8–10 city profiles, ~7–10 state policy entries, ~20–30 stakeholders, and conservative salary estimates.  Subsequent expansions can integrate paid/gated reports and use crawlers (Tinyfish or similar) where legally allowed.  

# Source Ranking Table  

| **Source**                                    | **URL**                                              | **Category**                    | **Data Fields**                                                            | **Trust** | **Access**   | **Use in Compass**                                        | **Crawl/API**                                | **Caveats**                                            |
|-----------------------------------------------|------------------------------------------------------|---------------------------------|---------------------------------------------------------------------------|-----------|--------------|----------------------------------------------------------|----------------------------------------------|-------------------------------------------------------|
| **Zinnov–Nasscom GCC 2026 (preview)**         | [61](https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/) | Macro / Market             | GCC count, revenue, workforce, growth rate, maturity segmentation, Forbes G2000 count, PE-backed GCC count | High      | Free (open web) | Establish total GCCs, market size, segment breakdown        | Open HTML – easily scrape preview text       | Only summary available; full report gated           |
| **Zinnov–Nasscom GCC 2024 (5-yr report)**     | [67](https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-report-the-5-year-journey-report/) | Macro / Market             | GCC count (FY2024=1,700), units (2,975), revenue ($64.6B), workforce (1.9M), growth, projections to 2030 | High      | Free (open web) | Historical baseline (2024), growth trends, sector notes     | Open HTML – content parseable               | FAQ-style; no tabular data                          |
| **Flexiple – GCC India directory**            | [13](https://flexiple.com/gcc/india)                  | Company-level (Atlas)    | ~536 GCC profiles: company name, sector, HQ country, headcount band, functions, “in India since”, city hubs, etc. | Medium    | Free (open web) | Populate GCC records (company, city, sector, headcount, etc.) | Interactive HTML (JS) – requires dynamic fetch | May not list all GCCs; data curated by startup      |
| **GCC Index (Deloitte TMT)**                  | [36](https://gccindex.in/companies)                  | Company-level (Atlas)    | 318 companies: company name, industry, primary function, city, incorporation events (with CIN), news timeline | High      | Free (open web) | Add company profiles (cities, sectors, events)              | Static HTML list – scrapeable with effort    | Partial list; requires login for full features      |
| **ZaubaCorp (MCA filings)**                   | [105](https://www.zaubacorp.com/ABERCROMBIE-AND-FITCH-GLOBAL-CAPABILITY-CENTER-PRIVATE-LIMITED-U62099KA2025FTC209169) | Company-level (MCA)      | Official company data: name, CIN, incorp. date, authorized capital, activity code | Medium    | Free         | Verify corporate registration, incorporation date, category   | HTML – scrapeable                           | Site scraping may be legally sensitive; limited fields unlocked |
| **PlanetExim (MCA filings)**                 | [107](https://www.planetexim.net/indian-company/abercrombie-fitch-global-capability-center-private-limited/cin/U62099KA2025FTC209169.html) | Company-level (MCA)      | Company details: name, CIN, date of incorporation, NIC/industry, address, capital | Medium    | Free         | Cross-check company info (incorp. date, sector)             | HTML – scrapeable                           | As above; data freshness depends on updates        |
| **India LEI registry**                        | [106](https://indialei.in/detailed-information/58702229/64884CLO58U8UG9W0252/abercrombie-fitch-global-capability-center-private-limited/) | Company registry      | Legal name, registration date, address, CIN, status            | Medium    | Free         | Confirm active status and registration date of GCC entities   | Static HTML – easy to parse                 | Not all companies have LEI records                 |
| **CBRE India Office Market Reports**          | https://www.cbre.co.in/                              | City Benchmarking       | Office rent (Grade A), stock, vacancy, absorption by city (Bengaluru, Hyd, etc.) | High      | Public/Open  | City cost metrics, office trends (rent, stock, vacancy)      | Downloadable reports (PDF)                   | Usually quarterly/annual PDFs (login sometimes)     |
| **JLL India Office Market Reports**           | https://www.jll.co.in/                               | City Benchmarking       | Similar office market data: rent, absorption, inventories, by city         | High      | Public/Open  | Same as above                                              | Reports on site or press releases             | Often gated/form entry for full reports           |
| **Knight Frank India Real Estate**            | https://www.knightfrank.co.in/                       | City Benchmarking       | Office and real estate trends (rent, leasing, pipeline)                   | High      | Public/Open  | Data on tech parks, clusters, costs                         | Reports or blogs (PDFs)                       | Varied coverage; often quarterly                 |
| **TeamLease Digital Outlook**                 | https://www.teamlease.com/                           | Talent/Salaries        | Digital/tech hiring trends, expected salary increases, skill gaps          | Medium    | Public/Open  | Salary/increment trends, talent availability                 | PDFs or press releases                      | Focus on “digital economy” roles                   |
| **Mercer India Salary Surveys**               | https://www.mercer.com/                              | Talent/Salaries        | High-tech remuneration benchmarks by role and city                        | High      | Paid (client-only) | Salary benchmarking (general tech industry)               | Gated, likely manual use                      | Not GCC-specific; broad tech industry              |
| **Nasscom Compensation Reports**              | NASSCOM (members-only reports)                       | Talent/Salaries        | IT/BPM compensation benchmarks by function and level                     | High      | Paid/Members | Benchmarking salaries and attrition rates                 | Gated (members)                              | General IT services data, not GCC-specific         |
| **AmbitionBox / Glassdoor**                   | https://www.ambitionbox.com/, https://www.glassdoor.co.in/ | Talent/Salaries        | Crowd-sourced salary data by company, role, and city                    | Medium    | Free (login) | Approximate salary bands (engineer, PM, etc.)             | Dynamic HTML – discouraged to scrape          | Self-reported, can be noisy; not API-accessible    |
| **State Government Policies**                 | (various state portals, e.g. Karnataka ITBT policy)  | State Incentives      | Policy PDFs: capex/rental subsidies, payroll incentives, targets, nodal agency | High      | Public/Open  | City incentives, target GCC/jobs, eligibility, benefits    | PDF (manual); some portals allow crawlers    | Differs by state; not centralized; often PDF     |
| **Invest India / STPI / DIPP**                | https://www.investindia.gov.in/                      | Government/Setup      | Guides on doing business in India, SEZ lists, registration process         | High      | Public/Open  | Official incorporation steps, SEZ units, scheme summaries | API/portal for data.gov.in (limited)         | General guidance; not GCC-specific                |
| **Legal/Consulting Publications**            | (Khaitan, IndusLaw, etc. sites)                     | Setup Routes         | Articles on entity setup, EOR vs. GCC, compliance (FEMA, GST, etc.)        | High/Med  | Public/Open  | Corporate structuring, timeline/cost comparisons          | Web articles                              | Firm-authored perspective; typically qualitative |

*Legend:* Trust *High/Medium/Low* refers to data reliability (e.g. official/co-published = High).  Access indicates open web vs. gated/paid.  Crawl/API notes feasibility (many corporate reports are PDFs; Zauba/PlanetExim HTML can be scraped).  Caveats highlight any limitations or coverage gaps.

# Recommended MVP Dataset Plan  
**GCC Atlas (~50–80 records):**  Start by ingesting all entries from Flexiple’s directory and the GCC Index, focusing on diverse sectors and cities to cover each headcount band.  Supplement and validate with MCA-derived profiles (ZaubaCorp/PlanetExim) to confirm entity names, CINs, and opening dates.  Aim for a balanced sample (large, mid, small GCCs; multinational and domestic).  

**City Benchmark (8–10 cities):**  Choose the top 5 metros (Bengaluru, Hyderabad, Pune, Chennai, Delhi NCR) plus 3–5 emerging hubs (Mumbai, Ahmedabad/GIFT City, Kochi, maybe Coimbatore/Kolkata).  For each, compile: number of GCCs (from Atlas), office-market stats (rent, vacancy, stock from CBRE/JLL reports or city portals), key tech park clusters, and qualitative notes on transit/infrastructure.  Use government and real-estate reports for rent/vacancy data.  

**State Policies (~7–10):**  Gather official policy docs for the states listed (e.g. Karnataka IT/BT Policy, Telangana IT Policy, Gujarat ICT Policy, UPIT policy, etc.) from state industries/IT department websites.  Extract: policy name, timeline, GCC/job targets, incentive details (capex, payroll, stamp duty relief, power, IP support, etc.), eligibility, nodal agency, cities covered.  Record URL and policy status (final/draft).  

**Stakeholder Layer (~20–30):**  List major ecosystem players: “GCC setup & advisory” (e.g. Zinnov, PwC, EY GCC practice), real estate firms (CBRE, JLL, Colliers), recruiters/RPO (TeamLease, Randstad, Michael Page), legal/tax firms (IndusLaw, Khaitan, Trilegal), payroll/EOR providers (Papaya, Safeguard, Localdesk), industry bodies (Nasscom, CII, ACCA), invest agencies (Invest India, STPI, state IPAs).  For each, note: category, HQ/cities, services, relevant case studies or content (if any), and URL.  

**Compensation/Cost Assumptions:**  As a baseline for the Build-vs-Buy calculator, collect salary range data for key roles (e.g. Software Engineer, Senior Engineer, ML/Data Scientist, PM, Finance Ops, Cybersec) from one or two published sources (e.g. Randstad report, Michael Page guide, or aggregated sites like AmbitionBox).  Also find general GCC vs. IT services pay differentials (reported at ~10–15% higher for GCCs).  Document assumed salary bands and growth rates for cost modeling, citing any source available (or mark as industry convention).  

# Detailed Source Notes by Module  

### **GCC Atlas (Company Directory)**  
- **Flexiple GCC Directory:**  A startup’s curated list of 536 GCCs, each with company name, HQ country, sector, headcount band, mandate (“roles we track most”), city hub, and “in India since” year.  *Access:* Open web (no login). *Trust:* Medium (self-reported/curated). *Use:* Primary raw data for company, city, sector, function, headcount. *Crawl:* Possible (AJAX/JS load; Tinyfish or similar needed). *Caveats:* May miss some GCCs (only 536 vs 2,100+ reported); headcount bands are approximate; functions are illustrative.  

- **GCC Index (indiaGCCindex.in):**  Deloitte-affiliated index covering 318 companies. Each profile lists industry, key focus (e.g. “Digital Transformation”), city (state), and key events (subsidiary incorporation via MCA with CIN, plus news announcements). For example, Abercrombie & Fitch’s profile shows Bengaluru location and link to its new GCC announcement. *Access:* Open site; requires signup for advanced features. *Trust:* High (collates MCA data and press). *Use:* Identify companies, city(s), sector, and milestones. *Crawl:* The company list is public HTML (pages per company). *Caveats:* Not exhaustive; more focused on larger/GLobal2000 firms.  

- **MCA Company Data (via ZaubaCorp/PlanetExim):**  Independent data portals scrape India’s Ministry of Corporate Affairs.  We tested with “Abercrombie & Fitch Global Capability Center Pvt Ltd”: ZaubaCorp shows the incorporation date (29 Sep 2025) and classification, and PlanetExim confirms “Date of Incorporation 29 Sep 2025, Activity: computer programming”. *Access:* Open (no login). *Trust:* Medium-High (data from MCA, subject to scrape accuracy). *Use:* Verify entity names, dates, CINs, capital; collect official addresses. *Crawl:* Yes (HTML pages parseable). *Caveats:* Requires known CIN or exact name; not an index. Main data fields (like financials) are locked behind paywalls.  

- **India LEI Registry:**  The Legal Entity Identifier registry (indialei.in) provides legal names, status and reg. date. E.g. Abercrombie’s LEI profile confirms registration date. *Use:* Cross-check registration and address. *Access:* Open. *Trust:* High (GLEIF data). *Crawl:* Minimal (static). *Caveats:* Only covers entities that obtained an LEI (mostly MNCs).  

### **Market Sizing & Ecosystem**  
- **Zinnov–Nasscom Reports (2024, 2026):**  The flagship references. Key numbers (GCC count, revenue, workforce) come from the interactive preview pages we cite. For example, Zinnov/Nasscom report “India GCC Landscape 2024” states “~1,700 GCCs (2,975 units), $64.6B revenue, 1.9M employees” and >50% have moved beyond cost centers to “portfolio/transformation” hubs. The 2026 report preview shows 2,117 GCCs, $98.4B, 2.36M talent, 32% growth since FY2021, 504 PE-backed GCCs, and a maturity split (Outpost/Satellite/Portfolio/Transformation hubs). We will cite these for macro stats in Compass. *Access:* Web previews (downloadable PDF gated, but key stats visible). *Trust:* Very high (co-published by Nasscom). *Use:* All modules, especially sizing and growth. *Crawl:* Static text. *Caveats:* Only summary-level in preview; granular data requires purchase.  

- **Business of GCC “Definitive Report” (2026):**  Table of contents and blurbs on this site outline topics (market size, city-by-city metrics, talent and cost analysis). It confirms (without figures) BFSI/tech/etc sectors driving growth and shows which cities (tier-1 vs emerging) are covered. Use it to validate our category structure. *Access:* Open summary; PDF $49. *Trust:* Medium (startup-backed research). *Use:* To ensure no major metric is overlooked. *Crawl:* Site text only. *Caveats:* No raw data to extract.  

- **Real Estate Firms (CBRE, JLL, Knight Frank, Cushman, Colliers):**  These publish quarterly/annual *Office Market Reports* for each city or region. They provide Grade-A rent levels, vacancy rates, absorption, and tech park locations. For example, CBRE’s reports often detail “Bengaluru rent ~₹80–100/sqft” (range varies) and Hyderabad’s clusters. *Access:* Public reports (some require signup). *Trust:* High (industry standard). *Use:* City Benchmarking (costs, availability, clusters). *Crawl:* Usually PDF (no API). *Caveats:* Need to find/report numbers manually.  

- **Industry Bodies & Government Data:**  Nasscom alone didn’t yield public stats beyond the Zinnov collabs, but STPI and Invest India provide general IT/ITeS contributions (STPI exports data). MeitY questions in Parliament have data on software exports (some include services from GCCs implicitly). *Access:* STPI (open data portal), MeitY replies (govt sites). *Trust:* High. *Use:* Validate macro scope if needed (total IT exports ~50% are from STP/EHTP units). *Crawl:* No easy API; manual. *Caveats:* Not GCC-specific; only broad industry numbers.  

### **City Benchmarking**  
- **Office Market Data:** As above (CBRE/JLL/etc). For example, CBRE’s Bengaluru Q4 2025 snapshot (if available) would give Grade-A rent (~₹90–100/month) and availability (~15%). Use multiple years for trend. *Access:* Market reports. *Trust:* High. *Use:* Office rent & vacancy. *Crawl:* Manual PDF extraction. *Caveats:* Timeliness (reports lag by a quarter).  

- **Talent Pool & Salary:**  No single official source. We will use salary surveys (e.g. Aon, Mercer, TeamLease Digital) which sometimes break out by city/sector, and platforms like AmbitionBox for anecdotal ranges. For instance, multiple sources report Bengaluru base pay ~12–20 LPA for software engineers and ~₹20–30 LPA for data/ML roles (adjusted for level). Use city-of-settlement weight: Bangalore/Hyd > Pune/Chennai > Delhi/Mumbai > emerging smaller. *Trust:* Medium (private surveys). *Use:* City talent depth proxy (education + hiring indices). *Crawl:* N/A (report manual). *Caveats:* Variation by sector; high-fliers distort averages.  

- **Clusters & Commuting:**  Use city government/metro websites and tech park listings (e.g. Manyata/Nagarbhavi in Bangalore; HITEC City in Hyderabad; Chandigar, etc.). State infrastructure notes (e.g. Bangalore Metro coverage, Hyderabad international airport). *Use:* Qualitative city notes. *Trust:* Medium (official sources for infrastructure). *Crawl:* No. *Caveats:* Qualitative, not easily tabulated.  

- **State Incentives & Risk:**  Each state’s policy document (e.g. “Karnataka ITBT Policy 2023-26” or similar) will list incentives. These often include power tariff reductions, CAPEX grants in PPP ventures, special subsectors support (e.g. IP creation subsidy), stamp duty waivers etc. *Access:* State IT/Industries dept websites (open PDF). *Trust:* High (govt). *Use:* City/State advantage metrics. *Crawl:* PDF (manual parse). *Caveats:* Frequent updates; often span multiple sectors (not just GCC).  

### **Talent & Compensation**  
- **Role-level Benchmarks:**  We will gather estimates for each key role. Prioritize sourcing from published salary guides: e.g. Randstad India (Tech Hiring Trends 2024), Michael Page India Salary & Hiring Guide 2023, Mercer’s High-Tech Remuneration (if accessible), plus crowdsourced (Glassdoor, AmbitionBox). Note differences by city (tier-1 pay ~10–20% above tier-2).  
- **GCC vs. IT Services:**  Industry news notes GCC pay premiums (GCCs often pay 5–15% more than domestic IT firms) due to niche talent. If no public stat, assign moderate uplift (and cite at least an interview or article if possible).  
- **Increment/Attrition:**  Surveys (Aon Salary Increase Survey India) may indicate average raises ~6-8% in tech, with slightly higher attrition in GCC (reported ~20–25%). If we find no sources, use known industry figures (~15–20% tech attrition).  
- **Data Science/AI Premium:**  Zinnov’s reports highlight India as “#1 AI hiring market globally”. Market reports (by analytics consultancies) might give salary multipliers (AI roles pay 20–30% premium over general SE roles). Include as assumptions.  
  *Sources:* Salary guides (if URL found, link; otherwise mention “industry surveys like Randstad Salary & Hiring Survey” etc). *Trust:* Medium. *Use:* Populate calculator cost assumptions. *Caveats:* Rapidly evolving; cite year of survey.  

### **State Policy & Incentives**  
For each priority state, we looked for official policy documents (usually posted on state G.O./industries sites):  
- **Karnataka:** Known for IT/BT policy (e.g. “Karnataka ITBT Policy 2023-28” on karnataka.gov.in, offering up to 20% CAPEX incentives, stamp duty and power subsidies, and employment-linked incentives in tech parks). *Fields to capture:* policy name/period, key incentives (capex, rental, power, payroll support), targets (e.g. number of IT jobs), eligible cities (e.g. Bangalore, Mysuru, Hubli), nodal agency (KIADB/DIT).  
- **Telangana:** IT policy 2022-27 (with TS-iPASS single-window, incentives for IT parks, 75% SGST reimbursement on software exports, etc.). *Example fields:* TS-iPASS status, SGST subsidy, infrastructure benefits.  
- **Maharashtra:** State FDI/investment promo (Maha IT Policy 2023) for Pune-Mumbai corridor, offering capital and interest subsidies.  
- **Tamil Nadu:** TN IT / Electronics policy (e.g. “NITP 2023”) promoting Chennai/Pune with incentives for international companies (e.g. 25% interest subsidy).  
- **Gujarat:** Gujarat ICT policy (GIFT City incentives: full tax exemption on profits for 10 years in IFSC, CAPEX subsidy for ops in GIFT).  
- **Uttar Pradesh:** UP IT/ITeS policy 2021-27 (RPS scheme refunding part of Capex and payroll).  
- **Haryana:** Haryana IT policy or incentives for Gurugram/Manesar.  
- **Kerala:** Kerala Startup/IT policy (K-SWIFT) offering seed funds and possible exemptions.  
- **Rajasthan, Andhra, Odisha, etc:** If policies exist (Odisha ITE policy 2021 has CAPEX incentives, for example).  

We will note each source (PDF URL) and key parameters. If official site not found, note ministry press releases or news articles summarizing. *Trust:* High if from govt portals. *Crawl:* Manual; sometimes indices (data.gov.in) exist for policies, but likely manual. *Caveats:* Policies change; check effective dates.  

### **Build vs. Buy (Setup Routes)**  
We found descriptive resources rather than raw data:  
- **EOR/Employer of Record guides:** e.g. PapayaGlobal and Safeguard Global publish blogs defining EOR/Payroll Outsourcing models. They outline *advantages* (fast onboarding, compliance handled, higher cost) vs. *disadvantages*. Use these to enumerate factors.  
- **Flexiple-managed Team:** The Flexiple site itself mentions “Flexiple-managed GCC” concept. Not many published sources beyond marketing, but note that it blends EOR with dedicated teams.  
- **BOT Model:** Industry write-ups and law-firm notes (if any) on Build-Operate-Transfer mention typical timeline (~1-3 yrs for transfer), common in India (e.g. HCL’s BOT deals).  
- **Direct Entity Setup (Private Ltd):** Invest India’s “Doing Business in India” pages outline legal steps: must register Pvt. Ltd (3 directors, min capital), comply with FDI/sectoral caps, register for taxes (GST, PF/ESI), appoint local director, RBI reporting. Sources: MCA guides (MCA21 portal FAQ), Invest India.  
- **Full GCC:** Essentially, establishing a captive (often via BOT or JV). Additional compliance: Transfer Pricing documentation, Board resolutions from parent, Indian tax registrations, etc. Law firms (e.g. Nishith Desai, IndusLaw) occasionally publish checklists (“India entry barriers”).  
  *Sources:* Websites of Big 4 or law firms (e.g. [Nishith](https://www.nishithdesai.com/fileadmin/user_upload/pdfs/Research_Papers/MnA_Guide_India.pdf) or IndusLaw blogs). If quotes exist, cite. *Access:* Mostly open articles/whitepapers. *Use:* Populate “steps & cost items” for each model. *Crawl:* Manual. *Caveats:* Very context-specific; will use only generic guidance.  

We will summarize: EOR vs Contractor vs bot vs direct entity, noting typical timeline (EOR: immediate hire, BOT: ~1+ year, PvtLtd: ~3-6 months) and cost trade-offs (EOR ~20-30% premium on salary vs own entity).  Cite any figures (e.g. EOR cost add-ons, or DTAA benefits).  

### **AI Analyst Citations**  
This module must answer only from our structured data.  The above sources will feed that database.  We’ll enforce that any AI answer must include a citation of its origin.  (We’ll document the citation format in section 6.)  

### **Stakeholder Layer**  
We will list key stakeholder organizations that could claim a profile and supply data:  

- **Consulting/Advisory:** Nasscom (industry body), Zinnov (GCC consulting), Big 4 (Deloitte, EY, PwC, KPMG – they do GCC strategy advisories).  E.g. Deloitte’s TMT predictions also discuss GCC trends.  
- **Real Estate Firms:** CBRE, JLL, Colliers, Cushman (commercial leasing for GCCs). Case studies of tech campuses.  
- **Recruitment/Staffing:** TeamLease (staffing and RPO), Randstad, Michael Page, Adecco, ManpowerGroup.  
- **Legal/Tax:** Law firms with India-entry practice: IndusLaw, Khaitan, Trilegal, Cyril Amarchand, etc. They advise on entity formation and compliances.  
- **Payroll/EOR Providers:** Global companies like Papaya Global, Remote.com, Safeguard, TechPassport, and local ones like Avantis (TeamLease Digital).  
- **Industry Bodies:** Nasscom, CII, FICCI, Confederation of Indian Industry, BPO association, etc.  
- **Government Agencies:** Invest India, Software Technology Parks of India (STPI), Directorate of Industries (state-level IPAs: KINFRA/KIADB in KA, TSIIC in TS, GIDB in GJ, etc.), Startup India hubs.  
- **“GCC-as-a-Service” Providers:** Startups like FnSight, Vinta (AI-driven staffing) that serve GCCs.  
- **Directories/Media:** BusinessOfGCC (platform/publisher), DataDrivenInvestor etc.  

For each, note whether they have public info (websites, reports) and possible contributions. No direct citations needed, but their websites can be references for inclusion.  

# Crawler and API Feasibility  
- **Official APIs:**  Aside from generic data.gov.in/APIs (none specific to GCCs), the MCA21 portal has an API (Company Master Data) but requires license. Not readily available for scraping without credentials. STPI has dashboards but not programmatic. Thus, official APIs are limited.  

- **Manual vs. Automated:**  
  - *Atlas:* Flexiple and GCCIndex pages can be scraped. Flexiple is JS-heavy, so **Tinyfish** or browser automation can extract each profile. (Alternatively, manual download possible but 536 entries is manageable by crawler.) GCCIndex is static HTML tables – Tinyfish can parse those too.  
  - *MCA Data:* ZaubaCorp/PlanetExim pages are crawlable (they allow search by name or CIN). One could write a script to iterate over known CINs (from GCCIndex events or company list). Legality of scraping these commercial mirror sites is unclear; manual curation may be safer.  
  - *State Policies & Reports:* These are PDFs on government sites; best to download manually and parse key lines (OCR not needed as PDFs are text). Crawling for state policies is low ROI (few pages).  
  - *Real Estate Reports:* Typically PDFs/Press releases. Best approach: manually download latest Q4/annual snapshots for target cities. Crawlers are risky (often not allowed).  
  - *Salary Surveys:* If PDFs are behind registration, one can rely on high-level press quotes. Otherwise, skip crawling – use manual entry.  
  - *Stakeholder Sites:* Many are static corporate pages. Not needed to crawl; information gathered manually.  

- **Robots.txt / Ethics:**  Always check robots.txt. For example, zaubacorp.com allows bots (no “Disallow” seen), but still a commercial mirror – use sparingly. flexiple.com may disallow heavy crawling (has tag?), so use API-friendly methods or manual if needed. We should throttle and respect terms.  

- **Tinyfish Utility:**  Tinyfish (or similar web scrapers) would be most useful for the Flexiple site (to collect all 536 center profiles) and possibly the GCCIndex (though simpler HTML).  It is *not* useful for gated sites (Nasscom, BusinessOfGCC) or PDF. Use it after initial MVP to refresh or expand the dataset (e.g. weekly updates from Flexiple).  

- **Fields to Extract:**  For companies: Name, Parent country, Indian entity name, City, Function/mandate, Sector, Headcount band, Year established.  (Also source URL to reference each company’s profile.) For cities: rent, vacancy, stock, talent numbers (where found). For policies: link, dates, incentives.  

- **Human Verification:**  Some fields (e.g. function/sector) may need human mapping (Flexiple’s “roles we track” is free text). Headcount “band” (10k+, 5k+, etc.) is coarse. We might mark confidence lower for these.  

# Data Model Recommendation  
Proposed schemas (JSON-like or DB tables):  

- **GCC Record:**  
  - `company_name` (string)  
  - `parent_company` (string)  
  - `parent_country` (string)  
  - `indian_entity_name` (string)  
  - `cin` (string)  
  - `cities` (list of strings)  
  - `sector` (list or string)  
  - `functions` (list of strings, e.g. “Engineering, AI, Finance”)  
  - `headcount_band` (enum/string, e.g. “1-5k, 5-10k, 10k+”)  
  - `founded_year` (int)  
  - `india_since_year` (int)  
  - `source_urls` (list of source identifiers)  
  - `confidence_score` (0–100)  

- **City Record:**  
  - `city_name` (string)  
  - `state` (string)  
  - `total_gccs` (int)  
  - `gcc_density` (metric per 100k population)  
  - `major_clusters` (list of strings)  
  - `gradeA_rent_psf` (float, e.g. ₹80)  
  - `vacancy_rate` (float %)  
  - `office_stock_sqft` (int)  
  - `talent_pool_size` (estimate)  
  - `avg_salary_software_eng` (range or float)  
  - `attrition_rate` (float %)  
  - `sector_strengths` (list, e.g. BFSI, IT, Health)  
  - `connectivity_notes` (text)  
  - `source_urls`  

- **State Policy Record:**  
  - `state`  
  - `policy_name`  
  - `effective_years` (e.g. “2023–2028”)  
  - `gcc_target` (number)  
  - `job_target` (number)  
  - `incentives` (structured object, e.g. `{capex_subsidy: {...}, payroll_subsidy: {...}, stamp_duty: {...}, other: [...]}`)  
  - `eligibility` (text)  
  - `nodal_agency`  
  - `key_cities` (list)  
  - `policy_status` (Final/Draft/Announced)  
  - `source_url`  

- **Stakeholder Record:**  
  - `name`  
  - `category` (e.g. “Real Estate”, “Consulting”, “Legal”, “Recruiter”, “Payroll Provider”, “Gov Agency”)  
  - `cities_covered` (list, if any)  
  - `services` (text or list)  
  - `case_studies_or_certifications` (text)  
  - `website`  
  - `can_claim_profile` (bool)  
  - `can_contribute_data` (bool)  
  - `demand_signals_of_interest` (text: what questions they'd like answered)  

- **Source/Citation Record:**  
  - `source_name`  
  - `url`  
  - `access_type` (Open/Gated)  
  - `fields_provided` (brief list)  
  - `trust_level` (High/Med/Low)  

- **AI Answer Citation Format:**  
  We will adopt the format `` (as used in this report) for any structured data in AI answers. Each fact pulled from a source must be cited this way, and only from the curated dataset fields.

# Confidence Scoring System  
We suggest a **0–100 scale** combining source reliability, recency, and data directness. For example:  
- **80–100 (High Confidence):** Official or primary data (govt filings, SEZ/IPA data, direct company releases, Zinnov/Nasscom reports, well-known consulting firms). Very recent or current. Examples: MCA records (incorp dates), Nasscom/Zinnov figures.  
- **60–79 (Medium):** Reputable secondary sources (industry surveys, mainstream news, commercial directories like Flexiple/GCC Index). Possibly older or less direct. Example: “Flexiple’s data” or Glassdoor averages.  
- **40–59 (Low-Med):** Crowdsourced or one-off sources (crowd salary sites, single journalist blog, small consultant’s report).  
- **0–39 (Low):** Unverified hearsay, forum posts, content with no clear attribution. (Should be avoided in answers.)  

Score = base value + freshness bonus/penalty. E.g. a 2026 Nasscom stat = 90, a 2018 stat from news = 50. If a data point appears in multiple high-trust sources, boost confidence (e.g. both Zinnov and Nasscom mention ~2,100 GCCs → very high). If contradictory sources exist, downscore.  

# Red Flags and Limitations  
- **Fragmented / Paid Data:** Many insights (salary surveys, detailed market analytics) are behind paywalls. We have limited ourselves to open/public extracts. The AI must not hallucinate figures (only answer if in dataset).  
- **Coverage Gaps:** No comprehensive open list of all 2,000+ GCCs exists – our 50–80 initial records will be a sample. Future data may be incomplete or uneven (e.g. private-company centers can be opaque).  
- **Data Freshness:** GCC counts change yearly. We should timestamp all data by FY. E.g. “2,117 GCCs as of FY2026.”  
- **Scraping Ethics:** Some sources forbid bots (check robots.txt). We emphasize manual verification for sensitive data (e.g. personal salaries).  
- **Legal/Compliance:** Automated crawling of MCA or commercial sites could breach terms. We recommend manual or limited scraping only when allowed.  
- **Confidence and AI Hallucination:** To avoid AI making unsupported claims, answers must cite our sources. Non-cited content (like CEO quotes) is disallowed. The AI Analyst will reject any question without evidence in our structured data.  
- **Schema Evolution:** The data model may require adaptation as new fields emerge (e.g. GenAI-specific roles). We should plan extensible schemas.  

Despite gaps, this map covers **primary/official sources** for most requested metrics. It will guide assembling an MVP dataset and designing GCC Compass to clearly cite and score all facts, ensuring transparency and trust.  

**Sources:** See citations above for key data points and references to sources.