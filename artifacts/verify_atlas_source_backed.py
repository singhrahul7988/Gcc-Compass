from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 900}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(1000)
    page.screenshot(path=str(out / 'gcc-atlas-source-backed-fixed.png'), full_page=True)

    page.locator('.atlas-tabs button').nth(1).click()
    source_rows = page.locator('.atlas-source-row').count()
    page.locator('.atlas-tabs button').nth(2).click()
    verification_text = page.locator('.atlas-tab-panel').inner_text()
    page.locator('.atlas-tabs button').nth(3).click()
    insights_text = page.locator('.atlas-tab-panel').inner_text()
    page.locator('.atlas-tabs button').nth(4).click()
    related_count = page.locator('.atlas-related-list button').count()
    if related_count:
        page.locator('.atlas-related-list button').first.click()
    selected_detail = page.locator('.atlas-detail-hero h2').inner_text()
    page.locator('.atlas-export-button').click()
    export_count = page.locator('.atlas-export-popover button').count()

    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const table = q('.atlas-table-wrap');
      return {
        firstRow: q('.atlas-table tbody tr')?.innerText,
        detailText: q('.atlas-detail-panel')?.innerText.slice(0, 1300),
        tableClientWidth: table?.clientWidth,
        tableScrollWidth: table?.scrollWidth,
        tableClientHeight: table?.clientHeight,
        tableScrollHeight: table?.scrollHeight,
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
        sourceLinkCount: document.querySelectorAll('.source-link-cell[href], .atlas-source-row[href]').length,
        companyWeight: getComputedStyle(q('.atlas-company-cell span')).fontWeight,
        selectWeight: getComputedStyle(q('.atlas-select-filter select')).fontWeight
      }
    }
    """)
    print({
      'source_rows': source_rows,
      'verification_has_score': 'Confidence score in dataset' in verification_text,
      'insights_mentions_data': 'selected record fields' in insights_text,
      'related_count': related_count,
      'selected_detail_after_related': selected_detail,
      'export_count': export_count,
      **metrics,
    })
    browser.close()
