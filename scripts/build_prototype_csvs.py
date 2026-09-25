from __future__ import annotations

import csv
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "dataset" / "raw"
ORG = ROOT / "dataset" / "organized"
PROC = ROOT / "dataset" / "processed"


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def build_gcc_records() -> int:
    src = ORG / "06_app_ready" / "company_seed_merged.csv"
    df = pd.read_csv(src)
    rows = []
    for idx, row in df.iterrows():
        rows.append({
            "gcc_id": f"GCC-{idx + 1:04d}",
            "parent_company": row.get("company_name", ""),
            "indian_entity_name": "",
            "mca_cin": row.get("cin", ""),
            "parent_country": row.get("parent_hq", ""),
            "primary_city": str(row.get("cities", "")).split(",")[0].strip(),
            "cities": row.get("cities", ""),
            "sector": row.get("sector", ""),
            "functions": row.get("functions_or_capability", ""),
            "headcount_band": row.get("headcount_band", ""),
            "maturity_stage": "Unknown",
            "year_established": row.get("in_india_since", ""),
            "verification_status": row.get("verification_status", ""),
            "confidence_score": row.get("confidence_score", ""),
            "source_ids": row.get("source_ids", ""),
            "source_urls": ";".join(
                str(v)
                for v in [row.get("flexiple_profile_url", ""), row.get("gcc_index_profile_url", "")]
                if str(v) and str(v) != "nan"
            ),
            "last_checked": "2026-09-25",
            "notes": "Seeded from public directory exports; verify individual legal entity before treating as canonical.",
        })
    fields = [
        "gcc_id", "parent_company", "indian_entity_name", "mca_cin", "parent_country",
        "primary_city", "cities", "sector", "functions", "headcount_band",
        "maturity_stage", "year_established", "verification_status", "confidence_score",
        "source_ids", "source_urls", "last_checked", "notes",
    ]
    write_csv(PROC / "gcc_records.csv", rows, fields)
    write_csv(ORG / "06_app_ready" / "gcc_records_app_ready.csv", rows, fields)
    return len(rows)


