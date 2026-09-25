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
    page.screenshot(path=str(out / 'gcc-atlas-current-audit.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const rect = (s) => {
        const e = q(s); if (!e) return null;
        const r = e.getBoundingClientRect();
        return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom)};
      };
      const table = q('.atlas-table-wrap');
      return {
        shell: rect('.atlas-shell'),
        table: rect('.atlas-table-wrap'),
        detail: rect('.atlas-detail-panel'),
        sourceChips: rect('.atlas-source-chips'),
        actionButtons: rect('.atlas-detail-actions'),
        tableClientWidth: table?.clientWidth,
        tableScrollWidth: table?.scrollWidth,
        tableClientHeight: table?.clientHeight,
        tableScrollHeight: table?.scrollHeight,
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
        firstRows: [...document.querySelectorAll('.atlas-table tbody tr')].slice(0, 5).map(row => row.innerText),
        detailText: q('.atlas-detail-panel')?.innerText.slice(0, 1600),
        sourceLinks: [...document.querySelectorAll('.atlas-detail-panel a')].map(a => ({text: a.innerText, href: a.href}))
      };
    }
    """)
    print(metrics)
    browser.close()
