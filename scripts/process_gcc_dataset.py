from __future__ import annotations

import csv
import json
import math
import re
import shutil
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import fitz  # PyMuPDF
import pandas as pd
import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "dataset" / "raw"
ORGANIZED = ROOT / "dataset" / "organized"
PROCESSED = ROOT / "dataset" / "processed"


def safe_name(value: str) -> str:
    value = re.sub(r"[^\w\-\. ]+", "_", value, flags=re.UNICODE).strip()
    return re.sub(r"\s+", "_", value)[:140] or "unnamed"


def normalize_company(value: str) -> str:
    if not isinstance(value, str):
        return ""
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    stop = {
        "private", "limited", "pvt", "ltd", "india", "services", "service",
        "technologies", "technology", "global", "capability", "center",
        "centre", "solutions", "systems", "inc", "llp", "plc",
    }
    parts = [p for p in value.split() if p not in stop]
    return " ".join(parts).strip()


def classify_file(path: Path) -> tuple[str, str, int, str]:
    name = path.name.lower()
    ext = path.suffix.lower()

    category = "misc"
    status = "medium"
    score = 55
    reason = "Potentially useful but needs review."

    if ext in [".xlsx", ".xls", ".csv"]:
        category = "company_entity_data"
        status = "high"
        score = 90
        reason = "Structured file that can feed the prototype directly."

    if any(k in name for k in ["zinnov", "nasscom", "gcc in india", "gccs-in-india"]):
        category = "macro_gcc_reports"
        status = "high"
        score = 90
        reason = "High-value GCC market report/source."

    if any(k in name for k in ["office", "real estate", "market dynamics", "market-report"]):
        category = "real_estate_city_benchmarking"
        status = "high"
        score = 85
        reason = "Useful for city benchmarking, rents, leasing, vacancy, office demand."

    if any(k in name for k in ["gujarat", "maharashtra", "global-cabability", "up_gcc", "up-gcc", "scheme to promote gcc", "gcc-sop"]):
        category = "state_policy_incentives"
        status = "high"
        score = 88
        reason = "Official or policy-adjacent source for state incentives and setup rules."

    if any(k in name for k in ["establish", "dhruva", "induslaw"]):
        category = "setup_compliance_tax"
        status = "high"
        score = 82
        reason = "Useful for setup, tax, operating model, or compliance framing."

    if any(k in name for k in ["kpmg", "avasant", "cognizant"]):
        category = "stakeholder_provider_landscape"
        status = "high"
        score = 78
        reason = "Useful for provider categories and stakeholder ecosystem."

    if any(k in name for k in ["remuneration", "trd", "salary", "compensation"]):
        category = "talent_compensation"
        status = "medium"
        score = 70
        reason = "Useful for salary-source metadata, but detailed data may be gated."

    if any(k in name for k in ["sez", "boa", "notified"]):
        category = "sez_stpi_facility_signals"
        status = "high"
        score = 82
        reason = "Official facility/location signal; needs manual mapping to GCC tenants."

    if "nidhi" in name:
        category = "low_relevance_noise"
        status = "low"
        score = 25
        reason = "Generic business scheme, weak fit for GCC Compass MVP."

    if ext == ".png":
        category = "visual_reference"
        status = "medium"
        score = 55
        reason = "Screenshot/reference image, useful for product comparison only."

    return category, status, score, reason


def ensure_dirs() -> None:
    for folder in [
        ORGANIZED,
        ORGANIZED / "00_inventory",
        ORGANIZED / "01_by_category",
        ORGANIZED / "02_visual_review",
        ORGANIZED / "03_extracted_tables",
        ORGANIZED / "04_spreadsheet_profiles",
        ORGANIZED / "05_reconciliation",
        ORGANIZED / "06_app_ready",
        ORGANIZED / "07_noise_review",
        PROCESSED,
    ]:
        folder.mkdir(parents=True, exist_ok=True)


def copy_to_category(path: Path, category: str, status: str) -> str:
    if status == "low":
        target_dir = ORGANIZED / "07_noise_review" / category
    else:
        target_dir = ORGANIZED / "01_by_category" / category
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / path.name
    if not target.exists() or target.stat().st_size != path.stat().st_size:
        shutil.copy2(path, target)
    return str(target.relative_to(ROOT))