def build_city_benchmarks() -> int:
    filter_options = pd.read_excel(RAW / "flexiple_india_verified_centers.xlsx", sheet_name="Filter Options")
    city_counts = {
        row["display_label"]: int(row["count_display"])
        for _, row in filter_options[filter_options["filter_dimension"].eq("city")].dropna(subset=["count_display"]).iterrows()
    }
    rows = [
        {
            "city_id": "CITY-BLR",
            "city": "Bengaluru",
            "state": "Karnataka",
            "tier_classification": "Tier 1",
            "gcc_sample_count": city_counts.get("Bangalore", 437),
            "key_clusters": "Outer Ring Road; Whitefield; Manyata; Electronic City; North Bengaluru",
            "sector_strengths": "Technology; BFSI; Retail; Engineering R&D; AI/ML",
            "talent_strengths": "Deepest engineering and product talent pool; strong AI/ML and platform engineering ecosystem.",
            "senior_engineer_salary_range": "High; source-backed exact role bands need compensation cleanup",
            "ml_engineer_salary_range": "Very high; specialist AI roles require premium assumptions",
            "office_rent_range": "Premium / high; exact micro-market rent requires CBRE/JLL table cleanup",
            "attrition_proxy": "High competition; use as high attrition risk",
            "state_incentive_summary": "Karnataka has GCC policy direction and mature tech ecosystem; exact incentives need final policy extraction.",
            "best_for": "AI/product engineering; platform teams; enterprise-scale GCCs",
            "risks": "Talent competition, commute pressure, premium rents, attrition.",
            "confidence_score": 82,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_ZINNOV_GCC_2026_LOCAL;SRC_CBRE_OFFICE_Q2_2026_PAGE;SRC_JLL_OFFICE_DYNAMICS_PAGE",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/zinnov-nasscom-india-gcc-landscape-report-2026.pdf;dataset/raw/India_Office_Figures_Q2_2026.pdf;dataset/raw/26-insights-india-office-market-dynamics-q2-2026.pdf",
            "last_checked": "2026-09-25",
            "notes": "GCC count from Flexiple public directory; rent/salary fields are qualitative until table cleanup.",
        },
        {
            "city_id": "CITY-HYD",
            "city": "Hyderabad",
            "state": "Telangana",
            "tier_classification": "Tier 1",
            "gcc_sample_count": city_counts.get("Hyderabad", 299),
            "key_clusters": "HITEC City; Gachibowli; Financial District; Kokapet",
            "sector_strengths": "Technology; Healthcare; BFSI; AI/ML; Life sciences",
            "talent_strengths": "Strong engineering depth with strong cost-quality balance versus Bengaluru.",
            "senior_engineer_salary_range": "High / upper-mid",
            "ml_engineer_salary_range": "High; strong AI and data talent availability",
            "office_rent_range": "Upper-mid / high; exact micro-market rent requires report cleanup",
            "attrition_proxy": "Moderate-high",
            "state_incentive_summary": "Telangana promotes IT/GCC investment; final GCC policy details need verification.",
            "best_for": "Scaled engineering; healthcare/life sciences; analytics; AI/data teams",
            "risks": "Rising office demand, increasing competition for senior talent.",
            "confidence_score": 80,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_ZINNOV_GCC_2026_LOCAL;SRC_CBRE_OFFICE_Q2_2026_PAGE;SRC_JLL_OFFICE_DYNAMICS_PAGE",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/zinnov-nasscom-india-gcc-landscape-report-2026.pdf;dataset/raw/India_Office_Figures_Q2_2026.pdf;dataset/raw/26-insights-india-office-market-dynamics-q2-2026.pdf",
            "last_checked": "2026-09-25",
            "notes": "GCC count from Flexiple public directory; city positioning cross-checked with office/GCC reports.",
        },
        {
            "city_id": "CITY-PUNE",
            "city": "Pune",
            "state": "Maharashtra",
            "tier_classification": "Tier 1 / emerging scale",
            "gcc_sample_count": city_counts.get("Pune", 169),
            "key_clusters": "Hinjewadi; Kharadi; Magarpatta; Baner; Yerwada",
            "sector_strengths": "Technology; Engineering R&D; Automotive; BFSI; SaaS",
            "talent_strengths": "Strong engineering and ER&D base, often attractive for cost-quality tradeoff.",
            "senior_engineer_salary_range": "Upper-mid",
            "ml_engineer_salary_range": "Upper-mid / high",
            "office_rent_range": "Mid / upper-mid",
            "attrition_proxy": "Moderate",
            "state_incentive_summary": "Maharashtra GCC Policy 2025 and IT/ITES policy support GCC/IT investment.",
            "best_for": "Engineering R&D; mid-scale GCCs; cost-conscious tech teams",
            "risks": "Competing with Mumbai/Bengaluru for senior leadership; policy details need English extraction.",
            "confidence_score": 78,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_MAHARASHTRA_GCC_POLICY_PDF;SRC_CBRE_OFFICE_Q2_2026_PAGE",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/global-cabability-centres-compressed_1.pdf;dataset/raw/India_Office_Figures_Q2_2026.pdf",
            "last_checked": "2026-09-25",
            "notes": "Maharashtra PDF contains Marathi sections; incentive extraction needs translation/manual review.",
        },
        {
            "city_id": "CITY-NCR",
            "city": "Delhi NCR",
            "state": "Delhi / Haryana / Uttar Pradesh",
            "tier_classification": "Tier 1",
            "gcc_sample_count": city_counts.get("Delhi NCR", 305),
            "key_clusters": "Gurugram; Noida; Greater Noida; Aerocity",
            "sector_strengths": "BFSI; Professional services; Technology; Retail; Shared services",
            "talent_strengths": "Large business, finance, operations and engineering talent base across NCR.",
            "senior_engineer_salary_range": "High / upper-mid",
            "ml_engineer_salary_range": "High",
            "office_rent_range": "Wide range; premium Gurugram and cost-efficient Noida options",
            "attrition_proxy": "Moderate-high",
            "state_incentive_summary": "UP GCC Policy directly supports GCC setup outside/around Noida region with capital/payroll/stamp duty incentives.",
            "best_for": "BFSI, operations, professional services, hybrid tech/business GCCs",
            "risks": "Multi-state policy complexity; city selection within NCR matters.",
            "confidence_score": 82,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_UP_GCC_POLICY_2025_PDF;SRC_CBRE_OFFICE_Q2_2026_PAGE",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/UP_GCC-Policy-Eng_050625.pdf;dataset/raw/India_Office_Figures_Q2_2026.pdf",
            "last_checked": "2026-09-25",
            "notes": "NCR aggregates multiple states; incentives depend on exact district/state.",
        },
        {
            "city_id": "CITY-CHN",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "tier_classification": "Tier 1",
            "gcc_sample_count": city_counts.get("Chennai", 244),
            "key_clusters": "OMR; Guindy; Ambattur; Porur; Siruseri",
            "sector_strengths": "Automotive; Engineering R&D; SaaS; BFSI; Manufacturing",
            "talent_strengths": "Strong engineering, manufacturing, SaaS, and operations talent.",
            "senior_engineer_salary_range": "Mid / upper-mid",
            "ml_engineer_salary_range": "Upper-mid",
            "office_rent_range": "Mid / upper-mid",
            "attrition_proxy": "Moderate",
            "state_incentive_summary": "Tamil Nadu has a special scheme to promote GCCs.",
            "best_for": "Engineering, automotive, SaaS, cost-stable scaled teams",
            "risks": "May be less deep than Bengaluru for some frontier AI roles.",
            "confidence_score": 82,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_TN_GCC_SCHEME_PDF;SRC_CBRE_OFFICE_Q2_2026_PAGE",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/Scheme to promote GCC.pdf;dataset/raw/India_Office_Figures_Q2_2026.pdf",
            "last_checked": "2026-09-25",
            "notes": "Strong policy and city data, but exact incentive amounts need final structured extraction.",
        },
        {
            "city_id": "CITY-MUM",
            "city": "Mumbai",
            "state": "Maharashtra",
            "tier_classification": "Tier 1",
            "gcc_sample_count": city_counts.get("Mumbai", 283),
            "key_clusters": "BKC; Powai; Navi Mumbai; Andheri; Lower Parel",
            "sector_strengths": "BFSI; Media; Retail; Professional services; Operations",
            "talent_strengths": "Strong finance, compliance, operations, and business leadership talent.",
            "senior_engineer_salary_range": "High",
            "ml_engineer_salary_range": "High",
            "office_rent_range": "Premium / very high in core micro-markets",
            "attrition_proxy": "Moderate-high",
            "state_incentive_summary": "Maharashtra GCC Policy 2025 relevant; exact incentives need manual extraction.",
            "best_for": "BFSI, business operations, executive proximity, regulated-sector GCCs",
            "risks": "High real estate cost; commute and location choice matter heavily.",
            "confidence_score": 76,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_MAHARASHTRA_GCC_POLICY_PDF;SRC_CBRE_OFFICE_Q2_2026_PAGE",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/global-cabability-centres-compressed_1.pdf;dataset/raw/India_Office_Figures_Q2_2026.pdf",
            "last_checked": "2026-09-25",
            "notes": "Useful for BFSI/business functions; likely expensive for large engineering-only GCC.",
        },
        {
            "city_id": "CITY-AHD",
            "city": "Ahmedabad / GIFT City",
            "state": "Gujarat",
            "tier_classification": "Emerging hub",
            "gcc_sample_count": city_counts.get("Ahmedabad", 30) + city_counts.get("GIFT City", 2),
            "key_clusters": "Ahmedabad; GIFT City; Gandhinagar",
            "sector_strengths": "BFSI; fintech; operations; professional services; emerging tech",
            "talent_strengths": "Emerging GCC talent pool with policy-led push.",
            "senior_engineer_salary_range": "Mid",
            "ml_engineer_salary_range": "Mid / emerging",
            "office_rent_range": "Lower than Tier 1 premium hubs; exact range needs real estate extraction",
            "attrition_proxy": "Lower than top metros; needs verification",
            "state_incentive_summary": "Gujarat GCC Policy 2025-30 includes CAPEX support, employment generation incentive, and skilling support.",
            "best_for": "Cost-conscious BFSI/fintech, operations, emerging GCCs",
            "risks": "Lower depth for niche senior engineering compared with Bengaluru/Hyderabad.",
            "confidence_score": 84,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_GUJARAT_GCC_POLICY_PDF",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/Gujarat Global Capability Center.pdf",
            "last_checked": "2026-09-25",
            "notes": "Policy data is strong; market depth is still emerging.",
        },
        {
            "city_id": "CITY-CBE",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "tier_classification": "Emerging hub",
            "gcc_sample_count": city_counts.get("Coimbatore", 48),
            "key_clusters": "Coimbatore IT parks; industrial corridors",
            "sector_strengths": "Engineering; manufacturing; support operations; mid-market tech",
            "talent_strengths": "Emerging lower-cost engineering and operations talent.",
            "senior_engineer_salary_range": "Mid / lower than Tier 1",
            "ml_engineer_salary_range": "Emerging; specialist talent depth lower",
            "office_rent_range": "Lower than Tier 1 hubs",
            "attrition_proxy": "Likely lower than metros; needs verification",
            "state_incentive_summary": "Tamil Nadu GCC scheme applies at state level; city fit needs policy extraction.",
            "best_for": "Cost-efficient support, engineering extensions, retention-sensitive teams",
            "risks": "Limited senior/niche talent depth; may need hub-spoke model.",
            "confidence_score": 72,
            "source_ids": "SRC_FLEXIPLE_GCC_INDIA_HTML;SRC_TN_GCC_SCHEME_PDF",
            "source_urls": "https://flexiple.com/gcc/india;dataset/raw/Scheme to promote GCC.pdf",
            "last_checked": "2026-09-25",
            "notes": "Emerging hub assumptions need further validation.",
        },
    ]
    fields = [
        "city_id", "city", "state", "tier_classification", "gcc_sample_count", "key_clusters",
        "sector_strengths", "talent_strengths", "senior_engineer_salary_range", "ml_engineer_salary_range",
        "office_rent_range", "attrition_proxy", "state_incentive_summary", "best_for", "risks",
        "confidence_score", "source_ids", "source_urls", "last_checked", "notes",
    ]
    write_csv(PROC / "city_benchmarks.csv", rows, fields)
    write_csv(ORG / "06_app_ready" / "city_benchmarks_app_ready.csv", rows, fields)
    return len(rows)


