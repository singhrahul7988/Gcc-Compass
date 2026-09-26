from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts')
out.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', headless=True)
    page = browser.new_page(viewport={'width': 1536, 'height': 1000}, device_scale_factor=1)
    page.goto('http://127.0.0.1:5175/', wait_until='networkidle')
    page.get_by_role('button', name='City Compare').click()
    page.wait_for_timeout(1400)
    page.screenshot(path=str(out / 'city-compare-implemented.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const q = (s) => document.querySelector(s);
      const rect = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return {x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height), bottom:Math.round(r.bottom), text:e.innerText.slice(0, 500)}; };
      return {
        screen: rect('.city-compare-screen'),
        hero: rect('.city-compare-hero'),
        layout: rect('.city-compare-layout'),
        left: rect('.city-left-rail'),
        map: rect('.city-map-card'),
        quick: rect('.quick-city-card'),
        summaries: rect('.city-summary-grid'),
        table: rect('.comparison-table-card'),
        right: rect('.city-right-rail'),
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
        selectedCities: [...document.querySelectorAll('.quick-city-card button.active')].map(b => b.innerText),
        tableHeader: q('.city-criteria-table thead')?.innerText,
      };
    }
    """)
    print(metrics)
    browser.close()