def render_pdf_pages(pdf_path: Path, selected_pages: list[int], out_dir: Path) -> list[str]:
    rendered = []
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        doc = fitz.open(pdf_path)
        for page_index in selected_pages:
            if page_index < 0 or page_index >= len(doc):
                continue
            page = doc[page_index]
            pix = page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4), alpha=False)
            out = out_dir / f"page_{page_index + 1:03d}.png"
            pix.save(out)
            rendered.append(str(out.relative_to(ROOT)))
        doc.close()
    except Exception as exc:
        rendered.append(f"ERROR: {exc}")
    return rendered


def process_pdf(path: Path) -> dict:
    summary = {
        "pages": 0,
        "text_chars": 0,
        "tables_found": 0,
        "table_pages": [],
        "rendered_pages": [],
        "macro_hits": [],
        "errors": [],
    }
    stem = safe_name(path.stem)
    table_dir = ORGANIZED / "03_extracted_tables" / stem
    visual_dir = ORGANIZED / "02_visual_review" / stem
    table_dir.mkdir(parents=True, exist_ok=True)

    page_scores: list[tuple[int, int, int]] = []
    extracted_text = []
    patterns = [
        r"\b2,?117\b", r"\b3,?728\b", r"\b2\.36\b", r"\b98\.4\b",
        r"\b1,?700\b", r"\b64\.6\b", r"\b1\.9\b", r"\b31\s?M\b",
        r"\bAI\b", r"\bGCC\b", r"\bGlobal Capability",
    ]

    try:
        with pdfplumber.open(path) as pdf:
            summary["pages"] = len(pdf.pages)
            for pno, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                extracted_text.append(text)
                summary["text_chars"] += len(text)
                hits = []
                for pat in patterns:
                    if re.search(pat, text, flags=re.IGNORECASE):
                        hits.append(pat)
                if hits:
                    summary["macro_hits"].append({"page": pno, "patterns": hits[:5]})

                tables = []
                try:
                    tables = page.extract_tables() or []
                except Exception as exc:
                    summary["errors"].append(f"table page {pno}: {exc}")
                if tables:
                    summary["table_pages"].append(pno)
                    for tno, table in enumerate(tables, start=1):
                        rows = [[cell if cell is not None else "" for cell in row] for row in table if row]
                        if len(rows) < 2:
                            continue
                        out = table_dir / f"page_{pno:03d}_table_{tno:02d}.csv"
                        with out.open("w", newline="", encoding="utf-8") as f:
                            writer = csv.writer(f)
                            writer.writerows(rows)
                        summary["tables_found"] += 1
                page_scores.append((pno - 1, len(tables), len(text)))
    except Exception as exc:
        summary["errors"].append(str(exc))

    selected = [0]
    table_heavy = [idx for idx, tables, _chars in sorted(page_scores, key=lambda x: (x[1], x[2]), reverse=True) if tables > 0]
    text_heavy = [idx for idx, _tables, chars in sorted(page_scores, key=lambda x: x[2], reverse=True)]
    for idx in table_heavy[:3] + text_heavy[:1]:
        if idx not in selected:
            selected.append(idx)
    selected = selected[:5]
    summary["rendered_pages"] = render_pdf_pages(path, selected, visual_dir)

    text_path = ORGANIZED / "05_reconciliation" / "pdf_text_snippets"
    text_path.mkdir(parents=True, exist_ok=True)
    joined = "\n\n--- PAGE BREAK ---\n\n".join(extracted_text)
    (text_path / f"{stem}.txt").write_text(joined[:250000], encoding="utf-8")
    return summary


