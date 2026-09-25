# Dataset Workspace

This folder stores the real public data used for the GCC Compass MVP.

Important: do not invent data. Every processed record should trace back to at least one public source URL.

## Folder Structure

```text
dataset/
  raw/
    reports/          downloaded PDFs, reports, market notes
    policies/         state policy PDFs and government notifications
    screenshots/      screenshots of important web pages
    downloaded-pages/ saved HTML or page exports if needed
  processed/          clean CSV files the app can use
  sources/            source index and source notes
  templates/          blank CSV templates
  notes/              collection log and manual research notes
```

## Workflow

1. Add source links to `sources/source_links.md`.
2. Save raw PDFs/screenshots/pages in `raw/`.
3. Fill CSV templates in `templates/`.
4. When cleaned, copy filled CSVs into `processed/`.
5. Keep source IDs attached to every row.

## Minimum MVP Targets

- 30 GCC records
- 8 city benchmark records
- 7 state policy records
- 15 stakeholder records
- 20 source records
- 10 calculator assumptions

## Quality Rules

- Use `Unknown` if a field is not verified.
- Use ranges for salary and rent when exact values are not reliable.
- Add a caveat for every assumption.
- Prefer official/company/government sources over blogs.
- Do not scrape restricted sources.
