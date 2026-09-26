from pathlib import Path
import argparse
import json

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('stage', choices=['before', 'trial', 'after'])
args = parser.parse_args()
out = Path('artifacts/build-vs-buy/palette-refresh')
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        headless=True,
    )
    page = browser.new_page(viewport={'width': 1536, 'height': 1024}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:5173/#build', wait_until='domcontentloaded')
    page.locator('.build-hero-copy h2').wait_for()
    page.evaluate('document.fonts.ready')
    page.wait_for_timeout(1000)
    page.screenshot(path=str(out / f'{args.stage}-desktop.png'), full_page=True)
    page.screenshot(path=str(out / f'{args.stage}-viewport.png'))
    report = {'errors': errors, 'sizes': {}}
    for name, width, height in [('wide', 1920, 1080), ('laptop', 1280, 900), ('tablet', 768, 1024), ('mobile', 390, 844)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.screenshot(path=str(out / f'{args.stage}-{name}.png'), full_page=True)
        report['sizes'][name] = page.evaluate('''() => ({
            viewport: innerWidth,
            pageWidth: document.documentElement.scrollWidth,
            route: document.querySelector('.build-hero-copy h2').textContent,
            heroBackground: getComputedStyle(document.querySelector('.build-recommendation')).backgroundColor,
        })''')
    (out / f'{args.stage}-visual-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2))
    browser.close()