def profile_spreadsheet(path: Path) -> dict:
    ext = path.suffix.lower()
    profile = {"sheets": [], "errors": []}
    out_dir = ORGANIZED / "04_spreadsheet_profiles"
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        if ext == ".csv":
            df = pd.read_csv(path, low_memory=False)
            profile["sheets"].append({
                "sheet": "csv",
                "rows": len(df),
                "columns": list(df.columns),
            })
            df.head(100).to_csv(out_dir / f"{safe_name(path.stem)}__sample.csv", index=False)
        else:
            xl = pd.ExcelFile(path)
            for sheet in xl.sheet_names:
                df = pd.read_excel(path, sheet_name=sheet)
                profile["sheets"].append({
                    "sheet": sheet,
                    "rows": len(df),
                    "columns": list(df.columns),
                })
                df.head(100).to_csv(out_dir / f"{safe_name(path.stem)}__{safe_name(sheet)}__sample.csv", index=False)
    except Exception as exc:
        profile["errors"].append(str(exc))
    return profile


def build_company_outputs() -> dict:
    stats = {}
    flex_path = RAW / "flexiple_india_verified_centers.xlsx"
    gcc_index_path = RAW / "GCC_Index_All_Companies.xlsx"
    outputs = []

    flex = pd.DataFrame()
    idx = pd.DataFrame()
    if flex_path.exists():
        flex = pd.read_excel(flex_path, sheet_name="Centers")
        flex["norm_name"] = flex["company_name"].map(normalize_company)
        stats["flexiple_rows"] = len(flex)
    if gcc_index_path.exists():
        idx = pd.read_excel(gcc_index_path, sheet_name="Company Profiles")
        idx["norm_name"] = idx["company_name"].map(normalize_company)
        stats["gcc_index_rows"] = len(idx)

    merged_keys = sorted(set(flex.get("norm_name", pd.Series(dtype=str)).dropna()) | set(idx.get("norm_name", pd.Series(dtype=str)).dropna()))
    records = []
    for key in merged_keys:
        if not key:
            continue
        frow = flex[flex["norm_name"] == key].head(1)
        irow = idx[idx["norm_name"] == key].head(1)
        f = frow.iloc[0].to_dict() if not frow.empty else {}
        i = irow.iloc[0].to_dict() if not irow.empty else {}
        sources = []
        if f:
            sources.append("SRC_FLEXIPLE_GCC_INDIA_HTML")
        if i:
            sources.append("SRC_GCC_INDEX_COMPANIES_HTML")
        records.append({
            "normalized_company": key,
            "company_name": f.get("company_name") or i.get("company_name"),
            "sector": f.get("sector") or i.get("profile_sector") or i.get("directory_sector"),
            "cities": f.get("cities") or i.get("profile_city") or i.get("directory_city_text"),
            "functions_or_capability": f.get("roles_tracked_most") or i.get("capability_intent"),
            "headcount_band": f.get("team_size_display"),
            "model": f.get("model"),
            "parent_hq": f.get("parent_hq"),
            "in_india_since": f.get("in_india_since"),
            "cin": i.get("cin"),
            "incorporation_events": i.get("incorporation_related_event(s)"),
            "timeline_event_count": i.get("timeline_event_count"),
            "flexiple_profile_url": f.get("profile_url"),
            "gcc_index_profile_url": i.get("profile_url"),
            "source_ids": ";".join(sources),
            "cross_verified_by_both_directories": bool(f and i),
            "confidence_score": 86 if f and i else 72,
            "verification_status": "cross-directory match" if f and i else "single-directory seed",
        })
    out = ORGANIZED / "06_app_ready" / "company_seed_merged.csv"
    pd.DataFrame(records).to_csv(out, index=False)
    shutil.copy2(out, PROCESSED / "company_seed_merged.csv")
    stats["merged_company_seed_rows"] = len(records)
    stats["cross_directory_matches"] = sum(1 for r in records if r["cross_verified_by_both_directories"])
    outputs.append(str(out.relative_to(ROOT)))

    if not idx.empty:
        timeline = pd.read_excel(gcc_index_path, sheet_name="Activity Timeline")
        timeline_out = ORGANIZED / "06_app_ready" / "gcc_index_activity_timeline.csv"
        timeline.to_csv(timeline_out, index=False)
        shutil.copy2(timeline_out, PROCESSED / "gcc_index_activity_timeline.csv")
        stats["activity_timeline_rows"] = len(timeline)
        outputs.append(str(timeline_out.relative_to(ROOT)))

    return {"stats": stats, "outputs": outputs}


