from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 900}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(800)

    page.locator('.atlas-table-toolbar select').select_option('Company')
    page.locator('.atlas-pagination select').select_option('25')
    page.locator('.atlas-pagination button').filter(has_text='2').click()
    page.locator('.atlas-table tbody tr').nth(2).click()
    selected_detail = page.locator('.atlas-detail-hero h2').inner_text()
    page.locator('.atlas-export-button').click()
    export_buttons = page.locator('.atlas-export-popover button').all_inner_texts()

    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const table = q('.atlas-table-wrap');
      const company = q('.atlas-company-cell span');
      const select = q('.atlas-select-filter select');
      const rowCount = document.querySelectorAll('.atlas-table tbody tr').length;
      const pageText = q('.atlas-table-toolbar span')?.innerText;
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return {w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), left: Math.round(r.left)};
      };
      return {
        rowCount,
        pageText,
        tableClientWidth: table.clientWidth,
        tableScrollWidth: table.scrollWidth,
        tableClientHeight: table.clientHeight,
        tableScrollHeight: table.scrollHeight,
        companyWeight: getComputedStyle(company).fontWeight,
        selectWeight: getComputedStyle(select).fontWeight,
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
        tableRect: rect(table),
        detailRect: rect(q('.atlas-detail-panel'))
      };
    }
    """)
    page.screenshot(path=str(out / 'gcc-atlas-flow-fixed.png'), full_page=True)
    print({'selected_detail': selected_detail, 'export_buttons': export_buttons, **metrics})
    browser.close()
