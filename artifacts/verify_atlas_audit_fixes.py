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
    page.screenshot(path=str(out / 'gcc-atlas-audit-fixed.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const rect = (s) => {
        const e = q(s); const r = e.getBoundingClientRect();
        return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom), text: e.innerText};
      };
      const styles = (s) => {
        const e = q(s); const cs = getComputedStyle(e);
        return {background: cs.backgroundImage || cs.backgroundColor, color: cs.color, position: cs.position};
      };
      return {
        filterBottom: rect('.atlas-filter-bar').bottom,
        toolbarTop: rect('.atlas-table-toolbar').y,
        detail: rect('.atlas-detail-panel'),
        keyCard: rect('.atlas-key-card'),
        actions: rect('.atlas-detail-actions'),
        verificationCard: rect('.atlas-verification-card'),
        verificationCardClass: q('.atlas-verification-card')?.className,
        verificationStrongStyle: styles('.atlas-verification-card strong'),
        actionsStyle: styles('.atlas-detail-actions'),
        tableClientWidth: q('.atlas-table-wrap')?.clientWidth,
        tableScrollWidth: q('.atlas-table-wrap')?.scrollWidth,
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
      };
    }
    """)
    print(metrics)
    browser.close()