def build_mca_keyword_matches() -> dict:
    path = RAW / "data_gov data.csv"
    if not path.exists():
        return {"rows": 0, "outputs": []}
    use_cols = [
        "CIN", "CompanyName", "CompanyRegistrationdate_date", "Registered_Office_Address",
        "CompanyStatus", "CompanyStateCode", "CompanyIndian/Foreign Company",
        "nic_code", "CompanyIndustrialClassification",
    ]
    df = pd.read_csv(path, usecols=lambda c: c in use_cols, low_memory=False)
    name = df["CompanyName"].fillna("").str.upper()
    patterns = [
        "GLOBAL CAPABILITY", "CAPABILITY CENT", "CAPABILITY CENTER", "CAPABILITY CENTRE",
        "DEVELOPMENT CENT", "DEVELOPMENT CENTER", "DEVELOPMENT CENTRE",
        "R&D", "RESEARCH AND DEVELOPMENT", "TECHNOLOGY CENT", "TECHNOLOGY CENTER",
        "TECHNOLOGY CENTRE",
    ]
    mask = False
    for pat in patterns:
        mask = mask | name.str.contains(re.escape(pat), regex=True)
    matches = df[mask].copy()
    matches["match_reason"] = name[mask].map(lambda n: ";".join([p for p in patterns if p in n]))
    out = ORGANIZED / "06_app_ready" / "mca_keyword_entity_matches.csv"
    matches.to_csv(out, index=False)
    shutil.copy2(out, PROCESSED / "mca_keyword_entity_matches.csv")
    return {"rows": len(matches), "outputs": [str(out.relative_to(ROOT))]}


