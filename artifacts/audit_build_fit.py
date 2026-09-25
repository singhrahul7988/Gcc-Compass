from pathlib import Path
from playwright.sync_api import sync_playwright

out=Path('artifacts/build-vs-buy/audit')
out.mkdir(parents=True,exist_ok=True)
def select_city(page, city):
    page.locator('#build-city').click()
    page.locator('.build-city-option').filter(has_text=city).click()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',headless=True)
    for width in [1920,1440,390]:
        page=browser.new_page(viewport={'width':width,'height':900})
        page.goto('http://127.0.0.1:5173/#build',wait_until='networkidle')
        card=page.locator('.build-fit-card')
        assert card.locator('.build-fit-row').count()==4
        assert card.locator('.build-fit-list').first.locator('li').count()==3
        assert card.locator('.build-fit-list.risks li').count()==4
        assert card.locator('.build-fit-mix > span').count()==3
        assert 'Bengaluru' in card.locator('h2').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        card.screenshot(path=str(out/f'fit-card-bengaluru-{width}.png'))
        select_city(page, 'Hyderabad')
        assert card.locator('.build-fit-list').first.locator('li').count()==4
        assert card.locator('.build-fit-list.risks li').count()==2
        assert 'Hyderabad' in card.locator('h2').inner_text()
        select_city(page, 'Ahmedabad / GIFT City')
        assert 'Ahmedabad / GIFT City' in card.locator('h2').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        card.screenshot(path=str(out/f'fit-card-ahmedabad-{width}.png'))
        page.locator('.build-mix-row input[type=range]').nth(1).fill('60')
        assert '60% Data / AI roles' in card.locator('.build-fit-insight').inner_text()
        assert card.locator('.build-fit-mix strong').nth(1).inner_text()=='60%'
        page.locator('.build-check-row input').nth(3).check()
        assert card.locator('.build-fit-cautions li').count()>=1
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        card.screenshot(path=str(out/f'fit-card-ai-ip-{width}.png'))
        page.locator('.build-mix-row input[type=range]').nth(0).fill('80')
        assert '80% Engineering / Product roles' in card.locator('.build-fit-insight').inner_text()
        page.locator('.build-mix-row input[type=range]').nth(2).fill('50')
        assert '50% G&A / Support roles' in card.locator('.build-fit-insight').inner_text()
        print(width, 'fit rows and scenario updates passed')
        page.close()
    browser.close()

