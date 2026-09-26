from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
    for width in [1440,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        page.goto('http://127.0.0.1:5173/#build',wait_until='networkidle')
        heading=page.locator('.build-coverage h3')
        assert heading.locator('svg').count()==1
        assert heading.locator('span').count()==0
        dimensions=heading.locator('svg').evaluate("""el => {
          const r=el.getBoundingClientRect();
          return {width:r.width,height:r.height,color:getComputedStyle(el).color};
        }""")
        assert dimensions['width']==17 and dimensions['height']==17,dimensions
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('.build-coverage').screenshot(path=str(out/f'evidence-icon-after-{width}.png'))
        print(width,dimensions)
        page.close()
    browser.close()