def reconcile_macro(pdf_summaries: dict) -> None:
    snippets_dir = ORGANIZED / "05_reconciliation" / "pdf_text_snippets"
    macro_terms = {
        "gcc_2117": r"2,?117",
        "gcc_units_3728": r"3,?728",
        "talent_236": r"2\.36",
        "revenue_984": r"98\.4",
        "gcc_1700": r"1,?700",
        "units_2975": r"2,?975",
        "revenue_646": r"64\.6",
        "talent_19": r"1\.9",
        "leasing_31m": r"31\s?M",
    }
    hits = defaultdict(list)
    for txt_file in snippets_dir.glob("*.txt"):
        txt = txt_file.read_text(encoding="utf-8", errors="ignore")
        for key, pat in macro_terms.items():
            if re.search(pat, txt, flags=re.IGNORECASE):
                hits[key].append(txt_file.stem)

    lines = [
        "# Data Reconciliation & Discrepancy Notes",
        "",
        f"Generated: {datetime.now().isoformat(timespec='seconds')}",
        "",
        "## Macro Figure Hits Across Documents",
        "",
    ]
    for key, docs in sorted(hits.items()):
        lines.append(f"- `{key}` found in: {', '.join(sorted(docs))}")

    lines.extend([
        "",
        "## Important Reconciliation Notes",
        "",
        "- The Zinnov-Nasscom 2026 report should be treated as the primary macro source for FY26E figures: 2,117 GCCs, 3,728 units, 2.36M installed talent, USD 98.4B revenue.",
        "- Older reports may mention 1,700 GCCs, 2,975 units, 1.9M employees, or USD 64.6B revenue. These are historical figures, not conflicts, if labelled by year.",
        "- Flexiple's 536 verified centers and GCC Index's company list are partial directories, not substitutes for total ecosystem counts.",
        "- State policies have version risk. UP has multiple PDFs in raw; use the newest official English policy for app facts and keep older/SOP docs as implementation context.",
        "- SEZ files prove facility/zone status, not that a specific GCC tenant receives SEZ tax benefits. The app should avoid assuming tax benefits from location alone.",
        "- Salary and remuneration sources are often brochures or summaries. Do not use exact salary bands unless visible and source-backed.",
        "",
        "## Prototype Implication",
        "",
        "Use confidence badges and source dates in the app. Where figures differ, show year/source rather than forcing a single number.",
    ])
    (ORGANIZED / "05_reconciliation" / "discrepancies.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    ensure_dirs()
    files = sorted([p for p in RAW.rglob("*") if p.is_file()])
    inventory = []
    pdf_summaries = {}
    spreadsheet_profiles = {}

    for path in files:
        category, status, score, reason = classify_file(path)
        organized_copy = copy_to_category(path, category, status)
        row = {
            "file_name": path.name,
            "original_path": str(path.relative_to(ROOT)),
            "extension": path.suffix.lower(),
            "size_bytes": path.stat().st_size,
            "last_modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat(timespec="seconds"),
            "category": category,
            "relevance_status": status,
            "usefulness_score": score,
            "reason": reason,
            "organized_copy": organized_copy,
        }
        if path.suffix.lower() == ".pdf":
            summary = process_pdf(path)
            pdf_summaries[path.name] = summary
            row.update({
                "pdf_pages": summary["pages"],
                "pdf_tables_found": summary["tables_found"],
                "pdf_table_pages": ";".join(map(str, summary["table_pages"][:20])),
                "visual_review_pages": ";".join(summary["rendered_pages"]),
            })
        elif path.suffix.lower() in [".xlsx", ".xls", ".csv"]:
            profile = profile_spreadsheet(path)
            spreadsheet_profiles[path.name] = profile
            row.update({
                "sheet_count": len(profile["sheets"]),
                "sheet_summary": json.dumps(profile["sheets"][:5], ensure_ascii=False),
            })
        inventory.append(row)

    inv_df = pd.DataFrame(inventory)
    inv_df.to_csv(ORGANIZED / "00_inventory" / "raw_file_inventory.csv", index=False)
    inv_df.to_csv(PROCESSED / "raw_file_inventory.csv", index=False)

    (ORGANIZED / "00_inventory" / "pdf_processing_summary.json").write_text(json.dumps(pdf_summaries, indent=2, ensure_ascii=False), encoding="utf-8")
    (ORGANIZED / "04_spreadsheet_profiles" / "spreadsheet_profiles.json").write_text(json.dumps(spreadsheet_profiles, indent=2, ensure_ascii=False), encoding="utf-8")

    company_result = build_company_outputs()
    mca_result = build_mca_keyword_matches()
    reconcile_macro(pdf_summaries)

    summary_lines = [
        "# GCC Dataset Processing Report",
        "",
        f"Generated: {datetime.now().isoformat(timespec='seconds')}",
        "",
        "## Inventory",
        "",
        f"- Raw files reviewed: {len(files)}",
        f"- PDFs processed: {sum(1 for p in files if p.suffix.lower() == '.pdf')}",
        f"- Spreadsheet/CSV files processed: {sum(1 for p in files if p.suffix.lower() in ['.xlsx', '.xls', '.csv'])}",
        f"- Extracted PDF tables: {sum(s.get('tables_found', 0) for s in pdf_summaries.values())}",
        "",
        "## App-Ready Outputs",
        "",
        f"- Merged company seed rows: {company_result['stats'].get('merged_company_seed_rows', 0)}",
        f"- Cross-directory company matches: {company_result['stats'].get('cross_directory_matches', 0)}",
        f"- GCC Index timeline rows: {company_result['stats'].get('activity_timeline_rows', 0)}",
        f"- MCA keyword entity matches: {mca_result['rows']}",
        "",
        "## Key Files",
        "",
        "- `dataset/organized/00_inventory/raw_file_inventory.csv`",
        "- `dataset/organized/03_extracted_tables/`",
        "- `dataset/organized/02_visual_review/`",
        "- `dataset/organized/05_reconciliation/discrepancies.md`",
        "- `dataset/organized/06_app_ready/company_seed_merged.csv`",
        "- `dataset/organized/06_app_ready/mca_keyword_entity_matches.csv`",
        "",
        "## Notes",
        "",
        "- Raw files were copied into organized category folders but not deleted or moved from `dataset/raw`.",
        "- PDF page previews were rendered for layout/table review because some tables and charts are not captured cleanly by text extraction.",
        "- Treat extracted PDF tables as review candidates; tables from visual reports often need manual cleanup before app use.",
    ]
    (ORGANIZED / "processing_report.md").write_text("\n".join(summary_lines), encoding="utf-8")
    print("\n".join(summary_lines))


if __name__ == "__main__":
    main()
