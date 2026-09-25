# Prototype Data Readiness

Generated: 2026-09-25

## Ready For Direct Integration

- `company_seed_merged.csv`: 769 company/GCC candidate rows from Flexiple + GCC Index. Use this as the first GCC Atlas dataset.
- `gcc_index_activity_timeline.csv`: 503 timeline/event rows from GCC Index. Use for company detail drawers.
- `gcc_index_mca_cin_verified.csv`: 313 GCC Index rows with CINs joined to MCA/data.gov; 3 matched an MCA row. Use as higher-confidence legal entity verification.
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
