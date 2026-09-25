from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 1000}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(900)
    page.screenshot(path=str(out / 'gcc-atlas-bottom-aligned.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const rect = (s) => {
        const e = q(s); const r = e.getBoundingClientRect();
        return {y: Math.round(r.y), h: Math.round(r.height), bottom: Math.round(r.bottom), text: e.innerText};
      };
      return {
        leftPane: rect('.atlas-left-pane'),
        table: rect('.atlas-table-wrap'),
        detail: rect('.atlas-detail-panel'),
        keyCard: rect('.atlas-key-card'),
        actions: rect('.atlas-detail-actions'),
        lastDetailRow: rect('.atlas-key-card .atlas-detail-row:last-child'),
        gapBetweenCardAndActions: Math.round(q('.atlas-detail-actions').getBoundingClientRect().top - q('.atlas-key-card').getBoundingClientRect().bottom)
      };
    }
    """)
    print(metrics)
    browser.close()
