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
    page.screenshot(path=str(out / 'gcc-atlas-tabs-fixed.png'), full_page=True)
    metrics = page.evaluate("""
    () => [...document.querySelectorAll('.atlas-tabs button')].map((button) => {
      const r = button.getBoundingClientRect();
      return {text: button.innerText, w: Math.round(r.width), h: Math.round(r.height), scrollWidth: button.scrollWidth, clientWidth: button.clientWidth, lineHeight: getComputedStyle(button).lineHeight};
    })
    """)
    print(metrics)
    browser.close()
