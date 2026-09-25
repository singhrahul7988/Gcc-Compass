from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 900}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='GCC Atlas').click()
    page.wait_for_timeout(1400)
    page.screenshot(path=str(out / 'gcc-atlas-after.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const rect = (s) => {
        const e = q(s);
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
      };
      return {
        shell: rect('.atlas-shell'),
        left: rect('.atlas-left-pane'),
        filters: rect('.atlas-filter-bar'),
        tableWrap: rect('.atlas-table-wrap'),
        detail: rect('.atlas-detail-panel'),
        detailHero: rect('.atlas-detail-hero'),
        tabs: rect('.atlas-tabs'),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        leftScrollWidth: q('.atlas-left-pane')?.scrollWidth,
        leftClientWidth: q('.atlas-left-pane')?.clientWidth,
        filterRight: Math.round(q('.atlas-filter-bar')?.getBoundingClientRect().right || 0),
        detailLeft: Math.round(q('.atlas-detail-panel')?.getBoundingClientRect().left || 0),
        tableText: q('.atlas-table-wrap')?.innerText.slice(0, 900),
        detailText: q('.atlas-detail-panel')?.innerText.slice(0, 900)
      };
    }
    """)
    print(metrics)
    browser.close()