def build_state_policies() -> int:
    rows = [
        {
            "policy_id": "POL-GJ-GCC-2025",
            "state": "Gujarat",
            "policy_name": "Gujarat Global Capability Centre Policy 2025-30",
            "policy_status": "Official policy PDF",
            "effective_years": "2025-30",
            "target_gccs": "250 new GCC units",
            "target_jobs": "50,000+ jobs",
            "capital_subsidy": "CAPEX support by investment category; Category I includes support up to INR 50 Cr ceiling in extracted table",
            "capex_cap": "Up to INR 50 Cr for Category I per extracted policy table; verify full conditions",
            "payroll_reimbursement": "",
            "stamp_duty_exemption": "",
            "sgst_reimbursement": "",
            "electricity_duty_exemption": "",
            "training_subsidy": "Skilling support up to INR 50,000 per course / percentage of course fee per extracted policy table",
            "eligibility": "GCC units by investment/employment category; full eligibility in PDF",
            "nodal_agency": "Government of Gujarat / Department of Science and Technology",
            "key_cities": "Ahmedabad; GIFT City; Gandhinagar; Vadodara",
            "confidence_score": 88,
            "source_ids": "SRC_GUJARAT_GCC_POLICY_PDF",
            "source_urls": "dataset/raw/Gujarat Global Capability Center.pdf",
            "last_checked": "2026-09-25",
            "notes": "High-value direct state policy. Extracted tables need final manual verification before exact incentive display.",
        },
        {
            "policy_id": "POL-UP-GCC-2024",
            "state": "Uttar Pradesh",
            "policy_name": "UP Global Capability Centre Policy 2024",
            "policy_status": "Official English policy PDF",
            "effective_years": "Policy period in PDF",
            "target_gccs": "",
            "target_jobs": "",
            "capital_subsidy": "Eligibility thresholds: Level-1 and Advanced GCC by investment/employment criteria",
            "capex_cap": "",
            "payroll_reimbursement": "Extracted tables show payroll subsidy schedule by year; e.g. first-year percentages and max annual salary caps vary by category",
            "stamp_duty_exemption": "Mentioned in policy; exact field needs manual extraction",
            "sgst_reimbursement": "",
            "electricity_duty_exemption": "",
            "training_subsidy": "",
            "eligibility": "Level-1 GCC and Advanced GCC thresholds differ for GB Nagar/Ghaziabad vs other districts",
            "nodal_agency": "Invest UP / Uttar Pradesh government",
            "key_cities": "Noida; Greater Noida; Lucknow; Kanpur; other UP districts",
            "confidence_score": 88,
            "source_ids": "SRC_UP_GCC_POLICY_2025_PDF",
            "source_urls": "dataset/raw/UP_GCC-Policy-Eng_050625.pdf",
            "last_checked": "2026-09-25",
            "notes": "Strong policy source. Exact incentive table should be manually transcribed from pages 10, 13, 14.",
        },
        {
            "policy_id": "POL-TN-GCC-SCHEME",
            "state": "Tamil Nadu",
            "policy_name": "Special Scheme to Promote Global Capability Centres",
            "policy_status": "Official Government Order / scheme PDF",
            "effective_years": "As per Government Order",
            "target_gccs": "",
            "target_jobs": "",
            "capital_subsidy": "",
            "capex_cap": "",
            "payroll_reimbursement": "",
            "stamp_duty_exemption": "",
            "sgst_reimbursement": "",
            "electricity_duty_exemption": "",
            "training_subsidy": "",
            "eligibility": "Scheme details in short PDF; needs final manual extraction",
            "nodal_agency": "Government of Tamil Nadu",
            "key_cities": "Chennai; Coimbatore; Madurai; Tiruchirappalli; Hosur",
            "confidence_score": 82,
            "source_ids": "SRC_TN_GCC_SCHEME_PDF",
            "source_urls": "dataset/raw/Scheme to promote GCC.pdf",
            "last_checked": "2026-09-25",
            "notes": "Direct scheme PDF is available; fields need manual transcription because extracted tables are sparse.",
        },
        {
            "policy_id": "POL-MH-GCC-2025",
            "state": "Maharashtra",
            "policy_name": "Maharashtra Global Capability Centre Policy 2025",
            "policy_status": "Official policy PDF",
            "effective_years": "As per policy",
            "target_gccs": "",
            "target_jobs": "",
            "capital_subsidy": "Extracted Marathi tables show categories by investment and employee count; exact fields need translation/manual extraction",
            "capex_cap": "",
            "payroll_reimbursement": "",
            "stamp_duty_exemption": "",
            "sgst_reimbursement": "",
            "electricity_duty_exemption": "",
            "training_subsidy": "",
            "eligibility": "GCC classifications by investment and employee count in PDF",
            "nodal_agency": "Government of Maharashtra",
            "key_cities": "Mumbai; Pune; Nagpur; Nashik; Chhatrapati Sambhajinagar",
            "confidence_score": 75,
            "source_ids": "SRC_MAHARASHTRA_GCC_POLICY_PDF",
            "source_urls": "dataset/raw/global-cabability-centres-compressed_1.pdf",
            "last_checked": "2026-09-25",
            "notes": "Official source but table extraction is Marathi/garbled; use with caution until translated.",
        },
    ]
    fields = [
        "policy_id", "state", "policy_name", "policy_status", "effective_years", "target_gccs",
        "target_jobs", "capital_subsidy", "capex_cap", "payroll_reimbursement",
        "stamp_duty_exemption", "sgst_reimbursement", "electricity_duty_exemption",
        "training_subsidy", "eligibility", "nodal_agency", "key_cities", "confidence_score",
        "source_ids", "source_urls", "last_checked", "notes",
    ]
    write_csv(PROC / "state_policies.csv", rows, fields)
    write_csv(ORG / "06_app_ready" / "state_policies_app_ready.csv", rows, fields)
    return len(rows)


