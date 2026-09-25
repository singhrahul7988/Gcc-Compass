from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 900}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(900)
    page.screenshot(path=str(out / 'gcc-atlas-polished.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const all = (s) => [...document.querySelectorAll(s)];
      const rect = (e) => { const r = e.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height), text: e.innerText}; };
      return {
        parentHqHtml: q('.country-cell')?.innerHTML,
        companyRect: rect(q('.atlas-company-cell span')),
        statusRects: all('.atlas-status-pill').slice(0, 8).map(rect),
        reviewIcon: q('.atlas-status-pill.review svg')?.outerHTML.slice(0, 80),
        scoreChip: rect(q('.atlas-score-card span')),
        tableScrollWidth: q('.atlas-table-wrap')?.scrollWidth,
        tableClientWidth: q('.atlas-table-wrap')?.clientWidth,
      };
    }
    """)
    print(metrics)
    browser.close()
