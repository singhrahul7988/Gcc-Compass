from pathlib import Path
from playwright.sync_api import sync_playwright

out=Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.goto('http://127.0.0.1:5173/#build',wait_until='networkidle')
    build=page.evaluate("""() => ({
      active:[...document.querySelectorAll('.topbar nav button.active')].map(el=>el.textContent?.trim()),
      height:document.querySelector('.topbar').getBoundingClientRect().height,
      activeBackground:getComputedStyle(document.querySelector('.topbar nav button.active')).backgroundColor,
      headerBackground:getComputedStyle(document.querySelector('.topbar')).backgroundColor
    })""")
    page.screenshot(path=str(out/'header-build-after.png'),clip={'x':0,'y':0,'width':1440,'height':220})
    page.get_by_role('button',name='City Compare').click()
    city=page.evaluate("""() => ({
      active:[...document.querySelectorAll('.topbar nav button.active')].map(el=>el.textContent?.trim()),
      height:document.querySelector('.topbar').getBoundingClientRect().height,
      activeBackground:getComputedStyle(document.querySelector('.topbar nav button.active')).backgroundColor,
      headerBackground:getComputedStyle(document.querySelector('.topbar')).backgroundColor
    })""")
    page.screenshot(path=str(out/'header-city-reference.png'),clip={'x':0,'y':0,'width':1440,'height':220})
    assert build['active']==['Build vs Buy'],build
    assert city['active']==['City Compare'],city
    assert build['height']==city['height']
    assert build['activeBackground']==city['activeBackground']
    assert build['headerBackground']==city['headerBackground']
    mobile=browser.new_page(viewport={'width':390,'height':844})
    mobile.goto('http://127.0.0.1:5173/#build',wait_until='networkidle')
    mobile.screenshot(path=str(out/'header-build-mobile-after.png'),clip={'x':0,'y':0,'width':390,'height':220})
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert mobile.evaluate("""() => [...document.querySelectorAll('.topbar nav button.active')].map(el=>el.textContent?.trim())""")==['Build vs Buy']
    print({'build':build,'city':city,'mobileWidth':mobile.evaluate('document.documentElement.scrollWidth')})
    browser.close()