def build_stakeholders() -> int:
    rows = [
        ("STK-NASSCOM", "Nasscom", "Industry body", "India", "Industry reports, council network, ecosystem convening", "Co-publishes GCC Landscape with Zinnov", "unclaimed", "Macro benchmarks; ecosystem research; policy engagement", 92, "SRC_ZINNOV_GCC_2026_LOCAL"),
        ("STK-ZINNOV", "Zinnov", "GCC advisor / research", "India; global", "GCC strategy, setup, transformation, benchmarking", "Nasscom-Zinnov GCC Landscape; GCC setup offering", "unclaimed", "Buyer intent for GCC setup/transformation", 90, "SRC_ZINNOV_GCC_2026_LOCAL"),
        ("STK-EY", "EY India GCC Advisory", "Big 4 advisory", "India", "GCC strategy, setup, optimization, AI-native GCC advisory", "EY GCC services pages and ISG/HFS recognition pages", "unclaimed", "Qualified advisory demand and setup mandates", 84, "SRC_EY_GCC_ADVISORY"),
        ("STK-PWC", "PwC India GCC / Digital GCC", "Big 4 advisory", "India", "Digital GCC, technology consulting, tax and advisory", "PwC Digital GCC public page", "unclaimed", "GCC transformation and tax/compliance demand", 84, "SRC_PWC_DIGITAL_GCC"),
        ("STK-KPMG", "KPMG India", "Big 4 advisory", "India", "GCC services, tax, risk, setup and optimization", "KPMG ISG Provider Lens GCC Services PDF", "unclaimed", "Setup/optimization leads", 84, "SRC_KPMG_ISG_GCC_2025_PDF"),
        ("STK-DELOITTE", "Deloitte India", "Big 4 advisory", "India", "GCC advisory, tax, strategy, transformation", "Deloitte + Embark GCC alliance announcement", "unclaimed", "Board-level GCC setup interest", 84, "SRC_DELOITTE_EMBARK"),
        ("STK-CBRE", "CBRE India", "Real estate advisor", "India metros", "Office leasing, workplace strategy, market research", "CBRE office/GCC workplace reports", "unclaimed", "Office footprint demand by city/team size", 86, "SRC_CBRE_OFFICE_Q2_2026_PAGE"),
        ("STK-JLL", "JLL India", "Real estate advisor", "India metros", "Office leasing, GCC workplace advisory, market research", "JLL Office Market Dynamics and GCC pages", "unclaimed", "Tenant demand signals and city shortlist intent", 86, "SRC_JLL_OFFICE_DYNAMICS_PAGE"),
        ("STK-KF", "Knight Frank India", "Real estate research/advisory", "India metros", "Office market research and leasing advisory", "Knight Frank India research reports", "unclaimed", "City benchmark and office market data", 82, "SRC_KNIGHT_FRANK_RESEARCH_PAGE"),
        ("STK-COLLIERS", "Colliers India", "Real estate advisor", "India metros", "Office/flex space research and advisory", "Colliers India research", "unclaimed", "Tenant demand and office strategy", 80, "SRC_COLLIERS_RESEARCH_PAGE"),
        ("STK-INDUSLAW", "IndusLaw", "Legal advisor", "India", "GCC operating legal guide, entity setup, employment/compliance", "Operating a GCC in India 2025 PDF", "unclaimed", "Legal setup and compliance demand", 82, "SRC_INDUSLAW_GCC_2025_PDF"),
        ("STK-DHRUVA", "Dhruva Advisors", "Tax advisor", "India", "Tax, transfer pricing, GCC report", "Dhruva GCC Report 2025", "unclaimed", "Tax/compliance demand for captive setup", 82, "SRC_DHRUVA_GCC_2025_PDF"),
        ("STK-STPI", "Software Technology Parks of India", "Government / regulatory", "India", "STP/EHTP statutory services and export compliance", "STPI statutory services pages", "unclaimed", "STPI scheme/setup queries", 90, "SRC_STPI_STATUTORY"),
        ("STK-INVESTUP", "Invest UP", "State investment agency", "Uttar Pradesh", "UP GCC policy, investment facilitation", "UP GCC Policy PDFs", "unclaimed", "GCC investment/jobs pipeline for UP", 88, "SRC_UP_GCC_POLICY_2025_PDF"),
        ("STK-GUJARAT-DST", "Government of Gujarat DST", "State government", "Gujarat", "GCC policy, incentives, skilling support", "Gujarat GCC Policy 2025-30", "unclaimed", "GCC/fintech investment pipeline", 88, "SRC_GUJARAT_GCC_POLICY_PDF"),
        ("STK-TN-GOV", "Government of Tamil Nadu", "State government", "Tamil Nadu", "Special scheme to promote GCCs", "Tamil Nadu GCC scheme PDF", "unclaimed", "GCC investments in Chennai/Coimbatore", 84, "SRC_TN_GCC_SCHEME_PDF"),
        ("STK-MH-GOV", "Government of Maharashtra", "State government", "Maharashtra", "GCC policy and IT/ITES policy", "Maharashtra GCC Policy 2025", "unclaimed", "GCC investments in Mumbai/Pune/Nagpur", 78, "SRC_MAHARASHTRA_GCC_POLICY_PDF"),
        ("STK-AVASANT", "Avasant", "Provider analyst", "Global", "GCC services research / RadarView", "Avasant GCC Services RadarView example", "unclaimed", "Provider evaluation data", 75, "SRC_AVASANT_GCC_RADARVIEW_2025_PDF"),
        ("STK-FLEXIPLE", "Flexiple", "Talent / managed team / GCC enablement", "India", "Talent sourcing, payroll, compliance, managed teams, GCC support", "Flexiple public GCC pages and directory", "owner", "High-intent India setup leads", 86, "SRC_FLEXIPLE_GCC_INDIA_HTML"),
    ]
    fieldnames = [
        "stakeholder_id", "name", "category", "cities_supported", "services", "proof_points",
        "profile_status", "demand_signals_of_interest", "confidence_score", "source_ids",
        "source_urls", "last_checked", "notes",
    ]
    out_rows = []
    for r in rows:
        out_rows.append({
            "stakeholder_id": r[0],
            "name": r[1],
            "category": r[2],
            "cities_supported": r[3],
            "services": r[4],
            "proof_points": r[5],
            "profile_status": r[6],
            "demand_signals_of_interest": r[7],
            "confidence_score": r[8],
            "source_ids": r[9],
            "source_urls": "",
            "last_checked": "2026-09-25",
            "notes": "Seed stakeholder profile for claim/proof/data contribution flow.",
        })
    write_csv(PROC / "stakeholders.csv", out_rows, fieldnames)
    write_csv(ORG / "06_app_ready" / "stakeholders_app_ready.csv", out_rows, fieldnames)
    return len(out_rows)


