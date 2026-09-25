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
    page.screenshot(path=str(out / 'gcc-atlas-status-aligned.png'), full_page=True)
    metrics = page.evaluate("""
    () => {
      const chips = [...document.querySelectorAll('.atlas-table tbody tr .atlas-status-pill')].slice(0, 10);
      return chips.map((chip) => {
        const r = chip.getBoundingClientRect();
        const svg = chip.querySelector('svg').getBoundingClientRect();
        return {
          text: chip.innerText,
          x: Math.round(r.x),
          w: Math.round(r.width),
          scrollWidth: chip.scrollWidth,
          clientWidth: chip.clientWidth,
          iconX: Math.round(svg.x),
          iconW: Math.round(svg.width),
          overflow: chip.scrollWidth > chip.clientWidth
        };
      });
    }
    """)
    print(metrics)
    browser.close()
