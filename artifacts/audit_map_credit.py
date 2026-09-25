from pathlib import Path
import json
from playwright.sync_api import sync_playwright
out=Path('artifacts/city-map')
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
    for width in [1920,1440,1180,900,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        page.goto('http://127.0.0.1:5173/#cities=',wait_until='networkidle')
        info=page.evaluate("""() => {
          const names=['.city-map-card','.city-map-hint','.leaflet-control-attribution','.leaflet-control-attribution a'];
          return Object.fromEntries(names.map(name=>{
            const el=document.querySelector(name);
            const r=el?.getBoundingClientRect();
            const cs=el?getComputedStyle(el):null;
            return [name,{width:r?.width,height:r?.height,font:cs?.fontSize,lineHeight:cs?.lineHeight,whiteSpace:cs?.whiteSpace,text:el?.textContent?.trim()}];
          }));
        }""")
        print(width,json.dumps(info,ensure_ascii=True))
        page.locator('.city-map-card').screenshot(path=str(out/f'map-after-{width}.png'))
        page.close()
    browser.close()