def build_assumptions() -> int:
    rows = [
        ("ASM-MACRO-GCC-COUNT", "overview", "Current India GCC count", "2,117", "GCCs", "FY26E macro snapshot", 94, "SRC_ZINNOV_GCC_2026_LOCAL", "Current macro figure from Zinnov-Nasscom 2026; older sources use 1,700."),
        ("ASM-MACRO-UNITS", "overview", "Current India GCC units", "3,728", "units", "FY26E macro snapshot", 94, "SRC_ZINNOV_GCC_2026_LOCAL", "Use as current unit count."),
        ("ASM-MACRO-TALENT", "overview", "Installed GCC talent", "2.36M", "professionals", "FY26E macro snapshot", 94, "SRC_ZINNOV_GCC_2026_LOCAL", "Use as current talent figure."),
        ("ASM-MACRO-REVENUE", "overview", "GCC revenue", "USD 98.4B", "annual revenue", "FY26E macro snapshot", 94, "SRC_ZINNOV_GCC_2026_LOCAL", "Use as current revenue figure."),
        ("ASM-AI-GCCS", "city_compare", "India GCCs with AI/ML capability", "1,200+", "GCCs", "AI/GCC capability indicator", 88, "SRC_ZINNOV_GCC_2026_LOCAL", "Useful for AI city/product narrative."),
        ("ASM-AI-COE", "city_compare", "Dedicated AI/ML CoEs", "250+", "CoEs", "AI/GCC capability indicator", 88, "SRC_ZINNOV_GCC_2026_LOCAL", "Use as macro AI maturity signal."),
        ("ASM-BUILD-EOR-SPEED", "build_vs_buy", "EOR/managed route setup speed", "days to weeks", "time", "EOR/Flexiple-managed team path", 62, "SRC_DEEL_EOR_INDIA;SRC_FLEXIPLE_GCC_INDIA_HTML", "Directional; provider claims may be biased."),
        ("ASM-BUILD-ENTITY-TIMELINE", "build_vs_buy", "Direct entity setup timeline", "3-6 months", "time", "Direct entity/full GCC path", 65, "SRC_INVEST_INDIA_FAQ_PDF;SRC_INDUSLAW_GCC_2025_PDF", "Directional; actual setup depends on structure, banking, registrations, lease and compliance."),
        ("ASM-BUILD-BREAKEVEN", "build_vs_buy", "EOR vs direct entity break-even", "30-50 employees", "team size", "Route recommendation", 50, "SRC_INDUSLAW_GCC_2025_PDF;SRC_DHRUVA_GCC_2025_PDF", "Assumption for demo modeling; must be framed as configurable and indicative."),
        ("ASM-SEZ-CAUTION", "city_compare", "SEZ location does not equal tax benefit eligibility", "needs unit-level verification", "caution", "SEZ/STPI facility fields", 90, "SRC_SEZ_NOTIFIED_LIST;SRC_SEZ_BOA_127_MINUTES", "Important product caveat; do not infer incentives from tech park alone."),
    ]
    fields = [
        "assumption_id", "module", "assumption_name", "value_or_range", "unit",
        "applies_to", "confidence_score", "source_ids", "source_urls", "caveat",
        "last_checked", "notes",
    ]
    out_rows = []
    for r in rows:
        out_rows.append({
            "assumption_id": r[0],
            "module": r[1],
            "assumption_name": r[2],
            "value_or_range": r[3],
            "unit": r[4],
            "applies_to": r[5],
            "confidence_score": r[6],
            "source_ids": r[7],
            "source_urls": "",
            "caveat": r[8],
            "last_checked": "2026-09-25",
            "notes": "Use in app with visible assumption/caveat drawer.",
        })
    write_csv(PROC / "assumptions.csv", out_rows, fields)
    write_csv(ORG / "06_app_ready" / "assumptions_app_ready.csv", out_rows, fields)
    return len(out_rows)


