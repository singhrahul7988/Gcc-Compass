from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
    for width in [1920,1440,1280,1180,1120,1100,1000,900,780,760,520,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        page.goto('http://127.0.0.1:5173/#build',wait_until='domcontentloaded')
        result=page.evaluate("""() => {
          const wrap=document.querySelector('.build-table-scroll');
          const table=document.querySelector('.build-assumptions-table');
          return {
            viewport:innerWidth,
            pageWidth:document.documentElement.scrollWidth,
            wrapper:wrap?.clientWidth,
            scrollWidth:wrap?.scrollWidth,
            tableWidth:table?.getBoundingClientRect().width,
            headerWidths:[...document.querySelectorAll('.build-assumptions-table th')].map(x=>Math.round(x.getBoundingClientRect().width)),
            confidenceHeadingLines:(() => {
              const header=document.querySelector('.build-assumptions-table th:last-child');
              if (!header || getComputedStyle(header).display === 'none') return 0;
              const range=document.createRange();
              range.selectNodeContents(header);
              return range.getClientRects().length;
            })(),
            lastColumnRight:Math.round(document.querySelector('.build-assumptions-table th:last-child')?.getBoundingClientRect().right ?? 0),
            wrapperRight:Math.round(wrap?.getBoundingClientRect().right ?? 0)
          };
        }""")
        assert result['scrollWidth'] <= result['wrapper'] + 1, result
        if width > 960:
            assert result['lastColumnRight'] <= result['wrapperRight'] + 1, result
            assert result['confidenceHeadingLines'] == 1, result
        print(result)
        if width in [1440,1180,1120,1000,900,780,760,390]:
            page.locator('.build-details').screenshot(path=str(out/f'assumptions-after-{width}.png'))
        page.close()
    browser.close()


