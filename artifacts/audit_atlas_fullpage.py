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
    page.screenshot(path=str(out / 'gcc-atlas-fullpage-audit.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const all = (s) => [...document.querySelectorAll(s)];
      const rect = (s) => {
        const e = typeof s === 'string' ? q(s) : s;
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom), text: e.innerText};
      };
      const tabs = all('.atlas-tabs button').map(rect);
      const statuses = all('.atlas-table tbody tr .atlas-status-pill').slice(0, 12).map(rect);
      return {
        screenshot: 'artifacts/gcc-atlas-fullpage-audit.png',
        hero: rect('.atlas-hero'),
        heroActions: rect('.atlas-hero-actions'),
        filterBar: rect('.atlas-filter-bar'),
        toolbar: rect('.atlas-table-toolbar'),
        table: rect('.atlas-table-wrap'),
        detail: rect('.atlas-detail-panel'),
        detailHero: rect('.atlas-detail-hero'),
        detailTabs: rect('.atlas-tabs'),
        tabs,
        scoreCard: rect('.atlas-score-card'),
        scoreChip: rect('.atlas-score-card span'),
        verificationCard: rect('.atlas-verification-card'),
        verificationStrong: rect('.atlas-verification-card strong'),
        keyCard: rect('.atlas-key-card'),
        actionBar: rect('.atlas-detail-actions'),
        statuses,
        tableClientWidth: q('.atlas-table-wrap')?.clientWidth,
        tableScrollWidth: q('.atlas-table-wrap')?.scrollWidth,
        tableClientHeight: q('.atlas-table-wrap')?.clientHeight,
        tableScrollHeight: q('.atlas-table-wrap')?.scrollHeight,
        bodyClientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.documentElement.scrollWidth,
        visibleText: document.body.innerText.slice(0, 2500)
      };
    }
    """)
    print(metrics)
    browser.close()