def main() -> None:
    results = {
        "gcc_records": build_gcc_records(),
        "city_benchmarks": build_city_benchmarks(),
        "state_policies": build_state_policies(),
        "stakeholders": build_stakeholders(),
        "assumptions": build_assumptions(),
    }
    summary = ["# Prototype CSV Build Summary", "", "Generated: 2026-09-25", ""]
    for key, value in results.items():
        summary.append(f"- `{key}` rows: {value}")
    summary.extend([
        "",
        "## App Integration Notes",
        "",
        "- `gcc_records.csv` is ready for the GCC Atlas, but legal-entity fields are sparse and should be shown as verified/unknown.",
        "- `city_benchmarks.csv` is usable for a polished comparison UI, but rent/salary fields are deliberately qualitative until manual table cleanup is complete.",
        "- `state_policies.csv` contains source-backed policy summaries; exact incentive amounts require final manual transcription for demo claims.",
        "- `stakeholders.csv` is ready for the ecosystem stakeholder section.",
        "- `assumptions.csv` is ready for the Build vs Buy assumptions drawer.",
    ])
    report = "\n".join(summary)
    (ORG / "06_app_ready" / "prototype_csv_build_summary.md").write_text(report, encoding="utf-8")
    print(report)


if __name__ == "__main__":
    main()
