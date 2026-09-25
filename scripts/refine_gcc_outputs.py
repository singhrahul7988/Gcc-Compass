from __future__ import annotations

from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "dataset" / "raw"
ORG = ROOT / "dataset" / "organized"
PROC = ROOT / "dataset" / "processed"


def main() -> None:
    app_ready = ORG / "06_app_ready"
    app_ready.mkdir(parents=True, exist_ok=True)

    idx = pd.read_excel(RAW / "GCC_Index_All_Companies.xlsx", sheet_name="Company Profiles")
    idx_cin = idx[idx["cin"].notna() & (idx["cin"].astype(str).str.strip() != "")].copy()
    idx_cin["cin_clean"] = idx_cin["cin"].astype(str).str.strip().str.upper()

    use_cols = [
        "CIN",
        "CompanyName",
        "CompanyRegistrationdate_date",
        "Registered_Office_Address",
        "CompanyStatus",
        "CompanyStateCode",
        "CompanyIndian/Foreign Company",
        "nic_code",
        "CompanyIndustrialClassification",
    ]
    mca = pd.read_csv(RAW / "data_gov data.csv", usecols=lambda c: c in use_cols, low_memory=False)
    mca["cin_clean"] = mca["CIN"].astype(str).str.strip().str.upper()

    merged = idx_cin.merge(mca, on="cin_clean", how="left", suffixes=("_gcc_index", "_mca"))
    cols = [
        "company_name",
        "profile_city",
        "profile_sector",
        "capability_intent",
        "cin",
        "CompanyName",
        "CIN",
        "CompanyRegistrationdate_date",
        "CompanyStatus",
        "CompanyStateCode",
        "CompanyIndian/Foreign Company",
        "nic_code",
        "CompanyIndustrialClassification",
        "Registered_Office_Address",
        "profile_url",
        "company_website_url",
    ]
    for col in cols:
        if col not in merged.columns:
            merged[col] = ""
    out = app_ready / "gcc_index_mca_cin_verified.csv"
    merged[cols].to_csv(out, index=False)
    (PROC / "gcc_index_mca_cin_verified.csv").write_text(out.read_text(encoding="utf-8"), encoding="utf-8")

    inv = pd.read_csv(ORG / "00_inventory" / "raw_file_inventory.csv")
    module_map = {
        "macro_gcc_reports": "Overview / market snapshot",
        "real_estate_city_benchmarking": "City benchmarking",
        "state_policy_incentives": "State incentives / build-vs-buy",
        "company_entity_data": "GCC Atlas / entity verification",
        "sez_stpi_facility_signals": "Facility and cluster signals",
        "setup_compliance_tax": "Build-vs-buy assumptions",
        "stakeholder_provider_landscape": "Stakeholder layer",
        "talent_compensation": "Talent and compensation assumptions",
        "visual_reference": "Competitive/product reference",
        "low_relevance_noise": "Do not use unless needed",
        "misc": "Manual review",
    }
    inv["prototype_module"] = inv["category"].map(module_map).fillna("Manual review")
    inv["recommended_action"] = inv["relevance_status"].map({
        "high": "Use now",
        "medium": "Use only for context",
        "low": "Park as noise",
    }).fillna("Manual review")

    # Correct one hyphenated real-estate title that the first classifier parked as misc.
    mask_real_estate_title = inv["file_name"].str.contains("real-estate|real estate", case=False, na=False)
    inv.loc[mask_real_estate_title, "prototype_module"] = "City benchmarking"
    inv.loc[mask_real_estate_title, "recommended_action"] = "Use now"

    hv = inv[[
        "file_name",
        "original_path",
        "category",
        "prototype_module",
        "relevance_status",
        "usefulness_score",
        "recommended_action",
        "reason",
        "organized_copy",
    ]].sort_values(["recommended_action", "prototype_module", "file_name"])
    hv.to_csv(app_ready / "high_value_document_map.csv", index=False)
    hv[hv["prototype_module"].str.contains("State incentives", na=False)].to_csv(app_ready / "state_policy_document_index.csv", index=False)
    hv[hv["prototype_module"].str.contains("City benchmarking", na=False)].to_csv(app_ready / "real_estate_document_index.csv", index=False)

    matched_mca = int(merged["CompanyName"].notna().sum())
    summary = f"""# Prototype Data Readiness

Generated: 2026-09-25

## Ready For Direct Integration

- `company_seed_merged.csv`: 769 company/GCC candidate rows from Flexiple + GCC Index. Use this as the first GCC Atlas dataset.
- `gcc_index_activity_timeline.csv`: 503 timeline/event rows from GCC Index. Use for company detail drawers.
- `gcc_index_mca_cin_verified.csv`: {len(merged)} GCC Index rows with CINs joined to MCA/data.gov; {matched_mca} matched an MCA row. Use as higher-confidence legal entity verification.
- `mca_keyword_entity_matches.csv`: 49 MCA keyword matches. Use only as discovery leads because it includes false positives.
- `high_value_document_map.csv`: source-to-module map for the prototype.
- `raw_file_inventory.csv`: complete raw file manifest and relevance status.

## Requires Manual Cleanup Before App Use

- `03_extracted_tables/`: 475 extracted PDF tables. These need human review because PDF table extraction can split/merge columns incorrectly.
- Real estate PDF tables: use visual previews + extracted tables to manually create city benchmark rows.
- State policy PDFs: use document index + visual previews to manually extract incentive fields.

## Visual Review Outputs

- `02_visual_review/` contains rendered representative pages for each PDF, selected from first pages and table-heavy/text-heavy pages. Use these to catch charts, tables, and layout-based information that text extraction misses.

## Key Discrepancies To Preserve In Product

- Use Zinnov-Nasscom 2026 as primary current macro source: 2,117 GCCs, 3,728 units, 2.36M installed talent, USD 98.4B revenue.
- Older documents mention 1,700 GCCs, 1.9M employees, and USD 64.6B revenue. Treat these as historical trend points, not current values.
- Flexiple and GCC Index are partial directories, not total ecosystem counts.
- SEZ/STPI documents indicate facility/zone signals, not automatic tenant tax-benefit eligibility.

## Suggested Next Manual Step

Open `high_value_document_map.csv`, then build these app CSVs from the highest-value sources:

1. `city_benchmarks.csv` from real estate PDFs + Zinnov/Nasscom + state policy PDFs.
2. `state_policies.csv` from Gujarat, Maharashtra, UP, Tamil Nadu PDFs.
3. `stakeholders.csv` from KPMG/Avasant/provider reports.
4. `assumptions.csv` from setup/compliance/talent reports.
"""
    (app_ready / "prototype_data_readiness.md").write_text(summary, encoding="utf-8")
    print(summary)


if __name__ == "__main__":
    main()
