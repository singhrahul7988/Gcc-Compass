from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':400,'height':220})
    page.goto('http://127.0.0.1:5173/#build',wait_until='networkidle')
    icon=page.locator('link[rel="icon"]')
    assert icon.count()==1
    assert icon.get_attribute('href')=='/favicon.svg'
    response=page.request.get('http://127.0.0.1:5173/favicon.svg')
    assert response.status==200
    assert 'image/svg+xml' in response.headers.get('content-type','')
    assert page.evaluate("""async () => {
      const img=new Image();
      img.src=document.querySelector('link[rel="icon"]').href;
      await img.decode();
      return img.naturalWidth===64 && img.naturalHeight===64;
    }""")
    page.set_content('<style>body{margin:0;padding:20px;background:#263144;color:white;font:14px sans-serif}.row{display:flex;align-items:center;gap:12px;margin-bottom:20px}img{display:block}</style><div class="row"><img src="http://127.0.0.1:5173/favicon.svg" width="16" height="16">16 px tab icon</div><div class="row"><img src="http://127.0.0.1:5173/favicon.svg" width="32" height="32">32 px icon</div><div class="row"><img src="http://127.0.0.1:5173/favicon.svg" width="64" height="64">Original</div>')
    page.screenshot(path=str(out/'favicon-preview.png'))
    print({'link':'/favicon.svg','status':response.status,'contentType':response.headers.get('content-type'),'decoded':True})
    browser.close()

